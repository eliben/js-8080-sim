'use strict';

const {Parser} = require('./parser.js');

let p = new Parser();
let res = p.parse(`foobar\n`);

for (let r of res) {
  console.log(JSON.stringify(r, null, 2));
}

// TODO: should produce a raw memory map with assembled code, array of memory
// essentially (64 KiB?)
//
// Needs a fixup step to patch labels.

class Assembler {
  constructor() {
  }

  assemble(sourceLines) {
  }
}
