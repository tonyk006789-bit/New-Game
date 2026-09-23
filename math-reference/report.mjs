import { readFileSync } from 'node:fs';
import { profileMetrics, kenoDistribution, EXAMPLE_SLOT_HIT30_RTP96, EXAMPLE_SLOT_HIT10_RTP30, EXAMPLE_FISH_CAPTURE30_RTP96 } from './game-math.mjs';
const decisions=JSON.parse(readFileSync(new URL('../config/product-decisions.json',import.meta.url),'utf8'));
const keno=Array.from({length:7},(_,i)=>i+4).map(picks=>({picks,distribution:kenoDistribution(picks)}));
console.log(JSON.stringify({
 status:'Original reference metrics only. No production profile approved.',
 activeSlotProfile:decisions.slotMath.approvedProfileId,
 slotApprovalStatus:decisions.slotMath.status,
 illustrations:{slotHit30Rtp96:profileMetrics(EXAMPLE_SLOT_HIT30_RTP96),slotHit10Rtp30:profileMetrics(EXAMPLE_SLOT_HIT10_RTP30),fishUnapprovedIllustration:profileMetrics(EXAMPLE_FISH_CAPTURE30_RTP96)},
 kenoWarning:'Proposed 20-from-80 draw references, not approved production paytables. Slot target not inherited.',keno
},null,2));
