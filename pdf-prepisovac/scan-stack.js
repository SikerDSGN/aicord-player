(()=>{
'use strict';
const scans=[];
let preset='document';
let brightness=100,contrast=100,saturation=100;
let normalizeA4=true;
let galleryInput,cameraInput,sheet,listEl,progressEl;

function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function filterString(){
  const base={natural:[1,1,1,0],soft:[1.04,1.1,.9,0],document:[1.08,1.22,.72,0],bw:[1.07,1.25,0,1]}[preset]||[1,1,1,0];
  return `brightness(${Math.round(base[0]*brightness)}%) contrast(${Math.round(base[1]*contrast)}%) saturate(${Math.round(base[2]*saturation)}%)${base[3]?' grayscale(100%)':''}`;
}
function revoke(item){try{URL.revokeObjectURL(item.url)}catch{}}
function addFiles(files){
  for(const file of files){if(!file.type.startsWith('image/'))continue;scans.push({file,url:URL.createObjectURL(file),rot:0});}
  renderList();openSheet();
}
function move(i,d){const j=i+d;if(j<0||j>=scans.length)return;[scans[i],scans[j]]=[scans[j],scans[i]];renderList()}
function remove(i){revoke(scans[i]);scans.splice(i,1);renderList()}
function rotate(i){scans[i].rot=(scans[i].rot+90)%360;renderList()}
function renderList(){
  if(!listEl)return;
  const f=filterString();
  listEl.innerHTML=scans.length?scans.map((s,i)=>`
    <div class="scanItem">
      <div class="scanThumb"><img src="${s.url}" alt="Strana ${i+1}" style="filter:${f};transform:rotate(${s.rot}deg)"></div>
      <div class="scanMeta"><b>Strana ${i+1}</b><span>${esc(s.file.name)}</span></div>
      <div class="scanBtns">
        <button type="button" data-a="up" data-i="${i}" ${i===0?'disabled':''}>↑</button>
        <button type="button" data-a="down" data-i="${i}" ${i===scans.length-1?'disabled':''}>↓</button>
        <button type="button" data-a="rot" data-i="${i}">↻</button>
        <button type="button" data-a="del" data-i="${i}" class="danger">×</button>
      </div>
    </div>`).join(''):'<div class="scanEmpty">Zatím tu nejsou žádné skeny. Přidej fotky z galerie nebo vyfoť další stránku.</div>';
  listEl.querySelectorAll('button[data-a]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,a=b.dataset.a;if(a==='up')move(i,-1);if(a==='down')move(i,1);if(a==='rot')rotate(i);if(a==='del')remove(i)});
  const count=document.getElementById('scanCount');if(count)count.textContent=`${scans.length} ${scans.length===1?'stránka':'stránek'}`;
}
function openSheet(){sheet.classList.remove('hidden');document.body.style.overflow='hidden'}
function closeSheet(){sheet.classList.add('hidden');document.body.style.overflow=''}
async function loadBitmap(file){
  if('createImageBitmap'in window)return await createImageBitmap(file);
  const url=URL.createObjectURL(file);try{const img=new Image();await new Promise((r,j)=>{img.onload=r;img.onerror=j;img.src=url});return img}finally{URL.revokeObjectURL(url)}
}
function sourceSize(img){return {w:img.width||img.naturalWidth,h:img.height||img.naturalHeight}}
function renderPageCanvas(img,rot){
  const {w:sw,h:sh}=sourceSize(img);
  const maxSide=2400,scale=Math.min(1,maxSide/Math.max(sw,sh));
  const w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));
  const rw=(rot===90||rot===270)?h:w,rh=(rot===90||rot===270)?w:h;
  const temp=document.createElement('canvas');temp.width=rw;temp.height=rh;
  const t=temp.getContext('2d');t.fillStyle='#fff';t.fillRect(0,0,rw,rh);t.filter=filterString();t.save();
  if(rot===90){t.translate(rw,0);t.rotate(Math.PI/2)}
  else if(rot===180){t.translate(rw,rh);t.rotate(Math.PI)}
  else if(rot===270){t.translate(0,rh);t.rotate(-Math.PI/2)}
  t.drawImage(img,0,0,w,h);t.restore();t.filter='none';
  if(!normalizeA4)return temp;
  const page=document.createElement('canvas');page.width=1240;page.height=1754;
  const p=page.getContext('2d');p.fillStyle='#fff';p.fillRect(0,0,page.width,page.height);
  const margin=28,fit=Math.min((page.width-margin*2)/temp.width,(page.height-margin*2)/temp.height);
  const dw=temp.width*fit,dh=temp.height*fit,x=(page.width-dw)/2,y=(page.height-dh)/2;
  p.drawImage(temp,x,y,dw,dh);temp.width=temp.height=1;return page;
}
async function buildPdf(){
  if(!scans.length){progressEl.textContent='Nejdřív přidej aspoň jednu stránku.';return}
  const btn=document.getElementById('scanBuild');btn.disabled=true;
  try{
    const {jsPDF}=window.jspdf;let doc=null;
    for(let i=0;i<scans.length;i++){
      progressEl.textContent=`Připravuju stránku ${i+1} / ${scans.length}…`;
      await new Promise(r=>setTimeout(r,20));
      const bm=await loadBitmap(scans[i].file);const c=renderPageCanvas(bm,scans[i].rot);if(bm.close)bm.close();
      const w=c.width,h=c.height,ori=w>h?'landscape':'portrait';
      if(!doc)doc=new jsPDF({orientation:ori,unit:'px',format:[w,h],hotfixes:['px_scaling'],compress:true});
      else doc.addPage([w,h],ori);
      doc.addImage(c.toDataURL('image/jpeg',.9),'JPEG',0,0,w,h,undefined,'FAST');c.width=c.height=1;
    }
    progressEl.textContent='Skládám vícestránkové PDF…';
    const blob=doc.output('blob');const file=new File([blob],'skeny-dokument.pdf',{type:'application/pdf'});
    const dt=new DataTransfer();dt.items.add(file);
    const base=document.getElementById('fileInput');base.files=dt.files;closeSheet();base.dispatchEvent(new Event('change',{bubbles:true}));
  }catch(e){console.error(e);progressEl.textContent='Sestavení PDF selhalo: '+(e?.message||e)}finally{btn.disabled=false}
}
function init(){
  if(document.getElementById('scanBuilder'))return;
  const style=document.createElement('style');style.textContent=`
    .scanLaunch{background:#173f56!important;color:#fff!important}.scanLaunch.secondary{background:#dceff5!important;color:#123d52!important}
    .scanSheet{position:fixed;inset:0;z-index:140;background:#0008;display:flex;align-items:flex-end;justify-content:center}.scanSheet.hidden{display:none!important}
    .scanCard{width:min(760px,100%);max-height:92dvh;overflow:auto;background:#f8fafb;border-radius:22px 22px 0 0;padding:14px 14px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px #0004}
    .scanHead{position:sticky;top:0;z-index:3;background:#f8fafb;display:flex;justify-content:space-between;align-items:center;padding-bottom:8px}.scanHead h2{font-size:19px;margin:0}.scanCount{font-size:12px;color:var(--muted)}
    .scanActions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}.scanActions button{min-height:50px}
    .scanList{display:flex;flex-direction:column;gap:8px;margin:10px 0}.scanItem{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:9px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:13px;padding:7px}.scanThumb{width:72px;height:92px;background:#d5d8da;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center}.scanThumb img{width:100%;height:100%;object-fit:contain;transition:.15s}.scanMeta{min-width:0;display:flex;flex-direction:column}.scanMeta span{font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.scanBtns{display:grid;grid-template-columns:repeat(2,40px);gap:3px}.scanBtns button{min-width:40px;min-height:38px;padding:4px}.scanEmpty{padding:28px 12px;text-align:center;color:var(--muted);background:#fff;border:1px dashed var(--line);border-radius:12px}
    .scanTune{background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;margin:10px 0}.scanTune h3{font-size:14px;margin:0 0 8px}.scanPreset{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}.scanPreset button{font-size:11px;padding:8px 4px}.scanPreset button.active{background:var(--accent);color:#fff}.scanSlider{display:grid;grid-template-columns:82px 1fr 46px;gap:7px;align-items:center;margin:7px 0;font-size:12px}.scanSlider input{width:100%;min-height:32px}.scanCheck{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;margin-top:8px}.scanCheck input{width:20px;height:20px;min-height:20px}.scanBuild{width:100%;min-height:54px;font-size:15px}.scanProgress{font-size:11px;color:var(--muted);text-align:center;min-height:18px;margin-top:6px}
    @media(max-width:640px) and (orientation:portrait){.scanCard{max-height:94dvh;border-radius:18px 18px 0 0;padding:11px 9px calc(12px + env(safe-area-inset-bottom))}.scanItem{grid-template-columns:60px minmax(0,1fr) 84px}.scanThumb{width:60px;height:78px}.scanPreset{grid-template-columns:1fr 1fr}.scanSlider{grid-template-columns:70px 1fr 42px}.scanActions{position:sticky;top:48px;z-index:2;background:#f8fafb;padding:4px 0}.scanBuild{position:sticky;bottom:0;z-index:3;box-shadow:0 -5px 16px #f8fafb}}
  `;document.head.appendChild(style);

  galleryInput=document.createElement('input');galleryInput.type='file';galleryInput.accept='image/*';galleryInput.multiple=true;galleryInput.hidden=true;galleryInput.id='scanGallery';
  cameraInput=document.createElement('input');cameraInput.type='file';cameraInput.accept='image/*';cameraInput.capture='environment';cameraInput.hidden=true;cameraInput.id='scanCamera';document.body.append(galleryInput,cameraInput);
  galleryInput.onchange=e=>{addFiles(e.target.files||[]);e.target.value=''};cameraInput.onchange=e=>{addFiles(e.target.files||[]);e.target.value=''};

  sheet=document.createElement('div');sheet.id='scanBuilder';sheet.className='scanSheet hidden';sheet.innerHTML=`<div class="scanCard">
    <div class="scanHead"><div><h2>📚 Skeny do jednoho PDF</h2><div id="scanCount" class="scanCount">0 stránek</div></div><button id="scanClose" class="ghost">✕</button></div>
    <div class="scanActions"><button id="scanGalleryBtn" class="scanLaunch">🖼 Přidat z galerie</button><button id="scanCameraBtn" class="scanLaunch secondary">📷 Vyfotit stránku</button></div>
    <div id="scanList" class="scanList"></div>
    <div class="scanTune"><h3>🎨 Stejný vzhled pro všechny stránky</h3>
      <div class="scanPreset"><button data-p="natural">Přirozený</button><button data-p="soft">Jemný</button><button data-p="document" class="active">Čistý dokument</button><button data-p="bw">Černobílý</button></div>
      <div class="scanSlider"><span>Jas</span><input id="scanBright" type="range" min="80" max="125" value="100"><b id="scanBrightV">100%</b></div>
      <div class="scanSlider"><span>Kontrast</span><input id="scanContrast" type="range" min="80" max="135" value="100"><b id="scanContrastV">100%</b></div>
      <div class="scanSlider"><span>Sytost</span><input id="scanSat" type="range" min="0" max="130" value="100"><b id="scanSatV">100%</b></div>
      <label class="scanCheck"><input id="scanA4" type="checkbox" checked> Sjednotit všechny stránky na A4 na výšku</label>
    </div>
    <button id="scanBuild" class="primary scanBuild">Vytvořit vícestránkový dokument</button><div id="scanProgress" class="scanProgress"></div>
  </div>`;document.body.appendChild(sheet);listEl=document.getElementById('scanList');progressEl=document.getElementById('scanProgress');
  document.getElementById('scanClose').onclick=closeSheet;document.getElementById('scanGalleryBtn').onclick=()=>galleryInput.click();document.getElementById('scanCameraBtn').onclick=()=>cameraInput.click();document.getElementById('scanBuild').onclick=buildPdf;
  sheet.addEventListener('click',e=>{if(e.target===sheet)closeSheet()});
  sheet.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{preset=b.dataset.p;sheet.querySelectorAll('[data-p]').forEach(x=>x.classList.toggle('active',x===b));renderList()});
  const bind=(id,setter,out)=>{const el=document.getElementById(id);el.oninput=()=>{setter(+el.value);document.getElementById(out).textContent=el.value+'%';renderList()}};
  bind('scanBright',v=>brightness=v,'scanBrightV');bind('scanContrast',v=>contrast=v,'scanContrastV');bind('scanSat',v=>saturation=v,'scanSatV');document.getElementById('scanA4').onchange=e=>normalizeA4=e.target.checked;

  const startRow=document.querySelector('#startCard .row');if(startRow){const b=document.createElement('button');b.type='button';b.className='scanLaunch';b.textContent='📚 Skeny → PDF';b.onclick=openSheet;startRow.insertBefore(b,startRow.querySelector('.tag'))}
  const pager=document.querySelector('.pager');if(pager){const b=document.createElement('button');b.type='button';b.className='ghost';b.textContent='📚';b.title='Skeny do PDF';b.onclick=openSheet;pager.appendChild(b)}
  renderList();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();