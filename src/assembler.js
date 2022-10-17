'use strict';

const MEMORY_SIZE = 64 * 1024;

// Custom exception type thrown by the assembler.
class AssemblyError extends Error {
  constructor(message, pos) {
    super(message);
    this.pos = pos;
  }

  toString() {
    return `Assembly error at ${this.pos}: ${this.message}`;
  }
}

class Assembler {
  constructor() {
    // memory is the memory map being build during assembly.
    this.memory = new Array(MEMORY_SIZE).fill(0);

    // labelToAddr maps label names to addresses. We fill this up as we go.
    // When a label is defined we know what the current address is, so we add
    // an entry.
    this.labelToAddr = new Map();

    // Map address to line number
    this.lineAddressMapping = new Map();

    // labelToFixups maps label names to an array of fixup addresses where
    // these labels are requested. This is filled up during assembly when we
    // encounter refereces to labels. In the fixup stage these are applied to
    // the proper places in the final memory map.
    // Each entry in this map is an object:
    // {
    //    addr: the address where the fixup is needed,
    //    pos: reference to this label in the source
    // }
    this.labelToFixups = new Map();

    // tracing sets a tracing/debugging mode for the assembler where it reports
    // all the instructions it's processing and their encodings.
    this.tracing = false;
  }

  // Assembles the given source lines. Returns [memory, labelToAddr].
  // memory is the assembled memory array. labelToAddr is a Map object mapping
  // labels to addresses in memory.
  assemble(sourceLines) {
    this._assembleInstructions(sourceLines);
    this._applyFixups();
    return [this.memory, this.labelToAddr, this.lineAddressMapping];
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
        this.lineAddressMapping[curAddr] = sl.pos.line;
        for (let i = 0; i < encoded.length; i++) {
          this.memory[curAddr++] = encoded[i];
        }
      }
    }
  }

  _applyFixups() {
    for (let label of this.labelToFixups.keys()) {
      let addr = this.labelToAddr.get(label);
      if (addr === undefined) {
        const user = this.labelToFixups.get(label)[0];
        this._assemblyError(user.pos, `label '${label}' used but not defined`);
      }

      let addrLowByte = addr & 0xff;
      let addrHighByte = (addr >> 8) & 0xff;
      // Label is defined. Apply its address in each user location. User
      // locations point to an instruction:
      //
      //   mem: [...., instr opcode, <low byte slot>, <high byte slot>, ...]
      //                    ^
      //                    |
      //                 user.addr
      //
      for (let user of this.labelToFixups.get(label)) {
        this.memory[user.addr + 1] = addrLowByte;
        this.memory[user.addr + 2] = addrHighByte;

        if (this.tracing) {
          let vals = this.memory.slice(user.addr, user.addr + 3).map(
            (val) => {return val.toString(16);});

          console.log(`applied fixup at 0x${user.addr.toString(16)}: [${vals}]`);
        }
      }
    }
  }

  // Encodes the instruction in source line sl into an array of numbers,
  // and returns the array. curAddr is passed in so this method could update
  // the labelsToFixups field when it encounters label references.
  // Follows encodings in http://www.classiccmp.org/dunfield/r/8080.txt
  _encodeInstruction(sl, curAddr) {
    if (this.tracing) {
      console.log('assembling', JSON.stringify(sl));
    }
    const instrName = sl.instr.toLowerCase();
    switch (instrName) {
      case 'adc': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b10001000 | r];
      }
      case 'add': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b10000000 | r];
      }
      case 'aci': {
        this._expectArgsCount(sl, 1);
        let imm = this._argImm(sl, sl.args[0]);
        return [0b11001110, imm];
      }
      case 'adi': {
        this._expectArgsCount(sl, 1);
        let imm = this._argImm(sl, sl.args[0]);
        return [0b11000110, imm];
      }
      case 'ana': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b10100000 | r];
      }
      case 'ani': {
        this._expectArgsCount(sl, 1);
        let imm = this._argImm(sl, sl.args[0]);
        return [0b11100110, imm];
      }
      case 'call':
      case 'cc':
      case 'cnc':
      case 'cnz':
      case 'cm':
      case 'cp':
      case 'cpe':
      case 'cpo':
      case 'cz': {
        this._expectArgsCount(sl, 1);
        this._argLabel(sl, sl.args[0], curAddr);

        let ie = 0;
        if (instrName === 'call') {
          ie = 0b11001101;
        } else {
          let ccc = instrName.slice(1);
          ie = 0b11000100 | (this._translateCCC(ccc, sl) << 3);
        }
        return [ie, 0, 0];
      }
      case 'cma': {
        this._expectArgsCount(sl, 0);
        return [0b00101111];
      }
      case 'cmc': {
        this._expectArgsCount(sl, 0);
        return [0b00111111];
      }
      case 'cmp': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b10111000 | r];
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
      case 'db': {
        // Pseudo-instruction that simply assigns its immediate args to memory.
        if (sl.args.length == 1 && sl.args[0] instanceof Array) {
          // If 'db' has a single array argument, it comes from a STRING.
          return sl.args[0].map((c) => {return c.charCodeAt(0);});
        } else {
          return sl.args.map((arg) => {return this._argImm(sl, arg);});
        }
        throw new Error("Impossible to get here...");
      }
      case 'dw': {
        // Pseudo-instruction that treats immediate args as 2-byte words, and
        // assigns them to memory in little-endian.
        let enc = [];
        for (let arg of sl.args) {
          let argEnc = this._argImm(sl, arg);
          enc.push(argEnc & 0xFF);
          enc.push((argEnc >> 8) & 0xFF);
        }
        return enc;
      }
      case 'dcr': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b00000101 | (r << 3)];
      }
      case 'dcx': {
        this._expectArgsCount(sl, 1);
        let rp = this._argRP(sl, sl.args[0]);
        return [0b00001011 | (rp << 4)];
      }
      case 'hlt': {
        this._expectArgsCount(sl, 0);
        return [0b01110110];
      }
      case 'inr': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b00000100 | (r << 3)];
      }
      case 'inx': {
        this._expectArgsCount(sl, 1);
        let rp = this._argRP(sl, sl.args[0]);
        return [0b00000011 | (rp << 4)];
      }
      case 'jc':
      case 'jm':
      case 'jmp':
      case 'jnc':
      case 'jnz':
      case 'jp':
      case 'jpe':
      case 'jpo':
      case 'jz': {
        this._expectArgsCount(sl, 1);
        this._argLabel(sl, sl.args[0], curAddr);

        let ie = 0;
        if (instrName === 'jmp') {
          ie = 0b11000011;
        } else {
          let ccc = instrName.slice(1);
          ie = 0b11000010 | (this._translateCCC(ccc, sl) << 3);
        }
        return [ie, 0, 0];
      }
      case 'lda': {
        this._expectArgsCount(sl, 1);
        let num = this._argImmOrLabel(sl, sl.args[0], curAddr);
        // 16-bit immediates encoded litte-endian.
        return [0b00111010, num & 0xff, (num >> 8) & 0xff];
      }
      case 'ldax': {
        this._expectArgsCount(sl, 1);
        let rp = this._argRP(sl, sl.args[0]);
        return [0b00001010 | (rp << 4)];
      }
      case 'lhld': {
        this._expectArgsCount(sl, 1);
        let num = this._argImmOrLabel(sl, sl.args[1], curAddr);
        // 16-bit immediates encoded litte-endian.
        return [0b00101010, num & 0xff, (num >> 8) & 0xff];
      }
      case 'lxi': {
        this._expectArgsCount(sl, 2);
        let rp = this._argRP(sl, sl.args[0]);
        let num = this._argImmOrLabel(sl, sl.args[1], curAddr);
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
      case 'nop': {
        this._expectArgsCount(sl, 0);
        return [0b00000000];
      }
      case 'ora': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b10110000 | r];
      }
      case 'ori': {
        this._expectArgsCount(sl, 1);
        let imm = this._argImm(sl, sl.args[0]);
        return [0b11110110, imm];
      }
      case 'pchl': {
        this._expectArgsCount(sl, 0);
        return [0b11101001];
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
      case 'rc':
      case 'ret': 
      case 'rnc':
      case 'rnz':
      case 'rm':
      case 'rp':
      case 'rpe':
      case 'rpo':
      case 'rz': {
        this._expectArgsCount(sl, 0);
        let ie = 0;
        if (instrName === 'ret') {
          ie = 0b11001001;
        } else {
          let ccc = instrName.slice(1);
          ie = 0b11000000 | (this._translateCCC(ccc, sl) << 3);
        }
        return [ie];
      }
      case 'ral': {
        this._expectArgsCount(sl, 0);
        return [0b00010111];
      }
      case 'rar': {
        this._expectArgsCount(sl, 0);
        return [0b00011111];
      }
      case 'rlc': {
        this._expectArgsCount(sl, 0);
        return [0b00000111];
      }
      case 'rrc': {
        this._expectArgsCount(sl, 0);
        return [0b00001111];
      }
      case 'sbb': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b10011000 | r];
      }
      case 'sbi': {
        this._expectArgsCount(sl, 1);
        let imm = this._argImm(sl, sl.args[0]);
        return [0b11011110, imm];
      }
      case 'shld': {
        this._expectArgsCount(sl, 1);
        let num = this._argImmOrLabel(sl, sl.args[1], curAddr);
        // 16-bit immediates encoded litte-endian.
        return [0b00100010, num & 0xff, (num >> 8) & 0xff];
      }
      case 'sphl': {
        this._expectArgsCount(sl, 0);
        return [0b11111001];
      }
      case 'sta': {
        this._expectArgsCount(sl, 1);
        let num = this._argImmOrLabel(sl, sl.args[0], curAddr);
        // 16-bit immediates encoded litte-endian.
        return [0b00110010, num & 0xff, (num >> 8) & 0xff];
      }
      case 'stax': {
        this._expectArgsCount(sl, 1);
        let rp = this._argRP(sl, sl.args[0]);
        return [0b00000010 | (rp << 4)];
      }
      case 'stc': {
        this._expectArgsCount(sl, 0);
        return [0b00110111];
      }
      case 'sub': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b10010000 | r];
      }
      case 'sui': {
        this._expectArgsCount(sl, 1);
        let imm = this._argImm(sl, sl.args[0]);
        return [0b11010110, imm];
      }
      case 'xchg': {
        this._expectArgsCount(sl, 0);
        return [0b11101011];
      }
      case 'xra': {
        this._expectArgsCount(sl, 1);
        let r = this._argR(sl, sl.args[0]);
        return [0b10101000 | r];
      }
      case 'xri': {
        this._expectArgsCount(sl, 1);
        let imm = this._argImm(sl, sl.args[0]);
        return [0b11101110, imm];
      }
      case 'xthl': {
        this._expectArgsCount(sl, 0);
        return [0b11100011];
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
      case 'bc': case 'b': return 0b00;
      case 'de': case 'd': return 0b01;
      case 'hl': case 'h': return 0b10;
      case 'sp': case 'psw': return 0b11;
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
      case 'm': return 0b110;
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
      this.labelToFixups.set(arg, [{addr: curAddr, pos: sl.pos}]);
    } else {
      this.labelToFixups.get(arg).push({addr: curAddr, pos: sl.pos});
    }

    if (this.tracing) {
      console.log(`fixups for '${arg}': ${JSON.stringify(this.labelToFixups.get(arg))}`);
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

  // Translates the CCC (condition code) ending to its binary encoding.
  _translateCCC(ccc, sl) {
    switch (ccc) {
      case 'nz': return 0b000;
      case 'z':  return 0b001;
      case 'nc': return 0b010;
      case 'c':  return 0b011;
      case 'po': return 0b100;
      case 'pe': return 0b101;
      case 'p':  return 0b110;
      case 'm':  return 0b111;
      default:
        this._assemblyError(sl.pos, `unknown CCC ending ${ccc}`);
    }
  }

  _assemblyError(pos, msg) {
    throw new AssemblyError(msg, pos);
  }
}

// Exports.
module.exports.Assembler = Assembler;
module.exports.AssemblyError = AssemblyError;
