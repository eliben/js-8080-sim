'use strict';

const STORAGE_ID = 'js8080sim';

// Set up listeners.
const codetext = document.querySelector('#codetext');
const maxsteps = document.querySelector('#maxsteps');
codetext.addEventListener('keydown', codetextKey);

document.querySelector("#run").addEventListener("mousedown", runCode);

const cpuStateTable = document.querySelector('#cpuState');
const registers = ['a', 'b', 'c', 'd', 'e',
                   'h', 'l', 'pc', 'sp', 'halted']
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
  if (i % 5 == 0) {
    row = elt("tr");
  }

  let regname = registers[i];
  cpuStateValues[regname] = document.createTextNode("");
  let nameElem = elt("td", `${regname}:`);
  nameElem.classList.add("regName");
  row.appendChild(nameElem);
  row.appendChild(elt("td", cpuStateValues[regname]));

  if (i % 5 == 4) {
    cpuStateTable.appendChild(row);
  }
}

loadUiState();

function loadUiState() {
  let state = JSON.parse(localStorage.getItem(STORAGE_ID));
  if (state) {
    codetext.value = state['codetext'];
    maxsteps.value = state['maxsteps'];
  } else {
    maxsteps.value = "10000";
  }

  setStatusReady();
}

function saveUiState() {
  let state = {
    'codetext': codetext.value,
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

function runCode() {
  saveUiState();

  try {
    let prog = codetext.value;

    if (maxsteps.value === 'undefined' || isNaN(parseInt(maxsteps.value))) {
      throw new Error(`Max steps value is invalid`);
    }
    let [state, mem] = runProg(prog, parseInt(maxsteps.value));

    console.log(state, typeof state);
    for (let regName of Object.keys(state)) {
      if (cpuStateValues.hasOwnProperty(regName)) {
        let valueElement = cpuStateValues[regName];
        let width = registerWidths[regName];
        valueElement.textContent = state[regName].toString(16).padStart(width, 0);
      } else if (regName === 'f') {
        // TODO: handle flags?
      } else {
        console.log('cannot find state value for', regName);
      }
    }

    console.log(state);
    setStatusSuccess();
  } catch (e) {
    setStatusFail(e.message);
  }
}

function codetextKey(event) {
  if (event.keyCode == 13) {
    // Capture "Enter" to insert spaces similar to the previous line.
    let pos = codetext.selectionStart;

    let prevNewlinePos = pos - 1;
    while (prevNewlinePos > 0 &&
           codetext.value.charAt(prevNewlinePos) !== '\n') {
      prevNewlinePos--;
    }

    let startLinePos = prevNewlinePos + 1;
    while (codetext.value.charAt(startLinePos) === ' ') {
      startLinePos++;
    }

    let numSpaces = startLinePos - prevNewlinePos - 1;

    codetext.value = codetext.value.substring(0, pos)
                      + '\n'
                      + ' '.repeat(numSpaces)
                      + codetext.value.substring(pos, codetext.value.length);
    codetext.selectionStart = pos + numSpaces + 1;
    codetext.selectionEnd = pos + numSpaces + 1;
    event.stopPropagation();
    event.preventDefault();
  }
}

function runProg(progText, maxSteps) {
  let p = new js8080sim.Parser();
  let asm = new js8080sim.Assembler();
  let sourceLines = p.parse(progText);
  let mem = asm.assemble(sourceLines);

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

  return [js8080sim.CPU8080.status(), mem];
}

function elt(type, ...children) {
  let node = document.createElement(type);
  for (let child of children) {
    if (typeof child != "string") node.appendChild(child);
    else node.appendChild(document.createTextNode(child));
  }
  return node;
}
