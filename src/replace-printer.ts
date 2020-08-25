import {Console} from "console";
import {WriteStreamStringBuffer} from "./write-stream-string-buffer";
import TTY from "tty";

interface ReplacePrinterOptions {
    outStream?: TTYWriteStream;
}

function removeProblematicCharacters(str: string) {
    // this is a bit cheesy and won't work for the ALL cases, it should be extended
    // TODO think about a better solution
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

type TTYWriteStream = TTY.WriteStream & { moveCursor: (dx: number, dy: number) => undefined };

export const isTTYStream = (ws: any): ws is TTYWriteStream => !!(ws as TTYWriteStream).isTTY

export class ReplacePrinter {
    public readonly replaceConsole: Console;
    public readonly continuesConsole: Console;

    private readonly outStream: TTYWriteStream;

    private readonly replaceStreamBuffer: WriteStreamStringBuffer;
    private readonly continuesStreamBuffer: WriteStreamStringBuffer;

    private lastReplaceMessage?: string;

    constructor({
                    outStream = process.stdout as TTYWriteStream
                }: ReplacePrinterOptions = {}) {

        if (!isTTYStream(outStream))
            throw new Error('outStream needs to be a TTY stream');

        this.outStream = outStream;

        const notice = this.pushBuffers.bind(this);

        this.replaceStreamBuffer = new WriteStreamStringBuffer(this.outStream, notice, 'replace');
        this.replaceConsole = new Console(this.replaceStreamBuffer);

        this.continuesStreamBuffer = new WriteStreamStringBuffer(this.outStream, notice, 'append');
        this.continuesConsole = new Console(this.continuesStreamBuffer);
    }

    private pushBuffers() {
        const os = this.outStream;

        // since the buffer is written by a Console there is always a linebreak at the end
        // removing it to have it sit flush on the last line
        const clearedMessage = removeProblematicCharacters(this.replaceStreamBuffer.buffer.slice(0, -1));
        const replaceBuffer = clearedMessage.length == 0 ? this.lastReplaceMessage : clearedMessage;
        // clear buffer to remember that this message was already printed and is now cleaned in the lastReplaceMessage
        this.replaceStreamBuffer.buffer = '';

        const continuesBuffer = this.continuesStreamBuffer.buffer;
        // clear the buffer to not reprint the message since it is now already in the output buffer
        this.continuesStreamBuffer.buffer = '';

        // clear the space the last replace message took
        if (this.lastReplaceMessage != undefined) {
            const measurements = getLineCountAndLastLineLength(this.lastReplaceMessage, os.columns);

            // TODO try to remove flickering by concatenating the ASCII control characters which are used by
            // the moveCursor and clearScreenDown commands

            // clearing last printed replaceable part
            os.moveCursor(-measurements.lastLineLength, -measurements.lineCount);
            os.clearScreenDown();
        }

        this.lastReplaceMessage = replaceBuffer;

        // printing static and replaceable console output
        os.write(continuesBuffer + replaceBuffer);
    }
}