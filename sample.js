'use strict';

const {Parser} = require('./parser.js');
const {Assembler} = require('./assembler.js');
const CPU8080 = require('./sim8080');

let prog = `
mvi b, 10h
mvi a, 20h
add b
hlt
`;

let mult = `
; multiplies b by c, puts result in hl

Multiply:   push psw            ; save registers
            push bc

            mvi h, 00h
            mvi l, 00h

            mov a,b          ; the multiplier goes in a
            cpi 00h          ; if it's 0, we're finished
            jz AllDone

            mvi b,00h

MultLoop:   dad bc
            dcr a
            jnz MultLoop

            lxi bc, 3040h
AllDone:    pop  bc
            pop psw
            ret
`;

let testjmp = `
  mvi a, 1h
  dcr a
  jz YesZero
  jnz NoZero

YesZero:
  mvi c, 20
  hlt

NoZero:
  mvi c, 50
  hlt
`;

let teststack = `
  mvi a, 20
  mvi b, 30
  push bc
  mvi b, 50
  add b
  pop bc
  add b
  hlt
`;

let testcallret = `
  mvi b, 35
  mvi c, 22
  call Sub
  hlt
  
    ; This subroutine adds b into c, and clobbers a.
Sub:
  mov a, b
  add c
  mov c, a
  ret
`;

prog = testcallret;

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

let N = 100;

// TODO: note, 0x00 is NOPs, so it will just keep executing.
for (let i = 0; i < N; i++) {
  CPU8080.steps(1);
  console.log(`T=${CPU8080.T()}; status=${JSON.stringify(CPU8080.status())}`);
  
  if (CPU8080.status().halted) {
    break;
  }
}

