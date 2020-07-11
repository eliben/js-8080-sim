'use strict';

const {Parser} = require('./parser.js');
const {Assembler} = require('./assembler.js');
const CPU8080 = require('./sim8080');

let loadadd16bit = `
  lxi hl, 1234h
  lxi bc, 4567h
  dad bc
  hlt
`;

// TODO: add 'em up
let trydb = `
  mvi d, 0
  lxi bc, myArray

  ; Each iteration: load next item from myArray (until finding 0) into a. Add
  ; d <- d+a.
Loop:
  ldax bc
  cpi 0
  jz Done
  add d
  mov d, a
  inr c
  jmp Loop

Done:
  hlt

myArray:
  db 10, 20, 30, 10h, 20h, 0
`;

let prog = trydb;

let p = new Parser();
let sl = p.parse(prog);
let asm = new Assembler();
asm.setTracing(true);
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

let N = 10000;

// TODO: note, 0x00 is NOPs, so it will just keep executing.
for (let i = 0; i < N; i++) {
  CPU8080.steps(1);
  console.log(`T=${CPU8080.T()}; status=${JSON.stringify(CPU8080.status())}`);
  
  if (CPU8080.status().halted) {
    break;
  }
}

