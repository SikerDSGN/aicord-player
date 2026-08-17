(()=>{
'use strict';
const $=s=>document.querySelector(s);
let selected=null;
let loupe=null;
let ranked=[];
let rankIndex=0;
const watchIds=new Set(['newText','fontFamily','fontWeight','italic','align','fontSize','widthScale','letterSpacing','dx','dy','color','bgColor']);

const EXTRA_FONTS=[
  ['Roboto (Android)','"Roboto", Arial, sans-serif'],
  ['Roboto Condensed','"Roboto Condensed", Arial Narrow, sans-serif'],
  ['Arimo ≈ Arial','"Arimo", Arial, sans-serif'],
  ['Carlito ≈ Calibri','"Carlito", Calibri, Arial, sans-serif'],
  ['Tinos ≈ Times New Roman','"Tinos", "Times New Roman", serif'],
  ['Cousine ≈ Courier New','"Cousine", "Courier New", monospace'],
  ['Noto Sans','"Noto Sans", Arial, sans-serif'],
  ['Noto Serif','"Noto Serif", Georgia, serif'],
  ['Segoe UI','"Segoe UI", Roboto, Arial, sans-serif'],
  ['Arial Narrow','"Arial Narrow", "Roboto Condensed", Arial, sans-serif'],
  ['Trebuchet MS','"Trebuchet MS", Arial, sans-serif'],
  ['Tahoma','Tahoma, Verdana, sans-serif'],
  ['Garamond','Garamond, "Times New Roman", serif'],
  ['Palatino','"Palatino Linotype", Palatino, Georgia, serif'],
  ['Cambria','Cambria, Georgia, serif'],
  ['Book Antiqua','"Book Antiqua", Palatino, serif'],
  ['DejaVu Sans','"DejaVu Sans", Arial, sans-serif'],
  ['DejaVu Serif','"DejaVu Serif", Georgia, serif'],
  ['Liberation Sans','"Liberation Sans", Arial, sans-serif'],
  ['Liberation Serif','"Liberation Serif", "Times New Roman", serif']
];

function addWebFonts(){
  if(document.getElementById('pdfEditorFonts'))return;
  const l=document.createElement('link');
  l.id='pdfEditorFonts';l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family=Arimo:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&family=Carlito:ital,wght@0,400;0,700;1,400;1,700&family=Cousine:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&family=Noto+Serif:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&family=Roboto:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&family=Roboto+Condensed:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700&family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap';
  document.head.appendChild(l);
}

function addFontOptions(){
  const s=$('#fontFamily');if(!s)return;
  for(const [label,value] of EXTRA_FONTS){
    if([...s.options].some(o=>o.value===value))continue;
    const o=document.createElement('option');o.value=value;o.textContent=label;s.appendChild(o);
  }
}

function addStyle(){
  if($('#proEditStyle'))return;
  const st=document.createElement('style');st.id='proEditStyle';st.textContent=`
    .proLoupe{display:none;position:fixed;left:8px;right:8px;height:92px;bottom:calc(38dvh + 10px + env(safe-area-inset-bottom));z-index:96;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 8px 28px #0004;overflow:hidden;pointer-events:none}
    .proLoupe.on{display:block}.proLoupe canvas{display:block;width:100%;height:100%}.proLoupe .cap{position:absolute;left:7px;top:5px;background:#155873;color:#fff;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:900;opacity:.92}
    .proTools{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:6px 0}.proTools button{min-height:39px!important;padding:7px 8px!important;font-size:12px!important}.proMatch{grid-column:1/-1;font-size:10px;color:var(--muted);line-height:1.2;padding:0 2px}
    @media(max-width:640px) and (orientation:portrait){
      .sheet{background:#0001!important;pointer-events:none!important}
      .sheetCard{height:38dvh!important;max-height:38dvh!important;pointer-events:auto!important;padding:8px 10px calc(10px + env(safe-area-inset-bottom))!important;border-radius:16px 16px 0 0!important}
      .sheetHead{padding:0 0 4px!important}.sheetHead b{font-size:14px}.sheetHead .muted{font-size:10px}
      #autoStyleBtn{display:none!important}
      .field{margin:4px 0!important}.field label{font-size:10px!important;margin-bottom:2px!important}
      .field input,.field select,.field textarea{min-height:36px!important;padding:6px 7px!important;font-size:13px!important}
      .field textarea{min-height:46px!important;max-height:56px!important}
      .grid{grid-template-columns:1fr 1fr!important;gap:5px!important}
      .rangeVal{font-size:10px!important}
      .sheetCard>.row{position:sticky;bottom:-8px;background:#fff;padding:6px 0 0;z-index:4}
      .sheetCard>.row button{min-height:40px!important;padding:7px 10px!important}
    }
    @media(min-width:641px){.proLoupe{display:none!important}}
  `;document.head.appendChild(st);
}

function rect(){
  const v=$('#view');if(!selected||!v)return null;
  const p=x=>parseFloat(x||0)/100;
  return {x:p(selected.style.left)*v.width,y:p(selected.style.top)*v.height,w:p(selected.style.width)*v.width,h:p(selected.style.height)*v.height};
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function emit(el,type='input'){el.dispatchEvent(new Event(type,{bubbles:true}))}
function currentText(){return ($('#newText')?.value||selected?.title||'').trim()}

function buildLoupe(){
  if(loupe)return loupe;
  loupe=document.createElement('div');loupe.className='proLoupe';loupe.innerHTML='<canvas></canvas><span class="cap">ŽIVÝ NÁHLED</span>';document.body.appendChild(loupe);return loupe;
}
function drawLoupe(){
  if(!selected||$('#sheet')?.classList.contains('hidden')){if(loupe)loupe.classList.remove('on');return}
  const r=rect(),v=$('#view'),L=buildLoupe(),cv=L.querySelector('canvas');if(!r||!v)return;
  L.classList.add('on');
  const dpr=Math.min(2,window.devicePixelRatio||1),W=Math.round(L.clientWidth*dpr),H=Math.round(L.clientHeight*dpr);if(!W||!H)return;
  cv.width=W;cv.height=H;const x=cv.getContext('2d');x.clearRect(0,0,W,H);x.fillStyle='#e9ecef';x.fillRect(0,0,W,H);
  const mx=Math.max(r.w*.9,r.h*5),my=Math.max(r.h*1.7,18),sx=clamp(r.x-mx,0,v.width),sy=clamp(r.y-my,0,v.height),sw=Math.min(v.width-sx,r.w+mx*2),sh=Math.min(v.height-sy,r.h+my*2);
  const sc=Math.min(W/sw,H/sh),ox=(W-sw*sc)/2,oy=(H-sh*sc)/2;
  x.drawImage(v,sx,sy,sw,sh,ox,oy,sw*sc,sh*sc);
  const rx=ox+(r.x-sx)*sc,ry=oy+(r.y-sy)*sc,rw=r.w*sc,rh=r.h*sc,pad=Math.max(2,r.h*.18)*sc;
  x.fillStyle=$('#bgColor')?.value||'#fff';x.fillRect(rx-pad,ry-pad,rw+2*pad,rh+2*pad);
  const text=$('#newText')?.value||'';if(text){
    const fam=$('#fontFamily').value,wt=+$('#fontWeight').value,fs=+$('#fontSize').value*sc,z=+$('#widthScale').value/100,sp=+$('#letterSpacing').value*sc,dx=+$('#dx').value*sc,dy=+$('#dy').value*sc;
    x.fillStyle=$('#color').value;x.font=`${$('#italic').value==='1'?'italic ':''}${wt} ${fs}px ${fam}`;x.textBaseline='alphabetic';
    let raw=0;for(const ch of text)raw+=x.measureText(ch).width+sp;if(text.length)raw-=sp;
    let tx=rx+dx,al=$('#align').value;if(al==='center')tx+=(rw-raw*z)/2;if(al==='right')tx+=rw-raw*z;
    x.save();x.translate(tx,ry+rh*.82+dy);x.scale(z,1);let u=0;for(const ch of text){x.fillText(ch,u,0);u+=x.measureText(ch).width+sp}x.restore();
  }
  x.strokeStyle='#00a3c7';x.lineWidth=Math.max(2,dpr);x.setLineDash([6*dpr,4*dpr]);x.strokeRect(rx-2*dpr,ry-2*dpr,rw+4*dpr,rh+4*dpr);
}

function focusSelected(){
  const range=$('#zoomRange'),wrap=$('#canvasWrap');if(!selected||!range||!wrap)return;
  range.value='230';emit(range);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const l=parseFloat(selected.style.left)/100,t=parseFloat(selected.style.top)/100,w=parseFloat(selected.style.width)/100,h=parseFloat(selected.style.height)/100;
    wrap.scrollLeft=Math.max(0,(l+w/2)*wrap.scrollWidth-wrap.clientWidth/2);
    wrap.scrollTop=Math.max(0,(t+h/2)*wrap.scrollHeight-wrap.clientHeight*.35);
  }));
}

function tuneRanges(){
  const fs=$('#fontSize'),ws=$('#widthScale'),ls=$('#letterSpacing'),dx=$('#dx'),dy=$('#dy');
  if(fs){fs.min='4';fs.max='180';fs.step='.5'}
  if(ws){ws.min='60';ws.max='140';ws.step='1'}
  if(ls){ls.min='-8';ls.max='20';ls.step='.1'}
  if(dx){dx.min='-220';dx.max='220';dx.step='.5'}
  if(dy){dy.min='-220';dy.max='220';dy.step='.5'}
}

function fontMetrics(fam,weight,italic,text){
  const c=document.createElement('canvas').getContext('2d');c.font=`${italic?'italic ':''}${weight} 100px ${fam}`;const m=c.measureText(text),h=(m.actualBoundingBoxAscent||74)+(m.actualBoundingBoxDescent||20);return {w:m.width,h};
}
async function rankFonts(){
  const r=rect(),text=currentText(),s=$('#fontFamily');if(!r||!text||!s)return [];
  try{await Promise.race([document.fonts?.ready||Promise.resolve(),new Promise(res=>setTimeout(res,900))])}catch{}
  const out=[];
  for(const o of [...s.options])for(const weight of[300,400,500,600,700])for(const italic of[false,true]){
    const m=fontMetrics(o.value,weight,italic,text);if(!m.w||!m.h)continue;
    const size=clamp(r.h/m.h*100,4,180),w=m.w*size/100,raw=r.w/Math.max(1,w),z=clamp(raw,.6,1.4);
    const outside=raw<.6?.6-raw:raw>1.4?raw-1.4:0;
    const score=Math.abs(Math.log(Math.max(.05,raw)))+outside*3+Math.abs(weight-400)/5000+(italic?.012:0);
    out.push({fam:o.value,label:o.textContent,weight,italic,size,z,score});
  }
  out.sort((a,b)=>a.score-b.score);return out.slice(0,12);
}
function applyCandidate(c){
  if(!c)return;$('#fontFamily').value=c.fam;$('#fontWeight').value=String(c.weight);$('#italic').value=c.italic?'1':'0';$('#fontSize').value=(Math.round(c.size*2)/2).toString();$('#widthScale').value=String(Math.round(c.z*100));$('#letterSpacing').value='0';
  for(const id of['fontFamily','fontWeight','italic','fontSize','widthScale','letterSpacing'])emit($('#'+id));drawLoupe();
  const lab=$('#proMatchLabel');if(lab)lab.textContent=`Návrh ${rankIndex+1}/${ranked.length}: ${c.label}, ${c.weight}${c.italic?', kurzíva':''}, ${$('#fontSize').value}px, šířka ${$('#widthScale').value}%`;
}
async function bestMatch(){ranked=await rankFonts();rankIndex=0;applyCandidate(ranked[0])}
function nextMatch(){if(!ranked.length)return bestMatch();rankIndex=(rankIndex+1)%Math.min(8,ranked.length);applyCandidate(ranked[rankIndex])}
function fitCurrent(){
  const r=rect(),text=currentText();if(!r||!text)return;
  const fam=$('#fontFamily').value,wt=+$('#fontWeight').value,it=$('#italic').value==='1',m=fontMetrics(fam,wt,it,text),size=clamp(r.h/m.h*100,4,180),width=m.w*size/100,z=clamp(r.w/Math.max(1,width),.6,1.4);
  $('#fontSize').value=(Math.round(size*2)/2).toString();$('#widthScale').value=String(Math.round(z*100));emit($('#fontSize'));emit($('#widthScale'));drawLoupe();
}

function installTools(){
  const sh=$('.sheetCard');if(!sh||$('#proTools'))return;
  const old=$('#autoStyleBtn');if(old)old.style.display='none';
  const d=document.createElement('div');d.id='proTools';d.className='proTools';d.innerHTML=`<button type="button" id="proBest" class="primary">✨ Najít nejbližší písmo</button><button type="button" id="proNext">Další návrh</button><button type="button" id="proFit">↔ Srovnat do původního</button><button type="button" id="proZoom">🔎 Zaměřit text</button><div id="proMatchLabel" class="proMatch">Vyber „nejbližší písmo“ nebo dolaď ručně. Vše vidíš živě v lupě nad panelem.</div>`;
  const head=$('.sheetHead');head?.insertAdjacentElement('afterend',d);
  $('#proBest').onclick=bestMatch;$('#proNext').onclick=nextMatch;$('#proFit').onclick=fitCurrent;$('#proZoom').onclick=focusSelected;
}

function onBox(box){selected=box;ranked=[];rankIndex=0;setTimeout(()=>{addFontOptions();tuneRanges();installTools();focusSelected();drawLoupe()},90)}
function init(){addWebFonts();addFontOptions();addStyle();tuneRanges();installTools();buildLoupe();
  document.addEventListener('click',e=>{const box=e.target.closest?.('.box');if(box)onBox(box);const id=e.target.closest?.('button')?.id;if(['applyEdit','eraseEdit','cancelEdit','closeSheet'].includes(id)){setTimeout(()=>{selected=null;drawLoupe()},40)}},true);
  document.addEventListener('input',e=>{if(watchIds.has(e.target.id))requestAnimationFrame(drawLoupe)},true);document.addEventListener('change',e=>{if(watchIds.has(e.target.id))requestAnimationFrame(drawLoupe)},true);
  new MutationObserver(()=>{addFontOptions();installTools();tuneRanges()}).observe(document.body,{subtree:true,childList:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();