import type {WinTier} from './win-presentation';
/** Decorative clock-driven values. Never used by the wallet, RNG, API or ledger. */
export const virtualPoolCycleMs=6*60*60*1000;
export function virtualPools(now:number):Record<WinTier,string>{
 const elapsed=((Math.floor(now)%virtualPoolCycleMs)+virtualPoolCycleMs)%virtualPoolCycleMs;
 const tick=BigInt(Math.floor(elapsed/3000));
 return {minor:(2500n+tick).toString(),major:(50000n+tick*7n).toString(),jackpot:(500000n+tick*25n).toString()};
}
