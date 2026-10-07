import {winTier} from './win-presentation';
type Style={motion:string;motif:string;color:string;accent:string;glyph:string};
const style=(motion:string,motif:string,color:string,accent:string,glyph:string):Style=>({motion,motif,color,accent,glyph});
/** Presentation only: these seeds arrange particles, never sample a game outcome. */
export const winStyles:Record<string,Style>={
 'corsair-cove':style('fountain','coin','#ffc879','#75e9da','⚓'),
 'cosmic-tides':style('orbit','crystal','#bfa0ff','#6af4ff','✧'),
 'double-deck-blackjack':style('royal','chip','#f1acdc','#917aff','♣'),
 'european-blackjack':style('royal','chip','#bbd9ff','#ffe3b0','♦'),
 'clockwork-vault':style('orbit','coin','#e8b56e','#74c8f5','⚙'),
 'phoenix-falls':style('inferno','ember','#ffcf5b','#ff493f','✦'),
 'outlaw-sevens':style('fountain','coin','#fac371','#e47e90','★'),
 'celestial-wilds':style('orbit','crystal','#e0c6ff','#88e7ff','☾'),
 'meteor-keno':style('meteor','spark','#ffb363','#bd9bff','☄'),
 'bamboo-keno':style('rise','pearl','#d8f1a6','#fbb17e','✧'),
 'neon-sevens':style('fountain','coin','#ffd865','#fa438e','7'),
 'jade-fortune':style('orbit','jade','#61ffb1','#ffe89b','✦'),
 'coin-carnival':style('fountain','coin','#ffe784','#ff7945','★'),
 'temple-lights':style('rise','rune','#ffebac','#b493ff','✧'),
 'aurora-vault':style('shatter','crystal','#b4fbff','#bb82ff','◆'),
 'ember-relics':style('inferno','ember','#ffc04a','#ff5836','✦'),
 'ruby-rush':style('shatter','crystal','#ff789d','#ffce75','♦'),
 'sapphire-crown':style('royal','crystal','#82c8ff','#ffe094','♛'),
 'solar-fortune':style('orbit','coin','#ffce48','#ff873e','☀'),
 'disco-diamonds':style('orbit','mirror','#f589ff','#6dfff7','◆'),
 'midnight-express':style('meteor','spark','#ffc875','#91caff','✦'),
 'pirate-gold':style('fountain','coin','#ffd159','#77efd5','⚓'),
 'orchard-numbers':style('rise','ball','#ffd174','#b8fc6b','✦'),
 'neon-numbers':style('meteor','ball','#5be5ff','#ff6cda','✦'),
 'pearl-keno':style('tide','pearl','#edffff','#f9aedb','◉'),
 'royal-blackjack':style('royal','chip','#f6e1a5','#cb555a','♠'),
 'reef-party':style('tide','coin','#ffe36a','#87ffff','✧'),
 'abyss-legends':style('inferno','coin','#ffb63a','#6aeaff','✦'),
 'sunken-dynasty':style('orbit','jade','#83ffd5','#ffe392','✦'),
 'polar-odyssey':style('shatter','crystal','#c4f7ff','#98b8ff','❄')
};
export function winParticles(game:string,id:string,award:string,stake:string,compact=false){
 const tier=winTier(award,stake);if(!tier)return [];
 let seed=2166136261;for(const char of `${game}:${id}`)seed=Math.imul(seed^char.charCodeAt(0),16777619);
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
 const count=compact?18:tier==='jackpot'?62:tier==='major'?48:34;
 return Array.from({length:count},(_,i)=>({id:i,coin:i%3!==0,dx:Math.round((next()-.5)*(compact?250:720)),dy:Math.round(50+next()*(compact?90:310)),rise:Math.round(-45-next()*(compact?55:190)),spin:Math.round((next()-.5)*1080),size:Math.round((compact?11:16)+next()*12),delay:Math.round(next()*620),duration:Math.round(1600+next()*1100),angle:Math.round(next()*360)}));
}
