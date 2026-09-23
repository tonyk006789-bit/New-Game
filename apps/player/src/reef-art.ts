import {Container,Graphics} from 'pixi.js';
// Original vector sprites, drawn at logical table scale. No downloaded provider art.
export function reefSprite(species:number){
 const view=new Container(),tail=new Graphics(),body=new Graphics();
 const line={color:0x09263f,width:2.2},gold={color:0xffed99,width:1.1};
 const eye=(x:number,y:number,r=5)=>{body.circle(x,y,r+2).fill(0xfff4c9).circle(x+1,y,r).fill(0x122444).circle(x+2,y-2,1.6).fill(0xffffff);};
 if(species===3){ // Shark: forked tail, dorsal fin, gills and toothed jaw.
  tail.poly([-32,0,-66,-31,-56,-3,-62,23]).fill(0x367c9f).stroke(line);
  body.poly([-29,-8,-7,-14,1,-40,17,-13,34,-10,61,2,33,17,-16,14,-36,4]).fill(0x3698b9).stroke(line)
   .poly([-24,6,46,3,56,5,29,15,-15,12]).fill(0xb8f0d9)
   .poly([0,9,-21,34,21,14]).fill(0x20647f).stroke(line)
   .poly([-24,-9,5,-15,34,-9,46,-1,-13,-1]).fill({color:0x9fefff,alpha:.48});
  body.moveTo(39,10).lineTo(51,7).stroke({color:0x123144,width:2});
  for(let i=0;i<3;i++){body.moveTo(22-i*5,-5).lineTo(20-i*5,6).stroke({color:0x165377,width:1.5});body.poly([40+i*3,9,42+i*3,9,41+i*3,12]).fill(0xffffff);}eye(37,-4,3);
 }else if(species===4){
  tail.ellipse(-15,-22,22,8).ellipse(-15,22,22,8).ellipse(13,-24,21,9).ellipse(13,24,21,9).fill(0x67b257).stroke(line);
  body.ellipse(35,0,15,11).fill(0xa5cd68).stroke(line).ellipse(0,1,32,25).fill(0x29483b).stroke(gold).ellipse(0,-2,29,23).fill(0x50924c);
  for(const [x,y] of [[-14,-11],[5,-12],[-18,6],[2,8],[19,0]])body.poly([x-9,y-5,x-1,y-10,x+9,y-5,x+8,y+6,x,y+10,x-10,y+3]).fill(0x2f723e).stroke({color:0xc2d46e,width:1.5});
  body.ellipse(-7,-11,17,5).fill({color:0xf4ffaf,alpha:.2});eye(40,-4,2.4);
 }else if(species===5){
  tail.moveTo(-15,0).bezierCurveTo(-60,4,-58,-20,-88,-8).stroke({color:0xa191dc,width:5});
  body.poly([36,0,7,-13,-26,-53,-17,-17,-37,0,-17,17,-26,53,7,13]).fill(0x634fb4).stroke(line)
   .poly([30,0,4,-10,-23,-45,-9,-12,-22,0,-9,12,-23,45,4,10]).fill(0xa993ec)
   .ellipse(9,0,22,10).fill(0x534889);
  for(let i=0;i<9;i++)body.circle(-12+(i%3)*9,Math.floor(i/3)*7-7,1.4).fill(0xd6d7ff);eye(25,-6,2);eye(25,6,2);
 }else if(species===6){
  for(let i=0;i<7;i++){const y=(i-3)*6;tail.moveTo(0,y).bezierCurveTo(-30,y+15,-35,y-13,-59-i*2,y+10).stroke({color:i%2?0xff84ea:0x966ef4,width:i%2?2:3,alpha:.8});}
  body.ellipse(10,0,23,27).fill({color:0xbd49d9,alpha:.85}).stroke({color:0xf4a1fb,width:2}).ellipse(16,-4,15,20).fill({color:0xffa2e8,alpha:.65})
   .ellipse(22,-8,6,11).fill({color:0xffe5ff,alpha:.65});
  for(let y=-18;y<=18;y+=9)body.circle(-3,y,4).fill(0xf3adf9);eye(22,-3,2.5);
 }else{
  const colors=[0xff922c,0x298bff,0xffce36,0,0,0,0,0xffb823],color=colors[species];
  const dragon=species===7,size=dragon?1.5:1;view.scale.set(size);
  tail.poly([-20,0,-49,-24,-42,-2,-49,24]).fill(dragon?0xff7131:species===1?0xffd944:color).stroke(line);
  for(let y=-18;y<=18;y+=7)tail.moveTo(-23,0).lineTo(-44,y).stroke({color:0xffe390,width:1});
  body.poly([-21,-6,-12,-30,4,-23,22,-11]).fill(dragon?0xff723b:0xffe060).stroke(line)
   .ellipse(0,1,32,21).fill(0x593617).stroke(line).ellipse(0,-1,30,20).fill(color)
   .ellipse(-4,-8,23,10).fill({color:0xfffcaf,alpha:.35})
   .poly([-7,6,-15,25,12,14]).fill(0xffdb59).stroke(gold);
  if(species===0)for(const x of [-18,0,18])body.ellipse(x,-1,5,17-Math.abs(x)/5).fill(0x09263f).ellipse(x,-1,3,15-Math.abs(x)/5).fill(0xfff4df);
  if(species===1)body.moveTo(-24,-7).bezierCurveTo(-2,-18,15,-14,8,1).bezierCurveTo(3,9,-8,14,-18,10).stroke({color:0x082c70,width:8});
  if(species===2||dragon){for(let x=-18;x<16;x+=7)for(let y=-8;y<12;y+=7)body.arc(x,y,4,-1,1).stroke({color:0xb3781c,width:1.2,alpha:.65});}
  if(dragon){body.poly([9,-16,17,-32,20,-14,27,-25,26,-9]).fill(0xffed99).stroke(line);body.moveTo(26,8).bezierCurveTo(57,20,48,-6,64,3).stroke({color:0xffd957,width:2});}
  eye(20,-5,4);body.arc(25,8,5,0,1.4).stroke({color:0x89481b,width:1.5});
 }
 view.addChild(tail,body);return {view,tail,nativeScale:species===7?1.5:1};
}
