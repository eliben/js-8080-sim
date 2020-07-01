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

const MEMORY_SIZE = 64 * 1024;

class Assembler {
  constructor() {
    // memory is the memory map being build during assembly.
    this.memory = new Array(MEMORY_SIZE).fill(0);

    // labelToAddr maps label names to addresses. We fill this up as we go.
    // When a label is defined we know what the current address is, so we add
    // an entry.
    this.labelToAddr = new Map();

    // labelToFixups maps label names to an array of fixup addresses where
    // these labels are requested. This is filled up during assembly when we
    // encounter refereces to labels. In the fixup stage these are applied to
    // the proper places in the final memory map.
    // TODO: this can also help detect labels that were referenced but never
    // defined
    this.labelToFixups = new Map();
  }

  assemble(sourceLines) {
    this._assembleInstructions(sourceLines);
    this._applyFixups();
    return this.memory;
  }

  _assembleInstructions(sourceLines) {
    // curAddr is the current address into which the next instruction is going
    // to be assembled.
    let curAddr = 0;

    for (let sl of sourceLines) {
      if (sl.label !== null) {
        if (this.labelToAddr.has(sl.label)) {
          this._assemblyError(sl.pos, `duplicate label "${sl.label}"`);
        }

        this.labelToAddr.set(sl.label, curAddr);
      }

      // Instruction encoding here.
      if (sl.instr !== null) {
        let encoded = this._encodeInstruction(sl.instr, sl.args, curAddr);
      }
    }
  }

  _applyFixups() {
  }

  // Encodes the instruction 'instr' with its 'args' into an array of numbers,
  // and returns the array. curAddr is passed in so this method could update
  // the labelsToFixups field when it encounters label references.
  _encodeInstruction(instr, args, curAddr) {
  }

  _assemblyError(pos, msg) {
    throw new Error(`Assembly error at ${pos}: ${msg}`);
  }
}
