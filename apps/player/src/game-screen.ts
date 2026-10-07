export type GameOrientation='portrait'|'landscape';
export function gameFrame(portrait:boolean){return portrait?{width:450,height:800}:{width:1280,height:720};}
export function fitGameFrame(width:number,height:number,portrait:boolean){const frame=gameFrame(portrait);return Math.max(.05,Math.min(1,width/frame.width,height/frame.height));}
export function needsGameRotation(width:number,height:number,portrait:boolean,mobile:boolean){return mobile&&width!==height&&(portrait?width>height:height>width);}
