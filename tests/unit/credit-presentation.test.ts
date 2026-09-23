import {afterEach,describe,it,expect} from 'vitest';
import {creditPresentation,holdCredits,revealCredits} from '../../apps/player/src/credit-presentation';
afterEach(()=>revealCredits());
describe('committed win presentation',()=>{
 it('keeps the old display until the matching result is revealed',()=>{holdCredits('neon-sevens','player-a','100000');expect(creditPresentation.held).toBe('100000');revealCredits('reef-party');expect(creditPresentation.held).toBe('100000');revealCredits('neon-sevens');expect(creditPresentation.held).toBeNull();});
 it('clears any pending display on account exit',()=>{holdCredits('daily-wheel','player-b','1');revealCredits();expect(creditPresentation.accountId).toBe('');expect(creditPresentation.held).toBeNull();});
});
