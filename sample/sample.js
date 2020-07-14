// Sample usage. Invoke with 'node' from the main directory.
'use strict';

const {Parser} = require('../src/parser.js');
const {Assembler} = require('../src/assembler.js');
const CPU8080 = require('../src/sim8080');

let prog = `
  lxi hl, myArray
  mvi m, 33
  mvi a, 55
  lda myArray
  hlt

myArray:
  db 00
`;

let p = new Parser();
let sl = p.parse(prog);
let asm = new Assembler();
asm.setTracing(true);
let [mem, labelToAddr] = asm.assemble(sl);
console.log(labelToAddr);

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

let N = 10000;

// note, 0x00 is NOPs, so it will just keep executing.
for (let i = 0; i < N; i++) {
  CPU8080.steps(1);
  console.log(`T=${CPU8080.T()}; status=${JSON.stringify(CPU8080.status())}`);
  
  if (CPU8080.status().halted) {
    break;
  }
}

