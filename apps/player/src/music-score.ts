export const musicScores={
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
export type ScoreEvent={kind:'lead'|'bass'|'chord'|'kick'|'snare'|'hat';note:number;duration:number;level:number};
/** Original sixteen-bar arrangements in eighth-note steps. */
export function scoreStep(scene:MusicScene,step:number):ScoreEvent[]{
 const score=musicScores[scene],bar=Math.floor(step/8),beat=step%8,root=score.key+score.bass[bar%4],out:ScoreEvent[]=[];
 if(beat%2===0)out.push({kind:'kick',note:36,duration:.2,level:.35});
 if(beat===2||beat===6)out.push({kind:'snare',note:0,duration:.13,level:.14});
 out.push({kind:'hat',note:0,duration:beat===7?.12:.045,level:beat%2?.09:.045});
 if(beat%2===0||beat===7)out.push({kind:'bass',note:root-24+(beat===7?7:0),duration:.22,level:.22});
 if(beat===1||beat===5)for(const interval of [0,(score.motif as readonly number[]).includes(3)?3:4,7])out.push({kind:'chord',note:root-12+interval,duration:.18,level:.036});
 if(bar%4!==3||beat<4){const phrase=bar%8>=4?2:0;out.push({kind:'lead',note:score.key+score.motif[(beat+phrase)%8]+(bar%16>=12?12:0),duration:.19,level:.095});}
 return out;
}
