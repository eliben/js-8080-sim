# js-8080-sim

Links:

* https://pastraiser.com/cpu/i8080/i8080_opcodes.html
* 8080 by opcode:
  http://www.emulator101.com/reference/8080-by-opcode.html 
* Online assembler with "live" assmelby:
  https://svofski.github.io/pretty-8080-assembler/
* Online assembler: https://www.asm80.com/onepage/asm8080.html 
* Instruction encoding: http://www.classiccmp.org/dunfield/r/8080.txt

Working (fixed up) memcpy from Wikipedia:

```
            org     1000h       ;Origin at 1000h
memcpy:     
            mov     a,b         ;Copy register B to register A
            ora     c           ;Bitwise OR of A and C into register A
            rz                  ;Return if the zero-flag is set high.
loop:       ldax    d           ;Load A from the address pointed by DE
            mov     m,a         ;Store A into the address pointed by HL
            inx     d           ;Increment DE
            inx     h           ;Increment HL
            dcx     b           ;Decrement BC   (does not affect Flags)
            mov     a,b         ;Copy B to A    (so as to compare BC with zero)
            ora     c           ;A = A | C      (set zero)
            jnz     loop        ;Jump to 'loop:' if the zero-flag is not set.   
            ret                 ;Return
```

Sample code from the code book:

```
Multiply:   push psw            ; save registers
            push bc

            sub h,h             ; set hl (result) to 0
            sub l,l

            mov a,b             ; the multiplier goes in a
            cpi a, 00h          ; if it's 0, we're finished
            jz AllDone

            mvi b,00h

MultLoop:   dad hl,bc
            dec a
            jnz MultLoop

AllDone:    pop bc
            pop psw
            ret 
```
