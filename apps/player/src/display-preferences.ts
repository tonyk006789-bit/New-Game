import {reactive,watch} from 'vue';
import {validGameResolution,type GameResolution} from './game-screen';
let resolution:GameResolution='1080p';
try{const saved=localStorage.getItem('ng-resolution');if(validGameResolution(saved))resolution=saved;}catch{/* Optional display preference. */}
export const displayPreferences=reactive({resolution});
watch(()=>displayPreferences.resolution,value=>{try{localStorage.setItem('ng-resolution',value);}catch{/* Session preference still works. */}});
