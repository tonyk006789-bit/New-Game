export function kenoPageSize(compact:boolean,scale:number){return compact?(scale<.5?20:40):80;}
export function kenoPageNumbers(page:number,size:number){const safeSize=[20,40,80].includes(size)?size:80,clamped=Math.max(0,Math.min(80/safeSize-1,Math.floor(page)));return Array.from({length:safeSize},(_,i)=>clamped*safeSize+i+1);}
