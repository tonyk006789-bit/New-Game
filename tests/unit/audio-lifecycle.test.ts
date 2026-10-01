import {afterEach,describe,expect,it,vi} from 'vitest';
import {nextTick} from 'vue';

describe('casino audio lifecycle',()=>{
 afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();vi.resetModules();});
 it('keeps one scheduler, replaces old tracks, and respects independent mute and background settings',async()=>{
  vi.useFakeTimers();
  const parameter=()=>({value:0,setValueAtTime:vi.fn(),linearRampToValueAtTime:vi.fn(),exponentialRampToValueAtTime:vi.fn(),setTargetAtTime:vi.fn()});
  const sources:{stop:ReturnType<typeof vi.fn>}[]=[];
  const node=()=>({connect:vi.fn(),disconnect:vi.fn()});
  const source=()=>{const result={...node(),frequency:parameter(),start:vi.fn(),stop:vi.fn(),type:'sine',onended:null};sources.push(result);return result;};
  const context={state:'suspended',currentTime:1,sampleRate:128,destination:{},
   createGain:()=>({...node(),gain:parameter()}),createOscillator:source,createBufferSource:source,
   createBiquadFilter:()=>({...node(),type:'lowpass',frequency:parameter(),Q:parameter()}),
   createDynamicsCompressor:()=>({...node(),threshold:parameter(),ratio:parameter()}),
   createBuffer:()=>({getChannelData:()=>new Float32Array(128)}),
   resume:vi.fn(async()=>{context.state='running';}),suspend:vi.fn(async()=>{context.state='suspended';})};
  vi.stubGlobal('AudioContext',class {constructor(){return context;}});
  vi.stubGlobal('localStorage',{getItem:()=>null,setItem:vi.fn()});
  const audio=await import('../../apps/player/src/audio');
  audio.audioPreferences.music=true;await nextTick();await audio.unlockAudio();
  expect(vi.getTimerCount()).toBe(1);expect(sources.length).toBeGreaterThan(0);
  const firstTrack=[...sources];await audio.unlockAudio();expect(vi.getTimerCount()).toBe(1);
  audio.setMusicScene('abyss-legends');expect(vi.getTimerCount()).toBe(1);
  expect(firstTrack.every(s=>s.stop.mock.calls.length===2)).toBe(true);
  expect(audio.musicNow.scene).toBe('abyss-legends');
  audio.audioPreferences.music=false;await nextTick();expect(vi.getTimerCount()).toBe(0);
  const before=sources.length;audio.playSound('shot');expect(sources.length).toBeGreaterThan(before);
  audio.audioPreferences.sound=false;await nextTick();const muted=sources.length;audio.playSound('treasure');expect(sources.length).toBe(muted);
  audio.audioPreferences.music=true;await nextTick();expect(vi.getTimerCount()).toBe(1);
  audio.setAudioActive(false);expect(vi.getTimerCount()).toBe(0);expect(context.suspend).toHaveBeenCalled();
  audio.setAudioActive(true);await Promise.resolve();expect(vi.getTimerCount()).toBe(1);
  audio.setAudioActive(false);
 });
});
