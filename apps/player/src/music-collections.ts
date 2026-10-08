import type {Instrument,MusicScore} from './music-score';
type Row=[string,string,number,number,number,number,Instrument,Instrument,Instrument,Instrument,string,string,string,string,string,string,string,string,boolean,Instrument];
const notes=(s:string)=>s.split(' ').map(n=>n==='.'?-1:Number(n));
function track([name,genre,bpm,key,barSteps,swing,lead,chords,bass,pad,progression,melody,answer,kick,snare,hat,bassHits,chordHits,minor,percussion]:Row):MusicScore{
 return {name,genre,bpm,key,barSteps,swing,lead,chords,bass,pad,progression:notes(progression),melody:notes(melody),answer:notes(answer),kick:notes(kick),snare:notes(snare),hat:notes(hat),bassHits:notes(bassHits),chordHits:notes(chordHits),minor,percussion};
}
// Ten additional original compositions. Distinct phrases, meters, groove and
// harmonic movement; the existing original instrument bank supplies the timbres.
export const musicCollections={
 'neon-drive':{name:'Neon Drive',description:'Peak-time house & garage',tracks:[
  track(['Electric Skyline','Piano house',128,60,16,0,'piano','organ','sub','strings','0 5 -2 3','12 . 7 10 . 12 15 . 19 15 . 12 10 . 7 .','7 10 12 . 15 . 19 22 . 19 17 15 . 12 10 .','0 4 8 12','4 12','2 6 7 10 14','0 3 6 7 10 11 14','2 5 10 13',true,'clap']),
  track(['Last Train Uptown','Two-step garage',134,63,16,.16,'bell','electric','sub','choir','0 -2 5 3','7 . . 12 10 . 7 . 15 . 12 10 . 7 . 3','19 . 15 . 12 10 . 7 . 5 7 . 10 . 12 .','0 5 11 14','4 12','1 3 6 9 11 14 15','0 5 7 10 14','1 6 11 15',true,'shaker'])]},
 'brass-lights':{name:'Brass & Lights',description:'Swing floor & brass funk',tracks:[
  track(['Marquee Strut','Brass funk',116,65,16,.08,'trumpet','muteguitar','bass','sax','0 3 5 2','0 . 4 7 . 9 . 10 9 7 . 4 2 . 4 .','12 9 . 7 10 . 12 14 . 12 9 7 . 5 4 .','0 7 10 15','4 12','0 2 5 8 10 13 14','0 2 7 9 10 15','3 6 11 14',false,'conga']),
  track(['Velvet Rope Shuffle','Jump swing',148,58,12,.2,'sax','piano','upright','trumpet','0 5 7 2','0 3 . 6 7 . 10 7 3 2 . 0','12 10 7 . 6 3 5 . 7 10 . 12','0 4 6 10','3 9','0 2 4 5 6 8 10 11','0 3 6 9','1 5 7 11',true,'ride'])]},
 'tropical-rush':{name:'Tropical Rush',description:'Soca & Latin percussion',tracks:[
  track(['Sunset Parade','Soca sprint',154,67,16,0,'steelpan','guitar','bass','flute','0 7 2 5','0 4 . 7 9 12 . 9 7 . 4 2 4 . 7 .','16 . 14 12 9 . 7 9 12 . 14 16 . 14 12 .','0 4 7 8 12','4 11 12','0 2 4 6 7 8 10 12 14','0 3 7 8 11 15','2 5 9 13',false,'conga']),
  track(['Conga Avenue','Latin jazz',124,62,16,.025,'marimba','piano','upright','trumpet','0 2 7 5','7 9 . 12 14 . 12 9 . 7 5 . 4 2 . 0','12 . 16 14 12 9 . 7 9 . 12 14 . 9 7 .','0 6 10 13','3 9 14','0 3 5 6 8 11 13 14','0 6 7 10 12 15','1 4 7 11 14',false,'conga'])]},
 'velvet-room':{name:'Velvet Room',description:'Jazz-funk & late-night keys',tracks:[
  track(['Blue Hour Quartet','Seven-beat jazz',112,60,14,.09,'piano','electric','upright','flute','0 5 -2 7','0 . 3 7 10 . 14 12 . 10 7 5 . 3','15 . 14 12 10 9 . 7 5 . 3 2 0 .','0 8 11','4 10','0 2 5 7 9 12','0 4 8 10','1 6 11',true,'ride']),
  track(['Afterhours Switch','Jazz-funk',108,64,16,.14,'electric','organ','bass','sax','0 -2 3 5','0 . 7 10 . 12 . 14 10 7 . 5 3 . 2 .','12 10 . 9 7 . 5 7 10 . 12 15 . 14 12 .','0 3 9 11','4 12','1 2 5 8 9 12 14','0 3 5 9 11 15','2 7 12 15',true,'rim'])]},
 'cosmic-arcade':{name:'Cosmic Arcade',description:'Breaks & high-speed synths',tracks:[
  track(['Photon Chase','Synth breakbeat',144,57,16,0,'arp','synth','sub','bell','0 3 -2 -5','0 7 . 12 15 . 7 10 12 . 19 15 . 12 10 .','24 . 19 17 15 12 . 10 7 . 10 12 15 . 19 .','0 2 7 10 14','4 11 12','0 1 3 6 8 9 11 14','0 2 6 7 10 13','0 5 9 14',true,'clap']),
  track(['Zero Gravity Run','Liquid drum and bass',168,66,16,.02,'synth','electric','sub','choir','0 -5 -2 3','12 . . 7 10 . 14 . 15 12 . 10 . 7 5 .','19 17 . 15 . 14 12 . 10 7 . 5 3 . 5 .','0 6 8 13','4 12','0 2 5 6 8 11 12 14 15','0 6 9 13 15','1 7 12',true,'ride'])]}
} as const;
export type MusicCollectionId='game'|keyof typeof musicCollections;
export function validMusicCollection(id:unknown):id is MusicCollectionId{return id==='game'||typeof id==='string'&&Object.hasOwn(musicCollections,id);}
