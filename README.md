# js-8080-sim

Interactive assembler and simulator for the 8080 CPU. Can be used from the
command line (on Node.js) or in the browser, with a simple UI):

<p align="center">
  <img src="https://github.com/eliben/js-8080-sim/blob/master/doc/js-sim-screenshot.png?raw=true">
</p>

## How it works

The code for the assembler and simulator is in the `src/` directory.

The files `parser.js` and `assembler.js` implement a 8080 assembler. Assemblers
typically have different syntaxes; this one attempts to remain close to the
"Intel 8080 Assembly Language Programming Manual" book. Not all directives are
implemented - PRs welcome!

The file `sim8080.js` is the 8080 simulator; it is forked from
https://github.com/maly/8080js with some minor tweaks, and retains its original
BSD license.

For an example of using the assembler and simulator from the command line, see
`sample/sample.js`.

## Web UI

The web UI has no server component; it runs purely in your browser and doesn't
make any HTTP requests. It does use the browser's local storage to save the last
program you ran, for convenience. You can play with a live version here:
https://eliben.org/js8080 

js-8080-sim uses `browserify`; see `Makefile` for the invocation.

The files `index.html`, `ui.js` and `js8080simBundle.js` should be distributed
together to make it all work in the browser.
