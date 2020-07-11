'use strict';

const assert = require('assert').strict;

const {Parser} = require('../src/parser.js');
const {Assembler} = require('../src/assembler.js');
const CPU8080 = require('../src/sim8080');


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

    assert.ok(state.halted);
    assert.equal(state.a, 0x35);
  });

  it('movsub', () => {
    let [state, mem] = runProg(`
      mvi a, 20
      mvi b, 5

      sub b
      sbi 7
      hlt
      `);

    assert.ok(state.halted);
    assert.equal(state.a, 8);
  });

  it('jzlabel', () => {
    let [state, mem] = runProg(`
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
    `);

    assert.ok(state.halted);
    assert.equal(state.c, 20);
  });

  it('jnzlabel', () => {
    let [state, mem] = runProg(`
      mvi a, 2h
      dcr a
      jz YesZero
      jnz NoZero

    YesZero:
      mvi c, 20
      hlt

    NoZero:
      mvi c, 50
      hlt
    `);

    assert.ok(state.halted);
    assert.equal(state.c, 50);
  });

  it('stack', () => {
    let [state, mem] = runProg(`
      mvi a, 20
      mvi b, 30
      push bc
      mvi b, 50
      add b
      pop bc
      add b
      hlt
    `);

    assert.ok(state.halted);
    assert.equal(state.a, 100);
  });

  it('chainjmp', () => {
    let [state, mem] = runProg(`
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
    `);

    assert.ok(state.halted);
    assert.equal(state.a, 70);
  });

  it('callret', () => {
    let [state, mem] = runProg(`
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
    `);

    assert.ok(state.halted);
    assert.equal(state.c, 57);
  });

  it('loadadd16bit', () => {
    let [state, mem] = runProg(`
      lxi hl, 1234h
      lxi bc, 4567h
      dad bc
      hlt
    `);

    assert.ok(state.halted);
    assert.equal(state.h, 0x57);
    assert.equal(state.l, 0x9b);
  });

  it('movindirect', () => {
    let [state, mem] = runProg(`
      lxi hl, myArray
      mov b, m
      inr l
      mov c m
      hlt

    myArray:
      db 10, 20
    `);

    assert.ok(state.halted);
    assert.equal(state.b, 10);
    assert.equal(state.c, 20);
  });

  it('mult', () => {
    let [state, mem] = runProg(`
            mvi b, 44
            mvi c, 55
            call Multiply
            hlt
            
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

AllDone:    pop  bc
            pop psw
            ret
    `);

    assert.ok(state.halted);
    assert.equal(state.h * 256 + state.l, 44 * 55);
  });

  it('adduparray', () => {
    let [state, mem] = runProg(`
      ; The sum will be accumulated into d
      mvi d, 0
      lxi bc, myArray

      ; Each iteration: load next item from myArray
      ; (until finding 0) into a. Then do d <- d+a.
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
    `);

    assert.ok(state.halted);
    assert.equal(state.d, 108);
  });

  it('adduparray-count', () => {
    // Similar to adduparray but with some differences:
    // * accumulation into 'a' using the indirect form of add
    // * using a counter instead of zero-marker for array end
    let [state, mem] = runProg(`
      ; The sum will be accumulated into a
      mvi a, 0
      lxi hl, myArray

      ; c is the counter
      mvi c, 5

    Loop:
      add m
      inr l
      dcr c
      jz Done
      jmp Loop

    Done:
      hlt

    myArray:
      db 10, 20, 30, 10h, 21h
    `);

    assert.ok(state.halted);
    assert.equal(state.a, 109);
  });


  it('pchl', () => {
    let [state, mem] = runProg(`
        lxi hl, There
        pchl
        mvi a, 20
        hlt

There:  mvi a, 30
        hlt
      `);

    assert.ok(state.halted);
    assert.equal(state.a, 30);
  });

  it('cond-call-cnz-yes', () => {
    // Conditional call with cnz will happen.
    let [state, mem] = runProg(`
        mvi b, 5
        mvi a, 2
        dcr a
        cnz BAdder
        hlt

        ; This function increments b
    BAdder:
        inr b
        ret
      `);

    assert.ok(state.halted);
    assert.equal(state.b, 6);
  });

  it('cond-call-cnz-no', () => {
    // Conditional call with cnz will not happen.
    let [state, mem] = runProg(`
        mvi b, 5
        mvi a, 1
        dcr a
        cnz BAdder
        hlt

        ; This function increments b
    BAdder:
        inr b
        ret
      `);

    assert.ok(state.halted);
    assert.equal(state.b, 5);
  });

  it('cond-ret-rz-first', () => {
    // First rz in BRet will return.
    let [state, mem] = runProg(`
        mvi b, 1
        call BRet
        hlt

    BRet:
        mvi c, 10
        dcr b
        rz
        mvi c, 20
        dcr b
        rz
        mvi c, 99
        hlt
      `);

    assert.ok(state.halted);
    assert.equal(state.c, 10);
  });

  it('cond-ret-rz-second', () => {
    // First rz in BRet will not return, but the second will.
    let [state, mem] = runProg(`
        mvi b, 2
        call BRet
        hlt

    BRet:
        mvi c, 10
        dcr b
        rz
        mvi c, 20
        dcr b
        rz
        mvi c, 99
        hlt
      `);

    assert.ok(state.halted);
    assert.equal(state.c, 20);
  });

  it('bitwise-and', () => {
    let [state, mem] = runProg(`
       mvi a, 11111111b
       mvi b, 11101110b
       ani 11111101b
       ana b
       hlt
      `);

    assert.ok(state.halted);
    assert.equal(state.a, 0b11101100);
  });

  it('bitwise-or', () => {
    let [state, mem] = runProg(`
       mvi a, 10000001b
       mvi b, 10101010b
       ori 100b
       ora b
       hlt
      `);

    assert.ok(state.halted);
    assert.equal(state.a, 0b10101111);
  });

  it('bitwise-xor', () => {
    let [state, mem] = runProg(`
       mvi a, 10000001b
       mvi b, 11111111b
       xra b
       xri 00111100b
       hlt
      `);

    assert.ok(state.halted);
    assert.equal(state.a, 0b01000010);
  });

  it('bitwise-rotate', () => {
    let [state, mem] = runProg(`
       mvi a, 11101110b
       rlc
       mov b, a
       mvi a, 11101110b
       rrc
       hlt
      `);

    assert.ok(state.halted);
    assert.equal(state.a, 0b01110111, 'a');
    assert.equal(state.b, 0b11011101, 'b');
  });
});
