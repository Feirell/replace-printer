# replace-printer

> This package is rather basic, if you need something more elaborate you could look into [the ink package](https://www.npmjs.com/package/ink).

This package is meant to help you to construct continues in place output. For example this could be helpful to monitor the state of your application or to keep you updated on the current connections, cpu consumption or something else.

This package provides you with an easy to use way to print and then replace the printed with something else.

## usage

To use the package you can use the ReplacePrinter class.

<!-- USEFILE: test-it\test-01.js; str => str.replace('../', 'replace-printer') -->
``` js
const {ReplacePrinter} = require('replace-printer');

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


```




<!-- USEFILE: test-it\test-02.js; str => str.replace('../', 'replace-printer') -->
``` js
const {ReplacePrinter} = require('replace-printer');

const {continuesConsole, replaceConsole} = new ReplacePrinter();

replaceConsole.log('This is my object:', {field: 'test'});

setTimeout(() => {
    // if you want to print something the ordinary way in the meantime you can just do so by using
    continuesConsole.log('This is some event like print, which will scroll like always.', {withSome: 'object'});
}, 2000);

setTimeout(() => {
    replaceConsole.log('Whoosh and the message was removed.');
}, 5000);
```






