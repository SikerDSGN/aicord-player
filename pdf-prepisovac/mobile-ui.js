(()=>{
'use strict';
function initMobileUI(){
  if(document.getElementById('androidPortraitStyle'))return;
  const style=document.createElement('style');
  style.id='androidPortraitStyle';
  style.textContent=`
    :root{--touch:48px}
    body{min-height:100dvh}
    button,.btn,select,input,textarea{min-height:44px}
    button,.btn{-webkit-tap-highlight-color:transparent}
    .pager button{min-width:52px}
    @media(max-width:640px) and (orientation:portrait){
      body{padding-bottom:calc(86px + env(safe-area-inset-bottom))}
      header{padding:10px 12px;min-height:50px;display:flex;align-items:center;justify-content:space-between;gap:10px}
      header b{font-size:17px}.sub{font-size:10px;text-align:right;max-width:150px}
      .app{padding:8px;max-width:none}
      .card{border-radius:12px;padding:10px}
      #startCard .row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      #startCard .tag,#startCard .footerNote{grid-column:1/-1}
      #startCard .btn{display:flex;align-items:center;justify-content:center;text-align:center;padding:11px 8px}
      .pager{position:sticky;top:50px;z-index:16;background:rgba(246,243,237,.96);backdrop-filter:blur(10px);margin:4px 0 6px;padding:5px 2px;border-radius:10px}
      .pager b{font-size:14px}
      .toolbar{position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:80;display:grid;grid-template-columns:1.35fr repeat(4,1fr);gap:5px;margin:0;padding:6px;background:rgba(255,255,255,.96);border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 30px #0003;backdrop-filter:blur(12px)}
      .toolbar button{min-width:0;padding:8px 4px;min-height:54px;font-size:0;border-radius:11px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
      .toolbar button::first-letter{font-size:21px}
      .toolbar button:after{font-size:9px;line-height:1.05;font-weight:800}
      #ocrBtn:after{content:'OCR'}
      #beforeBtn:after{content:'Před/Po'}
      #undoBtn:after{content:'Zpět'}
      #redoBtn:after{content:'Znovu'}
      #exportBtn:after{content:'PDF'}
      .toolbar>label{display:none!important}
      #status{font-size:12px;line-height:1.3;margin:6px 0;padding:8px 10px}
      .canvasWrap{border-radius:10px!important;background:#8d9397!important}
      .muted{font-size:11px}
      .sheetCard{border-radius:18px 18px 0 0!important;padding:12px 12px calc(14px + env(safe-area-inset-bottom))!important}
      .sheetHead{position:sticky;top:0;background:#fff;z-index:2;padding:2px 0 8px}
      .field{margin:7px 0}
      .field input,.field select,.field textarea{padding:9px}
      .field textarea{min-height:64px}
      .grid{gap:7px}
      .row button{min-height:46px}
      .zoomBar{top:101px!important;margin:5px 0!important;border-radius:11px!important}
    }
    @media(max-width:380px) and (orientation:portrait){
      .toolbar{left:4px;right:4px;bottom:calc(4px + env(safe-area-inset-bottom));gap:3px;padding:4px}
      .toolbar button{min-height:50px}
      #startCard .row{grid-template-columns:1fr}
      #startCard .tag,#startCard .footerNote{grid-column:auto}
    }
  `;
  document.head.appendChild(style);

  const header=document.querySelector('header');
  if(header){
    const sub=header.querySelector('.sub');
    if(sub)sub.textContent='Android • OCR • vícestránkové PDF';
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMobileUI);else initMobileUI();
})();