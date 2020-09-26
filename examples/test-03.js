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
    const rp1 = new ReplacePrinter();
    const rc1 = rp1.replaceConsole;

    rc1.log('This is a log of\na new line which is long');
    await waitMs(2500);
    rc1.log('This is another line\nwhich is broken into two');
    await waitMs(2000);

    // Warning: Never mix two ReplacePrinter, this will result in unexpected behavior!
    // You should call endWithNewLine when you are done printing with the ReplacePrinter and want to print something else
    rp1.endWithNewLine();

    const rp2 = new ReplacePrinter();
    const rc2 = rp2.replaceConsole;
    const cc2 = rp2.continuesConsole;

    let framesPrinted = 0;
    await doEveryTill(5, 4000, (isLast) => {
        framesPrinted++;
        const frameString = '[' + framesPrinted.toString().padStart(4, '0') + ']';
        if (isLast)
            rc2.log(frameString + ' This is the last log')
        else
            rc2.log(frameString + ' Another line which is meant\nto be broken up into multiple ' + Date());
    })

    cc2.log('framesPrinted', framesPrinted);
})().catch(err => {
    console.error(err);
    process.exit(1)
})