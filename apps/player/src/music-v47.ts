import type {MusicScore,Instrument} from './music-score';
type Row=[string,string,number,number,Instrument,Instrument,Instrument,Instrument,string,string,string,string,string,string,string,boolean];
const notes=(s:string)=>s.split(' ').map(n=>n==='.'?-1:Number(n));
function score(r:Row):MusicScore{
 const [name,genre,bpm,key,lead,chords,bass,percussion,progression,melody,answer,kick,snare,bassHits,chordHits,minor]=r;
 return {name,genre,bpm,key,lead,chords,bass,percussion,pad:'strings',barSteps:16,swing:genre.includes('Swing')?.16:.025,
 progression:notes(progression),melody:notes(melody),answer:notes(answer),kick:notes(kick),snare:notes(snare),bassHits:notes(bassHits),chordHits:notes(chordHits),hat:[2,6,10,14],minor};
}
// Twelve independently authored two-bar phrases. Dots extend the preceding
// phrase instead of forcing every instrument into an identical short beep.
export const newMusicCollections={
 'velvet-electric':{name:'Velvet Electric',description:'Modern keys & warm bass',tracks:[
  score(['Penthouse Lights','Neo-soul house',122,60,'electric','organ','sub','clap','0 5 9 7','7 . . 12 . . 14 . 15 . 14 12 . . 10 . 7 . 10 . . 12 . . 14 12 . 10 . 7 . .','19 . 17 15 . . 14 . 12 . . 10 . 12 14 . 15 . 14 . 12 10 . . 7 . 5 . 7 . . .','0 4 8 12','4 12','0 3 7 8 10 14','2 6 11 14',true]),
  score(['Elevator to Midnight','Broken-beat soul',110,63,'piano','electric','bass','shaker','0 -2 5 7','0 . 3 . 7 . . 10 12 . 10 . 7 . 5 . 3 . . 2 0 . . 3 5 . 7 . 10 . . .','12 . . 15 14 . 12 . 10 . 9 7 . . 5 . 7 . 10 . . 12 14 . 15 . 14 12 . 10 . .','0 7 10','4 12 15','0 5 7 11 14','1 5 10 15',true])]},
 'desert-chrome':{name:'Desert Chrome',description:'Guitar drive & cinematic drums',tracks:[
  score(['Dust at Daybreak','Western groove',132,52,'guitar','organ','bass','rim','0 5 0 7','0 . 7 0 . 3 . 5 7 . . 6 5 . 3 . 0 . 0 7 . . 10 . 12 . 10 7 . 5 . .','12 . 7 . 10 . 12 15 . 14 12 . 10 7 . . 5 . 7 . 6 . 5 3 . 0 . 3 5 7 . .','0 6 8 14','4 12','0 2 6 10 12 15','0 7 12',true]),
  score(['Copper Horizon','Cinematic downtempo',98,57,'flute','guitar','upright','taiko','0 3 -2 5','7 . . . 10 . 12 . 14 . . 12 10 . . . 7 . 5 . 3 . . 5 7 . . 10 12 . . .','19 . . 17 15 . 14 . 12 . . . 10 . 7 . 5 . . 3 2 . 0 . 3 . 5 7 . . . .','0 8 11','6 14','0 6 11','0 5 12',true])]},
 'tokyo-afterglow':{name:'Tokyo Afterglow',description:'City pop & night-drive synths',tracks:[
  score(['Glass Highway','City pop',116,64,'synth','electric','bass','clap','0 5 2 7','7 . 9 . 11 12 . . 16 . 14 12 . 11 . . 9 . . 7 4 . 7 . 9 . 11 . 12 . . .','19 . 16 . 14 . 12 11 . 9 . 7 9 11 . . 12 . 14 16 . 19 . . 16 . 14 12 . . . .','0 4 8 12 15','4 12','0 3 6 8 10 13 15','1 6 9 14',false]),
  score(['Arcade at 2AM','Future funk',124,60,'sax','muteguitar','bass','conga','0 2 5 7','12 . 9 7 . . 4 . 7 . 9 . 10 . 9 7 4 . . 2 4 . 5 . 7 . . 9 12 . . .','16 . 14 12 . 9 . 7 9 . 12 14 . . 12 . 10 . 9 7 . 4 . 2 4 . . 7 9 . 12 .','0 3 8 10 14','4 11 12','0 2 5 8 11 14','2 4 7 10 13 15',false])]},
 'golden-orchestra':{name:'Golden Orchestra',description:'Swing brass & dance-floor strings',tracks:[
  score(['The Last Encore','Swing brass',136,65,'trumpet','piano','upright','ride','0 5 2 7','0 . 4 7 . . 9 . 10 9 . 7 4 . . . 2 . 4 5 . 7 . 9 12 . 9 7 . 4 . .','16 . 14 12 . 9 . 7 9 . 10 12 . . 14 . 16 14 . 12 9 . 7 . 4 5 . 7 9 . . .','0 7 8 13','4 12','0 4 8 12','2 7 10 15',false]),
  score(['Palace in Motion','Disco strings',120,62,'strings','muteguitar','bass','tambourine','0 5 -2 7','12 . . 10 7 . 5 . 7 10 . 12 . . 14 . 15 . 14 12 . 10 . 7 5 . 7 10 . . 12 .','19 . 17 15 . 14 . 12 10 . . 7 5 . 7 . 12 . 14 15 . 17 19 . 17 . 15 14 12 . . .','0 4 8 12','4 12 15','0 2 4 7 8 10 12 14','1 3 5 7 9 11 13 15',true])]},
 'island-frequency':{name:'Island Frequency',description:'Latin breaks & tropical bass',tracks:[
  score(['Coral Street Festival','Tropical breaks',128,67,'steelpan','piano','bass','conga','0 5 7 2','7 9 . 12 . . 9 7 . 4 . 2 4 . 7 . 9 . 12 14 . 12 9 . 7 4 . 2 0 . . .','16 . 14 12 . 9 . 7 9 . . 12 14 . 16 . 19 . 16 14 12 . 9 . 7 . 4 7 . . . .','0 6 8 11 15','4 12','0 3 6 8 10 15','2 5 8 11 14',false]),
  score(['Lanterns on the Water','Latin lounge',108,69,'marimba','guitar','upright','shaker','0 2 5 7','0 . 4 . 7 9 . . 12 . 9 7 . 4 . . 2 . 5 7 . 9 . 12 14 . 12 9 . 7 . .','16 . 14 12 . . 11 . 9 . 7 4 . 2 . . 5 . 7 9 . 12 14 . 16 . 14 12 9 . . .','0 7 10 15','3 6 11 14','0 5 8 13','0 3 6 10 14',false])]},
 'orbital-rush':{name:'Orbital Rush',description:'Melodic techno & liquid breaks',tracks:[
  score(['Launch Window','Melodic techno',130,57,'arp','synth','sub','clap','0 -5 3 -2','0 7 12 . 7 . 10 12 . 15 12 7 . 5 . . 3 10 15 . 10 . 12 15 . 19 15 10 . 7 . .','12 . 19 24 . 19 17 . 15 . 12 10 . 12 . . 17 . 24 29 . 24 22 . 19 17 . 15 12 . . .','0 4 8 12','4 12','2 6 10 14','0 5 8 13',true]),
  score(['Blue Shift','Liquid breaks',164,61,'celeste','electric','sub','ride','0 3 -2 -5','12 . . 7 10 . . 14 15 . 12 . 10 . 7 . 5 . . 3 7 . 10 . 12 . . 15 14 . 12 .','19 . . 17 15 . 14 . 12 . . 10 7 . 5 . 3 . 7 . . 10 12 . 14 . 12 10 . . 7 .','0 6 9 15','4 12','0 5 6 10 13','0 6 11 15',true])]}
} as const;
