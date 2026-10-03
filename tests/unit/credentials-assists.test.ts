import {describe,it,expect} from 'vitest';
import {NewPassword,NewUsername} from '@new-game/contracts';
import {reefAssistedOutcome,reefBotSeats,reefTier,reefTierProfile,reefTarget,stagingMultiplier} from '@new-game/game-math';
describe('simple six-character credentials',()=>{
 it('accepts either case and optional punctuation without requiring special characters',()=>{
  for(const value of ['abc123','ABC123','A1!@#$','name + 123','a'.repeat(255)+'1']){expect(NewUsername.safeParse(value).success).toBe(true);expect(NewPassword.safeParse(value).success).toBe(true);}
  expect(NewUsername.parse('  ABC123  ')).toBe('abc123');expect(NewPassword.parse('ABC123')).toBe('ABC123');
 });
 it('rejects missing letters, missing digits, short or oversized credentials',()=>{
  for(const value of ['ab123','abcdef','123456','     1','a1'+'x'.repeat(255),null,123456]){expect(NewUsername.safeParse(value).success).toBe(false);expect(NewPassword.safeParse(value).success).toBe(false);}
  expect(NewUsername.safeParse(' abc1 ').success).toBe(false);
 });
});
describe('solo bot capture assists',()=>{
 it('never fills or reserves human seats and is disabled for zero or multiple people',()=>{
  expect(reefBotSeats([2])).toEqual([1,3,4]);for(const seats of [[],[1,2],[1,2,3,4],[0]])expect(reefBotSeats(seats)).toEqual([]);
 });
 it('stops on the first catch, never pays multiple awards, and keeps all tier rewards',()=>{
  for(const game of ['reef-party','abyss-legends'] as const)for(let id=1;id<=80;id++)for(let success=0;success<=4;success++){
   let attempts=0;const result=reefAssistedOutcome('fixture',id,()=>attempts++===success?0:9999,game,[2]);
   expect(attempts).toBe(Math.min(success+1,4));expect(result.captured).toBe(success<4);
   expect(result.assistance.attempts.length).toBe(Math.min(success,3));
   expect(result.assistance.botSeats).toEqual([1,3,4]);
   expect(stagingMultiplier(result)).toBe(success<4?reefTierProfile.tiers[reefTier(reefTarget(id,0,game).species)].multiplier:0);
  }
 });
 it('makes exactly one capture draw when another human joins',()=>{
  let draws=0;const result=reefAssistedOutcome('fixture',25,()=>{draws++;return 9999;},'reef-party',[1,2]);
  expect(draws).toBe(1);expect(result.assistance.botSeats).toEqual([]);expect(result.assistance.attempts).toEqual([]);expect(result.captured).toBe(false);
 });
});
