/* ---------- UI ---------- */
function el(tag,attrs={},...kids){ const e=document.createElement(tag); for(const k in attrs){ const v=attrs[k]; if(k==='class') e.className=v; else if(k.startsWith('on')) e.addEventListener(k.slice(2),v); else if(v!==false&&v!=null) e.setAttribute(k,v); } kids.flat().forEach(c=>{ if(c!=null&&c!==false) e.append(c.nodeType?c:document.createTextNode(c)); }); return e; }
const btn=(label,fn,cls='')=>el('button',{class:'btn '+cls,type:'button',onclick:fn},label);

const panel=$('#panel'); let panelFn=null, focusIdx=0;
function openPanel(fn){ keys.clear(); panelFn=fn; focusIdx=0; panel.hidden=false; renderPanel(); $('#prompt').hidden=true; }
function closePanel(){ panel.hidden=true; panelFn=null; canvas.focus({preventScroll:true}); }
function renderPanel(){
  if(!panelFn) return; const s=panelFn();
  $('#pEyebrow').textContent=s.eyebrow; $('#pTitle').textContent=s.title;
  const body=$('#pBody'); body.replaceChildren(...(s.body||[]).filter(x=>x!=null&&x!==false));
  const act=$('#pActions'); act.replaceChildren(...(s.actions||[]).map(a=>btn(a.label,()=>{ a.fn(); if(panelFn) renderPanel(); },a.primary?'primary':'')));
  act.hidden=!(s.actions&&s.actions.length);
  $('#pNav').textContent = mode==='pad' ? 'Croix directionnelle pour choisir, A pour valider' : mode==='touch' ? 'Touche un bouton pour agir' : 'Tab pour naviguer, Entrée pour valider';
  setFocus(clamp(focusIdx,0,focusables().length-1), false);
}
$('#pClose').addEventListener('click',closePanel);
panel.addEventListener('click',e=>{ if(e.target===panel) closePanel(); });
function focusables(){ return [...panel.querySelectorAll('button, input')]; }
function setFocus(i,scroll=true){ const f=focusables(); f.forEach(x=>x.classList.remove('focus')); if(!f.length) return; focusIdx=(i+f.length)%f.length; if(mode==='pad'){ f[focusIdx].classList.add('focus'); if(scroll) f[focusIdx].scrollIntoView({block:'nearest'}); } }

function teleport(x,z,level,yaw){ fade(()=>{ player.pos.set(x,level*5,z); player.level=level; cam.yaw=yaw; player.face=yaw+PI; snapCam=true; }); }
const FLOORS={ '-1':['Sous-sol','archives des agents, mises à jour'], '0':['Rez-de-chaussée','accueil'], '1':['1er étage','bureaux 101, 102 et 103'], '2':['2e étage','présidence, registre, conseil'] };
function goFloor(n){ if(n===player.level) return; fade(()=>{ player.level=n; player.pos.set(11,n*5,3.8); cam.yaw=0; player.face=PI; snapCam=true; }); toast(FLOORS[n][0]+' · '+FLOORS[n][1]); }
let fading=false;
function fade(fn){ if(fading) return; fading=true; const f=$('#fade'); f.classList.add('on'); setTimeout(()=>{ fn(); f.classList.remove('on'); fading=false; },300); }
let toastT=0; function toast(t){ const e=$('#toast'); e.textContent=t; e.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>e.classList.remove('on'),2800); }

const homeAction={ label:'Retour au siège', fn:()=>{ closePanel(); teleport(0,15,0,0); } };

