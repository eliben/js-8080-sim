'use strict';

const STORAGE_ID = 'js8080sim';

// Set up listeners.
const codetext = document.querySelector('#codetext');
const maxsteps = document.querySelector('#maxsteps');
codetext.addEventListener('keydown', codetextKey);

document.querySelector("#run").addEventListener("mousedown", runCode);

const cpuStateTable = document.querySelector('#state');
const registers = ['a', 'b', 'c', 'd', 'e',
                   'h', 'l', 'pc', 'sp', 'halted']
let cpuStateValues;

// TODO: add entries to cpuStateTable for the registers and their values

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
