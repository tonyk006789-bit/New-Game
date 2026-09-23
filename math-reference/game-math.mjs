/** Original educational references. NONE is an approved production profile.
 * No implicit profile defaults. Not JUWA code or a complete game server. */
import { randomInt } from 'node:crypto';

export const EXAMPLE_SLOT_HIT30_RTP96 = Object.freeze([
  Object.freeze({ weight: 7000, payoutNumerator: 0, payoutDenominator: 1 }),
  Object.freeze({ weight: 2200, payoutNumerator: 2, payoutDenominator: 1 }),
  Object.freeze({ weight: 600, payoutNumerator: 4, payoutDenominator: 1 }),
  Object.freeze({ weight: 200, payoutNumerator: 14, payoutDenominator: 1 }),
]);

function safeInteger(value, name, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new RangeError(`${name} must be a safe integer in [${min}, ${max}]`);
  return value;
}

export function choose(n, k) {
  safeInteger(n, 'n', 0, 1000);
  if (!Number.isSafeInteger(k) || k < 0 || k > n) return 0n;
  k = Math.min(k, n - k);
  let result = 1n;
  for (let i = 1; i <= k; i++) result = result * BigInt(n - k + i) / BigInt(i);
  return result;
}

export function validateProfile(profile) {
  if (!Array.isArray(profile) || profile.length === 0) throw new TypeError('Empty profile');
  let total = 0;
  for (const item of profile) {
    safeInteger(item.weight, 'weight', 1);
    safeInteger(item.payoutNumerator, 'payoutNumerator');
    safeInteger(item.payoutDenominator, 'payoutDenominator', 1);
    total += item.weight;
  }
  safeInteger(total, 'totalWeight', 1, 2 ** 48 - 1);
  return total;
}

export function outcomeForTicket(ticket, profile) {
  const total = validateProfile(profile);
  safeInteger(ticket, 'ticket', 0, total - 1);
  let cursor = 0;
  for (const item of profile) {
    cursor += item.weight;
    if (ticket < cursor) return { ...item };
  }
  throw new Error('Unreachable: invalid probability partition');
}

export function sampleOutcome(profile, rng = randomInt) {
  const total = validateProfile(profile);
  return outcomeForTicket(rng(0, total), profile);
}

export function payoutUnits(stakeUnits, outcome) {
  if (typeof stakeUnits !== 'bigint' || stakeUnits <= 0n)
    throw new RangeError('stakeUnits must be a positive bigint');
  safeInteger(outcome.payoutNumerator, 'payoutNumerator');
  safeInteger(outcome.payoutDenominator, 'payoutDenominator', 1);
  const product = stakeUnits * BigInt(outcome.payoutNumerator);
  const denominator = BigInt(outcome.payoutDenominator);
  if (product % denominator !== 0n) throw new RangeError('Unsupported denomination: fractional minor units');
  return product / denominator;
}

export function profileMetrics(profile) {
  const total = validateProfile(profile);
  return {
    ticketCount: total,
    hitRate: profile.reduce((a, x) => a + (x.payoutNumerator > 0 ? x.weight : 0), 0) / total,
    netWinRate: profile.reduce((a, x) => a + (x.payoutNumerator > x.payoutDenominator ? x.weight : 0), 0) / total,
    rtp: profile.reduce((a, x) => a + x.weight * x.payoutNumerator / x.payoutDenominator, 0) / total,
  };
}

/** Draw 20 distinct numbers from 1..80 using partial Fisher-Yates and crypto.randomInt. */
export function drawKeno(rng = randomInt) {
  const pool = Array.from({ length: 80 }, (_, i) => i + 1);
  for (let i = 0; i < 20; i++) {
    const j = rng(i, 80);
    safeInteger(j, 'rng output', i, 79);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 20);
}

export function validateSelections(values) {
  if (!Array.isArray(values) || values.length < 4 || values.length > 10)
    throw new RangeError('Select 4..10 numbers');
  values.forEach(x => safeInteger(x, 'selection', 1, 80));
  if (new Set(values).size !== values.length) throw new RangeError('Selections must be unique');
  return values;
}

export function kenoMatchCount(selections, draw) {
  validateSelections(selections);
  if (!Array.isArray(draw) || draw.length !== 20 || new Set(draw).size !== 20)
    throw new RangeError('Draw must contain 20 distinct numbers');
  draw.forEach(x => safeInteger(x, 'draw value', 1, 80));
  const values = new Set(draw);
  return selections.filter(x => values.has(x)).length;
}

/** Exact counts as decimal strings; floating probabilities are for reporting only. */
export function kenoDistribution(picks) {
  safeInteger(picks, 'picks', 4, 10);
  const denominator = choose(80, 20);
  return Array.from({ length: picks + 1 }, (_, hits) => {
    const numerator = choose(picks, hits) * choose(80 - picks, 20 - hits);
    return { hits, numerator: numerator.toString(), denominator: denominator.toString(), probability: Number(numerator) / Number(denominator) };
  });
}

export function kenoMetrics(picks, multipliers) {
  if (!Array.isArray(multipliers) || multipliers.length !== picks + 1 ||
      multipliers.some(x => typeof x !== 'number' || !Number.isFinite(x) || x < 0))
    throw new RangeError('One finite nonnegative multiplier per possible match count is required');
  const distribution = kenoDistribution(picks);
  return {
    hitRate: distribution.reduce((a, x) => a + (multipliers[x.hits] > 0 ? x.probability : 0), 0),
    netWinRate: distribution.reduce((a, x) => a + (multipliers[x.hits] > 1 ? x.probability : 0), 0),
    rtp: distribution.reduce((a, x) => a + multipliers[x.hits] * x.probability, 0),
  };
}

/** Concept only: one accepted paid capture attempt, with no miss/expiry loss. */
export const EXAMPLE_FISH_CAPTURE30_RTP96 = Object.freeze([
  Object.freeze({ weight: 7000, payoutNumerator: 0, payoutDenominator: 1 }),
  Object.freeze({ weight: 3000, payoutNumerator: 16, payoutDenominator: 5 }),
]);

/** Contrasting educational example: 10% paying rounds, 30% expected returned credits. */
export const EXAMPLE_SLOT_HIT10_RTP30 = Object.freeze([
  Object.freeze({ weight: 9000, payoutNumerator: 0, payoutDenominator: 1 }),
  Object.freeze({ weight: 1000, payoutNumerator: 3, payoutDenominator: 1 }),
]);
