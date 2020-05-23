import {clearTimeout, setTimeout} from "timers";
import Timeout = NodeJS.Timeout;

export class CalibrateableThrottle {
    private timeout!: number;
    private timeoutId?: Timeout;

    constructor(private callback: () => any, timeout: number) {
        this.setTimout(timeout);
    }

    private get timeoutIsRunning() {
        return this.timeoutId !== undefined;
    }

    setTimout(interval: number) {
        if (typeof interval != 'number' || interval < 0 || !Number.isFinite(interval))
            throw new Error('interval needs to be a positive finite number');

        this.timeout = interval;

        if (this.timeoutIsRunning) {
            this.abort();
            this.changeNotice();
        }
    }

    changeNotice() {
        if (!this.timeoutIsRunning) {
            if (this.timeout == 0) {
                this.callback();
            } else {
                this.timeoutId = setTimeout(() => {
                    this.timeoutId = undefined;
                    this.callback();

                }, this.timeout);
            }
            return true;
        }

        return false;
    }

    abort() {
        if (this.timeoutIsRunning) {
            clearTimeout(this.timeoutId as Timeout)
            this.timeoutId = undefined;
            return true;
        }

        return false;
    }
}