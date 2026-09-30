import {describe,it,expect} from 'vitest';
import {cabinetAliases,cabinetPractice,cabinetExpansionProfile,stagingGameProfileId,stagingOutcome,stagingMultiplier,stagingProfile,storyboardRandom,type CabinetGameId} from '@new-game/game-math';
import {catalog,GameId} from '@new-game/contracts';
describe('approved themed cabinets preserve their base rules',()=>{
 for(const [game,base] of Object.entries(cabinetAliases) as [keyof typeof cabinetAliases,CabinetGameId][]){
  it(`${game} preserves every symbol, respin and award of ${base}`,()=>{
   for(let seed=1;seed<=300;seed++){
    const a=cabinetPractice(game,'same',storyboardRandom(seed)),b=cabinetPractice(base,'same',storyboardRandom(seed));
    expect({...a,game:base}).toEqual(b);
    const paying=stagingOutcome(game,'same',storyboardRandom(seed)),original=stagingOutcome(base,'same',storyboardRandom(seed));
    expect({...paying,game:base}).toEqual(original);
    expect(stagingMultiplier(paying)).toBe(stagingMultiplier(original));
   }
   expect(GameId.safeParse(game).success).toBe(true);expect(catalog.some(entry=>entry.id===game)).toBe(true);
   expect(stagingGameProfileId(game)).toBe(cabinetExpansionProfile.id);
  });
 }
 it('keeps old profile version and rule set intact',()=>{
  expect(stagingProfile.id).toBe('stage-paying30-v2');expect(Object.keys(stagingProfile.rules)).toHaveLength(8);
  expect(cabinetExpansionProfile.baseProfile).toBe(stagingProfile.id);
  expect(stagingGameProfileId('neon-sevens')).toBe(stagingProfile.id);
  expect(stagingGameProfileId('reef-party')).toBe('reef-tiers-v1');
 });
});
