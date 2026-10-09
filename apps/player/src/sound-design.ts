export type SoundKind='click'|'navigate'|'page'|'enter'|'back'|'favorite'|'shot'|'win'|'impact'|'reel-start'|'reel-stop'|'treasure'|'keno-draw'|'keno-match'|'card-deal'|'feature';
export type SoundNote={note:number;at:number;duration:number;volume:number;wave:OscillatorType;end?:number};
const phrase=(notes:number[],spacing:number,duration:number,wave:OscillatorType='sine',volume=.13):SoundNote[]=>notes.map((note,i)=>({note,at:i*spacing,duration,volume,wave}));
export function soundCue(kind:SoundKind,scene='lobby'):SoundNote[]{
 switch(kind){
  case 'navigate':return [{note:58,end:82,at:0,duration:.14,volume:.08,wave:'triangle'},...phrase([79,86],.055,.12,'sine',.07)];
  case 'page':return phrase([74,81],.045,.08,'triangle',.075);
  case 'enter':return phrase([48,60,67,76],.045,.23,'triangle',.13);
  case 'back':return phrase([76,67,60],.035,.12,'sine',.08);
  case 'favorite':return phrase([84,91],.085,.25,'sine',.12);
  case 'shot':return [{note:51,end:24,at:0,duration:.095,volume:.2,wave:'triangle'},{note:82,end:49,at:.005,duration:.055,volume:.055,wave:'sine'}];
  case 'impact':return phrase([92,67],.015,.09,'triangle',.085);
  case 'reel-start':return [{note:38,end:57,at:0,duration:.25,volume:.11,wave:'triangle'},...phrase([62,66,70],.035,.06,'triangle',.055)];
  case 'reel-stop':return phrase([54,78],.018,.075,'triangle',.12);
  case 'keno-draw':return phrase([72],0,.095,'sine',.1);
  case 'keno-match':return phrase([84,91,96],.04,.2,'sine',.12);
  case 'card-deal':return [{note:90,end:56,at:0,duration:.065,volume:.075,wave:'triangle'},{note:47,at:.04,duration:.06,volume:.06,wave:'sine'}];
  case 'feature':return phrase([67,74,79,86],.065,.27,'sine',.13);
  case 'treasure':return [...phrase([48,60,67,72,76,79,84,88],.07,.48,'triangle',.1),...phrase([91,96,100],.11,.5,'sine',.07).map(n=>({...n,at:n.at+.28}))];
  case 'win':
   if(/keno|numbers/.test(scene))return phrase([79,84,88,91,96],.07,.32,'sine',.13);
   if(scene.includes('blackjack'))return [...phrase([55,62,67,71,74],.08,.4,'triangle',.12),{note:86,at:.34,duration:.5,volume:.08,wave:'sine'}];
   if(/reef|abyss|dynasty|polar|corsair|cosmic/.test(scene))return phrase([72,79,84,88,91,96],.055,.34,'sine',.12);
   return [...phrase([60,64,67,72,76,79],.065,.32,'triangle',.1),...phrase([88,91,96],.08,.35,'sine',.075).map(n=>({...n,at:n.at+.25}))];
  default:return phrase([81],0,.045,'sine',.07);
 }
}
export const soundCooldown=(kind:SoundKind)=>kind==='win'||kind==='treasure'?400:kind==='shot'?35:kind==='impact'?65:kind==='navigate'?90:30;
/** Audio feedback is bounded independently of visual input and server actions. */
export function allowSound(kind:SoundKind,time:number,last:Map<SoundKind,number>){if(time-(last.get(kind)??-Infinity)<soundCooldown(kind))return false;last.set(kind,time);return true;}
