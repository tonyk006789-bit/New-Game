import {afterEach,describe,it,expect} from 'vitest';
import {creditPresentation,holdStake,holdAward,revealCredits} from '../../apps/player/src/credit-presentation';
afterEach(()=>revealCredits());
describe('stake-first credit presentation',()=>{
 it('deducts at submit and holds only the committed award until the matching reveal',()=>{
  holdStake('neon-sevens','player-a','100000','25');expect(creditPresentation.held).toBe('99975');
  holdAward('neon-sevens','player-a','100050','75');expect(creditPresentation.held).toBe('99975');
  revealCredits('reef-party');expect(creditPresentation.held).toBe('99975');revealCredits('neon-sevens');expect(creditPresentation.held).toBeNull();
 });
 it('clears the display on rejected play or account exit without inventing a refund',()=>{holdStake('neon-sevens','player-b','25','25');expect(creditPresentation.held).toBe('0');revealCredits();expect(creditPresentation.accountId).toBe('');expect(creditPresentation.held).toBeNull();});
 it('uses integer arithmetic and never shows a negative available balance',()=>{holdStake('keno','a','90071992547409930','25');expect(creditPresentation.held).toBe('90071992547409905');holdStake('keno','a','0','25');expect(creditPresentation.held).toBe('0');});
});
