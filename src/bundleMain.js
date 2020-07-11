// Collection of all objects we need in the browser, re-exported from a single
// file for use with Browserify (see Makefile).
'use strict';

const {Parser} = require('../src/parser.js');
const {Assembler} = require('../src/assembler.js');
const CPU8080 = require('../src/sim8080');

module.exports.Assembler = Assembler;
module.exports.Parser = Parser;
module.exports.CPU8080 = CPU8080;
