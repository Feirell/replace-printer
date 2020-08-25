const {ReplacePrinter} = require('../');

const waitMs = ms => new Promise(res => setTimeout(res, ms));
const doEveryTill = (every, till, action) => {
    const endTs = Date.now() + till;
    return new Promise(res => {
        const intervalTo = setInterval(() => {
            const isLAst = Date.now() > endTs;
            action(isLAst);

            if (isLAst) {
                clearInterval(intervalTo);
                res();
            }
        }, every);
    });
}

(async () => {
    const rp1 = new ReplacePrinter().replaceConsole;

    rp1.log('This is a log of\na new line which is long');
    await waitMs(1000);
    rp1.log('This is another line\nwhich is broken into two\n');
    await waitMs(1000);

    const replaceprinter2 = new ReplacePrinter();
    const rp2 = replaceprinter2.replaceConsole;
    const cp2 = replaceprinter2.continuesConsole;

    let framesPrinted = 0;
    await doEveryTill(5, 4000, (isLast) => {
        framesPrinted++;
        const frameString = '[' + framesPrinted.toString().padStart(4, '0') + ']';
        if (isLast)
            rp2.log(frameString + ' this is the last log\n\n')
        else
            rp2.log(frameString + ' Another line which is not mean\nto be broken up into multiple ' + Date());
    })

    cp2.log('framesPrinted', framesPrinted);

    // await waitMs(1000);
    rp2.log('A final line which needs to be broken up since this is a test');
})().catch(err => {
    console.error(err);
    process.exit(1)
})