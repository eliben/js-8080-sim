'use strict';

const assert = require('assert').strict;

const {Parser} = require('./parser.js');
const {Assembler} = require('./assembler.js');
const CPU8080 = require('./sim8080');


// runProg runs the assembly program in progText and returns a pair of
// [cpu state, memory map] after the program halts.
// If maxSteps is provided, runs up to maxSteps steps (otherwise a default upper
// limit is applied to avoid hanging).
// TODO: it sucks that CPU8080 manipulates global state; fix it.
function runProg(progText, maxSteps) {
  let p = new Parser();
  let asm = new Assembler();
  let sourceLines = p.parse(progText);
  let mem = asm.assemble(sourceLines);

  const memoryTo = (addr, value) => {mem[addr] = value;};
  const memoryAt = (addr) => {return mem[addr];};
  CPU8080.init(memoryTo, memoryAt);
  CPU8080.set('PC', 0);

  if (maxSteps === undefined) {
    maxSteps = 50000;
  }

  for (let i = 0; i < maxSteps; i++) {
    CPU8080.steps(1);

    if (CPU8080.status().halted) {
      break;
    }
  }

  return [CPU8080.status(), mem];
}

describe('sim', () => {
  it('movadd', () => {
    let [state, mem] = runProg(`
      mvi b, 12h
      mvi a, 23h
      add b
      hlt
      `);

    console.log(state);
    assert.ok(state.halted);
    assert.equal(state.a, 0x35);
  });
});

it('should return true', () => {
  assert.equal(true, true);
});
