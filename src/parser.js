'use strict';

// Lexer for 8080 assembly.
// Usage: create it given the input as an array of chars. Then repeatedly
// call token() until it returns null.
//
// token() returns objects with:
// {
//   name: <token name>,
//   value: <raw token value from the input buffer, as a string>,
//   pos: <token position in the buffer>
// }
//
// Possible token names: LABEL, ID, <ops>, STRING, NEWLINE.
// For ops, name and value are the same, e.g. {name: '[', value: ']', pos: ...}
// For STRING, the value's quotes are stripped
//
// IDs are returned for everything alphanumeric, including directives (starting
// with a '.') and numbers. Numbers can be hex - difficult to distinguish from
// IDs otherwise (e.g. "fah" could theoretically be a hex number "fa").
class Lexer {
  // buf should be an array of chars
  constructor(buf) {
    this.pos = 0;
    this.buf = buf;

    // These state variables are used to keep track of the line and column
    // of tokens.
    this.lineCount = 1;
    this.lastNewlinePos = 0;

    this._ops = new Set([':', ',', '[', ']']);
  }

  // Get the next token. Returns objects as described in the class comment; at
  // end of input, returns null every time it's called.
  token() {
    this._skipNonTokens();
    if (this.pos >= this.buf.length) {
      return null;
    }

    if (this.buf[this.pos] === ';') {
      this._skipComment();
    }

    let c = this.buf[this.pos];
    if (this._isNewline(c)) {
      let tok = {name: 'NEWLINE', value: c, pos: this._lineCol(this.pos)};
      this._skipNewlines();
      return tok;
    }

    if (this._ops.has(c)) {
      // Known operator.
      let tok = {name: c, value: c, pos: this._lineCol(this.pos)};
      this.pos++;
      return tok;
    } else {
      if (this._isAlphaNum(c)) {
        return this._id();
      } else if (c === "'") {
        return this._string();
      } else {
        throw new Error(`Token error at ${this.pos}`);
      }
    }
  }

  // Process and return an ID or LABEL.
  _id() {
    let endpos = this.pos + 1;
    while (endpos < this.buf.length && this._isAlphaNum(this.buf[endpos])) {
      endpos++;
    }

    if (endpos < this.buf.length && this.buf[endpos] === ':') {
      let tok = {
        name: 'LABEL',
        value: this.buf.slice(this.pos, endpos).join(''),
        pos: this._lineCol(this.pos)
      };
      this.pos = endpos + 1;
      return tok;
    } else {
      let tok = {
        name: 'ID',
        value: this.buf.slice(this.pos, endpos).join(''),
        pos: this._lineCol(this.pos)
      };
      this.pos = endpos;
      return tok;
    }
  }

  _string() {
    // this.pos points to the opening quote; find the ending quote.
    let end = this.buf.indexOf("'", this.pos + 1);

    if (end < 0) {
      throw new Error(`unterminated quote at ${this.pos}`);
    } else {
      var tok = {
        name: "STRING",
        value: this.buf.slice(this.pos + 1, end),
        pos: this._lineCol(this.pos)
      };
      this.pos = end + 1;
      return tok;
    }
  }

  _skipNonTokens() {
    while (this.pos < this.buf.length) {
      let c = this.buf[this.pos];
      if (c === ' ' || c === '\t') {
        this.pos++;
      } else {
        break;
      }
    }
  }

  _skipComment() {
    let endpos = this.pos + 1;
    while (endpos < this.buf.length && !this._isNewline(this.buf[endpos])) {
      endpos++;
    }
    this.pos = endpos;
  }

  _isNewline(c) {
    return c === '\r' || c === '\n';
  }

  _skipNewlines() {
    while (this.pos < this.buf.length) {
      let c = this.buf[this.pos];
      if (this._isNewline(c)) {
        this.lineCount++;
        this.lastNewlinePos = this.pos;
        this.pos++;
      } else {
        break;
      }
    }
  }

  _isAlphaNum(c) {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           (c >= '0' && c <= '9') ||
           c === '.' || c === '_' || c === '$';
  }

  _lineCol(pos) {
    return new Position(this.lineCount, pos - this.lastNewlinePos);
  }
}

class Position {
  constructor(line, col) {
    this.line = line;
    this.col = col;
  }

  toString() {
    return `${this.line}:${this.col}`;
  }
}

class Parser {
  constructor() {
  }

  // Parse string s and return an array of "source line" objects. Each source
  // line has:
  // {
  //  label: <optional label, null if none>,
  //  instr: <optional instruction, null if none>,
  //  args: <array of args>,
  //  pos: Position
  // }
  //
  // There can be standalone labels (w/o an instruction), and instructions w/o
  // labels. There can be no arguments without an instruction.
  parse(s) {
    let result = [];
    let lexer = new Lexer([...s]);

    while (true) {
      let curTok = lexer.token();
      
      // Skip empty lines.
      while (curTok !== null && curTok.name === 'NEWLINE') {
        curTok = lexer.token();
      }

      if (curTok === null) {
        return result;
      }

      // Here curTok is the first token of an actual line.

      // Figure out whether there's a label.
      let labelTok = null;
      if (curTok.name === 'LABEL') {
        labelTok = curTok;
        curTok = lexer.token();
      }

      // A standalone label is OK, we add it to result and continue to the next
      // line.
      if (curTok === null || curTok.name == 'NEWLINE') {
        result.push({
          label: labelTok.value, instr: null, args: [], pos: labelTok.pos});
        continue;
      }

      // ... there's more in the line; expect an instruction.
      if (curTok.name !== 'ID') {
        this._parseError(curTok.pos, `want ID; got "${curTok.value}"`);
      }

      let idTok = curTok;
      let args = [];

      curTok = lexer.token();

      // Arguments are optional, and we accept any number; allow a sequence
      // of arguments separated by ',' tokens.
      while (curTok !== null && curTok.name !== 'NEWLINE') {
        if (curTok.name === 'ID' || curTok.name === 'STRING') {
          args.push(curTok.value);
        } else {
          this._parseError(curTok.pos, `want arg; got "${curTok.value}"`);
        }
        curTok = lexer.token();
        if (curTok !== null && curTok.name === ',') {
          curTok = lexer.token();
        }
      }

      result.push({
        label: labelTok === null ? null : labelTok.value,
        instr: idTok.value,
        args: args,
        pos: idTok.pos});
    }
  }
  
  _parseError(pos, msg) {
    throw new Error(`Parse error at ${pos}: ${msg}`);
  }
}

// Exports.
module.exports.Parser = Parser;
