(()=>{
'use strict';

function initZoom(){
  const wrap=document.getElementById('canvasWrap');
  const view=document.getElementById('view');
  const overlay=document.getElementById('overlay');
  if(!wrap||!view||!overlay)return;
  if(document.getElementById('pdfZoomBar'))return;

  const style=document.createElement('style');
  style.textContent=`
    .canvasWrap{overflow:auto!important;max-height:72vh;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;position:relative!important}
    .canvasStage{position:relative;width:100%;min-width:100%;transform-origin:0 0}
    .canvasStage canvas{display:block;width:100%!important;height:auto!important}
    .canvasStage .overlay{position:absolute;inset:0}
    .zoomBar{display:grid;grid-template-columns:auto minmax(100px,1fr) auto auto;gap:7px;align-items:center;margin:9px 0;padding:8px;background:#fff;border:1px solid var(--line);border-radius:13px;position:sticky;top:58px;z-index:18;box-shadow:0 4px 14px #0001}
    .zoomBar button{padding:9px 12px;min-width:44px}
    .zoomBar input[type=range]{width:100%;accent-color:var(--accent)}
    .zoomPct{font-size:12px;font-weight:900;color:#155873;min-width:48px;text-align:center}
    @media(max-width:600px){
      .canvasWrap{max-height:68vh}
      .sheet{background:#0003!important;align-items:flex-end!important;pointer-events:none}
      .sheetCard{max-height:52vh!important;pointer-events:auto;box-shadow:0 -8px 30px #0003}
      .zoomBar{top:55px;grid-template-columns:auto minmax(70px,1fr) auto auto;padding:6px}
      .zoomBar button{padding:8px 10px}
    }
  `;
  document.head.appendChild(style);

  const stage=document.createElement('div');
  stage.className='canvasStage';
  wrap.insertBefore(stage,view);
  stage.appendChild(view);
  stage.appendChild(overlay);

  const bar=document.createElement('div');
  bar.id='pdfZoomBar';
  bar.className='zoomBar';
  bar.innerHTML=`
    <button type="button" id="zoomMinus" title="Oddálit">−</button>
    <input id="zoomRange" type="range" min="50" max="400" step="10" value="100" aria-label="Přiblížení dokumentu">
    <button type="button" id="zoomPlus" title="Přiblížit">＋</button>
    <button type="button" id="zoomReset" class="ghost"><span id="zoomPct">100 %</span></button>
  `;
  wrap.parentNode.insertBefore(bar,wrap);

  const range=document.getElementById('zoomRange');
  const pct=document.getElementById('zoomPct');
  let zoom=1;

  function setZoom(next,keepCenter=true){
    const old=zoom;
    zoom=Math.max(.5,Math.min(4,next));
    const oldW=wrap.scrollWidth||1,oldH=wrap.scrollHeight||1;
    const centerX=wrap.scrollLeft+wrap.clientWidth/2;
    const centerY=wrap.scrollTop+wrap.clientHeight/2;
    range.value=String(Math.round(zoom*100));
    pct.textContent=Math.round(zoom*100)+' %';
    stage.style.width=(zoom*100)+'%';
    if(keepCenter){
      requestAnimationFrame(()=>{
        const rx=oldW?centerX/oldW:.5, ry=oldH?centerY/oldH:.5;
        wrap.scrollLeft=Math.max(0,wrap.scrollWidth*rx-wrap.clientWidth/2);
        wrap.scrollTop=Math.max(0,wrap.scrollHeight*ry-wrap.clientHeight/2);
      });
    }
  }

  range.addEventListener('input',()=>setZoom(Number(range.value)/100));
  document.getElementById('zoomMinus').onclick=()=>setZoom(zoom-.25);
  document.getElementById('zoomPlus').onclick=()=>setZoom(zoom+.25);
  document.getElementById('zoomReset').onclick=()=>setZoom(1,false);

  let pinchStart=0,pinchZoom=1;
  const distance=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  stage.addEventListener('touchstart',e=>{
    if(e.touches.length===2){pinchStart=distance(e.touches);pinchZoom=zoom;}
  },{passive:true});
  stage.addEventListener('touchmove',e=>{
    if(e.touches.length===2&&pinchStart>0){
      e.preventDefault();
      setZoom(pinchZoom*(distance(e.touches)/pinchStart));
    }
  },{passive:false});
  stage.addEventListener('touchend',e=>{if(e.touches.length<2)pinchStart=0},{passive:true});

  let lastTap=0;
  stage.addEventListener('touchend',e=>{
    if(e.changedTouches.length!==1)return;
    const now=Date.now();
    if(now-lastTap<320){setZoom(zoom<1.75?2:1);lastTap=0}else lastTap=now;
  },{passive:true});

  setZoom(1,false);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(initZoom,0));
else setTimeout(initZoom,0);
})();
