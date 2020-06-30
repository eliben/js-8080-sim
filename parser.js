'use strict';

// TODO: separate ops for directives/identifiers? Or just accept .org / org
// similarly

// Support db directive to put bytes in memory. Should work with strings too

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
// Possible token names: LABEL, ID, <ops>, STRING
// For ops, name and value are the same, e.g. {name: '[', value: ']', pos: ...}
// For STRING, the value's quotes are stripped
//
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
        pos: this.pos
      }
      this.pos = endpos + 1;
      return tok;
    } else {
      let tok = {
        name: 'ID',
        value: this.buf.slice(this.pos, endpos).join(''),
        pos: this.pos
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
        pos: this.pos
      };
      this.pos = end + 1;
      return tok
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
db 'hello'
db 'a'
`;

let l = new Lexer([...s]);

while (true) {
  let tok = l.token();
  if (tok === null) {
    break;
  }
  console.log(tok);
}


// TODO: schema for parser:
// array of {label:, instruction:, arguments: []}
// use the same schema for directives?
