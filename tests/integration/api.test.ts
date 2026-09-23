import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { createApi } from '../../apps/api/src/app.js';
let app: INestApplication;
let base: string;
beforeAll(async () => { app = await createApi(); await app.listen(0, '127.0.0.1'); base = await app.getUrl(); });
afterAll(async () => { await app?.close(); });
describe('actual HTTP boundaries', () => {
  it('advertises all eight games as unavailable for stakes', async () => {
    const response = await fetch(`${base}/v1/games`); const games = await response.json();
    expect(response.status).toBe(200); expect(games).toHaveLength(8);
    expect(games.every((game: {creditStakedPlayEnabled:boolean;approved:boolean}) => !game.creditStakedPlayEnabled && !game.approved)).toBe(true);
  });
  it.each(['temple-lights','orchard-numbers','reef-party','aurora-vault','ember-relics','neon-sevens','jade-fortune','coin-carnival','unknown'])('rejects %s stakes even with forged authority or payout', async id => {
    const response = await fetch(`${base}/v1/games/${id}/rounds`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role:'MAIN_ADMIN',costUnits:'100',payoutUnits:'5000'})});
    expect(response.status).toBe(409); expect((await response.json()).code).toBe('GAME_MATH_NOT_APPROVED');
  });
  it.each(['admin/credit-adjustments','credit-transfers'])('does not expose a mock-success %s operation', async path => {
    const response = await fetch(`${base}/v1/${path}`, {method:'POST',headers:{'Content-Type':'application/json'},body:'{"role":"MAIN_ADMIN"}'});
    expect(response.status).toBe(400); expect((await response.json()).code).toBe('INVALID_REQUEST');
  });
  it.each(['credits/claim','daily-grant','wallet/set-balance'])('has no %s route', async path => expect((await fetch(`${base}/v1/${path}`,{method:'POST'})).status).toBe(404));
  it('does not fabricate an account when PostgreSQL is not configured', async () => expect((await fetch(`${base}/v1/me`)).status).toBe(503));
});
