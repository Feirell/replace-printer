import {Writable, WritableOptions} from "stream";

export class WriteStreamStringBuffer extends Writable {
    public buffer = '';
    public getColorDepth?: () => any;
    public isTTY?: boolean;

    constructor(backing: Writable, opt?: WritableOptions) {
        super({...opt, decodeStrings: false});
        this.setDefaultEncoding('utf8');

        // TODO WARNING: The values of .getColorDepth and .isTTY are pulled once and used static after that
        // this could introduce errors if those values change
        // This improves performance by about 25%

        if (typeof (backing as any).getColorDepth == 'function') {
            const colorDepth = (backing as any).getColorDepth();
            this.getColorDepth = () => colorDepth;
        }

        if (typeof (backing as any).isTTY != 'undefined') {
            this.isTTY = (backing as any).isTTY;
        }
    }

    _write(chunk: any, encoding: string, callback: (error?: (Error | null)) => void) {
        if (encoding === 'buffer') {
            callback(new Error("can not use buffers"));
            return;
        }

        if (typeof chunk != 'string') {
            callback(new Error("can not process chunk which are of type" + (typeof chunk)));
            return;
        }

        this.buffer += chunk;
        callback();

        return true;
    }

    _final(callback: (error?: (Error | null)) => void) {
        super._final(callback); // this will probably change an internal state of the stream
        return true;
    }
}