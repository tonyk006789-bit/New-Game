import {reactive,watch} from 'vue';
export const audioPreferences=reactive({music:false,sound:true});
try{const saved=JSON.parse(localStorage.getItem('ng-audio')||'{}');if(typeof saved.music==='boolean')audioPreferences.music=saved.music;if(typeof saved.sound==='boolean')audioPreferences.sound=saved.sound;}catch{/* Optional settings. */}
let context:AudioContext|undefined,musicGain:GainNode|undefined,soundGain:GainNode|undefined,timer:ReturnType<typeof setInterval>|undefined,active=true,bar=0;
const melody=[60,64,67,71,69,67,64,62,57,60,64,67,65,64,60,59];
function tone(note:number,start:number,duration:number,gain:GainNode,volume=.1,type:OscillatorType='sine'){
 if(!context)return;const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.type=type;oscillator.frequency.value=440*2**((note-69)/12);
 envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(volume,start+.018);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
 oscillator.connect(envelope);envelope.connect(gain);oscillator.start(start);oscillator.stop(start+duration+.02);oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
}
function scheduleMusic(){
 if(!context||!musicGain||!active||!audioPreferences.music||context.state!=='running')return;
 const start=context.currentTime+.025;
 for(let i=0;i<4;i++)tone(melody[(bar*4+i)%melody.length],start+i*.45,.7,musicGain,.13,'triangle');
 tone([48,45,53,55][bar%4],start,1.75,musicGain,.1);bar++;
}
function update(){
 clearInterval(timer);timer=undefined;
 if(!context)return;
 musicGain!.gain.setTargetAtTime(audioPreferences.music&&active?.24:0,context.currentTime,.03);
 soundGain!.gain.setTargetAtTime(audioPreferences.sound&&active?.28:0,context.currentTime,.015);
 if(active&&audioPreferences.music){scheduleMusic();timer=setInterval(scheduleMusic,1800);}
}
export async function unlockAudio(){
 if(!active)return;
 try{if(!context){context=new AudioContext();musicGain=context.createGain();soundGain=context.createGain();musicGain.connect(context.destination);soundGain.connect(context.destination);update();}
 if(context.state==='suspended')await context.resume();if(audioPreferences.music&&!timer)update();}catch{/* Unsupported audio never blocks play. */}
}
export function setAudioActive(value:boolean){active=value;update();if(!value)void context?.suspend();else if(context)void context.resume().then(update).catch(()=>{});}
export function playSound(kind:'click'|'shot'|'win'|'impact'='click'){
 if(!context||!soundGain||!active||!audioPreferences.sound||context.state!=='running')return;
 const now=context.currentTime;
 const notes=kind==='win'?[72,76,79,84]:kind==='shot'?[45,33]:kind==='impact'?[64,52]:[79];
 notes.forEach((note,i)=>tone(note,now+i*(kind==='win'?.1:.025),kind==='win'?.42:.13,soundGain!,.15,kind==='shot'?'triangle':'sine'));
}
watch(audioPreferences,()=>{try{localStorage.setItem('ng-audio',JSON.stringify(audioPreferences));}catch{/* Optional preferences. */}update();});
