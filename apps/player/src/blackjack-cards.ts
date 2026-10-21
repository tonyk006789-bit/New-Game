import type {Card} from '@new-game/game-math';

export const cardSuits=['♠','♥','♦','♣'];
export const cardRank=(rank:number)=>rank===1?'A':rank>10?['J','Q','K'][rank-11]:String(rank);
export const cardLabel=(card:Card|null)=>card?`${cardRank(card.rank)} of ${['spades','hearts','diamonds','clubs'][card.suit]}`:'Face down card';
/** Standard pip count and mirrored lower half; shared by held and landed cards. */
export function cardPips(rank:number):{x:number;y:number;flipped:boolean}[]{
 const points:[number,number][]=[];
 const row=(y:number)=>points.push([29,y],[71,y]);
 if(rank===1)points.push([50,50]);
 else if(rank<=3){points.push([50,23],[50,77]);if(rank===3)points.push([50,50]);}
 else if(rank<=10){row(23);row(77);if([6,7,8].includes(rank))row(50);if(rank>=9){row(41);row(59);}if([5,7,9].includes(rank))points.push([50,50]);if(rank===8)points.push([50,36],[50,64]);if(rank===10)points.push([50,32],[50,68]);}
 return points.map(([x,y])=>({x,y,flipped:y>50}));
}

/** Original card artwork. No downloaded deck or outcome-specific decoration. */
export function drawPlayingCard(context:CanvasRenderingContext2D,card:Card|null){
 const c=context,w=240,h=336;c.clearRect(0,0,w,h);
 c.fillStyle=card?'#fffdf4':'#f2eee2';c.beginPath();c.roundRect(0,0,w,h,10);c.fill();
 c.strokeStyle='#c9c5b9';c.lineWidth=2;c.stroke();
 if(!card){
  c.fillStyle='#28283f';c.beginPath();c.roundRect(12,12,w-24,h-24,5);c.fill();c.save();c.beginPath();c.rect(17,17,w-34,h-34);c.clip();c.strokeStyle='#b8a57d';c.lineWidth=.8;
  for(let n=-h;n<w+h;n+=13){c.beginPath();c.moveTo(n,0);c.lineTo(n+h,h);c.moveTo(n,0);c.lineTo(n-h,h);c.stroke();}c.restore();
  c.fillStyle='#28283f';c.beginPath();c.ellipse(w/2,h/2,43,55,0,0,Math.PI*2);c.fill();c.strokeStyle='#d7c18d';c.lineWidth=2;c.stroke();c.fillStyle='#ead9b0';c.font='58px Georgia';c.textAlign='center';c.fillText('♠',w/2,h/2+20);return;
 }
 const suit=cardSuits[card.suit],rank=cardRank(card.rank);c.fillStyle=card.suit===1||card.suit===2?'#b12c3b':'#20212c';
 for(let corner=0;corner<2;corner++){c.save();if(corner){c.translate(w,h);c.rotate(Math.PI);}c.textAlign='center';c.font='bold 36px Georgia';c.fillText(rank,24,40);c.font='29px Georgia';c.fillText(suit,24,69);c.restore();}
 if(card.rank<=10){for(const p of cardPips(card.rank)){c.save();c.translate(w*p.x/100,h*p.y/100);if(p.flipped)c.rotate(Math.PI);c.textAlign='center';c.textBaseline='middle';c.font=`${card.rank===1?124:64}px Georgia`;c.fillText(suit,0,1);c.restore();}}
 else{
  c.strokeStyle='#b39b6b';c.lineWidth=2;c.strokeRect(57,66,126,204);c.fillStyle='#b39b6b22';c.fillRect(60,69,120,198);
  for(let side=0;side<2;side++){c.save();if(side){c.translate(w,h);c.rotate(Math.PI);}c.textAlign='center';c.fillStyle='#a58b52';c.font='48px Georgia';c.fillText('♛',120,120);c.fillStyle=card.suit===1||card.suit===2?'#b12c3b':'#20212c';c.font='bold 37px Georgia';c.fillText(rank,120,157);c.restore();}
 }
}
