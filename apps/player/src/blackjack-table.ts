import * as T from 'three';
import type {BlackjackGame} from '@new-game/game-math';

const palettes={
 'royal-blackjack':{felt:'#233b4b',wood:'#493022',trim:0xc2a368},
 'double-deck-blackjack':{felt:'#4b2634',wood:'#382724',trim:0xbb985d},
 'european-blackjack':{felt:'#23474a',wood:'#30272a',trim:0xb9b8af}
};
/** A small repeatable woven/pebbled material, generated once, without network art. */
function materialTexture(kind:'felt'|'leather'|'wood',color:string){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;
 c.fillStyle=color;c.fillRect(0,0,256,256);let seed=8137;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<18000;i++){const x=random()*256,y=random()*256;c.fillStyle=random()>.5?'#ffffff0c':'#00000016';if(kind==='wood'){c.fillRect(x,y,20+random()*80,.4);}else if(kind==='felt')c.fillRect(x,y,.6,1.4);else{c.beginPath();c.ellipse(x,y,.6+random(),.45+random(),random()*3,0,7);c.fill();}}
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='wood'?2:7,kind==='wood'?3:7);t.anisotropy=4;return t;
}
function outline(scale=1){
 const s=new T.Shape();s.moveTo(-2.35*scale,0);s.lineTo(2.35*scale,0);
 s.bezierCurveTo(2.85*scale,-.60*scale,2.45*scale,-2.35*scale,0,-2.50*scale);
 s.bezierCurveTo(-2.45*scale,-2.35*scale,-2.85*scale,-.60*scale,-2.35*scale,0);return s;
}
function slab(shape:T.Shape,depth:number,bevel:number,material:T.Material,y:number){
 const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:40}),material);
 mesh.rotation.x=-Math.PI/2;mesh.position.set(0,y,.11);mesh.receiveShadow=true;return mesh;
}
/** Real shared light/shadow space for the dealer, shoe, chips and padded table. */
export function createBlackjackTable(game:BlackjackGame){
 const p=palettes[game],group=new T.Group();group.name='Blackjack table';
 const wood=new T.MeshPhysicalMaterial({map:materialTexture('wood',p.wood),roughness:.34,clearcoat:.25,clearcoatRoughness:.36});
 group.add(slab(outline(1.06),.055,.02,wood,.995));
 const pad=outline(1.025);pad.holes.push(new T.Path(outline(.94).getPoints(80).reverse()));
 const leather=new T.MeshStandardMaterial({map:materialTexture('leather','#201e22'),roughness:.58});group.add(slab(pad,.045,.021,leather,1.065));
 const weave=materialTexture('felt',p.felt),felt=new T.MeshStandardMaterial({map:weave,bumpMap:weave,bumpScale:.0012,roughness:1});group.add(slab(outline(.944),.007,0,felt,1.101));
 // Fine metallic piping follows the padded rail instead of a flat CSS outline.
 const points=outline(.947).getPoints(120).map(v=>new T.Vector3(v.x,1.112,.11-v.y));
 const piping=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points,true),160,.0035,5,true),new T.MeshStandardMaterial({color:p.trim,metalness:.65,roughness:.4}));group.add(piping);
 const tray=new T.Mesh(new T.BoxGeometry(.45,.018,.19),new T.MeshStandardMaterial({color:0x15151d,roughness:.36,metalness:.2}));tray.position.set(-.63,1.12,.34);tray.receiveShadow=true;tray.castShadow=true;group.add(tray);
 for(let stack=0;stack<5;stack++){
  const color=[0xa04850,0x2d627c,0xb6a16d,0x514677,0xddd5bf][stack],mat=new T.MeshStandardMaterial({color,roughness:.76});
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=16;const c=canvas.getContext('2d')!;c.fillStyle='#'+color.toString(16);c.fillRect(0,0,96,16);c.fillStyle='#e6dfcd';for(let n=0;n<8;n++)c.fillRect(n*12,0,4,16);const stripe=new T.CanvasTexture(canvas);stripe.colorSpace=T.SRGBColorSpace;
  const chipSide=new T.MeshStandardMaterial({map:stripe,roughness:.72});
  for(let n=0;n<4+stack%3;n++){const chip=new T.Mesh(new T.CylinderGeometry(.031,.031,.007,24),[chipSide,mat,mat]);chip.position.set(-.79+stack*.08,1.136+n*.0075,.34);chip.receiveShadow=true;chip.castShadow=n===3+stack%3;group.add(chip);}
 }
 return group;
}
