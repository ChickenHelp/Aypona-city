/* ---------- Sauvegarde locale ---------- */
const SAVE_KEY = 'aypona-city-v1';
let state = { built:[], agents:{}, removed:[], log:[] };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && Array.isArray(s.built)) state = { built:s.built, agents:s.agents||{}, removed:s.removed||[], log:s.log||[] }; } catch(e) {}
function logEvt(txt){ state.log.unshift({ t:Date.now(), txt }); state.log.length=Math.min(state.log.length,60); }
function save(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch(e) {} }

function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const R = rng(2114);

