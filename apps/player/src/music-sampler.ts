import type {Instrument,ScoreEvent} from './music-score';
export const instrumentRoots:Record<Instrument,number>={piano:60,electric:60,organ:60,guitar:60,muteguitar:60,sax:60,trumpet:60,strings:60,choir:60,flute:60,koto:60,sitar:60,marimba:60,steelpan:60,celeste:60,bell:60,accordion:60,synth:60,arp:60,bass:36,upright:36,sub:36,kick:36,snare:60,rim:60,clap:60,hat:60,ride:60,shaker:60,conga:60,taiko:60,tambourine:60};
export async function loadMusicBank(context:AudioContext){
 const bank={} as Record<Instrument,AudioBuffer>;
 await Promise.all((Object.keys(instrumentRoots) as Instrument[]).map(async id=>{
  const response=await fetch(`/audio/v29/${id}.wav`);if(!response.ok)throw new Error('Music instrument unavailable');
  bank[id]=await context.decodeAudioData(await response.arrayBuffer());
 }));return bank;
}
export function sampledNote(context:AudioContext,bank:Record<Instrument,AudioBuffer>,event:ScoreEvent,start:number,output:GainNode,echo:AudioNode,nodes:Set<AudioScheduledSourceNode>){
 const source=context.createBufferSource(),envelope=context.createGain(),pan=context.createStereoPanner();
 source.buffer=bank[event.kind];source.playbackRate.value=2**((event.note-instrumentRoots[event.kind])/12);pan.pan.value=event.pan;
 const drum=['kick','snare','rim','clap','hat','ride','shaker','conga','taiko','tambourine'].includes(event.kind);
 const release=drum?.025:event.kind==='strings'?.45:.15,end=start+event.duration+release;
 envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(event.level,start+(drum?.001:.008));
 envelope.gain.setValueAtTime(event.level,start+event.duration);envelope.gain.exponentialRampToValueAtTime(.0001,end);
 source.connect(envelope);envelope.connect(pan);pan.connect(output);if(!drum&&!['bass','upright','sub'].includes(event.kind))pan.connect(echo);
 source.start(start);source.stop(end+.01);nodes.add(source);
 source.onended=()=>{nodes.delete(source);source.disconnect();envelope.disconnect();pan.disconnect();};
}
