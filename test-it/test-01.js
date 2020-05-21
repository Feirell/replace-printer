const { ReplacePrinter } = require('../');

const printer = new ReplacePrinter();

// if you want to print something the ordinary way in the meantime you can just do so by using 

printer.log('This is some event like print, which will scroll like always.', { withSome: 'object' });

const timespan = 6000;
const starttime = Date.now();

setTimeout(() => {
    printer.log('This is some event like print, which will scroll like always which appears after about ' + (timespan / 2) + 'ms');
}, timespan / 2);

const intervalId = setInterval(() => {
    const remainingTime = timespan - Date.now() + starttime;
    printer.replacePrint('This is some replaceable Text\n\twhich will be replaced in ' + remainingTime + 'ms');
    if (remainingTime <= 0) {
        clearInterval(intervalId);
        printer.replacePrint('Whoosh and the text was removed.');
        // once you are done you can call
        printer.stop();
    }
}, 16);

