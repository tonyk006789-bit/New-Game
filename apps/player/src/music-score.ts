import type {GameId} from '@new-game/contracts';
export type MusicScene=GameId|'lobby';
export type Instrument='keys'|'brass'|'pluck'|'strings'|'bass'|'mallet'|'kick'|'snare'|'clap'|'hat'|'openhat'|'shaker'|'conga'|'crash';
type Style='disco'|'house'|'jazz'|'tropical'|'cinematic';
export type MusicScore={name:string;bpm:number;key:number;swing:number;style:Style;lead:Instrument;seed:number;progression:readonly number[];melody:readonly number[]};
const scenes:Record<MusicScene,{titles:string[];bpm:number;key:number;style:Style}>={
 'corsair-cove':{titles:['Ghost Harbor Groove','The Copper Fleet','Moonlit Mutiny'],bpm:129,key:55,style:'cinematic'},
 'cosmic-tides':{titles:['Plasma Current','Orbit Afterhours','Nebula Night Swim'],bpm:132,key:63,style:'house'},
 'double-deck-blackjack':{titles:['Double Down Quartet','Pink Velvet Club','Two Deck Shuffle'],bpm:123,key:61,style:'jazz'},
 'european-blackjack':{titles:['Riviera Nocturne','The Late Card','Midnight Promenade'],bpm:116,key:66,style:'jazz'},
 'clockwork-vault':{titles:['Brass Pendulum','Owl at Midnight','Mechanical Waltz'],bpm:126,key:58,style:'cinematic'},
 'phoenix-falls':{titles:['Rise in Flames','Ember Cascade','Wingbeat Overdrive'],bpm:136,key:60,style:'cinematic'},
 'outlaw-sevens':{titles:['Neon Frontier','Saloon After Dark','Sheriff Shuffle'],bpm:128,key:57,style:'disco'},
 'celestial-wilds':{titles:['Moonlight Frequency','Silver Constellation','Sorceress at Dawn'],bpm:124,key:69,style:'house'},
 'meteor-keno':{titles:['Orbit Hustle','Meteor Radio','Star Map Session'],bpm:130,key:62,style:'house'},
 'bamboo-keno':{titles:['Lantern Parade','Bamboo Social Club','Red Panda Rhythm'],bpm:122,key:64,style:'tropical'},
 lobby:{titles:['Grand Entrance','Champagne District','Last Dance at the Arcade'],bpm:124,key:60,style:'disco'},
 'royal-blackjack':{titles:['The High Roller Quartet','Satin & Spades','Penthouse After Midnight'],bpm:118,key:62,style:'jazz'},
 'reef-party':{titles:['Tropic Heat','Coral Club Radio','Island Fever'],bpm:128,key:65,style:'tropical'},
 'abyss-legends':{titles:['Pressure Drop','Leviathan Overdrive','Deepwater Afterburn'],bpm:132,key:57,style:'cinematic'},
 'sunken-dynasty':{titles:['Dragon Procession','Emperor of the Dancefloor','Jade Lantern District'],bpm:126,key:62,style:'tropical'},
 'polar-odyssey':{titles:['Arctic Velocity','Whiteout Club','Glacier Transmission'],bpm:130,key:64,style:'house'},
 'neon-numbers':{titles:['Laser Lounge','Eighty After Dark','Electric Counter'],bpm:132,key:59,style:'house'},
 'pearl-keno':{titles:['Pearl Coast Nights','Silver Terrace','Oceanfront Disco'],bpm:122,key:67,style:'disco'},
 'neon-sevens':{titles:['Seven on the Floor','Chrome Avenue','Jackpot Junction'],bpm:128,key:60,style:'house'},
 'ruby-rush':{titles:['Scarlet Nightclub','Red Carpet Hustle','Ruby Street Orchestra'],bpm:126,key:64,style:'disco'},
 'sapphire-crown':{titles:['Blue Palace Ballroom','The Sapphire Session','Crown at Dusk'],bpm:120,key:65,style:'jazz'},
 'solar-fortune':{titles:['Solaris Dance Unit','Gold Rush Highway','Sunset Accelerator'],bpm:134,key:62,style:'house'},
 'jade-fortune':{titles:['Lucky Dragon Club','Emerald Lantern Parade','Jade at Daybreak'],bpm:124,key:67,style:'tropical'},
 'coin-carnival':{titles:['Brass Coin Carnival','Parade of Gold','Confetti Casino'],bpm:128,key:62,style:'disco'},
 'temple-lights':{titles:['Sanctuary Afterhours','Temple of Rhythm','Moonstone Procession'],bpm:122,key:57,style:'cinematic'},
 'aurora-vault':{titles:['Northern Light District','Crystal Fever','Aurora in Stereo'],bpm:126,key:69,style:'house'},
 'ember-relics':{titles:['Volcanic Night Drive','Relic Breakout','Fireline Orchestra'],bpm:136,key:57,style:'cinematic'},
 'orchard-numbers':{titles:['Orchard Street Social','Lucky Harvest Club','Golden Hour Shuffle'],bpm:120,key:65,style:'tropical'},
 'disco-diamonds':{titles:['Mirrorball Millionaire','Diamond Dancefloor','Studio Twenty'],bpm:126,key:60,style:'disco'},
 'midnight-express':{titles:['Platform Nine After Dark','Midnight Connection','Velvet Railways'],bpm:122,key:59,style:'jazz'},
 'pirate-gold':{titles:['Buccaneer Brass Band','Treasure Island Club','Captain of the Night'],bpm:130,key:62,style:'tropical'}
};
const phrases=[
 [7,-1,9,12,-1,14,-1,12,7,-1,4,-1,9,7,-1,-1,12,-1,14,16,-1,14,12,-1,9,-1,7,4,-1,2,-1,-1],
 [0,-1,7,-1,10,12,-1,7,-1,3,-1,5,7,-1,10,-1,12,-1,15,-1,10,7,-1,5,3,-1,0,3,-1,7,-1,-1],
 [4,-1,7,9,-1,11,14,-1,12,-1,9,7,-1,4,2,-1,7,-1,11,14,-1,16,14,-1,11,-1,9,4,-1,2,-1,-1],
 [0,-1,4,-1,7,9,-1,12,14,-1,12,-1,9,7,-1,-1,4,-1,7,12,-1,14,9,-1,7,-1,4,2,-1,0,-1,-1]
];
export const musicPlaylists=Object.fromEntries(Object.entries(scenes).map(([scene,s],index)=>[scene,s.titles.map((name,variant):MusicScore=>({
 name,bpm:s.bpm+variant*2,key:s.key+(variant===2?-2:0),swing:s.style==='jazz'?.16:s.style==='tropical'?.045:0,
 style:s.style,lead:s.style==='jazz'?'keys':s.style==='disco'?'brass':s.style==='tropical'?'mallet':'pluck',seed:index*3+variant,
 progression:variant===0?[0,5,2,7]:variant===1?[0,-3,5,7]:[0,7,5,2],melody:phrases[(index+variant)%phrases.length]
}))])) as unknown as Record<MusicScene,readonly MusicScore[]>;
export const musicScores=Object.fromEntries(Object.entries(musicPlaylists).map(([id,tracks])=>[id,tracks[0]])) as Record<MusicScene,MusicScore>;
export const TRACK_STEPS=512;
export function musicTrack(scene:MusicScene,index=0){const p=musicPlaylists[scene];return p[((index%p.length)+p.length)%p.length];}
export type ScoreEvent={kind:Instrument;note:number;duration:number;level:number;pan:number};
/** Original 32-bar arrangements at sixteenth-note resolution: intro, groove, bridge and finale. */
export function scoreStep(scene:MusicScene,step:number,trackIndex=0):ScoreEvent[]{
 const s=musicTrack(scene,trackIndex),bar=Math.floor(step/16)%32,beat=step%16,root=s.key+s.progression[Math.floor(bar/2)%4],out:ScoreEvent[]=[];
 const add=(kind:Instrument,note:number,duration:number,level:number,pan=0)=>out.push({kind,note,duration,level,pan});
 const intro=bar<4,bridge=bar>=16&&bar<20,full=!intro&&!bridge,beatSeconds=60/s.bpm;
 if(!bridge&&(beat%4===0||(s.style==='cinematic'&&[7,14].includes(beat))))add('kick',36,.5,.3);
 if(!bridge&&[4,12].includes(beat)){add(s.style==='jazz'?'snare':'clap',60,.26,.19,.08);if(s.style==='disco')add('snare',60,.21,.09,-.1);}
 if(beat%2===0&&!bridge)add(beat%4===2&&full?'openhat':'hat',60,beat%4===2?.16:.07,beat%4===2?.068:.042,.3);
 if((full||s.style==='tropical')&&beat%2===1)add('shaker',60,.07,beat%4===3?.034:.02,-.35);
 if(s.style==='tropical'&&[3,10,15].includes(beat)&&!bridge)add('conga',60+(beat===10?3:0),.2,.09,beat===3?-.3:.3);
 if(beat===0&&[4,20,28].includes(bar))add('crash',60,1.3,.09,-.18);
 const bassBeat=s.style==='jazz'?[0,4,8,12]:[0,3,6,8,11,14];
 if(bassBeat.includes(beat)&&(!bridge||beat%8===0))add('bass',root-24+([6,14].includes(beat)?7:beat===11?12:0),beatSeconds*(s.style==='jazz'?.8:.38),.22);
 const minor=s.style==='cinematic'||s.style==='house';
 if((bridge?beat===0:[2,7,10,14].includes(beat)))for(const [i,n] of (minor?[0,3,7,10]:[0,4,7,11]).entries())
  add(bridge?'strings':'keys',root-12+n+(bar%8>=4?12:0),bridge?beatSeconds*3:beatSeconds*.55,bridge?.052:.06,(i-1.5)*.15);
 if(beat===0&&[0,8,16,20,28].includes(bar))for(const n of [0,7,12])add('strings',root+n,beatSeconds*3.2,.035,(n-6)/25);
 const index=(beat+(bar%2)*16+s.seed*2)%32,n=s.melody[index];
 if(n>=0&&(full||bar>=2&&beat%4===0)&&(!bridge||beat%4===0)&&!(bar%4===3&&beat>9))
  add(s.lead,s.key+n+(bar>=28?12:0),beatSeconds*(beat%4===0?.7:.4),s.lead==='brass'?.15:.19,Math.sin(s.seed+bar)*.22);
 if(full&&bar%4===3&&[11,13,14,15].includes(beat))add('snare',60,.12,.05+(beat-11)*.014,-.12);
 return out;
}
