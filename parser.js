'use strict';

// TODO: separate ops for directives/identifiers?

class Lexer {
  // buf should be an array of chars
  constructor(buf) {
    this.pos = 0;
    this.buf = buf;

    this._ops = new Set([':', ',', '[', ']']);
  }

  // Get the next token.
  token() {
    this._skipNonTokens();
    if (this.pos >= this.buf.length) {
      return null;
    }

    var c = this.buf[this.pos];
    if (c === ';') {
      this._skipComment();
    }

    if (this._ops.has(c)) {
      // Known operator.
      return {name: c, value: c, pos: this.pos++};
    } else {
      if (this._isAlpha(c)) {
        return this._identifier();
      } else if (this._isDigit(c)) {
        return this._number();
      } else {
        throw new Error(`Token error at ${this.pos}`);
      }
    }
  }

  _identifier() {
    var endpos = this.pos + 1;
    while (endpos < this.buf.length && this._isAlphaNum(this.buf[endpos])) {
      endpos++;
    }

    var tok = {
      name: 'IDENTIFIER',
      value: this.buf.slice(this.pos, endpos).join(''),
      pos: this.pos
    }
    this.pos = endpos;
    return tok;
  }

  _number() {
    var endpos = this.pos + 1;
    while (endpos < this.buf.length && this._isDigit(this.buf[endpos])) {
      endpos++;
    }

    var tok = {
      name: 'NUMBER',
      value: this.buf.slice(this.pos, endpos).join(''),
      pos: this.pos
    }
    this.pos = endpos;
    return tok;
  }

  _skipNonTokens() {
    while (this.pos < this.buf.length) {
      var c = this.buf[this.pos];
      if (c === ' ' || c === '\t' || this._isNewline(c)) {
        this.pos++;
      } else {
        break;
      }
    }
  }

  _skipComment() {
    var endpos = this.pos + 1;
    while (endpos < this.buf.length && !this._isNewline(this.buf[endpos])) {
      endpos++;
    }
    this._skipNonTokens();
  }

  _isNewline(c) {
    return c === '\r' || c === '\n';
  }

  _isAlpha = function(c) {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           c === '_' || c === '$';
  }

  _isDigit = function(c) {
    return (c >= '0' && c <= '9');
  }

  _isAlphaNum = function(c) {
    return (c >= 'a' && c <= 'z') ||
           (c >= 'A' && c <= 'Z') ||
           (c >= '0' && c <= '9') ||
           c === '_' || c === '$';
  }
}

let s = "mov foo[doo], 20";
let l = new Lexer([...s]);

while (true) {
  let tok = l.token();
  if (tok === null) {
    break;
  }
  console.log(tok);
}


