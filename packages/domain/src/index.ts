import { MAX_UNITS, type WalletSnapshot } from '@new-game/contracts';

export function zeroWallet(id: string): WalletSnapshot {
  return { id, settledUnits: '0', reservedUnits: '0', availableUnits: '0', version: '0' };
}
export function formatCredits(units: string): string {
  const value = BigInt(units);
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? '-' : ''}${(absolute / 100n).toLocaleString('en-US')}.${String(absolute % 100n).padStart(2, '0')}`;
}
export function parseCredits(input: string): string {
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(input)) throw new Error('Enter a positive amount with up to 2 decimal places.');
  const [whole, fractional = ''] = input.split('.');
  const value = BigInt(whole) * 100n + BigInt(fractional.padEnd(2, '0'));
  if (value <= 0n || value > MAX_UNITS) throw new Error('Amount is outside the supported range.');
  return value.toString();
}
// Presentation-only calculation: it neither authorizes nor persists an adjustment.
export function adjustmentPreview(wallet: WalletSnapshot, direction: 'ADD' | 'REMOVE', amount: string) {
  const units = BigInt(amount);
  if (units <= 0n || units > MAX_UNITS) throw new Error('Invalid amount.');
  if (direction === 'REMOVE' && units > BigInt(wallet.availableUnits)) throw new Error('Only available credits can be removed.');
  const after = BigInt(wallet.settledUnits) + (direction === 'ADD' ? units : -units);
  if (after > MAX_UNITS) throw new Error('Balance exceeds the supported range.');
  return { settledUnits: after.toString(), availableUnits: (after - BigInt(wallet.reservedUnits)).toString() };
}
export type PresentationState = { online: boolean; foreground: boolean; synchronized: boolean };
export function canAnimatePreview(state: PresentationState): boolean { return state.online && state.foreground && state.synchronized; }
export function canStake(): false { return false; } // S0: no authenticated ledger or approved math, under any client state.
export function isWithinBranch(branchId: string, ancestorIds: readonly string[]): boolean { return ancestorIds.includes(branchId); }
