'use strict';

const assert = require('assert').strict;

const {Parser} = require('./parser.js');
const {Assembler} = require('./assembler.js');
const CPU8080 = require('./sim8080');


class Sim8080 {
  constructor(progText) {
    let p = new Parser();
    let asm = new Assembler();

    this.sourceLines = p.parse(prog);
    this.mem = asm.assemble(sourceLines);
  }
}

describe('sim', () => {
  it('foo1', () => {
    let prog = `
    mvi b, 10h
    mvi a, 20h
    add b
    hlt
    `;
    let p = new Parser();
    let sl = p.parse(prog);
    let asm = new Assembler();
    let mem = asm.assemble(sl);

    // Set up memory access functions for the simulator.
    function memoryTo(addr, value) {
      mem[addr] = value;
    }

    function memoryAt(addr) {
      return mem[addr];
    }

    // Initialize simulator, and set PC=0 explicitly.
    CPU8080.init(memoryTo, memoryAt);
    CPU8080.set('PC', 0);

    let N = 10;

    for (let i = 0; i < N; i++) {
      CPU8080.steps(1);
    }

    console.log(CPU8080.status());
    assert.equal(CPU8080.status().a, 0x30);
    assert.ok(CPU8080.status().halted);
  });
});

it('should return true', () => {
  assert.equal(true, true);
});
