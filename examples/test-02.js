const {ReplacePrinter} = require('../');

const {continuesConsole, replaceConsole} = new ReplacePrinter();

replaceConsole.log('This is my object:', {field: 'test'});

setTimeout(() => {
    // if you want to print something the ordinary way in the meantime you can just do so by using
    continuesConsole.log('This is some event like print, which will scroll like always.', {withSome: 'object'});
}, 2000);

setTimeout(() => {
    replaceConsole.log('Whoosh and the message was removed.');
}, 5000);