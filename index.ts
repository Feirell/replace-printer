import * as TTY from 'tty';

const countChars = (char: string, string: string) => {
    let i = 0;
    for (const c of string)
        if (c == char)
            i++;

    return i;
}

const initialized = Symbol('initialized');
const running = Symbol('running');
const stopped = Symbol('stopped');

const states = [initialized, running, stopped];

type TTYWriteStream = TTY.WriteStream & { moveCursor: (dx: number, dy: number) => undefined };

export class ReplacePrinter {
    private logStack: { method: string, args: any[] }[] = [];
    private lastLineCount = 0;
    private currentMessage = '';
    private timeoutid: number | null = null;

    private outstream: TTYWriteStream;
    private waitTimeTillFlush: number;

    private _state: symbol = initialized;

    constructor(waitTillFlush = 250, outstream = process.stdout as TTYWriteStream) {
        if (!outstream.isTTY)
            throw new TypeError('the given outstream is not a tty');

        this.outstream = outstream;
        this.waitTimeTillFlush = waitTillFlush;

        this.state = initialized;
    }

    private get state() {
        return this._state;
    }

    private set state(newState) {
        if (states.indexOf(newState) == -1)
            throw new TypeError('the state ' + this.state.toString() + ' in none of the defined states');

        if (newState == this._state)
            return;

        if (newState == initialized && this._state != undefined)
            throw new Error('can not reset the state to initialized');

        if (newState == running && this._state != initialized)
            throw new Error('can not set the state to running when the current state is not initialized');

        if (newState == stopped && this._state != running)
            throw new Error('can not set the state to stopped when the current state is not running');

        if (newState == stopped)
            this.flushStack();

        this._state = newState;
    }

    console(method: string, args: any[]) {
        if (!(method in console))
            throw new TypeError('the methode "' + method + '" is not given in console object (console.' + method + ' does not exist)');

        this.logStack.push({
            method,
            args
        });

        if (this.state != running)
            this.flushStack();
        else
            this.timeoutid = setTimeout(() => this.assembleOutput(), this.waitTimeTillFlush) as any as number;

    }

    private clearFlushTimeout() {
        if (this.timeoutid !== null)
            clearTimeout(this.timeoutid);

        this.timeoutid = null;
    }

    log(...args: any[]) { this.console('log', args); }
    error(...args: any[]) { this.console('error', args); }
    info(...args: any[]) { this.console('info', args); }
    warn(...args: any[]) { this.console('warn', args); }

    private flushStack() {
        this.clearFlushTimeout();

        for (const { method, args } of this.logStack)
            (console as any)[method].apply(console, args);

        this.logStack = [];
    }

    replacePrint(string: string) {
        this.currentMessage = string;

        this.assembleOutput();
    }

    get printing() {
        return this.state == running || this.state == initialized;
    }

    private assembleOutput() {
        if (!this.printing)
            throw new Error('this ReplacePrinter is in an invalid state to continue printing');

        this.state = running;

        this.outstream.moveCursor(-500, -this.lastLineCount);
        this.outstream.clearScreenDown();

        this.flushStack();

        this.outstream.write(this.currentMessage);
        this.lastLineCount = countChars('\n', this.currentMessage);
    }

    start() {
        this.state = running;
    }

    stop() {
        this.state = stopped;
    }
}