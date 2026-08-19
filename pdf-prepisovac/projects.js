(()=>{
'use strict';
const DB='pdf-prepisovac-projects',VER=1,STORE='projects';
const $=s=>document.querySelector(s);
let dbP=null,currentId=null,currentName='',sourceName='',busy=false,dirty=false,saveTimer=null,loadToken=0,thumbUrls=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function openDB(){if(dbP)return dbP;dbP=new Promise((res,rej)=>{const r=indexedDB.open(DB,VER);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE)){const s=db.createObjectStore(STORE,{keyPath:'id'});s.createIndex('updatedAt','updatedAt')}};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});return dbP}
async function all(){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>res((r.result||[]).sort((a,b)=>b.updatedAt-a.updatedAt));r.onerror=()=>rej(r.error)})}
async function get(id){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function put(rec){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction(STORE,'readwrite');t.objectStore(STORE).put(rec);t.oncomplete=()=>res(rec);t.onerror=()=>rej(t.error)})}
async function remove(id){const db=await openDB();return new Promise((res,rej)=>{const t=db.transaction(STORE,'readwrite');t.objectStore(STORE).delete(id);t.oncomplete=res;t.onerror=()=>rej(t.error)})}
function fmtDate(t){try{return new Intl.DateTimeFormat('cs',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(t))}catch{return''}}
function baseName(n='Dokument'){return n.replace(/\.[^.]+$/,'').trim()||'Dokument'}
function chip(text,kind='ok'){const c=$('#projectChip');if(!c)return;c.textContent=text;c.dataset.kind=kind;c.classList.remove('saving','warn');if(kind==='saving')c.classList.add('saving');if(kind==='warn')c.classList.add('warn')}
function summaryText(rec){const p=rec.state?.pages||[];const edits=p.reduce((n,x)=>n+(x.edits?.length||0),0),ocr=p.filter(x=>x.ocrDone).length;return `${p.length} ${p.length===1?'stránka':'stránek'} • OCR ${ocr}/${p.length} • ${edits} úprav`}
async function saveCurrent(full=false,force=false){
  if(!currentId||busy||!window.PDFPBridge?.hasDocument())return;
  if(!force&&!dirty&&!full)return;
  busy=true;chip('💾 Ukládám…','saving');
  try{
    let old=await get(currentId);if(!old)full=true;
    const sum=window.PDFPBridge.summary();if(!old?.state?.pages||old.state.pages.length!==sum.pages)full=true;
    const exp=await window.PDFPBridge.exportState({withImages:full,withThumbnail:full});
    if(!full&&old?.state?.pages){exp.pages=exp.pages.map((p,i)=>({...p,baseBlob:old.state.pages[i]?.baseBlob}));}
    const thumb=exp.thumbBlob||old?.thumbBlob||null;delete exp.thumbBlob;
    const now=Date.now(),rec={id:currentId,name:currentName||old?.name||'Dokument',sourceName:sourceName||old?.sourceName||'',createdAt:old?.createdAt||now,updatedAt:now,state:exp,thumbBlob:thumb};
    await put(rec);dirty=false;chip(`✅ Uloženo ${new Date(now).toLocaleTimeString('cs',{hour:'2-digit',minute:'2-digit'})}`);await refreshButtons();
  }catch(e){console.error(e);chip('⚠️ Autosave selhal','warn')}
  finally{busy=false}
}
function scheduleSave(ms=550){dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(()=>saveCurrent(false),ms)}
async function createFromCurrent(name){
  if(!window.PDFPBridge?.hasDocument())return;
  currentId=crypto.randomUUID();currentName=baseName(name);sourceName=name||'';dirty=true;await saveCurrent(true,true);renderResume();
}
async function waitForLoaded(name,token){
  for(let i=0;i<160;i++){
    if(token!==loadToken)return;
    const st=$('#status')?.textContent||'';
    if(window.PDFPBridge?.hasDocument()&&st.includes('Dokument připraven')){await createFromCurrent(name);return}
    await delay(100);
  }
  chip('⚠️ Projekt se nepodařilo automaticky založit','warn');
}
async function openProject(id){
  const rec=await get(id);if(!rec)return;
  busy=true;chip('📂 Otevírám projekt…','saving');
  try{currentId=rec.id;currentName=rec.name;sourceName=rec.sourceName||'';await window.PDFPBridge.importState(rec.state);rec.updatedAt=Date.now();await put(rec);dirty=false;chip(`✅ ${rec.name}`);closeSheet();await refreshButtons();renderResume()}
  catch(e){console.error(e);chip('⚠️ Projekt nešel otevřít','warn');alert('Projekt nešel otevřít: '+(e?.message||e))}
  finally{busy=false}
}
async function renameProject(id){const rec=await get(id);if(!rec)return;const n=prompt('Nový název projektu:',rec.name);if(!n?.trim())return;rec.name=n.trim();rec.updatedAt=Date.now();await put(rec);if(id===currentId){currentName=rec.name;chip(`✅ ${rec.name}`)}renderSheet();renderResume()}
async function duplicateProject(id){const rec=await get(id);if(!rec)return;const copy=typeof structuredClone==='function'?structuredClone(rec):rec;copy.id=crypto.randomUUID();copy.name=rec.name+' – kopie';copy.createdAt=copy.updatedAt=Date.now();await put(copy);renderSheet();renderResume();refreshButtons()}
async function deleteProject(id){const rec=await get(id);if(!rec||!confirm(`Smazat projekt „${rec.name}“?`))return;await remove(id);if(id===currentId){currentId=null;currentName='';chip('Neuložený dokument','warn')}renderSheet();renderResume();refreshButtons()}
function revokeThumbs(){for(const u of thumbUrls)URL.revokeObjectURL(u);thumbUrls=[]}
async function renderSheet(){
  buildSheet();revokeThumbs();const list=$('#projList'),items=await all();$('#projCount').textContent=String(items.length);
  if(!items.length){list.innerHTML='<div class="projEmpty">Zatím tu není žádný rozpracovaný projekt. Nahraj dokument a první projekt se založí automaticky.</div>';return}
  list.innerHTML='';
  for(const rec of items){
    const row=document.createElement('div');row.className='projItem'+(rec.id===currentId?' current':'');
    let thumb='';if(rec.thumbBlob){const u=URL.createObjectURL(rec.thumbBlob);thumbUrls.push(u);thumb=`<img src="${u}" alt="">`}else thumb='<span>📄</span>';
    row.innerHTML=`<div class="projThumb">${thumb}</div><div class="projBody"><div class="projName"></div><div class="projMeta">${summaryText(rec)}</div><div class="projMeta">${fmtDate(rec.updatedAt)}${rec.id===currentId?' • právě otevřený':''}</div></div><div class="projActs"><button class="primary pOpen">Otevřít</button><button class="pRename">Přejmenovat</button><button class="pDup">Duplikovat</button><button class="danger pDel">Smazat</button></div>`;
    row.querySelector('.projName').textContent=rec.name;row.querySelector('.pOpen').onclick=()=>openProject(rec.id);row.querySelector('.pRename').onclick=()=>renameProject(rec.id);row.querySelector('.pDup').onclick=()=>duplicateProject(rec.id);row.querySelector('.pDel').onclick=()=>deleteProject(rec.id);list.appendChild(row);
  }
}
function openSheet(){buildSheet();$('#projectSheet').classList.remove('hidden');document.body.style.overflow='hidden';renderSheet()}
function closeSheet(){$('#projectSheet')?.classList.add('hidden');document.body.style.overflow='';revokeThumbs()}
function addStyle(){if($('#projectStyle'))return;const st=document.createElement('style');st.id='projectStyle';st.textContent=`
  .projectSheet{position:fixed;inset:0;z-index:280;background:#0008;display:flex;align-items:flex-end;justify-content:center}.projectSheet.hidden{display:none!important}.projectCard{width:min(780px,100%);max-height:88dvh;overflow:auto;background:#f8fafb;border-radius:22px 22px 0 0;padding:12px 12px calc(15px + env(safe-area-inset-bottom));box-shadow:0 -12px 45px #0004}.projectHead{position:sticky;top:-12px;background:#f8fafb;z-index:3;display:flex;justify-content:space-between;align-items:center;padding:10px 0}.projectHead h2{font-size:18px;margin:0}.projCount{font-size:10px;background:#155873;color:#fff;padding:3px 7px;border-radius:999px}.projList{display:grid;gap:8px}.projItem{display:grid;grid-template-columns:68px minmax(0,1fr) auto;gap:9px;align-items:center;background:#fff;border:1px solid var(--line);border-radius:14px;padding:8px}.projItem.current{outline:2px solid #0b789555}.projThumb{width:68px;height:88px;border-radius:8px;background:#e6eaec;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:28px}.projThumb img{width:100%;height:100%;object-fit:cover}.projBody{min-width:0}.projName{font-size:13px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.projMeta{font-size:10px;color:var(--muted);margin-top:3px}.projActs{display:grid;grid-template-columns:1fr 1fr;gap:4px}.projActs button{min-height:37px!important;padding:6px 8px!important;font-size:10px!important}.projEmpty{text-align:center;padding:32px 12px;color:var(--muted);background:#fff;border:1px dashed var(--line);border-radius:13px}.projectTools{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:9px}.projectTools button{flex:1;min-width:130px}.projectChip{font-size:10px;font-weight:800;padding:5px 8px;border-radius:999px;background:#e8f6ef;color:#18683a;margin:5px 0 7px;display:inline-block}.projectChip.saving{background:#edf7fa;color:#155873}.projectChip.warn{background:#fff1ed;color:#9f2d1d}.resumeProject{display:flex;align-items:center;justify-content:center;width:100%;margin-top:8px;background:#e7f4f8!important;color:#124f64!important}
  @media(max-width:640px){.projectCard{max-height:88dvh;border-radius:18px 18px 0 0;padding:9px}.projItem{grid-template-columns:58px minmax(0,1fr)}.projThumb{width:58px;height:76px}.projActs{grid-column:1/-1;grid-template-columns:1fr 1fr 1fr 1fr}.projActs button{font-size:9px!important;padding:5px 3px!important}.projectTools{position:sticky;top:44px;z-index:2;background:#f8fafb;padding:4px 0}.projectTools button{min-width:0;font-size:11px}}
`;document.head.appendChild(st)}
function buildSheet(){if($('#projectSheet'))return;addStyle();const d=document.createElement('div');d.id='projectSheet';d.className='projectSheet hidden';d.innerHTML=`<div class="projectCard"><div class="projectHead"><div><h2>📂 Rozpracované projekty <span id="projCount" class="projCount">0</span></h2></div><button id="projClose" class="ghost">✕</button></div><div class="projectTools"><button id="projSaveNow" class="primary">💾 Uložit teď</button><button id="projSnapshot">📸 Kopie aktuálního</button></div><div id="projList" class="projList"></div></div>`;document.body.appendChild(d);$('#projClose').onclick=closeSheet;d.addEventListener('click',e=>{if(e.target===d)closeSheet()});$('#projSaveNow').onclick=()=>saveCurrent(false,true);$('#projSnapshot').onclick=async()=>{if(!currentId)return alert('Nejdřív otevři nebo vytvoř projekt.');await saveCurrent(false,true);await duplicateProject(currentId)}}
async function refreshButtons(){const items=await all().catch(()=>[]);const c=$('#projectsBtn .projCountMini');if(c)c.textContent=String(items.length);const pager=$('#projectsPager');if(pager)pager.title=`Projekty (${items.length})`}
async function renderResume(){
  const host=$('#startCard');if(!host)return;let b=$('#resumeProject');const items=await all().catch(()=>[]);const last=items[0];
  if(!last){b?.remove();return}if(!b){b=document.createElement('button');b.id='resumeProject';b.className='resumeProject';host.appendChild(b)}b.textContent=`▶ Pokračovat: ${last.name}`;b.onclick=()=>openProject(last.id)
}
function addUI(){
  buildSheet();let chipEl=$('#projectChip');if(!chipEl){chipEl=document.createElement('div');chipEl.id='projectChip';chipEl.className='projectChip warn';chipEl.textContent='Neuložený dokument';$('#status')?.insertAdjacentElement('afterend',chipEl)}
  const row=$('#startCard .row');if(row&&!$('#projectsBtn')){const b=document.createElement('button');b.id='projectsBtn';b.type='button';b.className='btn ghost';b.innerHTML='📂 Projekty <span class="projCountMini">0</span>';b.onclick=openSheet;row.appendChild(b)}
  const pager=$('.pager');if(pager&&!$('#projectsPager')){const b=document.createElement('button');b.id='projectsPager';b.type='button';b.className='ghost';b.textContent='📂';b.onclick=openSheet;pager.appendChild(b)}
  refreshButtons();renderResume()
}
function observe(){
  const input=$('#fileInput');if(input)input.addEventListener('change',e=>{const f=e.target.files?.[0];if(!f||busy)return;const token=++loadToken;currentId=null;currentName='';sourceName=f.name;dirty=false;chip('Nový projekt…','saving');waitForLoaded(f.name,token)},false);
  document.addEventListener('click',e=>{const id=e.target.closest?.('button')?.id;if(['applyEdit','eraseEdit','undoBtn','redoBtn','beforeBtn','prevPage','nextPage'].includes(id))scheduleSave(id==='prevPage'||id==='nextPage'?250:500)},false);
  const st=$('#status');if(st)new MutationObserver(()=>{const t=st.textContent||'';if(t.startsWith('OCR hotovo'))scheduleSave(450)}).observe(st,{childList:true,subtree:true,characterData:true});
  setInterval(()=>{if(currentId&&dirty)saveCurrent(false)},15000);
}
async function init(){
  for(let i=0;i<80&&!window.PDFPBridge;i++)await delay(50);if(!window.PDFPBridge){console.warn('Project bridge unavailable');return}
  try{await navigator.storage?.persist?.()}catch{}
  addUI();observe();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();