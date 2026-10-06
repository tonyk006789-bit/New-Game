export const musicScores={
 'royal-blackjack':{name:'Velvet Aces',bpm:120,key:60,wave:'triangle',swing:.2,motif:[0,7,11,14,9,4,12,7],bass:[0,5,2,7]},
 'sunken-dynasty':{name:'Jade Armada',bpm:130,key:62,wave:'triangle',swing:.04,motif:[7,12,14,9,4,2,9,7],bass:[0,7,2,5]},
 'polar-odyssey':{name:'Aurora Expedition',bpm:136,key:65,wave:'sine',swing:0,motif:[12,7,14,16,9,12,4,7],bass:[0,-3,5,2]},
 'neon-numbers':{name:'Electric Eighty',bpm:134,key:59,wave:'square',swing:0,motif:[0,12,3,10,7,15,5,10],bass:[0,3,-2,5]},
 'pearl-keno':{name:'Pearl Promenade',bpm:124,key:67,wave:'sine',swing:.12,motif:[4,12,9,7,14,16,11,7],bass:[0,5,-3,7]},
 lobby:{name:'Midnight Casino',bpm:118,key:60,wave:'triangle',swing:.16,motif:[0,4,7,11,9,7,4,2],bass:[0,-3,5,7]},
 'neon-sevens':{name:'Neon Jackpot',bpm:134,key:64,wave:'square',swing:0,motif:[0,7,12,7,10,7,3,5],bass:[0,0,-2,3]},
 'ruby-rush':{name:'Ruby Disco',bpm:128,key:62,wave:'sawtooth',swing:.08,motif:[0,3,7,10,12,10,7,5],bass:[0,-2,-4,-5]},
 'sapphire-crown':{name:'Royal Lights',bpm:122,key:65,wave:'triangle',swing:0,motif:[0,7,12,11,7,4,9,7],bass:[0,5,-3,7]},
 'solar-fortune':{name:'Solar Drive',bpm:138,key:60,wave:'sawtooth',swing:0,motif:[0,12,7,10,3,7,15,12],bass:[0,3,-2,5]},
 'jade-fortune':{name:'Jade Palace',bpm:124,key:62,wave:'triangle',swing:.04,motif:[0,2,4,7,9,7,4,2],bass:[0,7,5,2]},
 'coin-carnival':{name:'Golden Parade',bpm:132,key:67,wave:'square',swing:.12,motif:[0,4,7,12,9,7,5,4],bass:[0,5,0,7]},
 'temple-lights':{name:'Temple Pulse',bpm:120,key:57,wave:'triangle',swing:0,motif:[0,3,7,10,7,5,3,2],bass:[0,-2,3,5]},
 'aurora-vault':{name:'Crystal Skyline',bpm:126,key:69,wave:'sine',swing:0,motif:[0,7,12,14,11,7,4,2],bass:[0,-3,5,7]},
 'ember-relics':{name:'Ember Rush',bpm:140,key:57,wave:'sawtooth',swing:0,motif:[0,3,5,7,12,10,7,5],bass:[0,0,3,-2]},
 'orchard-numbers':{name:'Lucky Orchard',bpm:116,key:65,wave:'triangle',swing:.2,motif:[0,4,9,7,12,9,5,4],bass:[0,5,7,0]},
 'reef-party':{name:'Reef Carnival',bpm:132,key:62,wave:'triangle',swing:.1,motif:[0,7,9,12,14,12,9,7],bass:[0,5,-2,7]},
 'abyss-legends':{name:'Abyss Pursuit',bpm:138,key:59,wave:'sawtooth',swing:0,motif:[0,3,7,12,10,7,5,2],bass:[0,-2,-5,3]}
} as const;
export type MusicScene=keyof typeof musicScores;
export type MusicScore={name:string;bpm:number;key:number;wave:OscillatorType;swing:number;motif:readonly number[];bass:readonly number[];groove?:'house'|'swing'|'breaks'};
const track=(name:string,bpm:number,key:number,wave:OscillatorType,groove:'house'|'swing'|'breaks',motif:number[],bass:number[]):MusicScore=>({name,bpm,key,wave,groove,swing:groove==='swing'?.18:0,motif,bass});
// Original compositions: each scene gets two additional melodies and progressions.
const additions:Record<MusicScene,readonly MusicScore[]>={
 'royal-blackjack':[track('Ace of Nights',128,62,'triangle','swing',[11,7,4,9,14,12,16,7],[0,5,7,-3]),track('Green Felt Groove',122,57,'sine','house',[0,7,3,12,14,10,5,7],[0,-2,5,3])],
 'sunken-dynasty':[track('Imperial Tide',136,65,'sine','house',[0,4,9,14,12,7,2,9],[0,5,2,7]),track('Dragon Lanterns',126,60,'triangle','breaks',[7,2,12,9,14,4,7,12],[0,7,5,2])],
 'polar-odyssey':[track('Icebound Pulse',140,62,'sawtooth','breaks',[12,17,10,7,15,3,10,5],[0,-5,-2,3]),track('Crystal Voyage',128,69,'sine','house',[4,7,14,19,16,9,12,2],[0,-3,5,7])],
 'neon-numbers':[track('Number Runner',142,64,'square','house',[3,12,7,15,10,5,0,7],[0,3,5,-2]),track('Lucky Voltage',130,60,'sawtooth','breaks',[10,7,12,3,17,15,5,7],[0,-2,3,-5])],
 'pearl-keno':[track('Moon Pearl',128,65,'triangle','swing',[9,4,12,16,14,7,11,2],[0,5,7,2]),track('Ocean Gems',132,62,'sine','house',[14,12,7,4,9,16,7,2],[0,-3,2,5])],
 lobby:[track('Velvet Roulette',124,62,'triangle','swing',[7,9,12,16,14,9,5,2],[0,5,-2,7]),track('After Hours',128,57,'sine','house',[12,7,10,14,15,10,7,3],[0,-5,-2,3])],
 'neon-sevens':[track('Electric Avenue',138,59,'sawtooth','house',[0,3,10,7,15,12,10,5],[0,3,5,-2]),track('Seven Star Swing',126,65,'triangle','swing',[4,7,9,12,16,14,9,7],[0,7,5,-3])],
 'ruby-rush':[track('Scarlet Fever',136,60,'square','breaks',[7,12,10,15,7,5,3,10],[0,-2,5,3]),track('Ruby Boulevard',122,64,'triangle','swing',[0,4,11,9,7,14,12,9],[0,5,7,-3])],
 'sapphire-crown':[track('Crown Jewels',130,62,'sine','house',[12,14,19,16,11,9,7,4],[0,-3,5,2]),track('Blue Velvet',120,60,'triangle','swing',[7,11,14,12,9,7,4,2],[0,5,-2,7])],
 'solar-fortune':[track('Sunburst',142,64,'square','house',[0,7,10,12,17,15,10,7],[0,-2,3,5]),track('Golden Orbit',128,67,'triangle','breaks',[12,9,7,4,11,14,12,7],[0,5,2,-3])],
 'jade-fortune':[track('Lantern Festival',132,60,'sine','house',[12,9,7,4,2,7,9,14],[0,5,7,2]),track('Emerald Rhythm',120,65,'triangle','swing',[4,9,12,14,9,7,2,4],[0,7,-3,5])],
 'coin-carnival':[track('Brass & Gold',126,62,'triangle','swing',[7,9,4,12,14,16,12,7],[0,5,2,7]),track('Coin Machine',140,59,'square','breaks',[0,7,3,10,12,7,15,10],[0,3,-2,5])],
 'temple-lights':[track('Moonlit Parade',128,62,'sine','house',[7,10,12,15,14,10,5,3],[0,-2,5,3]),track('Sanctuary Swing',118,60,'triangle','swing',[0,3,7,9,10,7,5,2],[0,5,-2,-5])],
 'aurora-vault':[track('Prism Nights',134,65,'sine','house',[12,16,14,19,11,7,9,4],[0,-3,2,5]),track('Northern Groove',122,62,'triangle','breaks',[7,12,14,9,16,12,7,2],[0,5,-3,7])],
 'ember-relics':[track('Molten Gold',144,60,'sawtooth','breaks',[0,5,3,12,10,15,7,3],[0,3,-5,-2]),track('Firelight Club',132,64,'square','house',[12,7,10,5,15,12,3,7],[0,-2,5,3])],
 'orchard-numbers':[track('Lucky Clover',122,62,'triangle','swing',[4,7,12,9,14,11,7,2],[0,5,2,7]),track('Harvest Hop',130,67,'sine','house',[12,7,4,9,11,14,9,5],[0,-3,5,7])],
 'reef-party':[track('Coral Carnival',136,65,'triangle','swing',[0,9,7,12,16,14,7,4],[0,5,7,-3]),track('Tidal Lights',128,60,'sine','house',[12,10,7,15,14,7,3,5],[0,-2,3,5])],
 'abyss-legends':[track('Deep Current',142,62,'square','breaks',[0,3,12,10,17,15,7,5],[0,-5,3,-2]),track('Midnight Leviathan',130,57,'sine','house',[12,15,10,7,14,12,5,3],[0,3,5,-2])]
};
export const musicPlaylists=(Object.keys(musicScores) as MusicScene[]).reduce((playlists,scene)=>{
 playlists[scene]=[musicScores[scene],...additions[scene]];return playlists;
},{} as Record<MusicScene,readonly MusicScore[]>);
export const TRACK_STEPS=256;
export function musicTrack(scene:MusicScene,index=0):MusicScore{const playlist=musicPlaylists[scene];return playlist[((index%playlist.length)+playlist.length)%playlist.length];}
export type ScoreEvent={kind:'lead'|'bass'|'chord'|'kick'|'snare'|'hat';note:number;duration:number;level:number};
/** Thirty-two bars: opening, main phrase, breakdown, and final lift. */
export function scoreStep(scene:MusicScene,step:number,trackIndex=0):ScoreEvent[]{
 const score=musicTrack(scene,trackIndex),bar=Math.floor(step/8)%32,beat=step%8,root=score.key+score.bass[bar%4],out:ScoreEvent[]=[];
 const breakdown=bar>=16&&bar<20,breaks=score.groove==='breaks',swing=score.groove==='swing';
 if(!breakdown&&(breaks?[0,3,4,7].includes(beat):beat%2===0))out.push({kind:'kick',note:36,duration:.2,level:.35});
 if(!breakdown&&(beat===2||beat===6||(breaks&&bar%8===7&&beat===7)))out.push({kind:'snare',note:0,duration:.13,level:.14});
 if(!breakdown||beat%2===1)out.push({kind:'hat',note:0,duration:beat===7?.12:.045,level:beat%2?.09:.045});
 if(beat%2===0||beat===7)out.push({kind:'bass',note:root-24+(beat===7?7:swing&&beat===4?4:0),duration:swing?.28:.22,level:.22});
 if(beat===1||beat===5)for(const interval of [0,score.motif.includes(3)?3:4,7])out.push({kind:'chord',note:root-12+interval,duration:breakdown?.55:swing?.3:.18,level:.036});
 if((bar%4!==3||beat<4)&&(!breakdown||beat%2===0)){const phrase=bar%8>=4?2:0;out.push({kind:'lead',note:score.key+score.motif[(beat+phrase)%8]+(bar>=24?12:0),duration:breakdown?.38:swing?.25:.19,level:.095});}
 return out;
}
