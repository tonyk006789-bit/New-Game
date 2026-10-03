import {reactive,watch} from 'vue';
import {musicScores,musicPlaylists,musicTrack,scoreStep,TRACK_STEPS,type MusicScene} from './music-score';
export const audioPreferences=reactive({music:false,sound:true});
export const musicNow=reactive({scene:'lobby' as MusicScene,title:musicScores.lobby.name as string,index:0,total:musicPlaylists.lobby.length});
const selectedTracks=new Map<MusicScene,number>();
function trackInfo(index:number){musicNow.index=index;musicNow.title=musicTrack(musicNow.scene,index).name;musicNow.total=musicPlaylists[musicNow.scene].length;selectedTracks.set(musicNow.scene,index);}
try{const saved=JSON.parse(localStorage.getItem('ng-audio')||'{}');if(typeof saved.music==='boolean')audioPreferences.music=saved.music;if(typeof saved.sound==='boolean')audioPreferences.sound=saved.sound;}catch{/* Optional settings. */}
let context:AudioContext|undefined,musicGain:GainNode|undefined,soundGain:GainNode|undefined,noise:AudioBuffer|undefined;
let timer:ReturnType<typeof setInterval>|undefined,active=true,step=0,nextAt=0;
const musicNodes=new Set<AudioScheduledSourceNode>();
function tone(note:number,start:number,duration:number,gain:GainNode,volume=.1,type:OscillatorType='sine',music=false,kick=false){
 if(!context)return;const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(kick?135:440*2**((note-69)/12),start);
 if(kick)oscillator.frequency.exponentialRampToValueAtTime(42,start+.16);
 envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(volume,start+.006);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
 const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=type==='sawtooth'?1500:3300;
 oscillator.connect(filter);filter.connect(envelope);envelope.connect(gain);oscillator.start(start);oscillator.stop(start+duration+.02);if(music)musicNodes.add(oscillator);
 oscillator.onended=()=>{musicNodes.delete(oscillator);oscillator.disconnect();filter.disconnect();envelope.disconnect();};
}
function drum(start:number,duration:number,level:number,hat:boolean){
 if(!context||!musicGain||!noise)return;const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=noise;
 filter.type=hat?'highpass':'bandpass';filter.frequency.value=hat?7500:1800;filter.Q.value=.7;
 gain.gain.setValueAtTime(level,start);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
 source.connect(filter);filter.connect(gain);gain.connect(musicGain);source.start(start);source.stop(start+duration);musicNodes.add(source);
 source.onended=()=>{musicNodes.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};
}
function scheduleMusic(){
 if(!context||!musicGain||!active||!audioPreferences.music||context.state!=='running')return;
 if(nextAt<context.currentTime)nextAt=context.currentTime+.03;
 while(nextAt<context.currentTime+.18){
  const score=musicTrack(musicNow.scene,musicNow.index),eighth=30/score.bpm;
  for(const e of scoreStep(musicNow.scene,step,musicNow.index)){
   if(e.kind==='hat'||e.kind==='snare')drum(nextAt,e.duration,e.level,e.kind==='hat');
   else tone(e.note,nextAt,e.duration,musicGain,e.level,e.kind==='kick'?'sine':e.kind==='bass'?'triangle':e.kind==='chord'?'sawtooth':score.wave,true,e.kind==='kick');
  }
  nextAt+=eighth*(step%2?1-score.swing:1+score.swing);step++;
  if(step===TRACK_STEPS){step=0;trackInfo((musicNow.index+1)%musicNow.total);}
 }
}
function stopMusic(){clearInterval(timer);timer=undefined;for(const node of musicNodes){try{node.stop();}catch{/* Already ended. */}}musicNodes.clear();}
function update(){
 if(!context)return;musicGain!.gain.setTargetAtTime(audioPreferences.music&&active?.34:0,context.currentTime,.03);soundGain!.gain.setTargetAtTime(audioPreferences.sound&&active?.28:0,context.currentTime,.015);
 if(!active||!audioPreferences.music){stopMusic();return;}
 if(context.state==='running'&&!timer){nextAt=context.currentTime+.03;scheduleMusic();timer=setInterval(scheduleMusic,50);}
}
export function setMusicScene(scene:string){const next=Object.hasOwn(musicScores,scene)?scene as MusicScene:'lobby';if(next===musicNow.scene)return;stopMusic();step=0;musicNow.scene=next;trackInfo(selectedTracks.get(next)||0);update();}
export function selectMusicTrack(index:number){if(!Number.isInteger(index)||index<0||index>=musicNow.total)return;stopMusic();step=0;trackInfo(index);update();}
export function nextMusicTrack(){selectMusicTrack((musicNow.index+1)%musicNow.total);}
export async function unlockAudio(){
 if(!active)return;
 try{if(!context){context=new AudioContext();musicGain=context.createGain();soundGain=context.createGain();
 const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=8;musicGain.connect(limiter);soundGain.connect(limiter);limiter.connect(context.destination);
 noise=context.createBuffer(1,context.sampleRate,context.sampleRate);const data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
 if(context.state==='suspended')await context.resume();update();}catch{/* Unsupported audio never blocks play. */}
}
export function setAudioActive(value:boolean){active=value;update();if(!value)void context?.suspend();else if(context)void context.resume().then(update).catch(()=>{});}
export function playSound(kind:'click'|'shot'|'win'|'impact'|'reel-start'|'reel-stop'|'treasure'='click'){
 if(!context||!soundGain||!active||!audioPreferences.sound||context.state!=='running')return;
 const now=context.currentTime,notes=kind==='treasure'?[60,67,72,76,79,84]:kind==='win'?[72,76,79,84]:kind==='reel-start'?[48,55,60]:kind==='reel-stop'?[62,50]:kind==='shot'?[45,33]:kind==='impact'?[64,52]:[79];
 notes.forEach((note,i)=>tone(note,now+i*(kind==='win'||kind==='treasure'?.1:.025),kind==='win'||kind==='treasure'?.42:.13,soundGain!,.15,kind==='shot'?'triangle':'sine'));
}
watch(audioPreferences,()=>{try{localStorage.setItem('ng-audio',JSON.stringify(audioPreferences));}catch{/* Optional preferences. */}update();});
