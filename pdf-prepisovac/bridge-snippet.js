// Injected inside the core editor IIFE by app.html. Has access to S/render/imageToCanvas.
(()=>{
  const clone=v=>{try{return typeof structuredClone==='function'?structuredClone(v):JSON.parse(JSON.stringify(v))}catch{return JSON.parse(JSON.stringify(v))}};
  const canvasBlob=(c,type='image/jpeg',quality=.93)=>new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Canvas export failed')),type,quality));
  const makeThumb=async()=>{
    if(!S.pages.length)return null;
    const src=S.pages[0].base,maxW=320,scale=Math.min(1,maxW/src.width),w=Math.max(1,Math.round(src.width*scale)),h=Math.max(1,Math.round(src.height*scale));
    const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(src,0,0,w,h);return canvasBlob(c,'image/jpeg',.72);
  };
  window.PDFPBridge={
    version:1,
    hasDocument:()=>S.pages.length>0,
    summary:()=>({pages:S.pages.length,page:S.page,after:S.after,ocrPages:S.pages.filter(p=>p.ocrDone).length,edits:S.pages.reduce((n,p)=>n+(p.edits?.length||0),0)}),
    async exportState(opts={}){
      const withImages=opts.withImages!==false;
      const pages=[];
      for(const p of S.pages){
        pages.push({
          baseBlob:withImages?await canvasBlob(p.base):undefined,
          words:clone(p.words||[]),ocrDone:!!p.ocrDone,edits:clone(p.edits||[]),undo:clone(p.undo||[]),redo:clone(p.redo||[])
        });
      }
      return {version:1,page:S.page,after:S.after,pages,thumbBlob:opts.withThumbnail?await makeThumb():undefined};
    },
    async importState(state){
      if(!state?.pages?.length)throw new Error('Projekt neobsahuje stránky.');
      const pages=[];
      for(const p of state.pages){
        if(!p.baseBlob)throw new Error('Projekt nemá uložený obraz stránky.');
        const base=await imageToCanvas(p.baseBlob);
        pages.push({base,words:clone(p.words||[]),ocrDone:!!p.ocrDone,edits:clone(p.edits||[]),undo:clone(p.undo||[]),redo:clone(p.redo||[])});
      }
      S.pages=pages;S.page=Math.max(0,Math.min(pages.length-1,Number(state.page)||0));S.after=state.after!==false;
      $('#editor').classList.remove('hidden');render();setStatus(`Projekt obnoven. ${pages.length} ${pages.length===1?'stránka':'stránek'}, ${pages.reduce((n,p)=>n+p.edits.length,0)} úprav.`);
      window.dispatchEvent(new CustomEvent('pdfp:project-restored'));
    },
    async thumbnail(){return makeThumb()}
  };
})();