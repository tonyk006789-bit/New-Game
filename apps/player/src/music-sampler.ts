import type {Instrument,ScoreEvent} from './music-score';
export const instrumentRoots:Record<Instrument,number>={piano:60,electric:60,organ:60,guitar:60,muteguitar:60,sax:60,trumpet:60,strings:60,choir:60,flute:60,koto:60,sitar:60,marimba:60,steelpan:60,celeste:60,bell:60,accordion:60,synth:60,arp:60,bass:36,upright:36,sub:36,kick:36,snare:60,rim:60,clap:60,hat:60,ride:60,shaker:60,conga:60,taiko:60,tambourine:60};
export type MusicBank=Partial<Record<Instrument,AudioBuffer>>;
const pending=new WeakMap<AudioContext,Map<Instrument,Promise<AudioBuffer>>>();
export async function loadMusicBank(context:AudioContext,instruments:Instrument[],bank:MusicBank={}){
 let requests=pending.get(context);if(!requests){requests=new Map();pending.set(context,requests);}
 await Promise.all(instruments.map(async id=>{
  if(bank[id])return;
  let request=requests.get(id);
  if(!request){request=(async()=>{const response=await fetch(`/audio/v47/${id}.wav`);if(!response.ok)throw new Error('Music instrument unavailable');return context.decodeAudioData(await response.arrayBuffer());})();requests.set(id,request);}
  try{bank[id]=await request;}finally{requests.delete(id);}
 }));return bank;
}
export function sampledNote(context:AudioContext,bank:MusicBank,event:ScoreEvent,start:number,output:GainNode,echo:AudioNode,nodes:Set<AudioScheduledSourceNode>){
 if(!bank[event.kind]||nodes.size>=80)return;
 const source=context.createBufferSource(),envelope=context.createGain(),pan=context.createStereoPanner();
 source.buffer=bank[event.kind]!;source.playbackRate.value=2**((event.note-instrumentRoots[event.kind])/12);pan.pan.value=event.pan;
 const drum=['kick','snare','rim','clap','hat','ride','shaker','conga','taiko','tambourine'].includes(event.kind);
 const release=drum?.025:event.kind==='strings'?.32:.12,end=start+event.duration+release;
 envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(event.level,start+(drum?.001:.008));
 envelope.gain.setValueAtTime(event.level,start+event.duration);envelope.gain.exponentialRampToValueAtTime(.0001,end);
 source.connect(envelope);envelope.connect(pan);pan.connect(output);if(!drum&&!['bass','upright','sub'].includes(event.kind))pan.connect(echo);
 source.start(start);source.stop(end+.01);nodes.add(source);
 source.onended=()=>{nodes.delete(source);source.disconnect();envelope.disconnect();pan.disconnect();};
}
