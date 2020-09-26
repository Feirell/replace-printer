import {Console} from "console";
import {WriteStream as TTYWriteStream} from "tty";

import {WriteStreamStringBuffer} from "./write-stream-string-buffer";

interface ReplacePrinterOptions {
    outStream?: TTYWriteStream;
    removeLastLinebreak?: boolean
}

function removeProblematicCharacters(str: string) {
    // TODO make this function obsolete

    // This function is used to remove characters which interfere with the character line length count
    // to estimate when the terminal will break the line by itself. This number is needed to correctly move the cursor
    // to replace the old replace message.

    // A workaround could be to use the save ASCII Escape sequence, to just get back to the actual start
    // of the replace message: <ESC> 7 (DECSC, save cursor position), <ESC> 8 (DECRC, restore curos).

    return str.replace(/\t/g, '    ');
}

function getLineCountAndLastLineLength(msg: string, columns?: number) {
    let lineCount = 0;
    let lastLineLength = 0;

    for (const char of msg) {

        // using lastLineLength == columns since the terminal will
        // linebreak even if it is not suggested by a \n
        if (char == '\n') {
            lineCount++;
            lastLineLength = 0;
        } else if (lastLineLength === columns) {
            lineCount++;
            lastLineLength = 1;
        } else {
            lastLineLength += 1;
        }
    }

    return {lineCount, lastLineLength};
}

export const isTTYStream = (ws: any): ws is TTYWriteStream => !!(ws as TTYWriteStream).isTTY

const CSI = '\x1b[';

let lastUsedReplacePrinter: ReplacePrinter | undefined = undefined;

export class ReplacePrinter {
    public readonly replaceConsole: Console;
    public readonly continuesConsole: Console;

    private readonly outStream: TTYWriteStream;

    private readonly replaceStreamBuffer: WriteStreamStringBuffer;
    private readonly continuesStreamBuffer: WriteStreamStringBuffer;

    private lastReplaceMessage?: string;
    private readonly removeLastLineBreak: boolean;

    constructor({
                    outStream = process.stdout as TTYWriteStream,
                    removeLastLinebreak = true
                }: ReplacePrinterOptions = {}) {
        this.removeLastLineBreak = removeLastLinebreak;

        if (!isTTYStream(outStream))
            throw new Error('outStream needs to be a TTY stream');

        this.outStream = outStream;

        const notice = this.pushBuffers.bind(this);

        this.replaceStreamBuffer = new WriteStreamStringBuffer(this.outStream, notice, 'replace');
        this.replaceConsole = new Console(this.replaceStreamBuffer);

        this.continuesStreamBuffer = new WriteStreamStringBuffer(this.outStream, notice, 'append');
        this.continuesConsole = new Console(this.continuesStreamBuffer);

        // this.continuesStreamBuffer.buffer = '\n';
    }

    /**
     * You need to call this function when you want to continue printing with another ReplacePrinter or resume using
     * another logging utility. This function will just append a new line, if the last replace message did not end with
     * one.
     */
    public endWithNewLine() {
        const lrm = this.lastReplaceMessage;
        if (lrm && !lrm.endsWith('\n')) {
            this.outStream.write('\n');

            // to allow the continues use of the replace printer
            this.lastReplaceMessage += '\n';
        }
    }

    private pushBuffers() {
        // this will append another new line
        if (lastUsedReplacePrinter != undefined && lastUsedReplacePrinter != this) {
            lastUsedReplacePrinter.endWithNewLine();
            lastUsedReplacePrinter = this;
        }

        lastUsedReplacePrinter = this;

        const os = this.outStream;

        let rpb = this.replaceStreamBuffer.buffer;

        // clear buffer to remember that this message was already printed and is now cleaned in the lastReplaceMessage
        this.replaceStreamBuffer.buffer = '';

        // since the buffer is written by a Console there is always a linebreak at the end
        // removing it to have it sit flush on the last line
        if (this.removeLastLineBreak && rpb.endsWith('\n'))
            rpb = rpb.slice(0, rpb.endsWith('\r\n') ? -2 : -1);

        const clearedMessage = removeProblematicCharacters(rpb);
        const replaceBuffer = clearedMessage.length == 0 ? this.lastReplaceMessage : clearedMessage;

        let continuesBuffer = this.continuesStreamBuffer.buffer;
        // clear the buffer to not reprint the message since it is now already in the output buffer
        this.continuesStreamBuffer.buffer = '';

        if (continuesBuffer.length > 0 && !continuesBuffer.endsWith('\n'))
            continuesBuffer += '\n';

        let write = '';

        // clear the space the last replace message took
        if (this.lastReplaceMessage != undefined) {
            const measurements = getLineCountAndLastLineLength(this.lastReplaceMessage, os.columns);

            const rows = measurements.lineCount;

            // clearing last printed replaceable part

            // move the cursor to the start of the line
            write += CSI + '1G';

            // move the cursor up lines
            write += rows > 0 ? CSI + rows + 'F' : '';

            // clear all characters following
            write += CSI + '0J';
        }

        this.lastReplaceMessage = replaceBuffer;

        write += continuesBuffer;
        write += replaceBuffer;

        // printing static and replaceable console output
        os.write(write);
    }
}