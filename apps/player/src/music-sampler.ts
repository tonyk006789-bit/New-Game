import type {Instrument,ScoreEvent} from './music-score';
export const instrumentRoots:Record<Instrument,number>={keys:60,brass:60,pluck:60,strings:60,bass:36,mallet:72,kick:36,snare:60,clap:60,hat:60,openhat:60,shaker:60,conga:60,crash:60};
export async function loadMusicBank(context:AudioContext){
 const bank={} as Record<Instrument,AudioBuffer>;
 await Promise.all((Object.keys(instrumentRoots) as Instrument[]).map(async id=>{
  const response=await fetch(`/audio/v23/${id}.wav`);if(!response.ok)throw new Error('Music instrument unavailable');
  bank[id]=await context.decodeAudioData(await response.arrayBuffer());
 }));return bank;
}
export function sampledNote(context:AudioContext,bank:Record<Instrument,AudioBuffer>,event:ScoreEvent,start:number,output:GainNode,echo:AudioNode,nodes:Set<AudioScheduledSourceNode>){
 const source=context.createBufferSource(),envelope=context.createGain(),pan=context.createStereoPanner();
 source.buffer=bank[event.kind];source.playbackRate.value=2**((event.note-instrumentRoots[event.kind])/12);pan.pan.value=event.pan;
 const drum=['kick','snare','clap','hat','openhat','shaker','conga','crash'].includes(event.kind);
 const release=drum?.025:event.kind==='strings'?.45:.15,end=start+event.duration+release;
 envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(event.level,start+(drum?.001:.008));
 envelope.gain.setValueAtTime(event.level,start+event.duration);envelope.gain.exponentialRampToValueAtTime(.0001,end);
 source.connect(envelope);envelope.connect(pan);pan.connect(output);if(!drum&&event.kind!=='bass')pan.connect(echo);
 source.start(start);source.stop(end+.01);nodes.add(source);
 source.onended=()=>{nodes.delete(source);source.disconnect();envelope.disconnect();pan.disconnect();};
}
