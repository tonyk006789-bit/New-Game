import type {GameId} from '@new-game/contracts';
export type MusicScene=GameId|'lobby';
export type Instrument='piano'|'electric'|'organ'|'guitar'|'muteguitar'|'sax'|'trumpet'|'strings'|'choir'|'flute'|'koto'|'sitar'|'marimba'|'steelpan'|'celeste'|'bell'|'accordion'|'synth'|'arp'|'bass'|'upright'|'sub'|'kick'|'snare'|'rim'|'clap'|'hat'|'ride'|'shaker'|'conga'|'taiko'|'tambourine';
export type MusicScore={name:string;genre:string;bpm:number;key:number;swing:number;barSteps:number;lead:Instrument;chords:Instrument;bass:Instrument;pad:Instrument;progression:number[];melody:number[];answer:number[];kick:number[];snare:number[];hat:number[];bassHits:number[];chordHits:number[];minor:boolean;percussion:Instrument};
type Composition=[MusicScene,string,string,number,number,number,number,Instrument,Instrument,Instrument,Instrument,string,string,string,string,string,string,string,string,boolean,Instrument];
const notes=(line:string)=>line.split(' ').map(n=>n==='.'?-1:Number(n));
// Each scene is a separately written composition: its own meter, drum/bass
// rhythm, two melodic phrases, harmonic movement, ensemble and musical form.
// Positions are sixteenth notes; dots are intentional melodic rests.
const compositions:Composition[]=[
 ['lobby','After the Marquee','Vegas big band',124,60,16,.12,'trumpet','piano','upright','strings','0 5 2 7','7 . 9 10 . 9 7 . 4 . 2 4 . 7 . 12','14 . 12 9 7 . 4 . 5 7 . 9 7 4 . .','0 7 8 14','4 12','0 3 6 8 11 14','0 4 8 12','2 7 10 14',false,'ride'],
 ['neon-sevens','Chrome Boulevard','Electro swing',126,62,16,.22,'sax','electric','upright','organ','0 3 5 7','0 . 3 5 . 6 7 . 10 7 . 6 5 . 3 .','12 10 . 7 . 6 5 3 . 0 . 3 5 6 . 7','0 6 10','4 12 15','2 5 8 11 14','0 3 7 8 11 15','1 6 9 14',true,'shaker'],
 ['ruby-rush','Crimson Sprint','Drum and bass',172,57,16,0,'synth','electric','sub','choir','0 -2 -5 3','12 . 7 10 . 14 . 15 12 . . 10 7 . 5 .','3 . 5 7 10 . 12 . 19 17 . 15 14 12 . .','0 6 9 14','4 12','0 2 3 6 8 10 11 14','0 5 6 9 11 14','0 7 10',true,'ride'],
 ['jade-fortune','Jade Silk Procession','Koto chamber groove',108,62,16,0,'koto','marimba','bass','flute','0 5 0 7','0 . 2 . 4 7 . 9 12 . 9 7 . 4 2 .','7 9 12 . 14 . 12 9 7 . 4 . 2 4 . 0','0 8 11','6 14','1 4 7 9 12 15','0 6 8 14','0 5 11',false,'taiko'],
 ['coin-carnival','Brass Street Carnival','New Orleans second line',118,65,16,.1,'trumpet','organ','upright','sax','0 0 5 7','0 4 . 7 9 7 . 4 . 2 4 . 5 7 9 .','12 . 9 10 . 9 7 4 5 . 7 9 . 7 4 .','0 3 8 10','2 4 7 12 15','0 2 4 6 8 10 12 14','0 3 6 8 10 13','1 5 9 13',false,'tambourine'],
 ['temple-lights','Obsidian Ritual','Cinematic hand drums',96,55,14,0,'flute','sitar','sub','choir','0 -2 3 0','0 . 1 5 . 7 . 8 7 . 5 . 1 .','12 . 8 7 5 . 1 . 0 1 5 . 7 .','0 6 10','4 12','0 2 5 7 9 12','0 6 10','0 7',true,'taiko'],
 ['aurora-vault','Glass Horizon','Luminous downtempo',92,69,16,0,'celeste','electric','sub','choir','0 7 4 5','0 . . 7 . 11 12 . 16 . 14 . 11 7 . .','19 . 16 14 . . 12 . 11 7 . 4 . 7 . .','0 10','6 14','2 5 8 11 14','0 7 10','0 6 12',false,'shaker'],
 ['ember-relics','Forge of Ash','Industrial percussion',138,50,16,0,'synth','organ','bass','choir','0 0 -1 3','0 0 . 3 0 . 6 5 0 3 . 7 6 . 5 .','12 . 12 10 7 . 6 . 5 3 0 . 3 5 . .','0 2 8 11 14','4 10 12','0 1 4 6 8 9 12 14','0 2 6 8 11 14','0 3 8 13',true,'taiko'],
 ['orchard-numbers','Sunroom Shuffle','Acoustic bluegrass',112,67,16,.1,'guitar','piano','upright','flute','0 5 0 7','0 4 7 4 2 5 9 5 4 7 12 7 2 5 7 .','12 9 7 4 5 9 12 9 7 4 2 0 2 4 7 .','0 8','4 12','2 6 10 14','0 4 8 12','2 6 10 14',false,'tambourine'],
 ['reef-party','Coral Calypso','Steelpan calypso',116,65,16,0,'steelpan','muteguitar','bass','flute','0 5 7 0','7 . 9 12 . 9 7 4 . 7 9 . 12 . 14 .','16 14 . 12 9 . 7 9 . 4 7 . 2 4 . .','0 6 8','4 10 14','0 2 4 6 8 10 12 14','0 3 6 10 13','2 6 10 14',false,'conga'],
 ['abyss-legends','Blackwater Engine','Deep dub',74,48,16,.06,'organ','electric','sub','choir','0 -5 0 -2','0 . . 7 . . 10 . 5 . . 3 . 0 . .','12 . 10 . . 7 . 5 3 . . 5 . 7 . .','0 11','8','2 6 10 14','0 3 7 11','4 12',true,'rim'],
 ['sunken-dynasty','Palace of Tides','Silk-road ensemble',102,60,12,0,'koto','sitar','bass','strings','0 7 5 3','0 . 2 3 . 7 10 . 7 3 . 2','12 10 . 7 5 . 3 2 . 0 2 .','0 6 9','3 10','0 2 4 6 8 10','0 5 6 10','0 4 8',true,'taiko'],
 ['polar-odyssey','Icebreaker Radio','Nordic synthwave',106,59,16,0,'synth','electric','bass','strings','0 -5 3 -2','0 . 7 . 10 12 . 14 . 12 10 . 7 5 . .','15 . 14 12 10 . 7 . 5 3 . 2 0 . 7 .','0 4 8 12','4 12','2 6 10 14','0 2 4 7 8 10 12 15','0 8',true,'tambourine'],
 ['neon-numbers','Binary Breakdance','Electro breakbeat',132,61,16,0,'arp','organ','sub','bell','0 -3 5 2','0 7 . 12 7 . 3 . 0 10 . 7 3 5 . .','12 15 . 19 15 12 . 10 7 . 5 3 . 2 . 0','0 3 10','4 12','0 2 5 6 8 10 13 14','0 3 6 10 14','1 7 11',true,'clap'],
 ['pearl-keno','Pearl Terrace Bossa','Bossa nova',126,67,16,0,'flute','guitar','upright','electric','0 2 5 7','7 . 11 12 . 9 . 7 4 . 2 4 . 7 . .','14 . 12 11 9 . 7 . 5 . 4 2 . 0 . .','0 7 8 15','3 6 11 14','0 2 4 6 8 10 12 14','0 6 8 14','0 3 6 10 13',false,'shaker'],
 ['sapphire-crown','Sapphire Waltz','Royal chamber waltz',114,65,12,.035,'strings','piano','upright','celeste','0 5 2 7','0 . 4 . 7 . 12 11 9 . 7 .','16 . 14 12 11 . 9 7 5 . 4 .','0 6','4 10','0 2 4 6 8 10','0 6','2 4 8 10',false,'ride'],
 ['solar-fortune','Solar Pulse Array','Afro house',122,62,16,0,'marimba','organ','sub','choir','0 5 -2 0','0 . 3 . 7 10 . 12 . 7 5 . 3 5 7 .','15 . 12 . 10 7 . 5 3 . 0 . 3 7 10 .','0 4 8 12','6 14','1 3 5 7 9 11 13 15','0 3 7 10 14','2 7 11',true,'conga'],
 ['disco-diamonds','Diamond Saturday','Live disco orchestra',120,60,16,0,'strings','muteguitar','bass','trumpet','0 2 5 7','12 . 9 7 . 9 12 16 . 14 12 . 9 7 . .','19 . 16 14 12 . 9 12 . 7 9 . 4 7 . .','0 4 8 12','4 12 14','0 2 4 6 8 10 12 14','0 2 3 6 8 10 11 14','1 3 5 7 9 11 13 15',false,'clap'],
 ['midnight-express','Sleeper Car Quartet','Brushed jazz',94,58,16,.28,'sax','piano','upright','electric','0 5 2 7','0 . 3 7 . 10 . 9 7 . 5 3 . 2 . .','12 . 10 9 7 . 6 . 5 3 . 2 0 . . 7','0 9','4 12','0 6 8 14','0 4 8 12','3 7 10 15',true,'ride'],
 ['pirate-gold','Doubloon Reel','Accordion sea reel',128,62,12,0,'accordion','guitar','upright','flute','0 -2 0 7','0 3 7 12 7 3 2 5 9 14 9 5','3 7 10 15 10 7 2 5 7 11 7 2','0 6','3 9','0 3 6 9','0 6','3 9',true,'tambourine'],
 ['royal-blackjack','Velvet Table Trio','Piano lounge jazz',88,63,16,.18,'piano','electric','upright','strings','0 5 2 7','7 . . 10 . 12 14 . 15 14 . 12 . 10 7 .','5 . 7 10 . 9 7 . 3 . 5 7 . 2 0 .','0 10','4 12 15','0 3 6 8 11 14','0 4 8 12','2 6 11',true,'ride'],
 ['corsair-cove','Phantom Fleet Jig','Pirate jig orchestra',138,57,12,.02,'accordion','strings','upright','choir','0 3 -2 7','0 3 7 0 3 7 10 7 3 10 7 3','12 10 7 14 12 10 7 5 3 2 3 5','0 5 6 11','3 9','0 2 3 6 8 9','0 5 6 10','0 3 6 9',true,'taiko'],
 ['cosmic-tides','Quasar Current','Cosmic future garage',136,61,16,.12,'bell','electric','sub','choir','0 -5 3 7','0 . 7 . . 10 14 . 12 . . 7 5 . 3 .','19 . 17 . 14 . . 12 10 . 7 . . 5 . .','0 7 11','4 12','1 2 6 7 9 10 14 15','0 5 7 11 14','2 9 14',true,'shaker'],
 ['double-deck-blackjack','Two Shoes Tango','Casino tango',122,62,16,0,'accordion','piano','upright','strings','0 -2 5 7','0 . 3 7 6 . 7 . 10 . 9 7 6 3 . 2','12 . 10 9 7 6 . 7 5 . 3 2 1 . 0 .','0 3 6 8 12','6 14','0 4 8 12','0 3 6 8 12','0 6 10 14',true,'rim'],
 ['european-blackjack','Riviera Five','Five-beat cool jazz',112,64,20,.1,'flute','electric','upright','strings','0 5 -2 7','0 . 3 . 7 10 . 9 7 . 5 . 3 2 . 0 . 2 3 .','12 . 10 9 7 . 5 . 3 2 . 0 3 . 5 7 . 10 9 .','0 12','8 16','0 3 6 8 11 14 16 19','0 4 8 12 16','2 10 17',true,'ride'],
 ['clockwork-vault','Clockmaker in Three','Mechanical celeste waltz',132,58,12,0,'celeste','muteguitar','bass','strings','0 3 7 5','0 7 12 7 3 7 2 9 14 9 5 9','15 12 7 12 14 10 5 10 12 9 3 9','0 8','4 10','1 3 5 7 9 11','0 6 9','2 4 8 10',true,'rim'],
 ['phoenix-falls','Wings of Fire','Epic rock',146,57,16,0,'guitar','organ','bass','strings','0 3 5 -2','0 . 0 3 5 . 7 . 10 12 . 10 7 . 5 .','12 15 . 14 12 . 10 7 . 5 7 10 . 12 . .','0 2 6 8 10','4 12','0 2 4 6 8 10 12 14','0 2 6 8 10 14','0 6 8 14',true,'tambourine'],
 ['outlaw-sevens','Dust and Neon','Surf western rock',154,52,16,.03,'guitar','organ','bass','trumpet','0 0 5 7','0 0 7 0 3 0 7 3 5 5 12 5 7 6 5 3','12 12 7 10 12 7 5 3 7 7 2 5 7 5 3 0','0 6 8 15','4 12','0 2 4 6 8 10 12 14','0 4 6 8 12 15','2 6 10 14',true,'rim'],
 ['celestial-wilds','Lunar Arpeggios','Dream trance',134,69,16,0,'arp','synth','sub','choir','0 -2 -5 3','0 7 12 15 7 12 19 15 3 10 15 19 10 15 22 19','5 12 17 20 12 17 24 20 7 14 19 22 14 19 26 22','0 4 8 12','4 12','2 3 6 7 10 11 14 15','2 6 10 14','0 8',true,'clap'],
 ['meteor-keno','Asteroid Arcade','Chiptune funk',142,60,16,0,'arp','electric','bass','bell','0 5 3 7','0 12 . 7 10 12 . 15 7 . 3 5 . 7 10 .','19 12 . 15 10 . 7 12 5 10 . 7 3 . 0 .','0 5 8 14','4 12','0 2 5 7 8 10 13 15','0 3 5 8 11 14','1 6 9 13',true,'conga'],
 ['bamboo-keno','Lantern Garden Samba','Marimba samba',104,67,16,0,'marimba','guitar','upright','flute','0 2 5 0','0 2 . 4 7 . 9 7 4 . 2 0 . 4 7 .','12 9 . 7 9 12 . 14 12 . 9 7 4 2 . 0','0 7 8 14','3 11 15','0 1 3 4 6 8 9 11 12 14','0 6 8 13','0 3 7 10 14',false,'conga']
];
export const musicPlaylists=Object.fromEntries(compositions.map(([id,name,genre,bpm,key,barSteps,swing,lead,chords,bass,pad,progression,melody,answer,kick,snare,hat,bassHits,chordHits,minor,percussion])=>[id,[{name,genre,bpm,key,barSteps,swing,lead,chords,bass,pad,progression:notes(progression),melody:notes(melody),answer:notes(answer),kick:notes(kick),snare:notes(snare),hat:notes(hat),bassHits:notes(bassHits),chordHits:notes(chordHits),minor,percussion}]])) as Record<MusicScene,MusicScore[]>;
export const musicScores=Object.fromEntries(Object.entries(musicPlaylists).map(([id,p])=>[id,p[0]])) as Record<MusicScene,MusicScore>;
export function musicTrack(scene:MusicScene,index=0){const p=musicPlaylists[scene];return p[((index%p.length)+p.length)%p.length];}
export const trackSteps=(scene:MusicScene,index=0)=>musicTrack(scene,index).barSteps*64;
export const TRACK_STEPS=1280;
export type ScoreEvent={kind:Instrument;note:number;duration:number;level:number;pan:number};
export function scoreStep(scene:MusicScene,step:number,index=0):ScoreEvent[]{
 return scoreEvents(musicTrack(scene,index),step);
}
export function scoreEvents(s:MusicScore,step:number):ScoreEvent[]{
 const bar=Math.floor(step/s.barSteps)%64,tick=step%s.barSteps,seconds=60/s.bpm,root=s.key+s.progression[Math.floor(bar/2)%s.progression.length],out:ScoreEvent[]=[];
 const section=Math.floor(bar/8),intro=section===0,breakdown=section===4,finale=section===7;
 const add=(kind:Instrument,note:number,duration:number,level:number,pan=0)=>out.push({kind,note,duration,level,pan});
 if(!breakdown){
  if(s.kick.includes(tick))add('kick',36,.35,intro?.15:.23);
  if(s.snare.includes(tick))add(s.genre.includes('jazz')||s.genre.includes('waltz')?'rim':'snare',60,.16,.1,.1);
  if(s.hat.includes(tick)&&(!intro||bar>=4))add('hat',60,.05,tick%4===0?.045:.025,.3);
  if((!intro||bar>=6)&&s.hat.includes((tick+3)%s.barSteps))add(s.percussion,60,.16,.048,-.28);
 }
 if(s.bassHits.includes(tick)&&(!breakdown||tick===0))add(s.bass,root-24+(tick>s.barSteps/2?7:0),seconds*.62,.17);
 if(s.chordHits.includes(tick)&&(!breakdown||tick===s.chordHits[0]))for(const [i,n] of (s.minor?[0,3,7,10]:[0,4,7,11]).entries())add(s.chords,root-12+n,seconds*(breakdown?2:.65),.045,(i-1.5)*.22);
 if(tick===0&&bar%4===0)for(const [i,n] of [0,7,12].entries())add(s.pad,root+n,seconds*Math.min(3,s.barSteps/4),.026,(i-1)*.35);
 const melody=section===2||section===5||finale?s.answer:s.melody,note=melody[(tick+(bar%2)*s.barSteps)%melody.length];
 if(note>=0&&(!intro||bar>=4)&&(!breakdown||tick%3===0))add(s.lead,s.key+note+(finale&&bar%4===3?12:0),seconds*(tick%4===0?.72:.42),.15,-.12);
 if(!intro&&!breakdown&&bar%8===7&&tick>=s.barSteps-3)add(s.percussion,60+(tick%2)*3,.12,.055,.2);
 return out;
}
