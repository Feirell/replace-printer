const { ReplacePrinter } = require('../');

const printer = new ReplacePrinter();

printer.replacePrint('Some Text which you will replace.');

// if you want to print something the ordinary way in the meantime you can just do so by using 

setTimeout(() => {
    printer.log('This is some event like print, which will scroll like alway.', { withSome: 'object' });
}, 2000);

setTimeout(() => {
    printer.replacePrint('Whoos\nand the text was removed.');
}, 5000);

// once you are done you can call .stop() this will force flush all remaining text and switch its state, if you want to continue you need to create a new one
setTimeout(() => {
    printer.stop();
}, 5500);