import WriteStream = NodeJS.WriteStream;
import {Console} from "console";
import {WriteStreamStringBuffer} from "./write-stream-string-buffer";
import TTY from "tty";

interface ReplacePrinterOptions {
    outStream?: WriteStream;
}

function removeProblematicCharacters(str: string) {
    // this is a bit cheesy and won't work for the ALL cases, it should be extended
    // TODO think about a better solution
    return str.replace(/\t/g, '    ');
}

type TTYWriteStream = TTY.WriteStream & { moveCursor: (dx: number, dy: number) => undefined };

export class ReplacePrinter {
    public readonly replaceConsole: Console;
    public readonly continuesConsole: Console;

    private outStream: TTYWriteStream;

    private replaceStreamBuffer: WriteStreamStringBuffer;
    private continuesStreamBuffer: WriteStreamStringBuffer;

    private lastReplaceMessage?: string;

    constructor(options: ReplacePrinterOptions = {}) {
        const {
            outStream = process.stdout
        } = options;

        if (!(outStream as TTYWriteStream).isTTY)
            throw new Error('outstream needs to be a TTY stream');


        this.outStream = outStream as TTYWriteStream;

        const notice = this.pushBuffers.bind(this);

        this.replaceStreamBuffer = new WriteStreamStringBuffer(this.outStream, notice, 'replace');
        this.continuesStreamBuffer = new WriteStreamStringBuffer(this.outStream, notice);

        this.replaceConsole = new Console(this.replaceStreamBuffer);
        this.continuesConsole = new Console(this.continuesStreamBuffer);
    }

    private getLineAndLastColumns(msg: string, columns?: number) {
        const columnsKnown = columns === undefined;

        let lineCount = 0;
        let lastLineLength = 0;

        for (const char of msg) {

            // using lastLineLength == columns since the terminal will
            // linebreak even if it is not suggested by a \n
            if (char == '\n' || lastLineLength == columns) {
                lineCount++;
                lastLineLength = lastLineLength == columns ? 1 : 0;
            } else {
                lastLineLength += 1;
            }
        }

        return {lineCount, lastLineLength};
    }

    private pushBuffers() {
        const os = this.outStream;

        // will not print if columns is currently zero
        if (Number.isFinite(os.columns) && os.columns <= 0) {
            this.pushBuffers();
            return;
        }

        const replaceBuffer = removeProblematicCharacters(this.replaceStreamBuffer.buffer.slice(0, -1)) || this.lastReplaceMessage; // removing the last linebreak
        this.replaceStreamBuffer.buffer = '';

        const continuesBuffer = this.continuesStreamBuffer.buffer;
        this.continuesStreamBuffer.buffer = '';

        if (this.lastReplaceMessage != undefined) {
            // can't make really
            const measurements = this.getLineAndLastColumns(this.lastReplaceMessage, os.columns);

            // clearing last printed replaceable part
            os.moveCursor(-measurements.lastLineLength, -measurements.lineCount);
            os.clearScreenDown();
        }

        this.lastReplaceMessage = replaceBuffer;

        // printing static and replaceable console output
        const assembledMessage = continuesBuffer + replaceBuffer;

        os.write(assembledMessage);
    }
}