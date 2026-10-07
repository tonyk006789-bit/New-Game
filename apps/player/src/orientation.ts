import {Capacitor} from '@capacitor/core';
import {ScreenOrientation as NativeOrientation} from '@capacitor/screen-orientation';
import type {GameOrientation} from './game-screen';
type BrowserOrientation=ScreenOrientation & {lock?:(orientation:GameOrientation)=>Promise<void>};
let desired:GameOrientation|null=null,queue=Promise.resolve();
// Serialize native calls so leaving/changing games cannot leave an earlier lock active.
export function lockGameOrientation(orientation:GameOrientation|null){
 desired=orientation;
 queue=queue.catch(()=>{}).then(async()=>{
  const target=desired;
  try{
   if(Capacitor.isNativePlatform()){if(target)await NativeOrientation.lock({orientation:target});else await NativeOrientation.unlock();}
   else {const screenOrientation=screen.orientation as BrowserOrientation|undefined;if(target)await screenOrientation?.lock?.(target);else screenOrientation?.unlock();}
  }catch{/* Unsupported browser/device policy uses the visible rotate-to-play gate. */}
 });
 return queue;
}
