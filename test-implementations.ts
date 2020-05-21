import {Writable} from 'stream';
import {Console} from 'console';
import {WriteStreamStringBuffer} from "./src/write-stream-string-buffer";

let stackBuffer = Buffer.of();
const wsBuffer: Pick<Writable, '_write'> & Pick<Writable, '_writev'> = {

    _write(chunk, encoding, callback) {
        let buffer = chunk;
        if (!Buffer.isBuffer(chunk))
            if (encoding != 'utf8') {
                callback(new Error('can not write in the encoding ' + encoding));
                return;
            } else
                buffer = Buffer.from(chunk, 'utf8');

        stackBuffer = Buffer.concat([stackBuffer, buffer]);

        callback();
        return true;
    },

    _writev(chunks: Array<{ chunk: any; encoding: string }>, callback: (error?: (Error | null)) => void) {
        for (const {chunk, encoding} of chunks)
            this._write(chunk, encoding, () => {
            });

        callback();
    }
}

Object.setPrototypeOf(wsBuffer, process.stdout);

let stackString = '';
const wsString: Pick<Writable, '_write'> & Pick<Writable, '_writev'> = {

    _write: function (chunk, encoding, callback) {
        let string = chunk;
        if (typeof chunk != 'string')
            if (Buffer.isBuffer(chunk)) {
                string = chunk.toString();
            } else {
                callback(new Error('can not process chunks in " + encoding + " encoding'));
                return;
            }
        stackString += string;

        // console.log('[' + encoding + '] chunk:', buffer);
        callback();
        // const args = arguments as any as [any, any, any];
        // process.stdout._write.apply(process.stdout, args);
    },

    _writev(chunks: Array<{ chunk: any; encoding: string }>, callback: (error?: (Error | null)) => void) {
        for (const {chunk, encoding} of chunks)
            this._write(chunk, encoding, () => {
            });

        callback();
    }
}

Object.setPrototypeOf(wsString, process.stdout);

const nf = new Intl.NumberFormat('en-US', {maximumFractionDigits: 0, useGrouping: true});

const helper = {
    instance: {
        instance: null as any,
        initialize() {
            return this.instance = new WriteStreamStringBuffer(process.stdout)
        },
        buffer() {
            return this.instance.buffer;
        }
    },
    buffer: {
        initialize() {
            stackBuffer = Buffer.of();
            return wsBuffer;
        },
        buffer() {
            return stackBuffer;
        }
    },
    string: {
        initialize() {
            stackString = '';
            return wsString;
        },
        buffer() {
            return stackString;
        }
    }
};

const runs = 10 ** 3;
const test = (wa: Writable) => {
    const consoleInstance = new Console(wa);

    for (let i = 0; i < runs; i++) {
        consoleInstance.log('This is kinda nice', {field: 'value'});
        consoleInstance.log('This is kinda nice', {field: 'value'});
        consoleInstance.log('This is kinda nice', {field: 'value'});
        consoleInstance.log('This is kinda nice', {field: 'value'});
    }
}
for (let runs = 0; runs < 3; runs++) {
    console.log("==[RUN " + (runs + 1) + "]==");
    const entries = Object.entries(helper)
    for (const [name, functions] of entries) {
        const start = Date.now();
        test((functions.initialize as any)());
        const end = Date.now();

        const stack = functions.buffer();
        const stackBuffer = Buffer.isBuffer(stack) ? stack : Buffer.from(stack);

        const timeDelta = end - start;
        const formattedTime = nf.format(timeDelta);

        console.log('it took %s %sms to run, the stack is %s bytes long and starts with %s', name, formattedTime, stackBuffer.length, stackBuffer.slice(-20, -1));
    }
}