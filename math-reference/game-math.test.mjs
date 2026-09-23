import test from 'node:test';
import assert from 'node:assert/strict';
import {
 EXAMPLE_SLOT_HIT30_RTP96, EXAMPLE_SLOT_HIT10_RTP30, EXAMPLE_FISH_CAPTURE30_RTP96, choose, validateProfile, outcomeForTicket,
 sampleOutcome, payoutUnits, profileMetrics, drawKeno, validateSelections,
 kenoMatchCount, kenoDistribution, kenoMetrics
} from './game-math.mjs';
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);

test('slot weights partition 10000 tickets', () => assert.equal(validateProfile(EXAMPLE_SLOT_HIT30_RTP96),10000));
test('exhaustive slot tickets have 30% positive and net wins, 96% RTP', () => {
 let positive=0, net=0, payout=0n;
 for(let i=0;i<10000;i++) { const p=payoutUnits(100n,outcomeForTicket(i,EXAMPLE_SLOT_HIT30_RTP96)); if(p>0n)positive++; if(p>100n)net++; payout+=p; }
 assert.equal(positive,3000);assert.equal(net,3000);assert.equal(payout,960000n);
});
test('slot boundaries cannot overlap', () => {
 for(const [ticket,pay] of [[0,0],[6999,0],[7000,2],[9199,2],[9200,4],[9799,4],[9800,14],[9999,14]])
 assert.equal(outcomeForTicket(ticket,EXAMPLE_SLOT_HIT30_RTP96).payoutNumerator,pay);
});
test('invalid tickets fail closed', () => { for(const x of [-1,10000,0.1,NaN])assert.throws(()=>outcomeForTicket(x,EXAMPLE_SLOT_HIT30_RTP96)); });
test('malformed profiles rejected', () => { for(const p of [[],[{weight:0,payoutNumerator:1,payoutDenominator:1}],[{weight:1,payoutNumerator:1,payoutDenominator:0}]]) assert.throws(()=>validateProfile(p)); });
test('profile metrics agree', () => { const m=profileMetrics(EXAMPLE_SLOT_HIT30_RTP96);near(m.hitRate,.3);near(m.netWinRate,.3);near(m.rtp,.96); });
test('integer units can exceed JS safe integer', () => assert.equal(payoutUnits(9007199254740993n,{payoutNumerator:14,payoutDenominator:1}),126100789566373902n));
test('zero, negative, and non-bigint stakes rejected', () => { for(const s of [0n,-1n,1,NaN])assert.throws(()=>payoutUnits(s,EXAMPLE_SLOT_HIT30_RTP96[1])); });
test('fractional minor units are rejected rather than rounded', () => assert.throws(()=>payoutUnits(1n,EXAMPLE_FISH_CAPTURE30_RTP96[1])));
test('injected ticket maps to deterministic outcome', () => assert.equal(sampleOutcome(EXAMPLE_SLOT_HIT30_RTP96,()=>9800).payoutNumerator,14));
test('binomial coefficient fixtures', () => {assert.equal(choose(5,2),10n);assert.equal(choose(80,0),1n);assert.equal(choose(3,4),0n);});
test('crypto keno draws contain exactly 20 unique in-range values', () => {for(let i=0;i<100;i++){const d=drawKeno();assert.equal(d.length,20);assert.equal(new Set(d).size,20);assert.ok(d.every(x=>x>=1&&x<=80));}});
test('deterministic partial shuffle fixture', () => assert.deepEqual(drawKeno(min=>min),Array.from({length:20},(_,i)=>i+1)));
test('bad rng values rejected', () => assert.throws(()=>drawKeno(()=>80)));
test('selection limits validated', () => {assert.equal(validateSelections([1,2,3,4]).length,4);for(const x of [[1,2,3],[1,1,2,3],[0,1,2,3],[1,2,3,81]])assert.throws(()=>validateSelections(x));});
test('keno match count is deterministic', () => assert.equal(kenoMatchCount([1,2,3,80],Array.from({length:20},(_,i)=>i+1)),3));
test('invalid result draws rejected', () => assert.throws(()=>kenoMatchCount([1,2,3,4],Array(20).fill(1))));
test('all seven keno distributions normalize exactly as integers', () => {for(let n=4;n<=10;n++){const d=kenoDistribution(n);assert.equal(d.reduce((a,x)=>a+BigInt(x.numerator),0n),BigInt(d[0].denominator));}});
test('keno expected matches equal picks/4', () => {for(let n=4;n<=10;n++)near(kenoDistribution(n).reduce((a,x)=>a+x.hits*x.probability,0),n/4);});
test('8-pick 3-or-more rate is 31.7124%, not 30%', () => near(kenoDistribution(8).filter(x=>x.hits>=3).reduce((a,x)=>a+x.probability,0),.31712402669572775));
test('paytable metrics distinguish positive payouts from net wins', () => {const m=kenoMetrics(4,[0,0,1,2,10]);assert.ok(m.hitRate>m.netWinRate);assert.ok(m.rtp>0);});
test('invalid keno tables and pick counts rejected', () => {assert.throws(()=>kenoMetrics(4,[0,1]));assert.throws(()=>kenoDistribution(3));});
test('fish concept yields 30% capture and 96% expected return per accepted attempt', () => {const m=profileMetrics(EXAMPLE_FISH_CAPTURE30_RTP96);near(m.hitRate,.3);near(m.rtp,.96);assert.equal(payoutUnits(10n,EXAMPLE_FISH_CAPTURE30_RTP96[1]),32n);});

test('profile must be supplied explicitly; no live 96% default',()=>{assert.throws(()=>outcomeForTicket(1));assert.throws(()=>profileMetrics());assert.throws(()=>sampleOutcome());});
test('contrasting example has 10% hits and 30% return',()=>{const m=profileMetrics(EXAMPLE_SLOT_HIT10_RTP30);near(m.hitRate,.1);near(m.netWinRate,.1);near(m.rtp,.3);});
test('contrasting example exact total is 300000 minor units on 10000 stakes of 100',()=>{let p=0n;for(let i=0;i<10000;i++)p+=payoutUnits(100n,outcomeForTicket(i,EXAMPLE_SLOT_HIT10_RTP30));assert.equal(p,300000n);});
