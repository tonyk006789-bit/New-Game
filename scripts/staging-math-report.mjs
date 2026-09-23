import {randomInt} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {stagingProfile,stagingOutcome,stagingMultiplier} from '../packages/game-math/src/index.ts';
const rounds=10000,results=[];
for(const game of Object.keys(stagingProfile.rules)){
 let paying=0,netWins=0,returned=0;
 for(let i=0;i<rounds;i++){const m=stagingMultiplier(stagingOutcome(game,String(i),randomInt,[1,2,3,4,5,6]));paying+=Number(m>0);netWins+=Number(m>1);returned+=m;}
 results.push({game,rounds,paying,payingPercent:100*paying/rounds,netWinPercent:100*netWins/rounds,returnPercent:100*returned/rounds});
}
const report={profile:stagingProfile,generatedAt:new Date().toISOString(),note:'Offline independent simulation using server math and crypto RNG. No accounts or balances touched. Keno uses six picks; this is an experimental profile, not a production return promise.',results};
await writeFile('reports/staging-math-v2.json',JSON.stringify(report,null,2)+'\n');console.table(results);
