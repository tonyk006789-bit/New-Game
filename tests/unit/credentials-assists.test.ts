import {describe,it,expect} from 'vitest';
import {NewPassword,NewUsername,credentialInputAttributes} from '@new-game/contracts';
import {reefAssistedOutcome,reefBotSeats,reefTier,reefTierProfile,reefTarget,stagingMultiplier} from '@new-game/game-math';
describe('simple six-character credentials',()=>{
 it('uses the same browser constraints and server policy for six-character credentials',()=>{
  expect(credentialInputAttributes.minlength).toBe(6);
  const browserPattern=new RegExp(`^(?:${credentialInputAttributes.pattern})$`,'v');
  for(const value of ['abc123','ABC123','Ab1234','randy78','A1!@#$','short','abcdef','123456','000001','12345','a'.repeat(256),'a'.repeat(257)]){
   expect(browserPattern.test(value)).toBe(NewPassword.safeParse(value).success);
  }
 });
 it('accepts numbers only, letters only, either case and optional punctuation',()=>{
  for(const value of ['123456','000001','abcdef','ABCDEF','abc123','ABC123','A1!@#$','name + 123','a'.repeat(256)]){expect(NewUsername.safeParse(value).success).toBe(true);expect(NewPassword.safeParse(value).success).toBe(true);}
  expect(NewUsername.parse('  ABC123  ')).toBe('abc123');expect(NewPassword.parse('ABC123')).toBe('ABC123');
  expect(NewUsername.parse('000001')).toBe('000001');expect(NewPassword.parse('000001')).toBe('000001');
 });
 it('rejects short, oversized or non-string credentials and short normalized usernames',()=>{
  for(const value of ['','ab123','abcde','12345','a'.repeat(257),null,123456]){expect(NewUsername.safeParse(value).success).toBe(false);expect(NewPassword.safeParse(value).success).toBe(false);}
  for(const value of [' abc1 ','     1','      ','abc\u0000123'])expect(NewUsername.safeParse(value).success).toBe(false);
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
