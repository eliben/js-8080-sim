'use strict';

const {Parser} = require('./parser.js');

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

    // tracing sets a tracing/debugging mode for the assembler where it reports
    // all the instructions it's processing and their encodings.
    this.tracing = false;
  }

  assemble(sourceLines) {
    this._assembleInstructions(sourceLines);
    this._applyFixups();
    return this.memory;
  }

  // Set tracing mode: true or false;
  setTracing(tracing) {
    this.tracing = tracing;
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

        if (this.tracing) {
          console.log(`Setting label ${sl.label}=0x${curAddr.toString(16)}`);
        }
        this.labelToAddr.set(sl.label, curAddr);
      }

      // Instruction encoding here.
      if (sl.instr !== null) {
        let encoded = this._encodeInstruction(sl, curAddr);
        if (this.tracing) {
          console.log(`0x${curAddr.toString(16)} =>`, encoded.map((e) => e.toString(16)));
        }
        for (let i = 0; i < encoded.length; i++) {
          this.memory[curAddr++] = encoded[i];
        }
      }
    }
  }

  _applyFixups() {
  }

  // Encodes the instruction in source line sl into an array of numbers,
  // and returns the array. curAddr is passed in so this method could update
  // the labelsToFixups field when it encounters label references.
  // Follows encodings in http://www.classiccmp.org/dunfield/r/8080.txt
  _encodeInstruction(sl, curAddr) {
    if (this.tracing) {
      console.log('assembling', JSON.stringify(sl));
    }
    switch (sl.instr.toLowerCase()) {
      case 'add': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b10000000 | r];
      }
      case 'cpi': {
        this._expectArgsCount(sl, 1);
        let imm = this._argImm(sl, sl.args[0]);
        return [0b11111110, imm];
      }
      case 'dad': {
        this._expectArgsCount(sl, 1);
        let rp = this._argRP(sl, sl.args[0]);
        return [0b00001001 | (rp << 4)];
      }
      case 'dcr': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b00000101 | (r << 3)];
      }
      case 'hlt': {
        this._expectArgsCount(sl, 0);
        return [0b01110110];
      }
      case 'jnz':
      case 'jz': {
        this._expectArgsCount(sl, 1);
        this._argLabel(sl, sl.args[0], curAddr);

        let ie = 0;
        switch (sl.instr.toLowerCase()) {
          case 'jz': ie = 0b11001010; break;
          case 'jnz': ie = 0b11000010; break;
          default:
            this._assemblyError(sl.pos, `unknown instruction ${sl.instr}`);
        }
        return [ie, 0, 0];
      }
      case 'lda': {
        this._expectArgsCount(sl, 1);
        let num = this._argImmOrLabel(sl, sl.args[1]);
        // 16-bit immediates encoded litte-endian.
        return [0b00111010 | (rp << 4), num & 0xff, (num >> 8) & 0xff];
      }
      case 'lhld': {
        this._expectArgsCount(sl, 1);
        let num = this._argImmOrLabel(sl, sl.args[1]);
        // 16-bit immediates encoded litte-endian.
        return [0b00101010 | (rp << 4), num & 0xff, (num >> 8) & 0xff];
      }
      case 'lxi': {
        this._expectArgsCount(sl, 2);
        let rp = this._argRP(sl, sl.args[0]);
        let num = this._argImmOrLabel(sl, sl.args[1]);
        // 16-bit immediates encoded litte-endian.
        return [0b00000001 | (rp << 4), num & 0xff, (num >> 8) & 0xff];
      }
      case 'mov': {
        this._expectArgsCount(sl, 2);
        let rd = this._argR(sl, sl.args[0]);
        let rs = this._argR(sl, sl.args[1]);
        return [0b01000000 | (rd << 3) | rs];
      }
      case 'mvi': {
        this._expectArgsCount(sl, 2);
        let r = this._argR(sl, sl.args[0]);
        let imm = this._argImm(sl, sl.args[1]);
        return [0b110 | (r << 3), imm];
      }
      case 'pop': {
        this._expectArgsCount(sl, 1);
        let rp = this._argRP(sl, sl.args[0]);
        return [0b11000001 | (rp << 4)];
      }
      case 'push': {
        this._expectArgsCount(sl, 1);
        let rp = this._argRP(sl, sl.args[0]);
        return [0b11000101 | (rp << 4)];
      }
      case 'sta': {
        this._expectArgsCount(sl, 1);
        let num = this._argImmOrLabel(sl, sl.args[1]);
        // 16-bit immediates encoded litte-endian.
        return [0b00110010 | (rp << 4), num & 0xff, (num >> 8) & 0xff];
      }
      case 'shld': {
        this._expectArgsCount(sl, 1);
        let num = this._argImmOrLabel(sl, sl.args[1]);
        // 16-bit immediates encoded litte-endian.
        return [0b00100010 | (rp << 4), num & 0xff, (num >> 8) & 0xff];
      }
      case 'ret': {
        this._expectArgsCount(sl, 0);
        return [0b11001001];
      }
      default:
        this._assemblyError(sl.pos, `unknown instruction ${sl.instr}`);
    }
    return [];
  }

  _expectArgsCount(sl, count) {
    if (sl.args.length != count) {
      this._assemblyError(sl.pos, `want ${count} args for ${sl.instr}; got ${sl.args.length}`);
    }
  }

  // Expect arg to be a register pair and return its encoding.
  _argRP(sl, arg) {
    switch (arg.toLowerCase()) {
      case 'bc': return 0b00;
      case 'de': return 0b01;
      case 'hl': return 0b10;
      case 'sp':
      case 'psw':
        return 0b11;
      default:
        this._assemblyError(sl.pos, `invalid register pair ${arg}`);
    }
  }

  // Expect arg to be a register and return its encoding.
  _argR(sl, arg) {
    switch (arg.toLowerCase()) {
      case 'a': return 0b111;
      case 'b': return 0b000;
      case 'c': return 0b001;
      case 'd': return 0b010;
      case 'e': return 0b011;
      case 'h': return 0b100;
      case 'l': return 0b101;
      default:
        this._assemblyError(sl.pos, `invalid register ${arg}`);
    }
  }

  // Expect arg to be an immediate number and return its encoding.
  _argImm(sl, arg) {
    let n = this._parseNumber(arg);
    if (isNaN(n)) {
      this._assemblyError(sl.pos, `invalid immediate ${arg}`);
    }
    return n;
  }

  // Expect arg to be a label name and add an entry in labelToFixups for it.
  _argLabel(sl, arg, curAddr) {
    if (!/^[a-zA-Z_][a-zA-Z_0-9]/.test(arg)) {
      this._assemblyError(sl.pos, `invalid label name ${arg}`);
    }

    if (!this.labelToFixups.has(arg)) {
      this.labelToFixups.set(arg, [curAddr]);
    } else {
      this.labelToFixups.get(arg).push(curAddr);
    }

    if (this.tracing) {
      console.log(`fixups for '${arg}': ${this.labelToFixups.get(arg)}`);
    }
  }

  // Arg can be either an immediate (if it looks like a number) or a label (if
  // it doesn't). Its value is returned in any case, as a number. For labels,
  // a 0 is returned and the fixup map is updated.
  _argImmOrLabel(sl, arg, curAddr) {
    let n = this._parseNumber(arg);
    if (isNaN(n)) {
      // Label.
      this._argLabel(sl, arg, curAddr);
      return 0;
    } else {
      // Number.
      return n;
    }
  }

  // Parses numbers in accepted asm format (24, 1Ah, 0101b)
  // A strict parser of binary, hex and decimal numbers. Returns NaN for invalid
  // numbers with bad prefixes, etc.
  _parseNumber(n) {
    n = n.toLowerCase();

    // Find supported base; validator will be set to a regexp to validate the
    // number's contents. n will be trimmed if needed.
    let validator = null;
    let base = 10;

    if (n.endsWith('h')) {
      validator = /^[0-9a-f]+$/;
      n = n.slice(0, -1);
      base = 16;
    } else if (n.endsWith('b')) {
      validator = /^[0-1]+$/;
      n = n.slice(0, -1);
      base = 2;
    } else {
      validator = /^[0-9]+$/;
    }

    if (!validator.test(n)) {
      return NaN;
    } else {
      return parseInt(n, base);
    }
  }

  _assemblyError(pos, msg) {
    throw new Error(`Assembly error at ${pos}: ${msg}`);
  }
}

// Exports.
module.exports.Assembler = Assembler;
