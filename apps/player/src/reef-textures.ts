import {Assets,Filter,GlProgram,Rectangle,RenderTexture,Sprite,Texture,type Application} from 'pixi.js';
const vertex=`in vec2 aPosition;out vec2 vTextureCoord;uniform vec4 uInputSize;uniform vec4 uOutputFrame;uniform vec4 uOutputTexture;void main(){vec2 p=aPosition*uOutputFrame.zw+uOutputFrame.xy;p.x=p.x*(2.0/uOutputTexture.x)-1.0;p.y=p.y*(2.0*uOutputTexture.z/uOutputTexture.y)-uOutputTexture.z;gl_Position=vec4(p,0.0,1.0);vTextureCoord=aPosition*(uOutputFrame.zw*uInputSize.zw);}`;
const fragment=`in vec2 vTextureCoord;uniform sampler2D uTexture;out vec4 finalColor;void main(){vec4 c=texture(uTexture,vTextureCoord);float spill=max(0.0,c.g-max(c.r,c.b));float key=smoothstep(0.16,0.58,spill);float a=c.a*(1.0-key);c.g=min(c.g,max(c.r,c.b)+0.12);finalColor=vec4(c.rgb*a,a);}`;
/** The atlas matte is removed by the GPU once, then all creatures share twelve cached textures. */
export async function reefTextures(app:Application){
 const sources=await Promise.all(['/art/reef-creatures-v6.png','/art/reef-cannons-v6.png'].map(url=>Assets.load<Texture>(url)));
 const filter=new Filter({glProgram:GlProgram.from({vertex,fragment}),padding:0});
 function crop(source:Texture,x:number,y:number,width:number,height:number){
  const texture=new Texture({source:source.source,frame:new Rectangle(x,y,width,height)}),sprite=new Sprite(texture);
  sprite.filters=[filter];const target=RenderTexture.create({width,height,resolution:1});
  app.renderer.render({container:sprite,target,clear:true});sprite.destroy();texture.destroy();return target;
 }
 const regions=[[8,65,365,350],[392,75,368,310],[776,60,361,380],[1140,90,395,310],[5,490,384,440],[393,486,370,445],[779,490,350,445],[1130,510,405,405]];
 const creatures=regions.map(([x,y,w,h])=>crop(sources[0],x,y,w,h));
 const cannons=Array.from({length:4},(_,i)=>crop(sources[1],i%2*768,Math.floor(i/2)*512,768,512));
 filter.destroy();return {creatures,cannons};
}
