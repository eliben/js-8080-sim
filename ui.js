'use strict';

const STORAGE_ID = 'js8080sim';


loadState();

document.querySelector("#run").addEventListener("mousedown", runCode);

// Expects the global js8080sim to be available.
let asm = new js8080sim.Assembler();

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

function runCode() {
  saveState();
}
