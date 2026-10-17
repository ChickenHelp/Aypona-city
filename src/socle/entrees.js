/* ---------- Entrées ---------- */
let mode='kb';
const keys=new Set();
function setMode(m){ if(m===mode) return; mode=m; $('#inputBadge').textContent= m==='pad'?'Manette Xbox':m==='touch'?'Tactile':'Clavier + souris'; $('#promptKey').textContent= m==='kb'?'E':'A'; $('#hint').hidden = m!=='kb'; if(panelFn) renderPanel(); }
addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
  setMode('kb');
  const k=e.key.toLowerCase();
  if(!$('#intro').hidden){ if(k==='enter'||k===' '||k==='e'){ e.preventDefault(); closeIntro(); } return; }
  if(!panel.hidden){ if(k==='escape'){ closePanel(); } return; }
  if(k==='e'||k==='enter'){ doInteract(); e.preventDefault(); return; }
  if(k==='h'){ $('#intro').hidden=false; return; }
  keys.add(k); if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>keys.clear());

// caméra à la souris / au doigt
let drag=null;
canvas.addEventListener('pointerdown',e=>{ if(e.pointerType==='touch') setMode('touch'); else if(mode!=='pad') setMode('kb'); drag={ id:e.pointerId, x:e.clientX, y:e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove',e=>{ if(!drag||drag.id!==e.pointerId) return; const dx=e.clientX-drag.x, dy=e.clientY-drag.y; drag.x=e.clientX; drag.y=e.clientY; cam.yaw-=dx*.006; cam.pitch=clamp(cam.pitch+dy*.004,.08,1.25); });
const endDrag=e=>{ if(drag&&drag.id===e.pointerId) drag=null; };
canvas.addEventListener('pointerup',endDrag); canvas.addEventListener('pointercancel',endDrag);
canvas.addEventListener('wheel',e=>{ cam.zoom=clamp(cam.zoom+Math.sign(e.deltaY)*.1,.55,1.7); e.preventDefault(); },{passive:false});

// joystick tactile
const joy=$('#joy'), knob=$('#knob'); const stick={x:0,y:0,id:null};
function joyMove(e){ const r=joy.getBoundingClientRect(); let x=(e.clientX-(r.left+r.width/2))/(r.width/2), y=(e.clientY-(r.top+r.height/2))/(r.height/2); const m=Math.hypot(x,y); if(m>1){x/=m;y/=m;} stick.x=x; stick.y=y; knob.style.transform=`translate(${x*38}px,${y*38}px)`; }
joy.addEventListener('pointerdown',e=>{ setMode('touch'); stick.id=e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); });
joy.addEventListener('pointermove',e=>{ if(stick.id===e.pointerId) joyMove(e); });
const joyEnd=e=>{ if(stick.id!==e.pointerId) return; stick.id=null; stick.x=stick.y=0; knob.style.transform=''; };
joy.addEventListener('pointerup',joyEnd); joy.addEventListener('pointercancel',joyEnd);
$('#btnA').addEventListener('pointerdown',e=>{ e.preventDefault(); setMode('touch'); doInteract(); });
function showTouch(){ $('#touchUI').hidden=false; $('#app').classList.add('touch'); }
if(matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window){ showTouch(); setMode('touch'); }
addEventListener('touchstart',showTouch,{once:true,passive:true});

// manette
let padPrev=[], navCool=0, padOk=true;
function readPad(){
  if(!padOk||!navigator.getGamepads) return null;
  let pads; try { pads=navigator.getGamepads(); } catch(e){ padOk=false; return null; }
  for(const p of pads) if(p&&p.connected) return p; return null;
}
const dz=v=>Math.abs(v)<.18?0:(v-Math.sign(v)*.18)/.82;
function pressed(p,i){ const b=p.buttons[i]; return !!b && (b.pressed||b.value>.5); }
addEventListener('gamepadconnected',()=>{ setMode('pad'); toast('Manette connectée'); });

/* ---------- Intro ---------- */
function closeIntro(){ $('#intro').hidden=true; canvas.focus({preventScroll:true}); }
$('#btnStart').addEventListener('click',closeIntro);

/* ---------- Interactions ---------- */
let current=null;
function findInteract(){
  let best=null, bd=1e9; const p=player.pos;
  for(const it of interacts){
    if(it.level!==player.level) continue; let d;
    if(it.type==='point') d=Math.hypot(p.x-it.x,p.z-it.z);
    else if(it.type==='box'){ const cx=clamp(p.x,it.minX,it.maxX), cz=clamp(p.z,it.minZ,it.maxZ); d=Math.hypot(p.x-cx,p.z-cz); }
    else { if(player.level!==0||insideHQ()) continue; d=Math.hypot(p.x-it.agent.pos.x,p.z-it.agent.pos.z); }
    if(d<it.r && d<bd){ bd=d; best=it; }
  }
  if(player.level===0 && !insideHQ()) for(const a of agents){ const d=Math.hypot(p.x-a.pos.x,p.z-a.pos.z); if(d<3.2 && d<bd){ bd=d; const m=a.data.matricule; best={ label:'Parler à '+a.name+' · '+m, act:()=>openPanel(()=>panelAgent(m)) }; } }
  return best;
}
function doInteract(){ if(!$('#intro').hidden){ closeIntro(); return; } if(!panel.hidden||fading) return; if(current) current.act(); }

