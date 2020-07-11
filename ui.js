'use strict';

const STORAGE_ID = 'js8080sim';


loadState();

document.querySelector("#run").addEventListener("mousedown", runCode);

let st = document.querySelector("#status");
st.textContent = "SUCCESS";
st.style.color = "green";

function loadState() {
  let state = JSON.parse(localStorage.getItem(STORAGE_ID));
  if (state) {
    document.querySelector("#codetext").value = state['codetext'];
  }
}

function saveState() {
  let state = {'codetext': document.querySelector('#codetext').value};
  localStorage.setItem(STORAGE_ID, JSON.stringify(state));
}

// TODO: editing -- same whitespace offset as last line
function runCode() {
  saveState();

  let prog = document.querySelector('#codetext').value;
  let [state, mem] = runProg(prog, 100);
  console.log(state);
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
