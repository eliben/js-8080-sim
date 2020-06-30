'use strict';

// TODO: separate ops for directives/identifiers?

// IDs are returned for everythin alphanumeric, including numbers. Numbers
// can be hex - difficult to distinguish from IDs otherwise (e.g. "fah" could
// theoretically be a hex number "fa").
class Lexer {
  // buf should be an array of chars
  constructor(buf) {
    this.pos = 0;
    this.buf = buf;

    this._ops = new Set([':', ',', '.', '[', ']']);
  }

  // Get the next token.
  token() {
    this._skipNonTokens();
    if (this.pos >= this.buf.length) {
      return null;
    }

    let c = this.buf[this.pos];
    if (c === ';') {
      this._skipComment();
    }

    if (this._ops.has(c)) {
      // Known operator.
      return {name: c, value: c, pos: this.pos++};
    } else {
      if (this._isAlphaNum(c)) {
        return this._id();
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
        pos: this.pos
      }
      this.pos = endpos + 1;
      return tok;
    } else {
      let tok = {
        name: 'ID',
        value: this.buf.slice(this.pos, endpos).join(''),
        pos: this.pos
      }
      this.pos = endpos;
      return tok;
    }
  }

  _skipNonTokens() {
    while (this.pos < this.buf.length) {
      let c = this.buf[this.pos];
      if (c === ' ' || c === '\t' || this._isNewline(c)) {
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
    this._skipNonTokens();
  }

  _isNewline(c) {
    return c === '\r' || c === '\n';
  }

  _isAlphaNum = function(c) {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           (c >= '0' && c <= '9') ||
           c === '_' || c === '$';
  }
}

let s = `
mov foo[doo], 20
org: pop a
`;

let l = new Lexer([...s]);

while (true) {
  let tok = l.token();
  if (tok === null) {
    break;
  }
  console.log(tok);
}


