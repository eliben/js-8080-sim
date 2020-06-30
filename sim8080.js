// Forked from https://github.com/maly/8080js
// Original license header below.
//
// Copyright (C) 2013, 2014 Martin Maly
// 
// Precise JS emulator for Intel 8080 CPU.
// 
// Based on BSD-licensed work by Copyright (C) 2008 Chris Double
// 
// All flags and instructions fixed to provide perfect compatibility 
// with original "silicon" CPU.
// 
// This emulator passes the Exerciser http://www.idb.me.uk/sunhillow/8080.html
// 
// Big thanks to Roman Borik (http://pmd85.borik.net). His help lets me 
// achieve such a perfect HW compatibility.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice,
//    this list of conditions and the following disclaimer in the documentation
//    and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES,
// INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
// DEVELOPERS AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//

/* jshint sub: true */


  (function(exports){
  var ds = [["NOP",1],["LXI B,#1",3],["STAX B",1],["INX B",1],["INR B",1],["DCR B",1],["MVI B, %1",2],["RLC",1],["-",0],["DAD B",1],["LDAX B",1],
  ["DCX B",1],["INR C",1],["DCR C",1],["MVI C,%1",2],["RRC",1],["-",0],["LXI D,#1",3],["STAX D",1],["INX D",1],["INR D",1],["DCR D",1],["MVI D, %1",2],
  ["RAL",1],["-",0],["DAD D",1],["LDAX D",1],["DCX D",1],["INR E",1],["DCR E",1],["MVI E,%1",2],["RAR",1],["RIM",1],["LXI H,#1",3],["SHLD #1",3],
  ["INX H",1],["INR H",1],["DCR H",1],["MVI H,%1",2],["DAA",1],["-",0],["DAD H",1],["LHLD #1",3],["DCX H",1],["INR L",1],["DCR L",1],["MVI L, %1",2],
  ["CMA",1],["SIM",1],["LXI SP, #1",3],["STA #1",3],["INX SP",1],["INR M",1],["DCR M",1],["MVI M,%1",2],["STC",1],["-",0],["DAD SP",1],["LDA #1",3],
  ["DCX SP",1],["INR A",1],["DCR A",1],["MVI A,%1",2],["CMC",1],["MOV B,B",1],["MOV B,C",1],["MOV B,D",1],["MOV B,E",1],["MOV B,H",1],["MOV B,L",1],
  ["MOV B,M",1],["MOV B,A",1],["MOV C,B",1],["MOV C,C",1],["MOV C,D",1],["MOV C,E",1],["MOV C,H",1],["MOV C,L",1],["MOV C,M",1],["MOV C,A",1],
  ["MOV D,B",1],["MOV D,C",1],["MOV D,D",1],["MOV D,E",1],["MOV D,H",1],["MOV D,L",1],["MOV D,M",1],["MOV D,A",1],["MOV E,B",1],["MOV E,C",1],
  ["MOV E,D",1],["MOV E,E",1],["MOV E,H",1],["MOV E,L",1],["MOV E,M",1],["MOV E,A",1],["MOV H,B",1],["MOV H,C",1],["MOV H,D",1],["MOV H,E",1],
  ["MOV H,H",1],["MOV H,L",1],["MOV H,M",1],["MOV H,A",1],["MOV L,B",1],["MOV L,C",1],["MOV L,D",1],["MOV L,E",1],["MOV L,H",1],["MOV L,L",1],
  ["MOV L,M",1],["MOV L,A",1],["MOV M,B",1],["MOV M,C",1],["MOV M,D",1],["MOV M,E",1],["MOV M,H",1],["MOV M,L",1],["HLT",1],["MOV M,A",1],
  ["MOV A,B",1],["MOV A,C",1],["MOV A,D",1],["MOV A,E",1],["MOV A,H",1],["MOV A,L",1],["MOV A,M",1],["MOV A,A",1],["ADD B",1],["ADD C",1],["ADD D",1],
  ["ADD E",1],["ADD H",1],["ADD L",1],["ADD M",1],["ADD A",1],["ADC B",1],["ADC C",1],["ADC D",1],["ADC E",1],["ADC H",1],["ADC L",1],["ADC M",1],
  ["ADC A",1],["SUB B",1],["SUB C",1],["SUB D",1],["SUB E",1],["SUB H",1],["SUB L",1],["SUB M",1],["SUB A",1],["SBB B",1],["SBB C",1],["SBB D",1],
  ["SBB E",1],["SBB H",1],["SBB L",1],["SBB M",1],["SBB A",1],["ANA B",1],["ANA C",1],["ANA D",1],["ANA E",1],["ANA H",1],["ANA L",1],["ANA M",1],
  ["ANA A",1],["XRA B",1],["XRA C",1],["XRA D",1],["XRA E",1],["XRA H",1],["XRA L",1],["XRA M",1],["XRA A",1],["ORA B",1],["ORA C",1],["ORA D",1],
  ["ORA E",1],["ORA H",1],["ORA L",1],["ORA M",1],["ORA A",1],["CMP B",1],["CMP C",1],["CMP D",1],["CMP E",1],["CMP H",1],["CMP L",1],["CMP M",1],
  ["CMP A",1],["RNZ",1],["POP B",1],["JNZ #1",3],["JMP #1",3],["CNZ #1",3],["PUSH B",1],["ADI %1",2],["RST 0",1],["RZ",1],["RET",1],["JZ #1",3],["-",0],
  ["CZ #1",3],["CALL #1",3],["ACI %1",2],["RST 1",1],["RNC",1],["POP D",1],["JNC #1",3],["OUT %1",2],["CNC #1",3],["PUSH D",1],["SUI %1",2],["RST 2",1],
  ["RC",1],["-",0],["JC #1",3],["IN %1",2],["CC #1",3],["-",0],["SBI %1",2],["RST 3",1],["RPO",1],["POP H",1],["JPO #1",3],["XTHL",1],["CPO #1",3],
  ["PUSH H",1],["ANI %1",2],["RST 4",1],["RPE",1],["PCHL",1],["JPE #1",3],["XCHG",1],["CPE #1",3],["-",0],["XRI %1",2],["RST 5",1],["RP",1],["POP PSW",1],
  ["JP #1",3],["DI",1],["CP #1",3],["PUSH PSW",1],["ORI %1",2],["RST 6",1],["RM",1],["SPHL",1],["JM #1",3],["EI",1],["CM #1",3],["-",0],["CPI %1",2],["RST 7",1]];

  var toHexN = function(n,d) {
    var s = n.toString(16);
    while (s.length <d) {s = '0'+s;}
    return s.toUpperCase();
  };

  var toHex2 = function(n) {return toHexN(n & 0xff,2);};
  var toHex4 = function(n) {return toHexN(n,4);};


   exports.disasm = function(i,a,b,c,d) {
      var sx = ds[i];
      var s = sx[0];
      var d8 = toHex2(a);
      s=s.replace("%1","$"+d8);
      var d16 = toHex2(b)+toHex2(a);
      s=s.replace("#1","$"+d16);
      return [s,sx[1]];
    };

  })(typeof exports === 'undefined'? this['CPUD8080']={}: exports);

(function(exports) {
  var flagTable = [70,2,2,6,2,6,6,2,2,6,6,2,6,2,2,6,2,6,6,2,6,2,2,6,6,2,2,6,2,6,6,2,2,6,6,2,6,2,2,6,6,2,2,6,2,6,6,2,6,2,2,6,2,6,6,2,2,6,6,2,6,2,2,6,2,6,6,2,6,2,2,6,6,2,2,6,2,6,6,2,6,2,2,6,2,6,6,2,2,6,6,2,6,2,2,6,6,2,2,6,2,6,6,2,2,6,6,2,6,2,2,6,2,6,6,2,6,2,2,6,6,2,2,6,2,6,6,2,130,134,134,130,134,130,130,134,134,130,130,134,130,134,134,130,134,130,130,134,130,134,134,130,130,134,134,130,134,130,130,134,134,130,130,134,130,134,134,130,130,134,134,130,134,130,130,134,130,134,134,130,134,130,130,134,134,130,130,134,130,134,134,130,134,130,130,134,130,134,134,130,130,134,134,130,134,130,130,134,130,134,134,130,134,130,130,134,134,130,130,134,130,134,134,130,130,134,134,130,134,130,130,134,134,130,130,134,130,134,134,130,134,130,130,134,130,134,134,130,130,134,134,130,134,130,130,134];
  var daaTable = [70,258,514,774,1026,1286,1542,1794,2050,2310,4114,4374,4630,4882,5142,5394,4098,4358,4614,4866,5126,5378,5634,5894,6150,6402,8210,8470,8726,8978,9238,9490,8194,8454,8710,8962,9222,9474,9730,9990,10246,10498,12310,12562,12818,13078,13330,13590,12294,12546,12802,13062,13314,13574,13830,14082,14338,14598,16402,16662,16918,17170,17430,17682,16386,16646,16902,17154,17414,17666,17922,18182,18438,18690,20502,20754,21010,21270,21522,21782,20486,20738,20994,21254,21506,21766,22022,22274,22530,22790,24598,24850,25106,25366,25618,25878,24582,24834,25090,25350,25602,25862,26118,26370,26626,26886,28690,28950,29206,29458,29718,29970,28674,28934,29190,29442,29702,29954,30210,30470,30726,30978,32914,33174,33430,33682,33942,34194,32898,33158,33414,33666,33926,34178,34434,34694,34950,35202,37014,37266,37522,37782,38034,38294,36998,37250,37506,37766,38018,38278,38534,38786,39042,39302,65623,65811,66067,66327,66579,66839,65607,65795,66051,66311,66563,66823,67079,67331,67587,67847,69651,69911,70167,70419,70679,70931,69635,69895,70151,70403,70663,70915,71171,71431,71687,71939,73747,74007,74263,74515,74775,75027,73731,73991,74247,74499,74759,75011,75267,75527,75783,76035,77847,78099,78355,78615,78867,79127,77831,78083,78339,78599,78851,79111,79367,79619,79875,80135,81939,82199,82455,82707,82967,83219,81923,82183,82439,82691,82951,83203,83459,83719,83975,84227,86039,86291,86547,86807,87059,87319,86023,86275,86531,86791,87043,87303,87559,87811,88067,88327,90135,90387,90643,90903,91155,91415,24583,24835,25091,25351,25603,25863,26119,26371,26627,26887,28691,28951,29207,29459,29719,29971,28675,28935,29191,29443,29703,29955,30211,30471,30727,30979,32915,33175,33431,33683,33943,34195,32899,33159,33415,33667,33927,34179,34435,34695,34951,35203,37015,37267,37523,37783,38035,38295,36999,37251,37507,37767,38019,38279,38535,38787,39043,39303,41111,41363,41619,41879,42131,42391,41095,41347,41603,41863,42115,42375,42631,42883,43139,43399,45203,45463,45719,45971,46231,46483,45187,45447,45703,45955,46215,46467,46723,46983,47239,47491,49303,49555,49811,50071,50323,50583,49287,49539,49795,50055,50307,50567,50823,51075,51331,51591,53395,53655,53911,54163,54423,54675,53379,53639,53895,54147,54407,54659,54915,55175,55431,55683,57491,57751,58007,58259,58519,58771,57475,57735,57991,58243,58503,58755,59011,59271,59527,59779,61591,61843,62099,62359,62611,62871,61575,61827,62083,62343,62595,62855,63111,63363,63619,63879,65623,65811,66067,66327,66579,66839,65607,65795,66051,66311,66563,66823,67079,67331,67587,67847,69651,69911,70167,70419,70679,70931,69635,69895,70151,70403,70663,70915,71171,71431,71687,71939,73747,74007,74263,74515,74775,75027,73731,73991,74247,74499,74759,75011,75267,75527,75783,76035,77847,78099,78355,78615,78867,79127,77831,78083,78339,78599,78851,79111,79367,79619,79875,80135,81939,82199,82455,82707,82967,83219,81923,82183,82439,82691,82951,83203,83459,83719,83975,84227,86039,86291,86547,86807,87059,87319,86023,86275,86531,86791,87043,87303,87559,87811,88067,88327,90135,90387,90643,90903,91155,91415,1542,1794,2050,2310,2566,2818,3078,3330,3586,3846,4114,4374,4630,4882,5142,5394,5634,5894,6150,6402,6658,6918,7170,7430,7686,7938,8210,8470,8726,8978,9238,9490,9730,9990,10246,10498,10754,11014,11266,11526,11782,12034,12310,12562,12818,13078,13330,13590,13830,14082,14338,14598,14854,15106,15366,15618,15874,16134,16402,16662,16918,17170,17430,17682,17922,18182,18438,18690,18946,19206,19458,19718,19974,20226,20502,20754,21010,21270,21522,21782,22022,22274,22530,22790,23046,23298,23558,23810,24066,24326,24598,24850,25106,25366,25618,25878,26118,26370,26626,26886,27142,27394,27654,27906,28162,28422,28690,28950,29206,29458,29718,29970,30210,30470,30726,30978,31234,31494,31746,32006,32262,32514,32914,33174,33430,33682,33942,34194,34434,34694,34950,35202,35458,35718,35970,36230,36486,36738,37014,37266,37522,37782,38034,38294,38534,38786,39042,39302,39558,39810,40070,40322,40578,40838,65623,65811,66067,66327,66579,66839,67079,67331,67587,67847,68103,68355,68615,68867,69123,69383,69651,69911,70167,70419,70679,70931,71171,71431,71687,71939,72195,72455,72707,72967,73223,73475,73747,74007,74263,74515,74775,75027,75267,75527,75783,76035,76291,76551,76803,77063,77319,77571,77847,78099,78355,78615,78867,79127,79367,79619,79875,80135,80391,80643,80903,81155,81411,81671,81939,82199,82455,82707,82967,83219,83459,83719,83975,84227,84483,84743,84995,85255,85511,85763,86039,86291,86547,86807,87059,87319,87559,87811,88067,88327,88583,88835,89095,89347,89603,89863,90135,90387,90643,90903,91155,91415,26119,26371,26627,26887,27143,27395,27655,27907,28163,28423,28691,28951,29207,29459,29719,29971,30211,30471,30727,30979,31235,31495,31747,32007,32263,32515,32915,33175,33431,33683,33943,34195,34435,34695,34951,35203,35459,35719,35971,36231,36487,36739,37015,37267,37523,37783,38035,38295,38535,38787,39043,39303,39559,39811,40071,40323,40579,40839,41111,41363,41619,41879,42131,42391,42631,42883,43139,43399,43655,43907,44167,44419,44675,44935,45203,45463,45719,45971,46231,46483,46723,46983,47239,47491,47747,48007,48259,48519,48775,49027,49303,49555,49811,50071,50323,50583,50823,51075,51331,51591,51847,52099,52359,52611,52867,53127,53395,53655,53911,54163,54423,54675,54915,55175,55431,55683,55939,56199,56451,56711,56967,57219,57491,57751,58007,58259,58519,58771,59011,59271,59527,59779,60035,60295,60547,60807,61063,61315,61591,61843,62099,62359,62611,62871,63111,63363,63619,63879,64135,64387,64647,64899,65155,65415,65623,65811,66067,66327,66579,66839,67079,67331,67587,67847,68103,68355,68615,68867,69123,69383,69651,69911,70167,70419,70679,70931,71171,71431,71687,71939,72195,72455,72707,72967,73223,73475,73747,74007,74263,74515,74775,75027,75267,75527,75783,76035,76291,76551,76803,77063,77319,77571,77847,78099,78355,78615,78867,79127,79367,79619,79875,80135,80391,80643,80903,81155,81411,81671,81939,82199,82455,82707,82967,83219,83459,83719,83975,84227,84483,84743,84995,85255,85511,85763,86039,86291,86547,86807,87059,87319,87559,87811,88067,88327,88583,88835,89095,89347,89603,89863,90135,90387,90643,90903,91155,91415];


function pad(str, n) {
  var r = [];
  for(var i=0; i < (n - str.length); ++i)
    r.push("0");
  r.push(str);
  return r.join("");
}

var CARRY     = 0x01;
var PARITY    = 0x04;
var HALFCARRY = 0x10;
var INTERRUPT = 0;
var ZERO      = 0x40;
var SIGN      = 0x80;

var byteTo, byteAt, portOut,portIn, ticks;

var Cpu = function ()
{
  this.b = 0;
  this.c = 0;
  this.d = 0;
  this.e = 0;
  this.f = 0;
  this.h = 0;
  this.l = 0;
  this.a = 0;
  this.pc = 0;
  this.inte = 0;
  this.halted = 0;
  this.sp = 0xF000;
  this.cycles = 0;
  this.ram=[];
};

Cpu.prototype.af = function() {
  return this.a << 8 | this.f;
};

Cpu.prototype.AF = function(n) {
  this.a = n >> 8 & 0xFF;
  this.f = n & 0xFF;
};

Cpu.prototype.bc = function () {
  return ((this.b & 0xff) << 8) | (this.c & 0xff);
};

Cpu.prototype.BC = function(n) {
  this.b = (n >> 8) & 0xFF;
  this.c = n & 0xFF;
};

Cpu.prototype.de = function () {
  return this.d << 8 | this.e;
};

Cpu.prototype.DE = function(n) {
  this.d = n >> 8 & 0xFF;
  this.e = n & 0xFF;
};

Cpu.prototype.hl = function () {
  return this.h << 8 | this.l;
};

Cpu.prototype.HL = function(n) {
  this.h = n >> 8 & 0xFF;
  this.l = n & 0xFF;
};

Cpu.prototype.set = function(flag) {
  this.f |= flag;
};

Cpu.prototype.clear = function(flag) {
  this.f &= ~flag & 0xFF ;
};

Cpu.prototype.toString = function() {
  return "{" +
    " af: " + pad(this.af().toString(16),4) +
    " bc: " + pad(this.bc().toString(16),4) +
    " de: " + pad(this.de().toString(16),4) +
    " hl: " + pad(this.hl().toString(16),4) +
    " pc: " + pad(this.pc.toString(16),4) +
    " sp: " + pad(this.sp.toString(16),4) +
    " flags: " +
    (this.f & ZERO ? "z" : ".") +
    (this.f & SIGN ? "s" : ".") +
    (this.f & PARITY ? "p" : ".") +
    (this.f & CARRY ? "c" : ".") +
    " " + 
    " }";
};

// Load the data from the array into the Cpu memory
// starting at address.

// Step through one instruction
Cpu.prototype.step = function() {
  if (this.halted===1) {
    this.cycles++;
    return 1;
  }
  var i = byteAt(this.pc++);
  var inT = this.cycles;
  this.execute(i);
  this.pc &= 0xFFFF;
  //this.processInterrupts();
  return this.cycles-inT;
};

Cpu.prototype.writePort = function (port, v) {
  if (portOut) portOut(port & 0xff,v);
};

Cpu.prototype.readPort = function (port) {
  if (portIn) return portIn(port & 0xff);
  return 255;
};

Cpu.prototype.getByte = function (addr) {
  return byteAt(addr & 0xffff);
};

Cpu.prototype.getWord = function (addr) {
  //var ram = this.ram;
  var l = byteAt(addr & 0xffff);
  var h = byteAt((addr+1)  & 0xffff);
  return h << 8 | l;
};

Cpu.prototype.nextByte = function() {
  var pc = this.pc;
  var b = byteAt(pc & 0xffff);
  this.pc = (pc + 1) & 0xFFFF;
  return b;
};

Cpu.prototype.nextWord = function() {
  var pc = this.pc;
  //var ram = this.ram;
  var l = byteAt(pc & 0xffff);
  var h = byteAt((pc+1) & 0xffff);
  this.pc = (pc + 2) & 0xFFFF;
  return h << 8 | l;
};

Cpu.prototype.writeByte = function(addr, value) {

  var v = value & 0xFF;
  byteTo(addr & 0xffff, v);
};

Cpu.prototype.writeWord = function(addr, value) {
  var l = value;
  var h = value >> 8;
  this.writeByte(addr & 0xffff, l);
  this.writeByte((addr+1) & 0xffff, h);
};


// set flags after arithmetic and logical ops
Cpu.prototype.calcFlags = function(v, lhs, rhs) {
  var x = v & 0xFF;

  if (v >= 0x100 || v < 0)
    this.f |= CARRY;
  else
    this.f &= ~CARRY & 0xFF;


  this.f = flagTable[x];
  if (v >= 0x100 || v < 0)
    this.f |= CARRY;
  else
    this.f &= ~CARRY & 0xFF;

  return x;
};

//R,A,result
Cpu.prototype.acADD = function(a1,a2,r){
  var aux = [ 0, HALFCARRY, HALFCARRY, HALFCARRY, 0, 0, 0, HALFCARRY ];
  var dis = (r&8)>>1 | (a2&8)>>2 | (a1&8)>>3;
  var ac = aux[dis];
  this.f = this.f & ~HALFCARRY | ac;
};
Cpu.prototype.acSUB = function(a1,a2,r){
  var aux = [ HALFCARRY, HALFCARRY, 0, HALFCARRY, 0, HALFCARRY, 0 ,0 ];
  var dis = (r&8)>>1 | (a2&8)>>2 | (a1&8)>>3;
  var ac = aux[dis];
  this.f = this.f & ~HALFCARRY | ac;
};


Cpu.prototype.incrementByte = function(o) {
  var c = this.f & CARRY; // carry isnt affected
  var r = this.calcFlags(o+1, o, 1);
  this.f = (this.f & ~CARRY & 0xFF) | c;
  if ((r & 0x0f) === 0) {
    this.f = this.f | HALFCARRY ;
  } else {
    this.f &= ~HALFCARRY & 0xff ;
  }
  return r;
};

Cpu.prototype.decrementByte = function(o) {
  var c = this.f & CARRY; // carry isnt affected
  var r = this.calcFlags(o-1, o, 1);
  this.f = (this.f & ~CARRY & 0xFF) | c;
  if ((o & 0x0f) > 0) {
    this.f = this.f | HALFCARRY ;
  } else {
    this.f &= ~HALFCARRY & 0xff ;
  }

  return r;
};

Cpu.prototype.addByte = function(lhs, rhs) {
  var mid =  this.calcFlags(lhs + rhs, lhs, rhs);
  this.acADD(lhs,rhs,mid);
  return mid;
};

Cpu.prototype.addByteWithCarry = function(lhs, rhs) {
  var mid =  this.addByte(lhs, rhs + ((this.f & CARRY) ? 1 : 0));
  this.acADD(lhs,rhs,mid);
  return mid;
};

Cpu.prototype.subtractByte = function(lhs, rhs) {
  var mid =  this.calcFlags(lhs - rhs, lhs, rhs);
  this.acSUB(lhs,rhs,mid);
  return mid;
};

Cpu.prototype.subtractByteWithCarry = function(lhs, rhs) {
  var nrhs = rhs + ((this.f & CARRY) ? 1 : 0);
  var mid =  this.calcFlags(lhs - nrhs, lhs, nrhs);
//  var mid =  this.calcFlags(lhs, rhs + ((this.f & CARRY) ? 1 : 0));
  this.acSUB(lhs,rhs,mid);
  return mid;
};

Cpu.prototype.andByte = function(lhs, rhs) {
  var x = this.calcFlags(lhs & rhs, lhs, rhs);
  var ac = (lhs & 0x08) | (rhs & 0x08);
  if (ac>0) {
    this.f |= HALFCARRY;
  } else {
      this.f &= ~HALFCARRY;
  }
  this.f &= ~CARRY & 0xFF;
  return x;
};

Cpu.prototype.xorByte = function(lhs, rhs) {
  var x = this.calcFlags(lhs ^ rhs, lhs, rhs);
  //this.f |= HALFCARRY;
  this.f &= ~HALFCARRY;
  this.f &= ~CARRY & 0xFF;
  return x;
};

Cpu.prototype.orByte = function(lhs, rhs) {
  var x = this.calcFlags(lhs | rhs, lhs, rhs);
  //this.f |= HALFCARRY;
  this.f &= ~HALFCARRY;
  this.f &= ~CARRY & 0xFF;
  return x;
};

Cpu.prototype.addWord = function(lhs, rhs) {
  var r = lhs + rhs;
  if (r > 0xFFFF)
    {this.f |= CARRY;}
  else {
    this.f &= ~CARRY;
  }

/*
  this.f |= SIGN;
  this.f |= ZERO;
  this.f |= HALFCARRY;
  this.f |= PARITY;
*/
  return r & 0xFFFF;
};

Cpu.prototype.pop = function() {
  var pc = this.getWord(this.sp);
  this.sp = (this.sp + 2) & 0xffff;
  return pc;
};

Cpu.prototype.push = function(v) {
  this.sp = (this.sp - 2) & 0xffff;
  this.writeWord(this.sp, v);
};

Cpu.prototype.processInterrupts = function() {
};

Cpu.prototype.execute = function(i) {

  var addr, w, c;

  this.f &= 0xd7;
  this.f |= 0x02;

  switch(i) {
    case 0x00:
    case 0x08:
    case 0x10:
    case 0x18:
    case 0x20:
    case 0x28:
    case 0x30:
    case 0x38:
        {
          // NOP
          this.cycles += 4;
        }
        break;
  case 0x01:
    {
      // LD BC,nn
      this.BC(this.nextWord());
      this.cycles += 10;
    }
    break;
  case 0x02:
    {
      // LD (BC),A
      this.writeByte(this.bc(), this.a);
      this.cycles += 7;
    }
    break;
  case 0x03:
    {
      // INC BC
      this.BC((this.bc() + 1) & 0xFFFF);
      this.cycles += 6;
    }
    break;
  case 0x04:
    {
      // INC  B
      this.b = this.incrementByte(this.b);
      this.cycles += 5 ;
    }
    break;
  case 0x05:
    {
      // DEC  B
      this.b = this.decrementByte(this.b);
      this.cycles += 5;
    }
    break;
  case 0x06:
    {
      // LD   B,n
      this.b = this.nextByte();
      this.cycles += 7;
    }
    break;
  case 0x07:
    {
          // RLCA
            var l = (this.a & 0x80) >> 7;
            if (l)
        this.f |= CARRY;
            else
        this.f &= ~CARRY & 0xFF;

            this.a = ((this.a << 1) & 0xFE) | l;
            this.cycles += 4;
    }
    break;
  case 0x09:
    {
      // ADD  HL,BC
      this.HL(this.addWord(this.hl(), this.bc()));
      this.cycles += 11;
    }
    break;
  case 0x0A:
    {
      // LD   A,(BC)
      this.a = byteAt(this.bc());
      this.cycles += 7;
    }
    break;
  case 0x0B:
    {
      // DEC  BC
      this.BC((this.bc() + 65535) & 0xFFFF);
      this.cycles += 6;
   }
    break;
  case 0x0C:
    {
      // INC  C
      this.c = this.incrementByte(this.c);
      this.cycles += 5;
    }
    break;
  case 0x0D:
    {
      // DEC  C
      this.c = this.decrementByte(this.c);
      this.cycles += 5;
    }
    break;
  case 0x0E:
    {
      // LD   C,n
      this.c = this.nextByte();
      this.cycles += 7;
    }
    break;
  case 0x0F:
    {
      // RRCA
      var h = (this.a & 1) << 7;
      if (h)
	this.f |= CARRY;
      else
	this.f &= ~CARRY & 0xFF;

      this.a = ((this.a >> 1) & 0x7F) | h;
      this.cycles += 4;
    }
    break;
  case 0x11:
    {
      // LD   DE,nn
      this.DE(this.nextWord());
      this.cycles += 10;
    }
    break;
  case 0x12:
    {
      // LD   (DE),A
      this.writeByte(this.de(), this.a);
      this.cycles += 7;
    }
    break;
  case 0x13:
    {
      // INC  DE
      this.DE((this.de() + 1) & 0xFFFF);
      this.cycles += 6;
    }
    break;
  case 0x14:
    {
      // INC  D
      this.d = this.incrementByte(this.d);
      this.cycles += 5;
    }
    break;
  case 0x15:
    {
      // DEC  D
      this.d = this.decrementByte(this.d);
      this.cycles += 5;
    }
    break;
  case 0x16:
    {
      // LD   D,n
      this.d = this.nextByte();
      this.cycles += 7;
    }
    break;
  case 0x17:
    {
      // RLA
      c = (this.f & CARRY) ? 1 : 0;
      if(this.a & 128)
	this.f |= CARRY;
      else
	this.f &= ~CARRY & 0xFF;
      this.a = ((this.a << 1) & 0xFE) | c;
      this.cycles += 4;
    }
    break;
  case 0x19:
    {
      // ADD  HL,DE
      this.HL(this.addWord(this.hl(), this.de()));
      this.cycles += 11;
    }
    break;
  case 0x1A:
    {
      // LD   A,(DE)
      this.a = byteAt(this.de());
      this.cycles += 7;
    }
    break;
  case 0x1B:
    {
      // DEC  DE
      this.DE((this.de() - 1) & 0xFFFF);
      this.cycles += 6;
    }
    break;
  case 0x1C:
    {
      // INC  E
      this.e = this.incrementByte(this.e);
      this.cycles += 5;
    }
    break;
  case 0x1D:
    {
      // DEC  E
      this.e = this.decrementByte(this.e);
      this.cycles += 5;
    }
    break;
  case 0x1E:
    {
      // LD   E,n
      this.e = this.nextByte();
      this.cycles += 7;
    }
    break;
  case 0x1F:
    {
      // RRA
      var cy = (this.f & CARRY) ? 128 : 0;
      if(this.a & 1)
	this.f |= CARRY;
      else
	this.f &= ~CARRY & 0xFF;
      this.a = ((this.a >> 1) & 0x7F) | cy;
      this.cycles += 4;
    }
    break;
  case 0x21:
    {
      // LD   HL,nn
      this.HL(this.nextWord());
      this.cycles += 10;
    }
    break;
  case 0x22:
    {
      // LD   (nn),HL
      this.writeWord(this.nextWord(), this.hl());
      this.cycles += 16;
    }
    break;
  case 0x23:
    {
      // INC  HL
      this.HL((this.hl() + 1) & 0xFFFF);
      this.cycles += 6;
    }
    break;
  case 0x24:
    {
      // INC  H
      this.h = this.incrementByte(this.h);
      this.cycles += 5;
    }
    break;
  case 0x25:
    {
      // DEC  H
      this.h = this.decrementByte(this.h);
      this.cycles += 5;
    }
    break;
  case 0x26:
    {
      // LD   H,n
      this.h = this.nextByte();
      this.cycles += 7;
    }
    break;
  case 0x27:
  {
    // DAA
    var temp = this.a;
    if (this.f & CARRY) {temp |= 0x100;}
    if (this.f & HALFCARRY) {temp |= 0x200;}
    var AF = daaTable[temp];
    this.a = (AF>>8)&0xff;
    this.f = AF&0xd7|0x02;
    this.cycles += 4;
  }
      break;
  case 0x29:
    {
      // ADD  HL,HL
      this.HL(this.addWord(this.hl(), this.hl()));
      this.cycles += 11;
    }
    break;
  case 0x2A:
    {
      // LD   HL,(nn)
      this.HL(this.getWord(this.nextWord()));
      this.cycles += 16;
    }
    break;
  case 0x2B:
    {
      // DEC  HL
      this.HL((this.hl() - 1) & 0xFFFF);
      this.cycles += 6;
    }
    break;
  case 0x2C:
    {
      // INC  L
      this.l = this.incrementByte(this.l);
      this.cycles += 5;
    }
    break;
  case 0x2D:
    {
      // DEC  L
      this.l = this.decrementByte(this.l);
      this.cycles += 5;
    }
    break;
  case 0x2E:
    {
      // LD   L,n
      this.l = this.nextByte();
      this.cycles += 7;
    }
    break;
  case 0x2F:
    {
      // CPL
      this.a ^= 0xFF;
      this.cycles += 4;
    }
    break;
  case 0x31:
    {
      // LD   SP,nn
      this.sp = this.nextWord();
      this.cycles += 10;
    }
    break;
  case 0x32:
    {
      // LD   (nn),A
      this.writeByte(this.nextWord(), this.a);
      this.cycles += 13;
    }
    break;
  case 0x33:
    {
      // INC  SP
      this.sp = ((this.sp + 1) & 0xFFFF);
      this.cycles += 6;
    }
    break;
  case 0x34:
    {
      // INC  (HL)
      addr = this.hl();
      this.writeByte(addr, this.incrementByte(byteAt(addr)));
      this.cycles += 10;
    }
    break;
  case 0x35:
    {
      // DEC  (HL)
      addr = this.hl();
      this.writeByte(addr, this.decrementByte(byteAt(addr)));
      this.cycles += 10;
    }
    break;
  case 0x36:
    {
      // LD   (HL),n
      this.writeByte(this.hl(), this.nextByte());
      this.cycles += 10;
    }
    break;
  case 0x37:
    {
      // SCF
      this.f |= CARRY;
      this.cycles += 4;
    }
    break;
  case 0x39:
    {
      // ADD  HL,SP
      this.HL(this.addWord(this.hl(), this.sp));
      this.cycles += 11;
    }
    break;
  case 0x3A:
    {
      // LD   A,(nn)
      this.a = byteAt(this.nextWord());
      this.cycles += 13;
    }
    break;
  case 0x3B:
    {
      // DEC  SP
      this.sp = (this.sp - 1) & 0xFFFF;
      this.cycles += 6;
    }
    break;
  case 0x3C:
    {
      // INC  A
      this.a = this.incrementByte(this.a);
      this.cycles += 5;
    }
    break;
  case 0x3D:
    {
      // DEC  A
      this.a = this.decrementByte(this.a);
      this.cycles += 5;
    }
    break;
  case 0x3E:
    {
      // LD   A,n
      this.a = this.nextByte();
      this.cycles += 7;
    }
    break;
  case 0x3F:
    {
      // CCF
      this.f ^= CARRY;
      this.cycles += 4;
    }
    break;
  case 0x40:
    {
      // LD   B,B
      this.b = this.b;
      this.cycles += 5;
    }
    break;
  case 0x41:
    {
      //LD   B,C
      this.b = this.c;
      this.cycles += 5;
    }
    break;
  case 0x42:
    {
      // LD   B,D
      this.b = this.d;
      this.cycles += 5;
    }
    break;
  case 0x43:
    {
      // LD   B,E
      this.b = this.e;
      this.cycles += 5;
    }
    break;
  case 0x44:
    {
      // LD   B,H
      this.b = this.h;
      this.cycles += 5;
    }
    break;
  case 0x45:
    {
      // LD   B,L
      this.b = this.l;
      this.cycles += 5;
    }
    break;
  case 0x46:
    {
      // LD   B,(HL)
      this.b = byteAt(this.hl());
      this.cycles += 7;
    }
    break;
  case 0x47:
    {
      // LD   B,A
      this.b = this.a;
      this.cycles += 5;
    }
    break;
  case 0x48:
    {
      // LD   C,B
      this.c = this.b;
      this.cycles += 5;
    }
    break;
  case 0x49:
    {
      // LD   C,C
      this.c = this.c;
      this.cycles += 5;
    }
    break;
  case 0x4A:
    {
      // LD   C,D
      this.c = this.d;
      this.cycles += 5;
    }
    break;
  case 0x4B:
    {
      // LD   C,E
      this.c = this.e;
      this.cycles += 5;
    }
    break;
  case 0x4C:
    {
      // LD   C,H
      this.c = this.h;
      this.cycles += 5;
    }
    break;
  case 0x4D:
    {
      // LD   C,L
      this.c = this.l;
      this.cycles += 5;
    }
    break;
  case 0x4E:
    {
      // LD   C,(HL)
      this.c = byteAt(this.hl());
      this.cycles += 7;
    }
    break;
  case 0x4F:
    {
      // LD   C,A
      this.c = this.a;
      this.cycles += 5;
    }
    break;
  case 0x50:
    {
      // LD   D,B
      this.d = this.b;
      this.cycles += 5;
    }
    break;
  case 0x51:
    {
      // LD   D,C
      this.d = this.c;
      this.cycles += 5;
    }
    break;
  case 0x52:
    {
      // LD   D,D
      this.d = this.d;
      this.cycles += 5;
    }
    break;
  case 0x53:
    {
      // LD   D,E
      this.d = this.e;
      this.cycles += 5;
    }
    break;
  case 0x54:
    {
      // LD   D,H
      this.d = this.h;
      this.cycles += 5;
    }
    break;
  case 0x55:
    {
      // LD   D,L
      this.d = this.l;
      this.cycles += 5;
    }
    break;
  case 0x56:
    {
      // LD   D,(HL)
      this.d = byteAt(this.hl());
      this.cycles += 7;
    }
    break;
  case 0x57:
    {
      // LD   D,A
      this.d = this.a;
      this.cycles += 5;
    }
    break;
  case 0x58:
    {
      // LD   E,B
      this.e = this.b;
      this.cycles += 5;
    }
    break;
  case 0x59:
    {
      // LD   E,C
      this.e = this.c;
      this.cycles += 5;
    }
    break;
  case 0x5A:
    {
      // LD   E,D
      this.e = this.d;
      this.cycles += 5;
    }
    break;
  case 0x5B:
    {
      // LD   E,E
      this.e = this.e;
      this.cycles += 5;
    }
    break;
  case 0x5C:
    {
      // LD   E,H
      this.e = this.h;
      this.cycles += 5;
    }
    break;
  case 0x5D:
    {
      // LD   E,L
      this.e = this.l;
      this.cycles += 5;
    }
    break;
  case 0x5E:
    {
      // LD   E,(HL)
      this.e = byteAt(this.hl());
      this.cycles += 7;
    }
    break;
  case 0x5F:
    {
      // LD   E,A
      this.e = this.a;
      this.cycles += 5;
    }
    break;
  case 0x60:
    {
      // LD   H,B
      this.h = this.b;
      this.cycles += 5;
    }
    break;
  case 0x61:
    {
      // LD   H,C
      this.h = this.c;
      this.cycles += 5;
    }
    break;
  case 0x62:
    {
      // LD   H,D
      this.h = this.d;
      this.cycles += 5;
    }
    break;
  case 0x63:
    {
      // LD   H,E
      this.h = this.e;
      this.cycles += 5;
    }
    break;
  case 0x64:
    {
      // LD   H,H
      this.h = this.h;
      this.cycles += 5;
    }
    break;
  case 0x65:
    {
      // LD   H,L
      this.h = this.l;
      this.cycles += 5;
    }
    break;
  case 0x66:
    {
      // LD   H,(HL)
      this.h = byteAt(this.hl());
      this.cycles += 7;
    }
    break;
  case 0x67:
    {
      // LD   H,A
      this.h = this.a;
      this.cycles += 5;
    }
    break;
  case 0x68:
    {
      // LD   L,B
      this.l = this.b;
      this.cycles += 5;
    }
    break;
  case 0x69:
    {
      // LD   L,C
      this.l = this.c;
      this.cycles += 5;
    }
    break;
  case 0x6A:
    {
      // LD   L,D
      this.l = this.d;
      this.cycles += 5;
    }
    break;
  case 0x6B:
    {
      // LD   L,E
      this.l = this.e;
      this.cycles += 5;
    }
    break;
  case 0x6C:
    {
      // LD   L,H
      this.l = this.h;
      this.cycles += 5;
    }
    break;
  case 0x6D:
    {
      // LD   L,L
      this.l = this.l;
      this.cycles += 5;
    }
    break;
   case 0x6E:
   {
      // LD   L,(HL)
      this.l = byteAt(this.hl());
      this.cycles += 7;
   }
   break;
  case 0x6F:
    {
      // LD   L,A
      this.l = this.a;
      this.cycles += 5;
    }
    break;

  case 0x70:
    {
      // LD   (HL),B
      this.writeByte(this.hl(), this.b);
      this.cycles += 7;
    }
    break;
  case 0x71:
    {
      // LD   (HL),C
      this.writeByte(this.hl(), this.c);
      this.cycles += 7;
    }
    break;
  case 0x72:
    {
      // LD   (HL),D
      this.writeByte(this.hl(), this.d);
      this.cycles += 7;
    }
    break;
  case 0x73:
    {
      // LD   (HL),E
      this.writeByte(this.hl(), this.e);
      this.cycles += 7;
    }
    break;
  case 0x74:
    {
      // LD   (HL),H
      this.writeByte(this.hl(), this.h);
      this.cycles += 7;
    }
    break;
  case 0x75:
    {
      // LD   (HL),L
      this.writeByte(this.hl(), this.l);
      this.cycles += 7;
    }
    break;
  case 0x76:
    {
      // HALT
      this.cycles += 7;
      this.halted = 1;
    }
    break;
  case 0x77:
    {
      // LD   (HL),A
      this.writeByte(this.hl(), this.a);
      this.cycles += 7;
    }
    break;
  case 0x78:
    {
      // LD   A,B
      this.a = this.b;
      this.cycles += 5;
    }
    break;
  case 0x79:
    {
      // LD   A,C
      this.a = this.c;
      this.cycles += 5;
    }
    break;
  case 0x7A:
    {
      // LD   A,D
      this.a = this.d;
      this.cycles += 5;
    }
    break;
  case 0x7B:
    {
      // LD   A,E
      this.a = this.e;
      this.cycles += 5;
    }
    break;
  case 0x7C:
    {
      // LD   A,H
      this.a = this.h;
      this.cycles += 5;
    }
    break;
  case 0x7D:
    {
      // LD   A,L
      this.a = this.l;
      this.cycles += 5;
    }
    break;
  case 0x7E:
    {
      // LD   A,(HL)
      this.a = byteAt(this.hl());
      this.cycles += 7;
    }
    break;
  case 0x7F:
    {
      // LD   A,A
      this.a = this.a;
      this.cycles += 5;
    }
    break;
  case 0x80:
    {
      // ADD  A,B
      this.a = this.addByte(this.a, this.b);
      this.cycles += 4;
    }
    break;
  case 0x81:
    {
      // ADD  A,C
      this.a = this.addByte(this.a, this.c);
      this.cycles += 4;
    }
    break;
  case 0x82:
    {
      // ADD  A,D
      this.a = this.addByte(this.a, this.d);
      this.cycles += 4;
    }
    break;
  case 0x83:
    {
      // ADD  A,E
      this.a = this.addByte(this.a, this.e);
      this.cycles += 4;
    }
    break;
  case 0x84:
    {
      // ADD  A,H
      this.a = this.addByte(this.a, this.h);
      this.cycles += 4;
    }
    break;
  case 0x85:
    {
      // ADD  A,L
      this.a = this.addByte(this.a, this.l);
      this.cycles += 4;
    }
    break;
  case 0x86:
    {
      // ADD  A,(HL)
      this.a = this.addByte(this.a, byteAt(this.hl()));
      this.cycles += 7;
    }
    break;
  case 0x87:
    {
      // ADD  A,A
      this.a = this.addByte(this.a, this.a);
      this.cycles += 4;
    }
    break;
  case 0x88:
    {
      // ADC  A,B
      this.a = this.addByteWithCarry(this.a, this.b);
      this.cycles += 4;
    }
    break;
    case 0x89:
      {
      // ADC  A,C
      this.a = this.addByteWithCarry(this.a, this.c);
      this.cycles += 4;
    }
    break;
  case 0x8A:
    {
      // ADC  A,D
      this.a = this.addByteWithCarry(this.a, this.d);
      this.cycles += 4;
    }
    break;
    case 0x8B:
      {
      // ADC  A,E
      this.a = this.addByteWithCarry(this.a, this.e);
      this.cycles += 4;
    }
    break;
  case 0x8C:
    {
      // ADC  A,H
      this.a = this.addByteWithCarry(this.a, this.h);
      this.cycles += 4;
    }
    break;
  case 0x8D:
    {
      // ADC  A,L
      this.a = this.addByteWithCarry(this.a, this.l);
      this.cycles += 4;
    }
    break;
  case 0x8E:
    {
      // ADC  A,(HL)
      this.a = this.addByteWithCarry(this.a, byteAt(this.hl()));
      this.cycles += 7;
    }
    break;
  case 0x8F:
    {
      // ADC  A,A
      this.a = this.addByteWithCarry(this.a, this.a);
      this.cycles += 4;
    }
    break;
  case 0x90:
    {
      // SUB  B
      this.a = this.subtractByte(this.a, this.b);
      this.cycles += 4;
    }
    break;
  case 0x91:
    {
      // SUB  C
      this.a = this.subtractByte(this.a, this.c);
      this.cycles += 4;
    }
    break;
  case 0x92:
    {
      // SUB  D
      this.a = this.subtractByte(this.a, this.d);
      this.cycles += 4;
    }
    break;
  case 0x93:
    {
      // SUB  E
      this.a = this.subtractByte(this.a, this.e);
      this.cycles += 4;
    }
    break;
  case 0x94:
    {
      // SUB  H
      this.a = this.subtractByte(this.a, this.h);
      this.cycles += 4;
    }
    break;
  case 0x95:
    {
      // SUB  L
      this.a = this.subtractByte(this.a, this.l);
      this.cycles += 4;
    }
    break;
  case 0x96:
    {
      // SUB  (HL)
      this.a = this.subtractByte(this.a, byteAt(this.hl()));
      this.cycles += 7;
    }
    break;
  case 0x97:
    {
      // SUB  A
      this.a = this.subtractByte(this.a, this.a);
      this.cycles += 4;
    }
    break;
  case 0x98:
    {
      // SBC  A,B
      this.a = this.subtractByteWithCarry(this.a, this.b);
      this.cycles += 4;
    }
    break;
  case 0x99:
    {
      // SBC  A,C
      this.a = this.subtractByteWithCarry(this.a, this.c);
      this.cycles += 4;
    }
    break;
  case 0x9A:
    {
      // SBC  A,D
      this.a = this.subtractByteWithCarry(this.a, this.d);
      this.cycles += 4;
    }
    break;
  case 0x9B:
    {
      // SBC  A,E
      this.a = this.subtractByteWithCarry(this.a, this.e);
      this.cycles += 4;
    }
    break;
  case 0x9C:
    {
      // SBC  A,H
      this.a = this.subtractByteWithCarry(this.a, this.h);
      this.cycles += 4;
    }
    break;
  case 0x9D:
    {
      // SBC  A,L
      this.a = this.subtractByteWithCarry(this.a, this.l);
      this.cycles += 4;
    }
    break;
  case 0x9E:
    {
      //  SBC  A,(HL)
      this.a = this.subtractByteWithCarry(this.a, byteAt(this.hl()));
      this.cycles += 7;
    }
    break;
  case 0x9F:
    {
      // SBC  A,A
      this.a = this.subtractByteWithCarry(this.a, this.a);
      this.cycles += 4;
    }
    break;
  case 0xA0:
    {
      // AND  B
      this.a = this.andByte(this.a, this.b);
      this.cycles += 4;
    }
    break;
  case 0xA1:
    {
      // AND  C
      this.a = this.andByte(this.a, this.c);
      this.cycles += 4;
    }
    break;
  case 0xA2:
    {
      // AND  D
      this.a = this.andByte(this.a, this.d);
      this.cycles += 4;
    }
    break;
  case 0xA3:
    {
      // AND  E
      this.a = this.andByte(this.a, this.e);
      this.cycles += 4;
    }
    break;
  case 0xA4:
    {
      // AND  H
      this.a = this.andByte(this.a, this.h);
      this.cycles += 4;
    }
    break;
  case 0xA5:
    {
      // AND  L
      this.a = this.andByte(this.a, this.l);
      this.cycles += 4;
    }
    break;
  case 0xA6:
    {
      // AND  (HL)
      this.a = this.andByte(this.a, byteAt(this.hl()));
      this.cycles += 7;
    }
    break;
  case 0xA7:
    {
      // AND  A
      this.a = this.andByte(this.a, this.a);
      this.cycles += 4;
    }
    break;
  case 0xA8:
    {
      // XOR  B
      this.a = this.xorByte(this.a, this.b);
      this.cycles += 4;
    }
    break;
  case 0xA9:
    {
      // XOR  C
      this.a = this.xorByte(this.a, this.c);
      this.cycles += 4;
    }
    break;
  case 0xAA:
    {
      // XOR  D
      this.a = this.xorByte(this.a, this.d);
      this.cycles += 4;
    }
    break;
  case 0xAB:
    {
      // XOR  E
      this.a = this.xorByte(this.a, this.e);
      this.cycles += 4;
    }
    break;
  case 0xAC:
    {
      // XOR  H
      this.a = this.xorByte(this.a, this.h);
      this.cycles += 4;
    }
    break;
  case 0xAD:
    {
      // XOR  L
      this.a = this.xorByte(this.a, this.l);
      this.cycles += 4;
    }
    break;
  case 0xAE:
    {
      // XOR  (HL)
      this.a = this.xorByte(this.a, byteAt(this.hl()));
      this.cycles += 7;
    }
    break;
  case 0xAF:
    {
      // XOR  A
      this.a = this.xorByte(this.a, this.a);
      this.cycles += 4;
    }
    break;
  case 0xB0:
    {
      // OR  B
      this.a = this.orByte(this.a, this.b);
      this.cycles += 4;
    }
    break;
  case 0xB1:
    {
      // OR  C
      this.a = this.orByte(this.a, this.c);
      this.cycles += 4;
    }
    break;
  case 0xB2:
    {
      // OR  D
      this.a = this.orByte(this.a, this.d);
      this.cycles += 4;
    }
    break;
  case 0xB3:
    {
      // OR  E
      this.a = this.orByte(this.a, this.e);
      this.cycles += 4;
    }
    break;
  case 0xB4:
    {
      // OR  H
      this.a = this.orByte(this.a, this.h);
      this.cycles += 4;
    }
    break;
  case 0xB5:
    {
      // OR  L
      this.a = this.orByte(this.a, this.l);
      this.cycles += 4;
    }
    break;
  case 0xB6:
    {
      //  OR   (HL)
      this.a = this.orByte(this.a, byteAt(this.hl()));
      this.cycles += 7;
    }
    break;
  case 0xB7:
    {
      // OR  A
      this.a = this.orByte(this.a, this.a);
      this.cycles += 4;
    }
    break;
  case 0xB8:
    {
      //  CP   B
      this.subtractByte(this.a, this.b);
      this.cycles += 4;
    }
    break;
  case 0xB9:
    {
      //  CP   C
      this.subtractByte(this.a, this.c);
      this.cycles += 4;
    }
    break;
  case 0xBA:
    {
      //  CP   D
      this.subtractByte(this.a, this.d);
      this.cycles += 4;
    }
    break;
  case 0xBB:
    {
      //  CP   E
      this.subtractByte(this.a, this.e);
      this.cycles += 4;
    }
    break;
  case 0xBC:
    {
      //  CP   H
      this.subtractByte(this.a, this.h);
      this.cycles += 4;
    }
    break;
  case 0xBD:
    {
      //  CP   L
      this.subtractByte(this.a, this.l);
      this.cycles += 4;
    }
    break;
  case 0xBE:
    {
      // CP   (HL)
      this.subtractByte(this.a, byteAt(this.hl()));
      this.cycles += 7;
    }
    break;
  case 0xBF:
    {
      //  CP   A
      this.subtractByte(this.a, this.a);
      this.cycles += 4;
    }
    break;
  case 0xC0:
    {
      //  RET  NZ      ; opcode C0 cycles 05
      if (this.f & ZERO)
	this.cycles += 5;
      else {
	this.pc = this.pop();
	this.cycles += 11;
      }
    }
    break;
  case 0xC1:
    {
      //  POP  BC
      this.BC(this.pop());
      this.cycles += 10;
    }
    break;
  case 0xC2:
    {
            // JP   NZ,nn
            if (this.f & ZERO) {
        this.pc = (this.pc + 2) & 0xFFFF;
            }
            else {
        this.pc = this.nextWord();
            }
            this.cycles += 10;
          }
    break;
  case 0xC3:
  case 0xCB:
    {
      //  JP   nn
      this.pc = this.getWord(this.pc);
      this.cycles += 10;
    }
    break;
  case 0xC4:
    {
      //  CALL NZ,nn
      if (this.f & ZERO) {
	this.cycles += 11;
	this.pc = (this.pc + 2) & 0xFFFF;
      }
      else {
	this.cycles += 17;
	w = this.nextWord();
	this.push(this.pc);
	this.pc = w;
      }
    }
    break;
  case 0xC5:
    {
      //  PUSH BC
      this.push(this.bc());
      this.cycles += 11;
    }
    break;
  case 0xC6:
    {
      //  ADD  A,n
      this.a = this.addByte(this.a, this.nextByte());
      this.cycles += 7;
    }
    break;
  case 0xC7:
    {
      // RST  0
      this.push(this.pc);
      this.pc = 0;
      this.cycles += 11;
    }
    break;
  case 0xC8:
    {
      // RET Z
      if (this.f & ZERO) {
	this.pc = this.pop();
	this.cycles += 11;
      }
      else {
	this.cycles += 5;
      }
    }
    break;
  case 0xC9:
  case 0xD9:
    {
      // RET  nn
      this.pc = this.pop();
      this.cycles += 10;
    }
    break;
  case 0xCA:
    {
            // JP   Z,nn
            if (this.f & ZERO) {
        this.pc = this.nextWord();
            }
            else {
        this.pc = (this.pc + 2) & 0xFFFF;
            }
            this.cycles += 10;
    }
    break;
  case 0xCC:
    {
      //  CALL Z,nn
      if (this.f & ZERO) {
	this.cycles += 17;
	w = this.nextWord();
	this.push(this.pc);
	this.pc = w;
      }
      else {
	this.cycles += 11;
	this.pc = (this.pc + 2) & 0xFFFF;
      }
    }
    break;
  case 0xCD:
  case 0xDD:
  case 0xED:
  case 0xFD:
    {
      // CALL nn
      w = this.nextWord();
      this.push(this.pc);
      this.pc = w;
      this.cycles += 17;
    }
    break;
  case 0xCE:
    {
      // ADC  A,n
      this.a = this.addByteWithCarry(this.a, this.nextByte());
      this.cycles += 7;
    }
    break;
  case 0xCF:
    {
      // RST  8
      this.push(this.pc);
      this.pc = 8;
      this.cycles += 11;
    }
    break;
  case 0xD0:
    {
      // RET NC
      if (this.f & CARRY) {
	this.cycles += 5;
      }
      else {
	this.pc = this.pop();
	this.cycles += 11;
      }
    }
    break;
  case 0xD1:
    {
      // POP DE
      this.DE(this.pop());
      this.cycles += 10;
    }
    break;
  case 0xD2:
    {
      // JP   NC,nn
      if (this.f & CARRY) {
	this.pc = (this.pc + 2) & 0xFFFF;
      }
      else {
	this.pc = this.nextWord();
      }
    this.cycles += 10;
    }
    break;
  case 0xD3:
    {
      // OUT  (n),A
      this.writePort(this.nextByte(), this.a);
      this.cycles += 10;
    }
    break;
  case 0xD4:
    {
      //  CALL NC,nn
      if (this.f & CARRY) {
	this.cycles += 11;
	this.pc = (this.pc + 2) & 0xFFFF;
      }
      else {
	this.cycles += 17;
	w = this.nextWord();
	this.push(this.pc);
	this.pc = w;
      }
    }
    break;
  case 0xD5:
    {
      //  PUSH DE
      this.push(this.de());
      this.cycles += 11;
    }
    break;
  case 0xD6:
    {
      // SUB  n
      this.a = this.subtractByte(this.a, this.nextByte());
      this.cycles += 7;
    }
    break;
  case 0xD7:
    {
      // RST  10H
      this.push(this.pc);
      this.pc = 0x10;
      this.cycles += 11;
    }
    break;
  case 0xD8:
    {
      // RET C
      if (this.f & CARRY) {
	this.pc = this.pop();
	this.cycles += 11;
      }
      else {
	this.cycles += 5;
      }
    }
    break;
  case 0xDA:
    {
      // JP   C,nn
      if (this.f & CARRY) {
	this.pc = this.nextWord();
      }
      else {
	this.pc = (this.pc + 2) & 0xFFFF;
      }
    this.cycles += 10;
    }
    break;
  case 0xDB:
    {
      // IN   A,(n)
      this.a = this.readPort(this.nextByte());
      this.cycles += 10;
    }
    break;
  case 0xDC:
    {
      //  CALL C,nn
      if (this.f & CARRY) {
	this.cycles += 17;
	w = this.nextWord();
	this.push(this.pc);
	this.pc = w;
      }
      else {
	this.cycles += 11;
	this.pc = (this.pc + 2) & 0xFFFF;
      }
    }
    break;
  case 0xDE:
    {
      // SBC  A,n
      this.a = this.subtractByteWithCarry(this.a, this.nextByte());
      this.cycles += 7;
    }
    break;
  case 0xDF:
    {
      // RST  18H
      this.push(this.pc);
      this.pc = 0x18;
      this.cycles += 11;
    }
    break;
  case 0xE0:
    {
      // RET PO
      if (this.f & PARITY) {
	this.cycles += 5;
      }
      else {
	this.pc = this.pop();
	this.cycles += 11;
      }
    }
    break;
  case 0xE1:
    {
      // POP HL
      this.HL(this.pop());
      this.cycles += 10;
    }
    break;
  case 0xE2:
    {
      // JP   PO,nn
      if (this.f & PARITY) {
	this.pc = (this.pc + 2) & 0xFFFF;
      }
      else {
	this.pc = this.nextWord();
      }
    this.cycles += 10;
    }
    break;
  case 0xE3:
    {
      // EX   (SP),HL ;
      var a = this.getWord(this.sp);
      this.writeWord(this.sp, this.hl());
      this.HL(a);
      this.cycles += 4;
    }
    break;
  case 0xE4:
    {
      //  CALL PO,nn
      if (this.f & PARITY) {
	this.cycles += 11;
	this.pc = (this.pc + 2) & 0xFFFF;
      }
      else {
	this.cycles += 17;
	w = this.nextWord();
	this.push(this.pc);
	this.pc = w;
      }
    }
    break;
  case 0xE5:
    {
      //  PUSH HL
      this.push(this.hl());
      this.cycles += 11;
    }
    break;
  case 0xE6:
    {
      // AND  n
      this.a = this.andByte(this.a, this.nextByte());
      this.cycles += 7;
    }
    break;
  case 0xE7:
    {
      // RST  20H
      this.push(this.pc);
      this.pc = 0x20;
      this.cycles += 11;
    }
    break;
  case 0xE8:
    {
      // RET PE
      if (this.f & PARITY) {
	this.pc = this.pop();
	this.cycles += 11;
      }
      else {
	this.cycles += 5;
      }
    }
    break;
  case 0xE9:
    {
      // JP   (HL)
      this.pc = this.hl();
      this.cycles += 4;
    }
    break;
  case 0xEA:
    {
      // JP   PE,nn
      if (this.f & PARITY) {
	this.pc = this.nextWord();
      }
      else {
	this.pc = (this.pc + 2) & 0xFFFF;
      }
    this.cycles += 10;
    }
    break;
  case 0xEB:
    {
      // EX   DE,HL
      w = this.de();
      this.DE(this.hl());
      this.HL(w);
      this.cycles += 4;
    }
    break;
  case 0xEC:
    {
      //  CALL PE,nn
      if (this.f & PARITY) {
	this.cycles += 17;
	w = this.nextWord();
	this.push(this.pc);
	this.pc = w;
      }
      else {
	this.cycles += 11;
	this.pc = (this.pc + 2) & 0xFFFF;
      }
    }
    break;
  case 0xEE:
    {
      // XOR  n
      this.a = this.xorByte(this.a, this.nextByte());
      this.cycles += 7;
    }
    break;
  case 0xEF:
    {
      // RST  28H
      this.push(this.pc);
      this.pc = 0x28;
      this.cycles += 11;
    }
    break;
  case 0xF0:
    {
      // RET P
      if (this.f & SIGN) {
	this.cycles += 5;
      }
      else {
	this.pc = this.pop();
	this.cycles += 11;
      }
    }
    break;
  case 0xF1:
    {
      // POP AF
      this.AF(this.pop());
      this.cycles += 10;
    }
    break;
  case 0xF2:
    {
      // JP   P,nn
      if (this.f & SIGN) {
	this.pc = (this.pc + 2) & 0xFFFF;
      }
      else {
	this.pc = this.nextWord();
      }
    this.cycles += 10;
    }
    break;
  case 0xF3:
    {
      // DI
      this.inte = 0;
      this.cycles += 4;
    }
    break;
  case 0xF4:
      {
      //  CALL P,nn
      if (this.f & SIGN) {
	this.cycles += 11;
	this.pc = (this.pc + 2) & 0xFFFF;
      }
      else {
	this.cycles += 17;
	w = this.nextWord();
	this.push(this.pc);
	this.pc = w;
      }
    }
    break;
  case 0xF5:
    {
      //  PUSH AF
      this.push(this.af());
      this.cycles += 11;
    }
    break;
  case 0xF6:
    {
      // OR   n
      this.a = this.orByte(this.a, this.nextByte());
      this.cycles += 7;
    }
    break;
  case 0xF7:
    {
      // RST  30H
      this.push(this.pc);
      this.pc = 0x30;
      this.cycles += 11;
    }
    break;
  case 0xF8:
    {
      // RET M
      if (this.f & SIGN) {
	this.pc = this.pop();
	this.cycles += 11;
      }
      else {
	this.cycles += 5;
      }
    }
    break;
  case 0xF9:
    {
      // LD   SP,HL
      this.sp = this.hl();
      this.cycles += 6;
    }
    break;
  case 0xFA:
    {
      // JP   M,nn
      if (this.f & SIGN) {
	this.pc = this.nextWord();
      }
      else {
	this.pc = (this.pc + 2) & 0xFFFF;
      }
    this.cycles += 10;
    }
    break;
  case 0xFB:
    {
      // EI
      this.inte = 1;
      this.cycles += 4;
    }
    break;
  case 0xFC:
    {
      //  CALL M,nn
      if (this.f & SIGN) {
	this.cycles += 17;
	w = this.nextWord();
	this.push(this.pc);
	this.pc = w;
      }
      else {
	this.cycles += 11;
	this.pc = (this.pc + 2) & 0xFFFF;
      }
    }
    break;
  case 0xFE:
    {
      // CP   n
      this.subtractByte(this.a, this.nextByte());
      this.cycles += 7;
    }
    break;
  case 0xFF:
    {
      // RST  38H
      this.push(this.pc);
      this.pc = 0x38;
      this.cycles += 11;
    }
    break;
  default:
    {
      // NOP
      this.cycles += 4;
    }
    break;

  }
  this.f &= 0xd7;
  this.f |= 0x02;

};

var proc, tracer=false;

var reset = function(){
  //pc=wordAt(ResetTo);
  proc.pc=0;
  proc.sp=0;
  proc.halted = 0;
  proc.a=proc.b=proc.c=proc.d=proc.e=proc.h=proc.l=0;
  proc.f=2;
  proc.inte = 0;
  proc.cycles=0;
};

var goTrace = function(proc){
  console.log(toHex4(proc.pc));
};


exports["trace"] = function(stat) {tracer = stat;};
exports["steps"] = function(Ts){
    T=0;


    while (Ts>0){

      Ts-=proc.step(); 


      if (tracer) goTrace(proc);
    }
  };
exports["T"] = function(){return proc.cycles;};
exports["reset"] = reset;
exports["init"] = function(bt,ba,tck,porto,porti){
    byteTo=bt; 
    byteAt = ba; 
    ticks=tck; 
    portOut = porto;
    portIn = porti;
    proc = new Cpu();
    reset();
  };
exports["status"] = function() {
    return {
      "pc":proc.pc,
      "sp":proc.sp,
      "a":proc.a,
      "b":proc.b,
      "c":proc.c,
      "d":proc.d,
      "e":proc.e,
      "f":proc.f,
      "h":proc.h,
      "l":proc.l
    };
  };
exports['interrupt'] = function(vector) {
      if (proc.inte) {
        proc.halted = 0;
        proc.push(proc.pc);
        proc.pc = vector || 0x38;
      }
  };
exports["set"] = function(reg,value) {
  reg = reg.toUpperCase();
    switch (reg) {
      case "PC": proc.pc=value;return;
      case "A": proc.a=value;return;
      case "B": proc.b=value;return;
      case "C": proc.c=value;return;
      case "D": proc.d=value;return;
      case "E": proc.e=value;return;
      case "H": proc.h=value;return;
      case "L": proc.l=value;return;
      case "F": proc.f=value;return;
      case "SP": proc.sp=value;return;
    }
  };
  exports["flagsToString"] = function() {
    var f='',fx = "SZ0A0P1C";
    for (var i=0;i<8;i++) {
      var n = proc.f&(0x80>>i);
      if (n===0) {f+=fx[i].toLowerCase();} else {f+=fx[i];}
    }
    return f;
  };


})(typeof exports === 'undefined'? this['CPU8080']={}: exports);


