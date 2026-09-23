export const mathStatus = Object.freeze({
  'neon-sevens': { approved: false, profileId: null, mathHash: null },
  'jade-fortune': { approved: false, profileId: null, mathHash: null },
  'coin-carnival': { approved: false, profileId: null, mathHash: null },
  'aurora-vault': { approved: false, profileId: null, mathHash: null },
  'ember-relics': { approved: false, profileId: null, mathHash: null },
  'temple-lights': { approved: false, profileId: null, mathHash: null },
  'orchard-numbers': { approved: false, profileId: null, mathHash: null },
  'reef-party': { approved: false, profileId: null, mathHash: null }
} as const);

export function requireApprovedGame(_gameId: string): never {
  void _gameId;
  // Deliberately no switch to live play in S0. A reviewed approval registry and durable settlement are required.
  throw new Error('GAME_MATH_NOT_APPROVED');
}
export const symbols = ['moon', 'lotus', 'gem', 'sun', 'leaf'] as const;
export type SymbolId = typeof symbols[number];
// Fixed visual storyboard, never an outcome distribution, round, wager, or payable grid.
export function previewGrid(frame: number): SymbolId[][] {
  const offset = Math.abs(Math.trunc(frame));
  return Array.from({ length: 3 }, (_, row) => Array.from({ length: 5 }, (_, col) => symbols[(row * 2 + col + offset) % symbols.length]));
}
export function evaluateLines(grid: readonly (readonly string[])[], lines: readonly (readonly number[])[], paytable: Readonly<Record<string, Readonly<Record<number, bigint>>>>): bigint {
  if (grid.length !== 3 || grid.some(row => row.length !== 5)) throw new Error('Expected a 5×3 grid');
  let award = 0n;
  for (const line of lines) {
    if (line.length !== 5 || line.some(row => !Number.isInteger(row) || row < 0 || row > 2)) throw new Error('Invalid payline');
    const symbol = grid[line[0]][0];
    let count = 1;
    while (count < 5 && grid[line[count]][count] === symbol) count++;
    const payout = paytable[symbol]?.[count] ?? 0n;
    if (payout < 0n) throw new Error('Negative award');
    award += payout;
  }
  return award;
}

// These rules produce nonpayable practice sequences, never credit awards or a production profile.
export type RandomIndex = (exclusiveMax: number) => number;
export type VaultFrame = { cells: number[]; added: number[]; remaining: number };
export type VaultSequence = { kind: 'vault'; frames: VaultFrame[]; collected: number };
export type CascadeFrame = { grid: string[][]; clusters: number[][]; removed: number[] };
export type CascadeSequence = { kind: 'cascade'; frames: CascadeFrame[]; cleared: number; capped: boolean };
export type FeatureResult = {
  id: string; game: 'aurora-vault' | 'ember-relics'; mode: 'PRACTICE'|'STAGING'; ruleVersion: string;
  sequence: VaultSequence | CascadeSequence; description: string; creditsChanged: boolean;
};
export const relicSymbols = ['ruby', 'sapphire', 'emerald', 'amber', 'amethyst'] as const;

export function vaultSequence(random: RandomIndex): VaultSequence {
  const cells = Array<number>(15).fill(0);
  const available = Array.from({ length: 15 }, (_, index) => index);
  const seeds: number[] = [];
  for (let index = 0; index < 3; index++) {
    const cell = available.splice(random(available.length), 1)[0];
    cells[cell] = 1 + random(4); seeds.push(cell);
  }
  let remaining = 3;
  const frames: VaultFrame[] = [{ cells: [...cells], added: seeds, remaining }];
  // At most 12 successful pulses and 2 empty pulses before each success, then 3 empty pulses.
  while (remaining > 0 && cells.some(cell => cell === 0)) {
    const added: number[] = [];
    cells.forEach((cell, index) => {
      if (cell === 0 && random(12) === 0) { cells[index] = 1 + random(4); added.push(index); }
    });
    remaining = added.length ? 3 : remaining - 1;
    frames.push({ cells: [...cells], added, remaining });
  }
  return { kind: 'vault', frames, collected: cells.filter(Boolean).length };
}

export function findClusters(grid: string[][]): number[][] {
  const height = grid.length, width = grid[0]?.length || 0;
  if (!height || !width || grid.some(row => row.length !== width)) throw new Error('Expected rectangular grid');
  const visited = new Set<number>(), clusters: number[][] = [];
  for (let start = 0; start < width * height; start++) {
    if (visited.has(start)) continue;
    const group = [start]; visited.add(start);
    for (let index = 0; index < group.length; index++) {
      const cell = group[index], row = Math.floor(cell / width), column = cell % width;
      for (const [r, c] of [[row - 1, column], [row + 1, column], [row, column - 1], [row, column + 1]]) {
        const next = r * width + c;
        if (r >= 0 && r < height && c >= 0 && c < width && !visited.has(next) && grid[r][c] === grid[row][column]) {
          visited.add(next); group.push(next);
        }
      }
    }
    if (group.length >= 4) clusters.push(group.sort((a, b) => a - b));
  }
  return clusters;
}

export function collapseGrid(grid: string[][], removed: number[], random: RandomIndex): string[][] {
  const height = grid.length, width = grid[0].length, cleared = new Set(removed);
  const next = grid.map(row => [...row]);
  for (let col = 0; col < width; col++) {
    const survivors = grid.map(row => row[col]).filter((_, row) => !cleared.has(row * width + col));
    const replacements = Array.from({ length: height - survivors.length }, () => relicSymbols[random(relicSymbols.length)]);
    [...replacements, ...survivors].forEach((symbol, row) => { next[row][col] = symbol; });
  }
  return next;
}

export function cascadeSequence(random: RandomIndex): CascadeSequence {
  let grid: string[][] = Array.from({ length: 5 }, () => Array.from({ length: 6 }, () => relicSymbols[random(relicSymbols.length)]));
  const frames: CascadeFrame[] = []; let cleared = 0;
  for (let step = 0; step < 6; step++) {
    const clusters = findClusters(grid), removed = clusters.flat();
    if (!removed.length) break;
    frames.push({ grid, clusters, removed }); cleared += removed.length;
    grid = collapseGrid(grid, removed, random);
  }
  const capped = frames.length === 6;
  frames.push({ grid, clusters: [], removed: [] });
  return { kind: 'cascade', frames, cleared, capped };
}

export function featurePractice(game: FeatureResult['game'], id: string, random: RandomIndex): FeatureResult {
  const sequence = game === 'aurora-vault' ? vaultSequence(random) : cascadeSequence(random);
  const description = sequence.kind === 'vault'
    ? `${sequence.collected} of 15 crystals locked. Vault sequence complete.`
    : `${sequence.cleared} relics cleared in ${sequence.frames.length - 1} cascades.${sequence.capped ? ' Six-cascade practice limit reached.' : ''}`;
  return { id, game, mode: 'PRACTICE', ruleVersion: 'practice-v1', sequence, description, creditsChanged: false };
}

// Reproducible local storyboard only. The API always supplies node:crypto.randomInt.
export function storyboardRandom(seed: number): RandomIndex {
  let state = seed >>> 0;
  return max => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return Math.floor(state / 4294967296 * max); };
}

// Original cabinet practice rules. Counts describe matches/collectibles, never payable units.
export const cabinetGames = {
  'neon-sevens': { columns: 5, symbols: ['seven', 'cherry', 'bell', 'bar', 'gem'], lines: [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2]], wild: false },
  'jade-fortune': { columns: 5, symbols: ['dragon', 'coin', 'lotus', 'gem', 'bell', 'leaf', 'seven'], lines: [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1]], wild: true },
  'coin-carnival': { columns: 5, symbols: ['coin', 'cherry', 'bell', 'bar', 'seven'], lines: [], wild: false }
} as const;
export type CabinetGameId = keyof typeof cabinetGames;
export type CabinetMatch = { line: number; rows: number[]; symbol: string; count: number };
export type CabinetFrame = { grid: string[][]; locked: number[]; remaining: number };
export type CabinetResult = {
  id: string; game: CabinetGameId; mode: 'PRACTICE'|'STAGING'; ruleVersion: string;
  frames: CabinetFrame[]; matches: CabinetMatch[]; collected: number; description: string; creditsChanged: boolean;
};
export function cabinetMatches(game: CabinetGameId, grid: string[][]): CabinetMatch[] {
  const profile = cabinetGames[game];
  if (grid.length !== 3 || grid.some(row => row.length !== profile.columns || row.some(symbol => !(profile.symbols as readonly string[]).includes(symbol)))) throw new Error('Invalid cabinet grid');
  const matches: CabinetMatch[] = [];
  profile.lines.forEach((rows, line) => {
    const path = rows.map((row, col) => grid[row][col]);
    const symbol = profile.wild ? path.find(item => item !== 'dragon') || 'dragon' : path[0];
    let count = 0;
    while (count < path.length && (path[count] === symbol || (profile.wild && path[count] === 'dragon'))) count++;
    if (count >= 3) matches.push({ line: line + 1, rows: [...rows], symbol, count });
  });
  return matches;
}
export function cabinetPractice(game: CabinetGameId, id: string, random: RandomIndex): CabinetResult {
  const profile = cabinetGames[game];
  const draw = () => profile.symbols[random(profile.symbols.length)];
  let grid = Array.from({ length: 3 }, () => Array.from({ length: profile.columns }, draw));
  let locked: number[] = [], remaining = game === 'coin-carnival' ? 3 : 0;
  if (game === 'coin-carnival') locked = grid[1].flatMap((symbol, col) => symbol === 'coin' ? [col] : []);
  const frames: CabinetFrame[] = [{ grid, locked: [...locked], remaining }];
  while (remaining > 0 && locked.length < profile.columns) {
    grid = grid.map(row => row.map((symbol, col) => locked.includes(col) ? symbol : draw()));
    locked = grid[1].flatMap((symbol, col) => symbol === 'coin' ? [col] : []);
    remaining--;
    frames.push({ grid, locked: [...locked], remaining });
  }
  const matches = cabinetMatches(game, grid), collected = locked.length;
  const description = game === 'coin-carnival' ? `${collected} of ${profile.columns} coin reels locked in ${frames.length - 1} respins.` : matches.length ? `${matches.length} matching line${matches.length === 1 ? '' : 's'}.` : 'No matching lines. Spin again!';
  return { id, game, mode: 'PRACTICE', ruleVersion: 'practice-cabinets-v2', frames, matches, collected, description, creditsChanged: false };
}

export const stakeLimits={min:25,max:2000,step:25} as const;
export function validStake(value:string):boolean{return /^[1-9]\d{1,3}$/.test(value)&&Number(value)>=stakeLimits.min&&Number(value)<=stakeLimits.max&&Number(value)%stakeLimits.step===0;}
// Explicit local experiment. This is not registered in the production approval registry.
export const stagingProfile = {
 id:'stage-paying30-v2', payingProbability:.30, stakes:Array.from({length:80},(_,i)=>String((i+1)*25)),
 method:'Independent 30% paying-round draw, followed by conditional sampling of a complete valid sequence. Awards are evaluated from that sequence.',
 rules:{
  'neon-sevens':'Five reels, five lines. From the left, 3 matches pay cherry 1×, bell 2×, BAR 2×, gem 3×, seven 5×; 4 matches double that award and 5 matches quadruple it. Add all 5 lines.',
  'jade-fortune':'Each left-to-right line: 3 matches 2×, 4 matches 4×, 5 matches 8×. Dragon substitutes. Add all 9 lines.',
  'coin-carnival':'Five reels. All 5 center coins locked after up to 3 respins pays 5×. Fewer pays zero. Locked reels stay unchanged.',
  'temple-lights':'Each horizontal row from the left: 3 matches 2×, 4 matches 3×, 5 matches 5×. Add all 3 rows.',
  'aurora-vault':'8 or more locked crystals pays (collected minus 7)×. Fewer pays zero.',
  'ember-relics':'12 or more cleared relics pays floor(cleared / 12)×. Fewer pays zero. Six cascades maximum.',
  'orchard-numbers':'Pick 4–10. Draw 20 of 80. With 4–6 picks, 2+ hits pays (hits minus 1)×; with 7–10 picks, 3+ hits pays (hits minus 2)×.',
  'reef-party':'Separate experimental fish model: each valid targeted shot independently has 30% capture probability and pays 3× stake on capture. All species use the same odds and award. Missed/expired/already caught targets are rejected without a charge.'
 }
} as const;
export type StagingGame=keyof typeof stagingProfile.rules;
export type StagingVisual={id:string;game:StagingGame;description:string;frames?:CabinetFrame[];matches?:CabinetMatch[];collected?:number;sequence?:VaultSequence|CascadeSequence;grid?:string[][];lines?:{row:number;count:number}[];drawn?:number[];picks?:number[];hits?:number[];captured?:boolean};
export function stagingMultiplier(outcome:StagingVisual):number {
 const game=outcome.game;
 if(game==='neon-sevens')return cabinetMatches(game,outcome.frames!.at(-1)!.grid).reduce((n,m)=>n+({cherry:1,bell:2,bar:2,gem:3,seven:5}[m.symbol]||0)*({3:1,4:2,5:4}[m.count]||0),0);
 if(game==='jade-fortune')return cabinetMatches(game,outcome.frames!.at(-1)!.grid).reduce((n,m)=>n+({3:2,4:4,5:8}[m.count]||0),0);
 if(game==='coin-carnival'){const row=outcome.frames!.at(-1)!.grid[1];return row.length===5&&row.every(s=>s==='coin')?5:0;}
 if(game==='temple-lights')return outcome.grid!.reduce((n,row)=>{let count=1;while(count<5&&row[count]===row[0])count++;return n+({3:2,4:3,5:5}[count]||0);},0);
 if(game==='aurora-vault')return Math.max(0,(outcome.sequence as VaultSequence).frames.at(-1)!.cells.filter(Boolean).length-7);
 if(game==='ember-relics')return Math.floor((outcome.sequence as CascadeSequence).frames.reduce((sum,frame)=>sum+frame.removed.length,0)/12);
 if(game==='orchard-numbers')return Math.max(0,outcome.picks!.filter(n=>outcome.drawn!.includes(n)).length-(outcome.picks!.length<=6?1:2));
 return outcome.captured?3:0;
}
export function stagingOutcome(game:StagingGame,id:string,random:RandomIndex,picks?:number[]):StagingVisual {
 const paying=random(10000)<3000;
 if(game==='reef-party')return {id,game,captured:paying,description:paying?'Captured! 3× shot stake returned.':'Fish escaped. Shot settled.'};
 // Rejection sampling conditions the visible outcome distribution, never a player's history.
 for(let attempt=0;attempt<10000;attempt++){
  let outcome:StagingVisual;
  if(game in cabinetGames)outcome=cabinetPractice(game as CabinetGameId,id,random);
  else if(game==='aurora-vault'||game==='ember-relics')outcome=featurePractice(game,id,random);
  else if(game==='temple-lights'){
   const grid=Array.from({length:3},()=>Array.from({length:5},()=>symbols[random(5)]));
   const lines=grid.flatMap((row,index)=>{let count=1;while(count<5&&row[count]===row[0])count++;return count>=3?[{row:index,count}]:[];});
   outcome={id,game,grid,lines,description:`${lines.length} matching rows.`};
  }else{
   if(!picks||picks.length<4||picks.length>10||new Set(picks).size!==picks.length||picks.some(n=>!Number.isInteger(n)||n<1||n>80))throw new Error('Invalid keno picks');
   const pool=Array.from({length:80},(_,i)=>i+1);for(let i=79;i>0;i--){const j=random(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
   const drawn=pool.slice(0,20),hits=picks.filter(n=>drawn.includes(n));outcome={id,game,picks,drawn,hits,description:`${hits.length} of ${picks.length} matched.`};
  }
  if((stagingMultiplier(outcome)>0)===paying)return outcome;
 }
 throw new Error('Experimental sampler exhausted; no round accepted.');
}

export const reefSpecies=['Clownfish','Blue tang','Golden koi','Reef shark','Sea turtle','Manta ray','Moon jelly','Golden dragon'] as const;
export const reefBallistics={speed:780,radius:5,lifetime:1.6,step:1/120,version:'reef-ballistics-v1'} as const;
export function reefCannon(seat:number){return [{x:280,y:557},{x:920,y:557},{x:280,y:43},{x:920,y:43}][seat-1]||{x:280,y:557};}
/** Predict a moving target's intercept; a fired projectile still follows a straight ray. */
export function reefLeadAngle(seat:number,targetId:number,time:number){
 const origin=reefCannon(seat);let target=reefTarget(targetId,time);
 for(let i=0;i<6;i++){const travel=Math.max(0,(Math.hypot(target.x-origin.x,target.y-origin.y)-56)/reefBallistics.speed);target=reefTarget(targetId,time+travel);}
 return Math.atan2(target.y-origin.y,target.x-origin.x);
}
/** Swept relative-circle intersection: moving targets cannot be skipped by a fast projectile. */
export function sweptCircle(ax:number,ay:number,bx:number,by:number,radius:number):number|null{
 const dx=bx-ax,dy=by-ay,c=ax*ax+ay*ay-radius*radius;
 if(c<=0)return 0;const a=dx*dx+dy*dy;if(a<1e-12)return null;
 const b=2*(ax*dx+ay*dy),d=b*b-4*a*c;if(d<0)return null;
 const t=(-b-Math.sqrt(d))/(2*a);return t>=0&&t<=1?t:null;
}
export function reefFlight(seat:number,angle:number,roomTime:number,targetIds:readonly number[]){
 const cannon=reefCannon(seat),vx=Math.cos(angle)*reefBallistics.speed,vy=Math.sin(angle)*reefBallistics.speed;
 const origin={x:cannon.x+Math.cos(angle)*56,y:cannon.y+Math.sin(angle)*56};
 let previous=origin;
 for(let time=reefBallistics.step;time<=reefBallistics.lifetime+1e-6;time+=reefBallistics.step){
  const current={x:origin.x+vx*time,y:origin.y+vy*time};let hit:{targetId:number;time:number;x:number;y:number}|null=null;
  for(const id of targetIds){
   const before=reefTarget(id,roomTime+time-reefBallistics.step),after=reefTarget(id,roomTime+time);
   if(Math.abs(after.x-before.x)>600)continue; // A fish wrapping offscreen never sweeps across the table.
   const contact=sweptCircle(previous.x-before.x,previous.y-before.y,current.x-after.x,current.y-after.y,after.radius+reefBallistics.radius);
   if(contact!==null){const t=time-reefBallistics.step+contact*reefBallistics.step;if(!hit||t<hit.time)hit={targetId:id,time:t,x:origin.x+vx*t,y:origin.y+vy*t};}
  }
  if(hit)return {...hit,origin,vx,vy,angle};
  if(current.x<0||current.x>1200||current.y<0||current.y>600)return {targetId:null,time,x:current.x,y:current.y,origin,vx,vy,angle};
  previous=current;
 }
 return {targetId:null,time:reefBallistics.lifetime,x:previous.x,y:previous.y,origin,vx,vy,angle};
}
export function reefTarget(id:number,time:number){
 const species=id%20===0?7:id%13===0?3:id%11===0?5:id%9===0?4:id%7===0?6:id%3;
 const direction=id%3===0?-1:1,speed=[32,40,28,48,19,24,14,34][species];
 const x=((id*157+time*speed*direction)%1320+1320)%1320-60;
 const y=85+(id*37%420)+Math.sin(time*.65+id*.8)*20;
 return {x,y,direction,species,radius:[26,28,30,48,34,48,30,56][species]};
}
