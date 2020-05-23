const {ReplacePrinter} = require('../');

const {continuesConsole, replaceConsole} = new ReplacePrinter();

// if you want to print something the ordinary way in the meantime you can just do so by using
continuesConsole.log('This is some event like print, which will scroll like always.', {withSome: 'object'});

const timespan = 6000;
const startTime = Date.now();

setTimeout(() => {
    continuesConsole.log('This is some event like print, which will scroll like always which appears after about %dms', Date.now() - startTime);
}, timespan / 2);

const intervalId = setInterval(() => {
    const remainingTime = timespan - Date.now() + startTime;
    replaceConsole.log('This is some replaceable Text\n\twhich will be replaced in %dms', remainingTime);

    if (remainingTime <= 0) {
        clearInterval(intervalId);
        replaceConsole.log('Whoosh and the text was removed.');
    }
}, 16);

