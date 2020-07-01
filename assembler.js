'use strict';

const {Parser} = require('./parser.js');

let p = new Parser();
let res = p.parse(`foobar\n`);

for (let r of res) {
  console.log(JSON.stringify(r, null, 2));
}
