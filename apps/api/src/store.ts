import pg, { type PoolClient, type QueryResultRow } from 'pg';
import { HttpException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { canonical, digest } from './security.js';
import { hostedTest, validateHostedTest } from './environment.js';
export const fail = (status: number, code: string, message: string = code): never => { throw new HttpException({ code, message }, status); };
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: hostedTest()?3:12, connectionTimeoutMillis:10000, idleTimeoutMillis:30000 });
pool.on('error',()=>console.error('An idle database connection closed.'));
export async function transaction<T>(run: (db: PoolClient) => Promise<T>) {
 if (!process.env.DATABASE_URL) fail(503, 'DATABASE_UNAVAILABLE', 'The account service is not configured.');
 const db = await pool.connect();
 try {
  await db.query('BEGIN');
  if(hostedTest()){
   validateHostedTest();
   const marker=await db.query('SELECT site_id FROM hosted_test_environment WHERE singleton=true');
   if(marker.rows[0]?.site_id!==process.env.HOSTED_TEST_SITE_ID)fail(503,'TEST_DATABASE_MISMATCH','The private test database is not configured.');
  }
  const result = await run(db); await db.query('COMMIT'); return result;
 }
 catch (error) { await db.query('ROLLBACK'); throw error; } finally { db.release(); }
}
export interface Actor extends QueryResultRow { id: string; branch_id: string; role: 'MAIN_ADMIN'|'SUB_DISTRIBUTOR'|'AGENT'|'PLAYER'; display_name: string; username: string; token_hash: string; csrf_token: string; verified_at: Date | null }
export interface Wallet extends QueryResultRow { id: string; account_id: string; settled_units: string; reserved_units: string; version: string }
export function walletView(wallet: Wallet) { return { settled: wallet.settled_units, reserved: wallet.reserved_units, available: (BigInt(wallet.settled_units)-BigInt(wallet.reserved_units)).toString(), version: wallet.version }; }
export async function inScope(db: PoolClient, actor: Actor, target: string) {
 const {rows} = await db.query('SELECT a.* FROM accounts a JOIN branch_ancestors b ON b.branch_id=a.branch_id WHERE a.id=$1 AND b.ancestor_id=$2', [target,actor.branch_id]);
 if (!rows.length || (actor.role === 'PLAYER' && target !== actor.id)) fail(404,'ACCOUNT_NOT_FOUND');
 return rows[0] as Actor;
}
export async function audit(db: PoolClient, actor: Actor, event: string, details: unknown) {
 await db.query('INSERT INTO audit_events(id,actor_id,branch_id_at_event,event_type,request_id,details) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),actor.id,actor.branch_id,event,randomUUID(),JSON.stringify(details)]);
}
export async function idempotent<T>(db: PoolClient, actor: Actor, operation: string, key: string, body: unknown, run: () => Promise<T>): Promise<T> {
 await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`${actor.id}:${operation}:${key}`]);
 const hash=digest(canonical(body));
 const {rows}=await db.query('SELECT * FROM idempotency_records WHERE actor_id=$1 AND operation=$2 AND request_key=$3',[actor.id,operation,key]);
 if(rows.length){if(rows[0].request_hash!==hash)fail(409,'IDEMPOTENCY_CONFLICT','This request ID was already used with different details.');return rows[0].response as T;}
 const result=await run();
 await db.query('INSERT INTO idempotency_records(actor_id,operation,request_key,request_hash,response) VALUES($1,$2,$3,$4,$5)',[actor.id,operation,key,hash,JSON.stringify(result)]);
 return result;
}
