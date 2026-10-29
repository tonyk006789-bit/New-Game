import {writeFile} from 'node:fs/promises';
import {catalog} from '../packages/contracts/src/index.ts';
import {configuredGameProfileId,stagingOutcome,stagingMultiplier,storyboardRandom} from '../packages/game-math/src/index.ts';

// Offline, reproducible test-profile review. Does not access accounts or the ledger.
const rounds=10000,policy={revision:'1',payingPercent:20},results=[];
function sample(game,picks){
 const random=storyboardRandom(50029+(picks?.length||0));let paying=0,totalReturn=0,maxReturn=0;
 for(let i=0;i<rounds;i++){
  const result=stagingOutcome(game,String(i),random,picks,policy.payingPercent),award=stagingMultiplier(result);
  const receipt={...result,ruleVersion:configuredGameProfileId(game,policy)};
  if(stagingMultiplier(receipt)!==award)throw Error(`Receipt mismatch: ${game}`);
  paying+=Number(award>0);totalReturn+=award;maxReturn=Math.max(maxReturn,award);
 }
 return {game,picks:picks?.length,rounds,payingPercent:paying/rounds*100,observedGrossReturnPercent:totalReturn/rounds*100,maximumSampledMultiplier:maxReturn};
}
for(const game of catalog.filter(g=>g.category==='Slots'||g.category==='Keno'))results.push(sample(game.id,game.category==='Keno'?[1,2,3,4,5,6]:undefined));
const kenoPickReview=Array.from({length:7},(_,i)=>sample('orchard-numbers',Array.from({length:i+4},(_,n)=>n+1)));
await writeFile('reports/rules-simulation-v50.json',JSON.stringify({policy,roundsPerCase:rounds,warning:'Offline seeded test sample, not certified RTP or production mathematics. Returns include stake. No virtual pool awards.',results,kenoPickReview},null,2)+'\n');
console.log(JSON.stringify({cases:results.length+kenoPickReview.length,rounds:(results.length+kenoPickReview.length)*rounds,payingPercentRange:[Math.min(...results.map(r=>r.payingPercent)),Math.max(...results.map(r=>r.payingPercent))],grossReturnPercentRange:[Math.min(...results.map(r=>r.observedGrossReturnPercent)),Math.max(...results.map(r=>r.observedGrossReturnPercent))]},null,2));
