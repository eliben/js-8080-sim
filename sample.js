'use strict';

const {Parser} = require('./parser.js');
const {Assembler} = require('./assembler.js');
const CPU8080 = require('./sim8080');

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

let testchainjmp = `
      mvi a, 50
      mvi b, 20
      mvi c, 100
      jmp Uno
Tres: add b
      hlt
Uno:  jmp Dos
      add c
Dos:  jmp Tres
      add c
`;

let prog = testchainjmp;

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

