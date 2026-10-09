import {reactive,watch} from 'vue';
import {musicScores,musicPlaylists,scoreEvents,type MusicScene,type MusicScore} from './music-score';
import {musicCollections,validMusicCollection,type MusicCollectionId} from './music-collections';
import {loadMusicBank,sampledNote} from './music-sampler';
import {soundCue,allowSound,type SoundKind} from './sound-design';
export const audioPreferences=reactive({music:false,sound:true});
export const musicNow=reactive({scene:'lobby' as MusicScene,collection:'game' as MusicCollectionId,title:musicScores.lobby.name as string,index:0,total:musicPlaylists.lobby.length,status:'idle' as 'idle'|'loading'|'ready'|'unavailable'});
const selectedTracks=new Map<string,number>();
const trackKey=()=>`${musicNow.scene}:${musicNow.collection}`;
export function currentMusicPlaylist():readonly MusicScore[]{return musicNow.collection==='game'?musicPlaylists[musicNow.scene]:musicCollections[musicNow.collection].tracks;}
function trackInfo(index:number){const tracks=currentMusicPlaylist();musicNow.index=index%tracks.length;musicNow.title=tracks[musicNow.index].name;musicNow.total=tracks.length;selectedTracks.set(trackKey(),musicNow.index);}
try{const saved=JSON.parse(localStorage.getItem('ng-audio')||'{}');if(typeof saved.music==='boolean')audioPreferences.music=saved.music;if(typeof saved.sound==='boolean')audioPreferences.sound=saved.sound;}catch{/* Optional settings. */}
try{const saved=localStorage.getItem('ng-music-collection');if(validMusicCollection(saved)){musicNow.collection=saved;trackInfo(0);}}catch{/* Optional music selection. */}
let context:AudioContext|undefined,musicGain:GainNode|undefined,soundGain:GainNode|undefined,echo:DelayNode|undefined;
let bank:Awaited<ReturnType<typeof loadMusicBank>>|undefined,loadingBank:Promise<void>|undefined;
let timer:ReturnType<typeof setInterval>|undefined,active=true,step=0,nextAt=0;
const musicNodes=new Set<AudioScheduledSourceNode>();
const soundNodes=new Set<AudioScheduledSourceNode>(),lastSounds=new Map<SoundKind,number>();
function stopSounds(){for(const node of soundNodes){try{node.stop();}catch{/* Already ended. */}}soundNodes.clear();lastSounds.clear();}
function tone(note:number,start:number,duration:number,gain:GainNode,volume=.1,type:OscillatorType='sine',end?:number){
 if(!context||soundNodes.size>=32)return;const oscillator=context.createOscillator(),envelope=context.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(440*2**((note-69)/12),start);
 if(end!==undefined)oscillator.frequency.exponentialRampToValueAtTime(440*2**((end-69)/12),start+duration);
 envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(volume,start+.006);envelope.gain.exponentialRampToValueAtTime(.0001,start+duration);
 const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=type==='sawtooth'?1500:3300;
 oscillator.connect(filter);filter.connect(envelope);envelope.connect(gain);oscillator.start(start);oscillator.stop(start+duration+.02);soundNodes.add(oscillator);
 oscillator.onended=()=>{soundNodes.delete(oscillator);oscillator.disconnect();filter.disconnect();envelope.disconnect();};
}
function scheduleMusic(){
 if(!context||!musicGain||!bank||!echo||!active||!audioPreferences.music||context.state!=='running')return;
 if(nextAt<context.currentTime)nextAt=context.currentTime+.03;
 while(nextAt<context.currentTime+.18){
  const score=currentMusicPlaylist()[musicNow.index],sixteenth=15/score.bpm;
  echo.delayTime.setTargetAtTime(45/score.bpm,context.currentTime,.1);
  for(const e of scoreEvents(score,step))sampledNote(context,bank,e,nextAt,musicGain,echo,musicNodes);
  nextAt+=sixteenth*(step%2?1-score.swing:1+score.swing);step++;
  if(step===score.barSteps*64){step=0;trackInfo((musicNow.index+1)%musicNow.total);}
 }
}
function stopMusic(){clearInterval(timer);timer=undefined;for(const node of musicNodes){try{node.stop();}catch{/* Already ended. */}}musicNodes.clear();}
function update(){
 if(!context)return;musicGain!.gain.setTargetAtTime(audioPreferences.music&&active?.34:0,context.currentTime,.03);soundGain!.gain.setTargetAtTime(audioPreferences.sound&&active?.28:0,context.currentTime,.015);
 if(!active||!audioPreferences.sound)stopSounds();
 if(!active||!audioPreferences.music){stopMusic();return;}
 if(context.state==='running'&&bank&&!timer){nextAt=context.currentTime+.03;scheduleMusic();timer=setInterval(scheduleMusic,50);}
}
export function setMusicScene(scene:string){const next=Object.hasOwn(musicScores,scene)?scene as MusicScene:'lobby';if(next===musicNow.scene)return;stopMusic();step=0;musicNow.scene=next;trackInfo(selectedTracks.get(trackKey())||0);update();}
export function selectMusicCollection(id:string){if(!validMusicCollection(id)||id===musicNow.collection)return;stopMusic();step=0;musicNow.collection=id;trackInfo(selectedTracks.get(trackKey())||0);try{localStorage.setItem('ng-music-collection',id);}catch{/* Session selection remains usable. */}update();}
export function selectMusicTrack(index:number){if(!Number.isInteger(index)||index<0||index>=musicNow.total)return;stopMusic();step=0;trackInfo(index);update();}
export function nextMusicTrack(){selectMusicTrack((musicNow.index+1)%musicNow.total);}
export async function unlockAudio(){
 if(!active)return;
 try{if(!context){context=new AudioContext();musicGain=context.createGain();soundGain=context.createGain();
 const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=8;musicGain.connect(limiter);soundGain.connect(limiter);limiter.connect(context.destination);
 echo=context.createDelay(1);const feedback=context.createGain(),wet=context.createGain(),lowpass=context.createBiquadFilter();feedback.gain.value=.18;wet.gain.value=.16;lowpass.type='lowpass';lowpass.frequency.value=2800;
 echo.connect(lowpass);lowpass.connect(wet);wet.connect(musicGain);lowpass.connect(feedback);feedback.connect(echo);}
 if(context.state==='suspended')await context.resume();
 if(audioPreferences.music&&!bank){loadingBank||= (async()=>{musicNow.status='loading';try{bank=await loadMusicBank(context!);musicNow.status='ready';}catch{musicNow.status='unavailable';}finally{loadingBank=undefined;}})();await loadingBank;}
 update();}catch{musicNow.status='unavailable';/* Unsupported audio never blocks play. */}
}
export function setAudioActive(value:boolean){active=value;update();if(!value)void context?.suspend();else if(context)void context.resume().then(update).catch(()=>{});}
export function playSound(kind:SoundKind='click'){
 if(!context||!soundGain||!active||!audioPreferences.sound||context.state!=='running')return;
 const now=context.currentTime;if(!allowSound(kind,now*1000,lastSounds))return;
 for(const note of soundCue(kind,musicNow.scene))tone(note.note,now+note.at,note.duration,soundGain,note.volume,note.wave,note.end);
}
watch(audioPreferences,()=>{try{localStorage.setItem('ng-audio',JSON.stringify(audioPreferences));}catch{/* Optional preferences. */}update();});
