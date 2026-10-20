import {describe,it,expect,vi} from 'vitest';
import {loadMusicBank} from '../../apps/player/src/music-sampler';
describe('on-demand original instruments',()=>{
 it('loads only needed samples, shares concurrent work, reuses decoded buffers, and retries failures',async()=>{
  const context={decodeAudioData:vi.fn(async()=>({duration:3}))} as unknown as AudioContext;
  const fetcher=vi.fn(async(url:string)=>({ok:url.length>0,arrayBuffer:async()=>new ArrayBuffer(16)}));vi.stubGlobal('fetch',fetcher);
  try{
   const bank={};await Promise.all([loadMusicBank(context,['piano','kick'],bank),loadMusicBank(context,['piano'],bank)]);
   expect(fetcher).toHaveBeenCalledTimes(2);expect(fetcher.mock.calls.map(c=>c[0])).toEqual(['/audio/v47/piano.wav','/audio/v47/kick.wav']);
   await loadMusicBank(context,['piano','kick'],bank);expect(fetcher).toHaveBeenCalledTimes(2);
   fetcher.mockRejectedValueOnce(Error('offline'));await expect(loadMusicBank(context,['sax'],bank)).rejects.toThrow('offline');
   await loadMusicBank(context,['sax'],bank);expect(bank).toHaveProperty('sax');
  }finally{vi.unstubAllGlobals();}
 });
});
