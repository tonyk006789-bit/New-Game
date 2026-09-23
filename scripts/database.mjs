import pg from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const command = process.argv[2];
if (!['migrate','seed','test'].includes(command)) throw new Error('Usage: database.mjs migrate|seed|test');
if (!process.env.DATABASE_URL) { console.error('BLOCKED: DATABASE_URL and a running PostgreSQL database are required. No database tests were run.'); process.exit(1); }
const target = new URL(process.env.DATABASE_URL);
if (['seed','test'].includes(command) && (process.env.ALLOW_LOCAL_FIXTURES !== 'true' || !['localhost','127.0.0.1','postgres'].includes(target.hostname) || !/^\/new_game_(dev|test)$/.test(target.pathname))) {
  throw new Error('Fixtures require ALLOW_LOCAL_FIXTURES=true and a local new_game_dev or new_game_test database.');
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
async function migrate() {
  await client.query('BEGIN');
  try {
    await client.query("SELECT pg_advisory_xact_lock(10440720)");
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, sha256 text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const name of (await readdir('database/migrations')).filter(name => name.endsWith('.sql')).sort()) {
      const sql = await readFile(`database/migrations/${name}`, 'utf8');
      const hash = createHash('sha256').update(sql).digest('hex');
      const { rows } = await client.query('SELECT sha256 FROM schema_migrations WHERE name=$1', [name]);
      if (rows.length) { assert.equal(rows[0].sha256, hash, `Applied migration changed: ${name}`); continue; }
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(name,sha256) VALUES ($1,$2)', [name,hash]);
      console.log(`Applied ${name}`);
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
}
async function seed() {
  await client.query('BEGIN');
  try { await client.query(await readFile('database/fixtures/two-branches.sql', 'utf8')); await client.query('COMMIT'); }
  catch (error) { await client.query('ROLLBACK'); throw error; }
}
try {
  await migrate();
  if (command === 'seed' || command === 'test') { await seed(); await seed(); }
  if (command === 'test') {
    const wallets = (await client.query('SELECT * FROM wallets')).rows;
    assert.equal(wallets.length, 8);
    assert.ok(wallets.every(wallet => wallet.settled_units === '0' && wallet.reserved_units === '0' && wallet.version === '0'));
    assert.equal((await client.query('SELECT * FROM game_profiles')).rowCount, 0);
    const north = (await client.query("SELECT a.display_name FROM accounts a JOIN branch_ancestors b ON b.branch_id=a.branch_id WHERE b.ancestor_id='00000000-0000-4000-8000-000000000002' AND a.role='PLAYER'")).rows;
    assert.deepEqual(north.map(row => row.display_name).sort(), ['Alex Morgan','Jamie Chen']);
    await assert.rejects(() => client.query("UPDATE wallets SET reserved_units=1 WHERE id='10000000-0000-4000-8000-000000000001'"), /check constraint/);
    await assert.rejects(() => client.query("UPDATE wallets SET settled_units=-1 WHERE id='10000000-0000-4000-8000-000000000001'"), /check constraint/);
    await client.query('BEGIN');
    await client.query("INSERT INTO audit_events VALUES('90000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','TEST','80000000-0000-4000-8000-000000000001','{}',now())");
    await assert.rejects(() => client.query("DELETE FROM audit_events WHERE event_type='TEST'"), /immutable/);
    await client.query('ROLLBACK');
    console.log('PASS: migration rerun, idempotent zero fixtures, branch query isolation, empty math profiles, wallet constraints, append-only audit. Not ledger race coverage.');
  }
} finally { await client.end(); }
