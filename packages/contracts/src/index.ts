import { z } from 'zod';

export const MAX_UNITS = 9223372036854775807n;
export const Units = z.string().regex(/^(0|[1-9]\d{0,18})$/).pipe(z.string().refine(value => BigInt(value) <= MAX_UNITS, 'Exceeds PostgreSQL bigint'));
export const PositiveUnits = Units.pipe(z.string().refine(value => BigInt(value) > 0n, 'Amount must be positive'));
export const Role = z.enum(['MAIN_ADMIN', 'SUB_DISTRIBUTOR', 'AGENT', 'PLAYER']);
export const GameId = z.enum(['temple-lights', 'orchard-numbers', 'reef-party', 'aurora-vault', 'ember-relics', 'neon-sevens', 'jade-fortune', 'coin-carnival']);
export type GameId = z.infer<typeof GameId>;
export const WalletSnapshot = z.object({
  id: z.uuid(), settledUnits: Units, reservedUnits: Units, availableUnits: Units, version: Units
}).strict().superRefine((wallet, ctx) => {
  if (![wallet.settledUnits, wallet.reservedUnits, wallet.availableUnits].every(value => Units.safeParse(value).success)) return;
  if (BigInt(wallet.reservedUnits) > BigInt(wallet.settledUnits) ||
      BigInt(wallet.availableUnits) !== BigInt(wallet.settledUnits) - BigInt(wallet.reservedUnits)) {
    ctx.addIssue({ code: 'custom', message: 'Inconsistent available balance' });
  }
});
export type WalletSnapshot = z.infer<typeof WalletSnapshot>;

// Server-side representation after session verification; never decode this from a request body as authority.
export const Principal = z.object({ accountId: z.uuid(), role: Role, branchId: z.uuid(), sessionId: z.uuid(), active: z.boolean() }).strict();
export type Principal = z.infer<typeof Principal>;
export const CreditAdjustmentRequest = z.object({
  targetWalletId: z.uuid(), direction: z.enum(['ADD', 'REMOVE']), amountUnits: PositiveUnits,
  reason: z.string().trim().min(5).max(500), expectedWalletVersion: Units
}).strict();
export const IdempotencyKey = z.string().min(8).max(128).regex(/^[a-zA-Z0-9_-]+$/);
export const TransferRequest = z.object({
  sourceWalletId: z.uuid(), targetWalletId: z.uuid(), amountUnits: PositiveUnits,
  expectedSourceVersion: Units, expectedTargetVersion: Units, reason: z.string().trim().min(5).max(500)
}).strict().refine(value => value.sourceWalletId !== value.targetWalletId, 'Wallets must differ');
export const RoundRequest = z.object({
  gameId: GameId, ruleVersion: z.string().min(1).max(80), costUnits: PositiveUnits,
  clientRequestId: z.uuid(), selections: z.array(z.number().int().min(1).max(80)).min(4).max(10).optional()
}).strict().superRefine((round, ctx) => {
  if (round.gameId === 'orchard-numbers' && (!round.selections || new Set(round.selections).size !== round.selections.length)) {
    ctx.addIssue({ code: 'custom', message: 'Keno requires 4–10 unique selections' });
  }
  if (round.gameId !== 'orchard-numbers' && round.selections) ctx.addIssue({ code: 'custom', message: 'Selections are only valid for keno' });
});
export const CursorQuery = z.object({ cursor: z.string().max(256).optional(), limit: z.coerce.number().int().min(1).max(100).default(25) }).strict();
export const FishCommand = z.object({
  protocolVersion: z.literal(1), roomId: z.uuid(), epoch: Units, commandId: z.uuid(),
  sequence: Units, type: z.enum(['aim', 'attemptCapture', 'resume']), targetId: z.uuid().optional()
}).strict();
export const ErrorCode = z.enum(['GAME_MATH_NOT_APPROVED', 'AUTH_REQUIRED', 'SERVICE_NOT_READY', 'FORBIDDEN', 'STALE_WALLET', 'INSUFFICIENT_AVAILABLE', 'IDEMPOTENCY_CONFLICT']);

export const catalog = [
  { id: 'neon-sevens', name: 'Neon Sevens', category: 'Slots', tagline: 'The classic lights up.', description: 'Five mechanical reels, cherries, bells, BARs and bright red sevens. Match three or more symbols from the left on any of five marked lines. Free practice with no credit award.', detail: '5 reels · 5 lines', color: '#ff4189' },
  { id: 'jade-fortune', name: 'Jade Fortune', category: 'Slots', tagline: 'Let the dragon lead.', description: 'Five reels and nine paths. Jade dragons substitute for any symbol in a run of three or more from the left. An all-dragon run counts once on each line. Free practice only.', detail: '5 reels · Wild dragons', color: '#54ffc1' },
  { id: 'coin-carnival', name: 'Coin Carnival', category: 'Slots', tagline: 'Catch a coin. Lock a reel.', description: 'Land a coin on the middle row to lock its entire reel. Up to three respins move only unlocked reels. Stop when all five reels lock or respins run out. Coins are practice collectibles, never credits.', detail: '5 reels · Lock & respin', color: '#ffcf3e' },
  { id: 'aurora-vault', name: 'Aurora Vault', category: 'Slots', tagline: 'Lock the light. Open the vault.', description: 'Crystals lock into an icy observatory. New crystals recharge three pulses; the sequence ends when pulses run out or all fifteen cells fill. Free practice only.', detail: '15 cells · Lock & collect', color: '#67f0ee' },
  { id: 'ember-relics', name: 'Ember Relics', category: 'Slots', tagline: 'Let the ancient fire fall.', description: 'Groups of four or more matching, edge-connected relics clear from a 6×5 board. New relics fall into their place, up to six cascades per practice round.', detail: '6 × 5 · Cluster cascades', color: '#ffac67' },
  { id: 'temple-lights', name: 'Temple Lights', category: 'Slots', tagline: 'Follow the glow. Find your wonder.', description: 'Step into a moonlit sanctuary of gold, gems, and luminous reels.', detail: '5 reels · 3 rows', color: '#c6a2ff' },
  { id: 'orchard-numbers', name: 'Orchard Numbers', category: 'Keno', tagline: 'A fresh pick, every time.', description: 'A little intuition. A colorful field of possibilities. Pick your numbers.', detail: '80 numbers · 4–10 picks', color: '#a8dbb0' },
  { id: 'reef-party', name: 'Reef Party', category: 'Fish', tagline: 'Good company. Deep blue adventures.', description: 'Discover a bright underwater world designed for a four-seat table.', detail: '4 seats · Ocean adventure', color: '#7ddcec' }
] as const;
