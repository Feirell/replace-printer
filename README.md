# replace-printer

> This package is rather basic, if you need something more elaborate you could look into [the ink package](https://www.npmjs.com/package/ink).

This package is meant to help you to construct continues in place output. For example this could be helpful to monitor the state of your application or to keep you updated on the current connections, cpu consumption or something else.

This package provides you with an easy to use way to print and then replace the printed with something else.

## usage

To use the package you can use the ReplacePrinter class.

<!-- USEFILE: test-it\test-01.js; str => str.replace('../', 'replace-printer') -->
``` js
const { ReplacePrinter } = require('replace-printer');

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


```


<!-- USEFILE: test-it\test-02.js; str => str.replace('../', 'replace-printer') -->
``` js
const { ReplacePrinter } = require('replace-printer');

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
```




