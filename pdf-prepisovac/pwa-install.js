(()=>{
'use strict';
let installPrompt=null;
function addHead(){
  if(!document.querySelector('link[rel="manifest"]')){const l=document.createElement('link');l.rel='manifest';l.href='./manifest.webmanifest';document.head.appendChild(l)}
  if(!document.querySelector('meta[name="theme-color"]')){const m=document.createElement('meta');m.name='theme-color';m.content='#155873';document.head.appendChild(m)}
  for(const [name,content] of [['mobile-web-app-capable','yes'],['apple-mobile-web-app-capable','yes'],['apple-mobile-web-app-status-bar-style','black-translucent']]){if(!document.querySelector(`meta[name="${name}"]`)){const m=document.createElement('meta');m.name=name;m.content=content;document.head.appendChild(m)}}
}
function standalone(){return window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true}
function toast(text){
  let t=document.getElementById('pwaToast');if(!t){t=document.createElement('div');t.id='pwaToast';t.style.cssText='position:fixed;left:12px;right:12px;bottom:100px;z-index:300;background:#17202a;color:#fff;padding:12px 14px;border-radius:14px;font:600 13px system-ui;box-shadow:0 8px 28px #0005';document.body.appendChild(t)}
  t.textContent=text;t.hidden=false;clearTimeout(t._tm);t._tm=setTimeout(()=>t.hidden=true,5000);
}
function addButton(){
  if(standalone()||document.getElementById('installPwaBtn'))return;
  const row=document.querySelector('#startCard .row');if(!row)return;
  const b=document.createElement('button');b.id='installPwaBtn';b.type='button';b.className='btn ghost';b.textContent='📲 Nainstalovat aplikaci';
  b.onclick=async()=>{
    if(installPrompt){installPrompt.prompt();try{await installPrompt.userChoice}catch{}installPrompt=null;if(standalone())b.remove();return}
    toast('V Chrome otevři menu ⋮ a zvol „Nainstalovat aplikaci“ nebo „Přidat na plochu“.');
  };
  row.appendChild(b);
}
async function registerSW(){if('serviceWorker'in navigator){try{await navigator.serviceWorker.register('./sw.js',{scope:'./'})}catch(e){console.warn('SW registration failed',e)}}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;addButton()});
window.addEventListener('appinstalled',()=>{installPrompt=null;document.getElementById('installPwaBtn')?.remove();toast('PDF Přepisovač je nainstalovaný. ✅')});
function init(){addHead();addButton();registerSW()}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();