export type WinTier='minor'|'major'|'jackpot';
/** Presentation labels only; never calculates or changes a round award. */
export function winTier(award:string,stake:string):WinTier|null{
 if(!/^\d+$/.test(award)||!/^\d+$/.test(stake)||BigInt(award)<=0n||BigInt(stake)<=0n)return null;
 return BigInt(award)>=BigInt(stake)*20n?'jackpot':BigInt(award)>=BigInt(stake)*5n?'major':'minor';
}
