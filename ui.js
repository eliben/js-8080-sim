'use strict';

// This is for jshint that will worry it can't find js8080sim, which is injected
// in a <script> tag in the HTML.
/* globals js8080sim: false */

const STORAGE_ID = 'js8080sim';

// Set up listeners.
const codetext = document.querySelector('#codetext');
const maxsteps = document.querySelector('#maxsteps');
const ramstart = document.querySelector('#ramstart');
const ramshowmode = document.querySelector('#ramshowmode');
codetext.addEventListener('keydown', onCodeTextKey);
document.querySelector("#run").addEventListener("mousedown", () => dispatchStep("run"));
document.querySelector("#prev").addEventListener("mousedown", () => dispatchStep("prev"));
document.querySelector("#next").addEventListener("mousedown", () => dispatchStep("next"));
document.querySelector("#setsample").addEventListener("mousedown", onSetSample);
document.querySelector("#showramstart").addEventListener("mousedown", onShowRamStart);
document.querySelector("#ramstart").addEventListener("keyup", onRamStartKey);
document.querySelector("#ramshowmode").addEventListener("change", onRamShowMode);

let codeSamples = [
  {'name': '', 'code': ''},

  {'name': 'add-array-indirect',
   'code': `
; The sum will be accumulated into d
  mvi d, 0

; Demonstrates indirect addressing, by keeping
; a "pointer" to myArray in bc.
  lxi bc, myArray

; Each iteration: load next item from myArray
; (until finding 0) into a. Then accumulate into d.
Loop:
  ldax bc
  cpi 0
  jz Done
  add d
  mov d, a
  inr c
  jmp Loop

Done:
  hlt

myArray:
  db 10h, 20h, 30h, 10h, 20h, 0
`},

  {'name': 'labeljump',
   'code': `
  mvi a, 1h
  dcr a
  jz YesZero
  jnz NoZero

YesZero:
  mvi c, 20
  hlt

NoZero:
  mvi c, 50
  hlt
`},

  {'name': 'capitalize',
   'code': `
  lxi hl, str
  mvi c, 14
  call Capitalize
  hlt

Capitalize:
  mov a, c
  cpi 0
  jz AllDone

  mov a, m
  cpi 61h
  jc SkipIt

  cpi 7bh
  jnc SkipIt

  sui 20h
  mov m, a

SkipIt:
  inx hl
  dcr c
  jmp Capitalize

AllDone:
  ret

str:
  db 'hello, friends'
  `},

  {'name': 'memcpy',
   'code': `
  lxi de, SourceArray
  lxi hl, TargetArray
  mvi b, 0
  mvi c, 5
  call memcpy
  hlt

SourceArray:
  db 11h, 22h, 33h, 44h, 55h

TargetArray:
  db 0, 0, 0, 0, 0, 0, 0, 0, 0, 0

  ; bc: number of bytes to copy
  ; de: source block
  ; hl: target block
memcpy:
  mov     a,b         ;Copy register B to register A
  ora     c           ;Bitwise OR of A and C into register A
  rz                  ;Return if the zero-flag is set high.
loop:
  ldax    de          ;Load A from the address pointed by DE
  mov     m,a         ;Store A into the address pointed by HL
  inx     de          ;Increment DE
  inx     hl          ;Increment HL
  dcx     bc          ;Decrement BC   (does not affect Flags)
  mov     a,b         ;Copy B to A    (so as to compare BC with zero)
  ora     c           ;A = A | C      (set zero)
  jnz     loop        ;Jump to 'loop:' if the zero-flag is not set.
  ret                 ;Return
`}

];

// Code samples.
let samples = document.querySelector("#samples");
for (let sample of codeSamples) {
  let option = elt("option", sample.name);
  option.setAttribute('value', sample.name);
  samples.appendChild(option);
}

// Create and populate the CPU state table.
const cpuStateTable = document.querySelector('#cpuState');
const registers = ['a', 'b', 'c', 'd', 'e',
                   'h', 'l', 'pc', 'sp', 'halted'];
const registerWidths = {
  'a': 2,
  'b': 2,
  'c': 2,
  'd': 2,
  'e': 2,
  'h': 2,
  'l': 2,
  'pc': 4,
  'sp': 4,
  'halted': 1
};

let cpuStateValues = {};

let row;
for (let i = 0; i < registers.length; i++) {
  if (i % 5 === 0) {
    row = elt("tr");
  }

  let regname = registers[i];
  cpuStateValues[regname] = document.createTextNode("");
  let nameElem = elt("td", `${regname}:`);
  nameElem.classList.add("regName");
  row.appendChild(nameElem);
  row.appendChild(elt("td", cpuStateValues[regname]));

  if (i % 5 === 4) {
    cpuStateTable.appendChild(row);
  }
}

// Create and populate the flags table.
let flags = ['Sign', 'Zero', 'Parity', 'Carry'];
let flagsStateValues = {};

let flagRow = elt("tr");
for (let i = 0; i < flags.length; i++) {
  let flagname = flags[i];
  let headtd = elt("td", flagname + ':');
  headtd.classList.add("flagHeader");
  flagsStateValues[flagname] = document.createTextNode("");
  flagRow.appendChild(headtd);
  flagRow.appendChild(elt("td", flagsStateValues[flagname]));
}
document.querySelector('#flags').appendChild(flagRow);

// Create and populate the RAM table.
const ramTable = document.querySelector('#ram');
let headrow = elt("tr", elt("td"));
for (let i = 0; i < 16; i++) {
  let headtd = elt("td", `${formatNum(i, 0)}`);
  headtd.classList.add("ramHeader");
  headrow.appendChild(headtd);
}
ramTable.appendChild(headrow);

const NROWS = 16;
let ramValues = [];
for (let i = 0; i < NROWS; i++) {
  let row = elt("tr");
  let headtd = elt("td", `${formatNum(i, 3)}`);
  headtd.classList.add("ramHeader");
  row.appendChild(headtd);

  for (let i = 0; i < 16; i++) {
    let ramval = document.createTextNode("00");
    ramValues.push(ramval);
    row.appendChild(elt("td", ramval));
  }
  ramTable.appendChild(row);
}

loadUiState();

function loadUiState() {
  let state = JSON.parse(localStorage.getItem(STORAGE_ID));
  // Defaults that will be overridden when reading state.
  maxsteps.value = "10000";
  ramstart.value = "0000";

  if (state) {
    codetext.innerHTML = state.codetext;
    if (state.maxsteps !== undefined) {
      maxsteps.value = state.maxsteps;
    }
    if (state.ramstart !== undefined) {
      ramstart.value = state.ramstart;
    }
  }

  setStatusReady();
}

function saveUiState() {
  let state = {
    'codetext': codetext.innerHTML,
    'maxsteps': maxsteps.value
  };
  localStorage.setItem(STORAGE_ID, JSON.stringify(state));
}

function setStatusFail(msg) {
  let st = document.querySelector("#status");
  st.textContent = "FAIL: " + msg;
  st.style.color = "red";
}

function setStatusSuccess() {
  let st = document.querySelector("#status");
  st.textContent = "SUCCESS";
  st.style.color = "green";
}

function setStatusReady() {
  let st = document.querySelector("#status");
  st.textContent = "Ready to run";
}

// Saves the mem values from the last run, so we could show different parts of
// RAM per the user's request in the RAM table.
let memFromLastRun = new Array(65536).fill(0);
let globAddrToLine;

// Checks if the value in the maxsteps box is valid; throws exception if not.
function checkSteps() {
    if (maxsteps.value === 'undefined' || isNaN(parseInt(maxsteps.value)) ||
        parseInt(maxsteps.value) < 0) {
    throw new Error(`Steps value is invalid`);
  }
}

function dispatchStep(event) {
  try {
    checkSteps();
    switch (event) {
    case "run":
      onRunCode();
      break;
    case "next":
      onNextStep();
      break;
    case "prev":
      onPrevStep();
      break;
    }
  } catch (e) {
    if (e instanceof js8080sim.ParseError ||
        e instanceof js8080sim.AssemblyError) {
      setStatusFail(`${e}`);
    } else {
      setStatusFail(e.message);
    }
    throw(e);
  }
}

function onNextStep() {
  let step = parseInt(maxsteps.value);
  maxsteps.value = step + 1;
  onRunCode();
  highlightCurrentLine();
}

function onPrevStep() {
  let step = parseInt(maxsteps.value);
  maxsteps.value = step - 1;
  onRunCode();
  highlightCurrentLine();
}

function highlightCurrentLine() {
  let pc = parseInt(cpuStateValues.pc.textContent, 16);
  let lineno = globAddrToLine[pc];
  //console.log(`Highlighting ${pc} => ${lineno}`);
  let lines = codetext.innerHTML.split('\n');

  // map the entries to a div to enable styling and track the index if the line contains FAIL
  lines = lines.map((value, index) => {
    index += 1;
    if(index === lineno && ! value.includes("<mark>")){
      return `<mark>${value}</mark>`;
    } else if(value.includes("<mark>")) {
      return value.replace("</mark>", "").replace("<mark>", "");
    } else {
      return value;
    }
  });

  // put the mapped content back as innerHTML of the PRE element
  codetext.innerHTML = lines.join("\n");
}

function onRunCode() {
  saveUiState();

  let prog = codetext.innerHTML;

  let [state, mem, labelToAddr, addrToLine] = runProg(prog, parseInt(maxsteps.value));
  memFromLastRun = mem;
  globAddrToLine = addrToLine;
  // Populate CPU state / registers.
  for (let regName of Object.keys(state)) {
    if (cpuStateValues.hasOwnProperty(regName)) {
      let valueElement = cpuStateValues[regName];
      let width = registerWidths[regName];
      valueElement.textContent = formatNum(state[regName], width);
    } else if (regName === 'f') {
      let regval = state[regName];
      flagsStateValues.Sign.textContent = formatNum((regval >> 7) & 0x01, 2);
      flagsStateValues.Zero.textContent = formatNum((regval >> 6) & 0x01, 2);
      flagsStateValues.Parity.textContent = formatNum((regval >> 2) & 0x01, 2);
      flagsStateValues.Carry.textContent = formatNum(regval & 0x01, 2);
    } else {
      console.log('cannot find state value for', regName);
    }
  }

  // Populate RAM table.
  ramstart.value = "0000";
  populateRamTable();

  // Populate labels table.
  const labelTable = document.querySelector('#labels');
  labelTable.innerHTML = '';
  for (let [key, value] of labelToAddr.entries()) {
    let row = elt("tr");
    let keyCol = elt("td", key + ':');
    keyCol.classList.add("labelName");
    let valCol = elt("td", formatNum(value, 4));
    row.append(keyCol, valCol);
    labelTable.appendChild(row);
  }

  setStatusSuccess();
}

function onRamStartKey(event) {
  if (event.keyCode === 13) {
    onShowRamStart();
    event.stopPropagation();
    event.preventDefault();
  }
}

// Credits to https://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
function getCaretCharacterOffsetWithin(element) {
  var caretOffset = 0;
  var doc = element.ownerDocument || element.document;
  var win = doc.defaultView || doc.parentWindow;
  var sel;
  if (typeof win.getSelection != "undefined") {
    sel = win.getSelection();
    if (sel.rangeCount > 0) {
      var range = win.getSelection().getRangeAt(0);
      var preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
  } else if ( (sel = doc.selection) && sel.type !== "Control") {
    const textRange = sel.createRange();
    const preCaretTextRange = doc.body.createTextRange();
    preCaretTextRange.moveToElementText(element);
    preCaretTextRange.setEndPoint("EndToEnd", textRange);
    caretOffset = preCaretTextRange.text.length;
  }
  return caretOffset;
}

// Credits to https://stackoverflow.com/questions/6249095/how-to-set-the-caret-cursor-position-in-a-contenteditable-element-div
function createRange(node, chars, range) {
  if (!range) {
    range = document.createRange();
    range.selectNode(node);
    range.setStart(node, 0);
  }

  if (chars.count === 0) {
    range.setEnd(node, chars.count);
  } else if (node && chars.count >0) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.length < chars.count) {
        chars.count -= node.textContent.length;
      } else {
        range.setEnd(node, chars.count);
        chars.count = 0;
      }
    } else {
      for (var lp = 0; lp < node.childNodes.length; lp++) {
        range = createRange(node.childNodes[lp], chars, range);

        if (chars.count === 0) {
          break;
        }
      }
    }
  }

  return range;
}

function setCurrentCursorPosition(element, chars) {
  if (chars >= 0) {
    const selection = window.getSelection();

    const range = createRange(element, {count: chars});

    if (range) {
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}

function onCodeTextKey(event) {
  if (event.keyCode === 13) {
    // Capture "Enter" to insert spaces similar to the previous line.
    let pos = getCaretCharacterOffsetWithin(codetext);

    let prevNewlinePos = pos - 1;
    while (prevNewlinePos > 0 &&
           codetext.innerHTML.charAt(prevNewlinePos) !== '\n') {
      prevNewlinePos--;
    }

    let startLinePos = prevNewlinePos + 1;
    while (codetext.innerHTML.charAt(startLinePos) === ' ') {
      startLinePos++;
    }

    let numSpaces = startLinePos - prevNewlinePos - 1;

    codetext.innerHTML = codetext.innerHTML.substring(0, pos) +
                      '\n' +
                      ' '.repeat(numSpaces) +
                      codetext.innerHTML.substring(pos, codetext.innerHTML.length);
    setCurrentCursorPosition(codetext, pos + numSpaces + 1);
    event.stopPropagation();
    event.preventDefault();
  }
}


function runProg(progText, maxSteps) {
  // we need to clean progText and remove the highlighting
  progText = progText.replaceAll("<mark>", "").replaceAll("</mark>", "");
  let p = new js8080sim.Parser();
  let asm = new js8080sim.Assembler();
  let sourceLines = p.parse(progText);
  let [mem, labelToAddr, addrToLine] = asm.assemble(sourceLines);

  const memoryTo = (addr, value) => {mem[addr] = value;};
  const memoryAt = (addr) => {return mem[addr];};
  js8080sim.CPU8080.init(memoryTo, memoryAt);
  js8080sim.CPU8080.set('PC', 0);

  if (maxSteps === undefined) {
    maxSteps = 50000;
  }

  for (let i = 0; i < maxSteps; i++) {
    js8080sim.CPU8080.steps(1);

    if (js8080sim.CPU8080.status().halted) {
      break;
    }
  }

  return [js8080sim.CPU8080.status(), mem, labelToAddr, addrToLine];
}

function onSetSample() {
  let samples = document.querySelector("#samples");
  let selectedSampleCode = codeSamples[samples.selectedIndex];
  codetext.innerHTML = selectedSampleCode.code.replace(/^\n+/, '');
  codetext.innerHTML = selectedSampleCode.code.replace(/^\n+/, '');
}

function onShowRamStart() {
  populateRamTable();
}

function onRamShowMode() {
  populateRamTable();
}

function populateRamTable() {
  // Calculate start address for the first entry in the displayed RAM table.
  let startAddr = parseInt(ramstart.value, 16) & 0xfff0;
  if (startAddr > 0xff00) {
    startAddr = 0xff00;
    ramstart.value = formatNum(startAddr, 4);
  }
  let headerStart = startAddr;

  // Set table row headers.
  for (let i = 1; i < ramTable.children.length; i++) {
    let headerTd = ramTable.children[i].firstChild;
    headerTd.textContent = formatNum(headerStart, 4).slice(0, 3);
    headerStart += 16;
  }

  const useAscii = ramshowmode.value === "ASCII";

  // Set table contents.
  for (let i = 0; i < 16 * 16; i++) {
    let memIndex = startAddr + i;
    let value = memFromLastRun[memIndex];
    ramValues[i].textContent = useAscii ?
      ('.' + formatAscii(value)) :
      formatNum(value, 2);
  }
}

function elt(type, ...children) {
  let node = document.createElement(type);
  for (let child of children) {
    if (typeof child != "string") node.appendChild(child);
    else node.appendChild(document.createTextNode(child));
  }
  return node;
}

// formatNum formats a number as a hexadecimal string with zero padding.
// Set padding to 0 for "no padding".
function formatNum(n, padding) {
  return n.toString(16).toUpperCase().padStart(padding, 0);
}

// formatAscii formats the numeric code n as ASCII, with special treatment for
// non-printable characters.
function formatAscii(n) {
  let f;
  if (n >= 33 && n <= 126) {
    f = String.fromCharCode(n);
  } else {
    f = '.';
  }
  return f;
}
