/** Presentation helpers only. The server's existing Keno evaluator owns awards. */
export function kenoTicketRows(picks:number,stake:string){
 if(!Number.isInteger(picks)||picks<4||picks>10)return [];
 const units=BigInt(stake),threshold=picks<=6?1:2;
 return Array.from({length:picks+1},(_,hits)=>({hits,multiplier:Math.max(0,hits-threshold),award:(units*BigInt(Math.max(0,hits-threshold))).toString()}));
}

/** Uniform selection without replacement; this only edits a ticket, never draws a result. */
export function quickKenoPick(count=6,randomIndex:(max:number)=>number=secureIndex){
 if(!Number.isInteger(count)||count<4||count>10)throw new Error('Choose 4–10 numbers');
 const numbers=Array.from({length:80},(_,i)=>i+1);
 for(let i=0;i<count;i++){
  const offset=randomIndex(80-i);
  if(!Number.isInteger(offset)||offset<0||offset>=80-i)throw new Error('Invalid selection index');
  const next=i+offset;[numbers[i],numbers[next]]=[numbers[next],numbers[i]];
 }
 return numbers.slice(0,count).sort((a,b)=>a-b);
}
function secureIndex(max:number){
 const bytes=new Uint32Array(1),limit=Math.floor(0x100000000/max)*max;
 do{crypto.getRandomValues(bytes);}while(bytes[0]>=limit);
 return bytes[0]%max;
}
