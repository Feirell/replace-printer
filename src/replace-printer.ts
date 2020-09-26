import {Console} from "console";
import {WriteStream as TTYWriteStream} from "tty";

import {WriteStreamStringBuffer} from "./write-stream-string-buffer";

interface ReplacePrinterOptions {
    outStream?: TTYWriteStream;
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

        let write = '';

        // clear the space the last replace message took
        if (this.lastReplaceMessage != undefined) {
            const measurements = getLineCountAndLastLineLength(this.lastReplaceMessage, os.columns);

            const moveCursorBack = CSI + '16';
            const moveCursorXUp = CSI + (measurements.lineCount - 1) + 'F';
            const clearScreenDown = CSI + '0J';

            // clearing last printed replaceable part
            write += moveCursorBack;
            write += moveCursorXUp;
            write += clearScreenDown;
        }

        this.lastReplaceMessage = replaceBuffer;

        write += continuesBuffer;
        write += replaceBuffer;

        // printing static and replaceable console output
        os.write(write);
    }
}