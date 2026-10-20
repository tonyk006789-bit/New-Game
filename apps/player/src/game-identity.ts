import type {GameId} from '@new-game/contracts';
import art from './identity-art.json';
export type Identity={host:string;style:'electric'|'expedition'|'royal'|'mechanical'|'natural'|'mythic';symbols?:Record<string,string>};
const triple=['seven','cherry','bell','bar','gem'];
const wild=['dragon','coin','lotus','gem','bell','leaf','seven'];
const collect=['coin','cherry','bell','bar','seven'];
const relic=['ruby','sapphire','emerald','amber','amethyst'];
const vault=['sapphire','amethyst','emerald','amber'];
const pair=(keys:string[],names:string[])=>Object.fromEntries(keys.map((key,i)=>[key,names[i]]));
export const gameIdentities:Record<GameId,Identity>={
 'neon-sevens':{host:'Nova · Night rider',style:'electric',symbols:pair(triple,['Lightning','Roller skate','Cassette','Headphones','Arcade stick'])},
 'ruby-rush':{host:'Ruby · Trailblazer',style:'expedition',symbols:pair(triple,['Scarlet falcon','Telescope','Expedition map','Compass','Satchel'])},
 'disco-diamonds':{host:'Miles · Soul singer',style:'electric',symbols:pair(triple,['Mirror ball','Platform shoe','Microphone','Vinyl record','Keytar'])},
 'outlaw-sevens':{host:'Rhea · Sheriff',style:'expedition',symbols:pair(triple,['Bronze eagle','Cowboy hat','Saddle','Wagon wheel','Horseshoe'])},
 'jade-fortune':{host:'Mei · Jade keeper',style:'royal',symbols:pair(wild,['Jade dragon · WILD','Silk lantern','Porcelain teapot','Carved fan','Incense burner','Bamboo','Ceremonial drum'])},
 'sapphire-crown':{host:'Amara · Queen',style:'royal',symbols:pair(wild,['Royal crown · WILD','Royal seal','Silver chalice','Heraldic shield','Ceremonial sword','Royal decree','Blue lion'])},
 'midnight-express':{host:'Silas · Conductor',style:'mechanical',symbols:pair(wild,['Locomotive · WILD','Train ticket','Pocket watch','Travel trunk','Railway signal','Oil lantern','Conductor cap'])},
 'celestial-wilds':{host:'Selene · Star guide',style:'mythic',symbols:pair(wild,['Moon scepter · WILD','Astrolabe','Star atlas','Comet','Lunar moth','Constellation orb','Compass star'])},
 'coin-carnival':{host:'Felix · Ringmaster',style:'electric',symbols:pair(collect,['Carnival token · HOLD','Carousel horse','Circus tent','Carnival mask','Ferris wheel'])},
 'solar-fortune':{host:'Lyra · Solar pilot',style:'mechanical',symbols:pair(collect,['Solar medallion · HOLD','Satellite','Astronaut helmet','Rocket','Lunar rover'])},
 'pirate-gold':{host:'Mara · Captain',style:'expedition',symbols:pair(collect,['Doubloon · HOLD','Sextant','Spyglass','Pirate ship','Parrot'])},
 'temple-lights':{host:'Tariq · Guardian',style:'mythic',symbols:pair(['moon','lotus','gem','sun','leaf'],['Owl idol','Lotus tablet','Ritual scarab','Sun altar','Oil lamp'])},
 'aurora-vault':{host:'Astrid · Explorer',style:'natural',symbols:pair(vault,['Ice shell','Snowflake prism','Polar totem','Borealis hourglass'])},
 'ember-relics':{host:'Dorian · Forge keeper',style:'mythic',symbols:pair(relic,['Basalt mask','Molten serpent','Volcanic urn','Ritual dagger','Obsidian tablet'])},
 'clockwork-vault':{host:'Orin · Clockmaker',style:'mechanical',symbols:pair(vault,['Escapement','Clockwork beetle','Mainspring','Pendulum'])},
 'phoenix-falls':{host:'Solara · Firebird',style:'mythic',symbols:pair(relic,['Phoenix plume','Phoenix egg','Flame wing','Talon amulet','Firebird crest'])},
 'orchard-numbers':{host:'Hazel · Orchard keeper',style:'natural'},
 'neon-numbers':{host:'Jett · Circuit master',style:'electric'},
 'pearl-keno':{host:'Mina · Pearl diver',style:'royal'},
 'meteor-keno':{host:'Pip · Navigator',style:'mechanical'},
 'bamboo-keno':{host:'Ember · Explorer',style:'natural'},
 'reef-party':{host:'Coral reef crew',style:'natural'},
 'abyss-legends':{host:'The abyss leviathan',style:'mythic'},
 'sunken-dynasty':{host:'The sea empress',style:'royal'},
 'polar-odyssey':{host:'The crystal orca',style:'natural'},
 'corsair-cove':{host:'The spectral captain',style:'expedition'},
 'cosmic-tides':{host:'The astral mermaid',style:'electric'},
 'coral-rush':{host:'The cobalt hammerhead',style:'natural'},
 'royal-blackjack':{host:'Royal table host',style:'royal'},
 'double-deck-blackjack':{host:'Double Deck table host',style:'electric'},
 'european-blackjack':{host:'European table host',style:'mechanical'}
};
export function identityArt(game:string){return art[game as keyof typeof art];}
export function symbolPresentation(game:string,symbol:string){
 const identity=gameIdentities[game as GameId],sheet=identityArt(game),keys=Object.keys(identity?.symbols||{}),cell=keys.indexOf(symbol);
 return sheet&&cell>=0?{...sheet,cell,name:identity.symbols![symbol]}:undefined;
}
export const symbolLabel=(game:string,symbol:string)=>gameIdentities[game as GameId]?.symbols?.[symbol]||symbol.toUpperCase();
