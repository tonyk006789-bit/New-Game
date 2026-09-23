import { describe, expect, it } from 'vitest';
import { CreditAdjustmentRequest, RoundRequest, Units, WalletSnapshot, TransferRequest } from '@new-game/contracts';
import { adjustmentPreview, canAnimatePreview, canStake, formatCredits, parseCredits, zeroWallet } from '@new-game/domain';
import { evaluateLines, mathStatus, previewGrid, requireApprovedGame } from '@new-game/game-math';
const id = '10000000-0000-4000-8000-000000000001';
describe('credit and authorization boundaries', () => {
  it('preserves bigint values beyond JavaScript numeric precision', () => { expect(parseCredits('90071992547409.91')).toBe('9007199254740991'); expect(formatCredits('9223372036854775807')).toBe('92,233,720,368,547,758.07'); });
  it.each(['-1', '1.001', '1e3', '00.5', 'NaN', 'Infinity', ' 2', '92233720368547758.08'])('rejects invalid credit input %s', input => expect(() => parseCredits(input)).toThrow());
  it.each(['01', '-1', '1.2', '9223372036854775808', '1e3'])('rejects noncanonical or overflowing units %s', input => expect(Units.safeParse(input).success).toBe(false));
  it('starts a new wallet at zero and checks consistency', () => { expect(WalletSnapshot.parse(zeroWallet(id))).toEqual(zeroWallet(id)); expect(WalletSnapshot.safeParse({ ...zeroWallet(id), availableUnits: '1' }).success).toBe(false); });
  it('malformed wallet units fail validation without throwing a conversion error', () => expect(WalletSnapshot.safeParse({ ...zeroWallet(id), settledUnits: '1.2' }).success).toBe(false));
  it('protects reserved credits without silently reducing a removal', () => {
    const wallet = { id, settledUnits: '10000', reservedUnits: '2000', availableUnits: '8000', version: '1' };
    expect(() => adjustmentPreview(wallet, 'REMOVE', '9000')).toThrow('Only available');
    expect(adjustmentPreview(wallet, 'REMOVE', '8000')).toEqual({ settledUnits: '2000', availableUnits: '0' });
    expect(wallet.settledUnits).toBe('10000');
  });
  it('rejects client-provided authority in an adjustment contract', () => {
    const request = { targetWalletId: id, direction: 'ADD', amountUnits: '100', reason: 'Manual review', expectedWalletVersion: '0' };
    expect(CreditAdjustmentRequest.safeParse(request).success).toBe(true);
    expect(CreditAdjustmentRequest.safeParse({ ...request, role: 'MAIN_ADMIN', stepUpVerified: true }).success).toBe(false);
  });
  it('rejects self-transfers', () => expect(TransferRequest.safeParse({sourceWalletId:id,targetWalletId:id,amountUnits:'100',expectedSourceVersion:'0',expectedTargetVersion:'0',reason:'Transfer reason'}).success).toBe(false));
  it('rejects client payout fields and duplicate keno selections', () => {
    const request = { gameId: 'orchard-numbers', ruleVersion: 'preview', costUnits: '100', clientRequestId: id, selections: [1,2,3,4] };
    expect(RoundRequest.safeParse({ ...request, payoutUnits: '1000' }).success).toBe(false);
    expect(RoundRequest.safeParse({ ...request, selections: [1,1,2,3] }).success).toBe(false);
  });
});
describe('game gating and presentation', () => {
  it.each(Object.keys(mathStatus))('blocks stakes for %s', id => { expect(() => requireApprovedGame(id)).toThrow('GAME_MATH_NOT_APPROVED'); expect(canStake()).toBe(false); });
  it('stops previews offline, backgrounded, or unsynchronized', () => {
    expect(canAnimatePreview({online:true,foreground:true,synchronized:true})).toBe(true);
    for (const key of ['online','foreground','synchronized']) expect(canAnimatePreview({online:true,foreground:true,synchronized:true,[key]:false})).toBe(false);
  });
  it('has a reproducible nonpayable visual storyboard', () => { expect(previewGrid(0)).toEqual(previewGrid(5)); expect(previewGrid(1)).not.toEqual(previewGrid(0)); });
  it('evaluates an explicit paytable from the visible grid, with no defaults', () => {
    const grid = [['a','a','a','b','c'],['b','b','b','b','b'],['a','b','c','a','b']];
    expect(evaluateLines(grid, [[0,0,0,0,0],[1,1,1,1,1]], { a:{3:200n}, b:{5:600n} })).toBe(800n);
    expect(evaluateLines(grid, [[2,2,2,2,2]], {})).toBe(0n);
    expect(() => evaluateLines(grid, [[3,0,0,0,0]], {})).toThrow();
  });
});
