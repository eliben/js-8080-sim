'use strict';

const STORAGE_ID = 'js8080sim';

// Set up listeners.
const codetext = document.querySelector('#codetext');
codetext.addEventListener('keydown', codetextKey);

document.querySelector("#run").addEventListener("mousedown", runCode);

loadState();

let st = document.querySelector("#status");
st.textContent = "SUCCESS";
st.style.color = "green";

function loadState() {
  let state = JSON.parse(localStorage.getItem(STORAGE_ID));
  if (state) {
    codetext.value = state['codetext'];
  }
}

function saveState() {
  let state = {'codetext': codetext.value};
  localStorage.setItem(STORAGE_ID, JSON.stringify(state));
}

// TODO: editing -- same whitespace offset as last line
function runCode() {
  saveState();

  let prog = codetext.value;
  let [state, mem] = runProg(prog, 100);
  console.log(state);
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
