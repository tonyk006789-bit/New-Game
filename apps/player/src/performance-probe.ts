import posters from './poster-assets.json';
/** Local development measurement only; never imported by the release build. */
export function installPerformanceProbe(){
 const panel=document.createElement('aside');panel.id='performance-probe';panel.setAttribute('aria-label','Development performance probe');
 panel.style.cssText='position:fixed;bottom:8px;left:8px;z-index:99999;max-width:360px;max-height:40vh;overflow:auto;padding:10px;background:#fff;color:#111;border:1px solid #888;font:12px monospace';
 const button=document.createElement('button'),output=document.createElement('output');button.textContent='Measure 12 seconds';output.textContent='Ready';output.style.cssText='display:block;white-space:pre-wrap';panel.append(button,output);document.body.append(panel);
 const images=document.createElement('button');images.textContent='Audit image loading';panel.prepend(images);
 const hide=document.createElement('button');hide.textContent='Hide probe';hide.onclick=()=>panel.hidden=true;panel.prepend(hide);
 images.onclick=()=>{
  const covers=Array.from(document.querySelectorAll<HTMLImageElement>('.poster-thumbnail'));
  const resources=performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const posterResources=resources.filter(r=>r.name.includes('/art/delivery/')&&covers.some(i=>i.currentSrc===r.name));
  const variants=Object.values(posters).flatMap(p=>p.variants);
  output.textContent=JSON.stringify({covers:covers.map(i=>({file:i.currentSrc.split('/').at(-1),complete:i.complete&&i.naturalWidth>0,cssWidth:Math.round(i.getBoundingClientRect().width),naturalWidth:i.naturalWidth})),selectedAssetBytes:covers.reduce((sum,i)=>sum+(variants.find(v=>i.currentSrc.endsWith(v.url))?.bytes||0),0),coverBytes:posterResources.reduce((s,r)=>s+r.encodedBodySize,0),coverTransferBytes:posterResources.reduce((s,r)=>s+r.transferSize,0),identityStripRequests:resources.filter(r=>r.name.includes('/art/identity-v47/')).length},null,2);
 };
 button.onclick=()=>{
  const frames:number[]=[],tasks:number[]=[],events:number[]=[];let last=0,frame=0;const start=performance.now();button.disabled=true;output.textContent='Measuring…';
  const observer=new PerformanceObserver(list=>{for(const entry of list.getEntries()){if(entry.startTime<start)continue;(entry.entryType==='longtask'?tasks:events).push(entry.duration);}});
  for(const type of ['longtask','event'])try{observer.observe({type,buffered:false,durationThreshold:16} as PerformanceObserverInit);}catch{/* Unsupported metric omitted. */}
  function tick(now:number){if(last)frames.push(now-last);last=now;if(now-start<12000){frame=requestAnimationFrame(tick);return;}observer.disconnect();cancelAnimationFrame(frame);const sorted=[...frames].sort((a,b)=>a-b);output.textContent=JSON.stringify({frames:frames.length,p95ms:+(sorted[Math.floor(sorted.length*.95)]||0).toFixed(1),maxFrameMs:+Math.max(0,...frames).toFixed(1),over34ms:frames.filter(n=>n>34).length,longTasks:tasks.length,longTaskMs:+tasks.reduce((a,b)=>a+b,0).toFixed(1),maxEventMs:Math.max(0,...events)},null,2);button.disabled=false;}
  frame=requestAnimationFrame(tick);
 };
}
