export type GameOrientation='portrait'|'landscape';
export const gameResolutions=[{id:'720p',label:'720p · HD',width:1280,height:720},{id:'1080p',label:'1080p · Full HD',width:1920,height:1080},{id:'2k',label:'2K · QHD',width:2560,height:1440}] as const;
export type GameResolution=typeof gameResolutions[number]['id'];
export function validGameResolution(value:unknown):value is GameResolution{return gameResolutions.some(r=>r.id===value);}
export function renderDimensions(resolution:GameResolution,portrait=false){const size=gameResolutions.find(r=>r.id===resolution)!;return portrait?{width:size.height,height:size.width}:{width:size.width,height:size.height};}
export function gameRenderDensity(resolution:GameResolution){return renderDimensions(resolution).width/1280;}
export function gameFrame(portrait:boolean){return portrait?{width:450,height:800}:{width:1280,height:720};}
export function fitGameFrame(width:number,height:number,portrait:boolean,resolution:GameResolution='720p'){const frame=gameFrame(portrait),output=renderDimensions(resolution,portrait);return Math.max(0,Math.min(output.width/frame.width,width/frame.width,height/frame.height));}
export function needsGameRotation(width:number,height:number,portrait:boolean,mobile:boolean){return mobile&&width!==height&&(portrait?width>height:height>width);}
