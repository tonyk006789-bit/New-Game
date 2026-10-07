import type {PoolClient} from 'pg';
import {z} from 'zod';
import {testProbabilityPolicy,type RoundPolicy} from '@new-game/game-math';
import {actorFor,parse,privileged,type Request} from './auth.js';
import {transaction,fail,audit,idempotent} from './store.js';
import {stagingEnabled} from './environment.js';

/** Shared row lock orders accepted rounds against global policy changes. */
export async function readRoundPolicy(db:PoolClient,lock=false):Promise<RoundPolicy>{
 const row=(await db.query(`SELECT p.revision::text,v.paying_percent FROM test_probability_current p
 JOIN test_probability_versions v ON v.revision=p.revision WHERE p.singleton=true${lock?' FOR SHARE OF p':''}`)).rows[0];
 if(!row)fail(503,'POLICY_UNAVAILABLE');
 return {revision:row.revision,payingPercent:row.paying_percent};
}
function gate(){if(!stagingEnabled())fail(404,'STAGING_DISABLED');}
export async function operatorGamePolicy(req:Request){
 gate();return transaction(async db=>{
  const actor=await actorFor(db,req);if(actor.role!=='MAIN_ADMIN')fail(403,'MAIN_ADMIN_REQUIRED');
  const current=await readRoundPolicy(db);
  const history=(await db.query(`SELECT v.revision::text,v.paying_percent AS "payingPercent",v.created_at AS "createdAt",a.username AS actor
   FROM test_probability_versions v LEFT JOIN accounts a ON a.id=v.actor_id ORDER BY v.revision DESC LIMIT 30`)).rows;
  return {current,limits:testProbabilityPolicy,history};
 });
}
const changeSchema=z.object({payingPercent:z.number().int().min(5).max(50),expectedRevision:z.string().regex(/^[1-9]\d{0,14}$/),requestKey:z.string().min(8).max(128)}).strict();
export async function updateGamePolicy(req:Request,body:unknown){
 gate();const data=parse(changeSchema,body);
 return transaction(async db=>{
  const actor=await actorFor(db,req,true);privileged(actor);
  return idempotent(db,actor,'GAME_PROBABILITY',data.requestKey,data,async()=>{
   await db.query('SELECT revision FROM test_probability_current WHERE singleton=true FOR UPDATE');
   const before=await readRoundPolicy(db);
   if(before.revision!==data.expectedRevision)fail(409,'POLICY_CHANGED','Another administrator changed the rate. Reload the setting before saving.');
   if(before.payingPercent===data.payingPercent)return {current:before,changed:false};
   const revision=(BigInt(before.revision)+1n).toString(),after={revision,payingPercent:data.payingPercent};
   await db.query('INSERT INTO test_probability_versions(revision,paying_percent,actor_id,request_key) VALUES($1,$2,$3,$4)',[revision,data.payingPercent,actor.id,data.requestKey]);
   await db.query('UPDATE test_probability_current SET revision=$1 WHERE singleton=true',[revision]);
   await audit(db,actor,'GAME_PROBABILITY_CHANGED',{before,after,requestKey:data.requestKey,policy:testProbabilityPolicy.id});
   return {current:after,changed:true};
  });
 });
}
