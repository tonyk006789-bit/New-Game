import pg from 'pg';
if(process.env.GAME_ENV!=='staging')throw new Error('Load .local/staging/runtime.env.');
const url=new URL(process.env.DATABASE_URL||'postgres://invalid/');
if(url.hostname!=='127.0.0.1'||url.pathname!=='/new_game_staging'||url.username!=='new_game_stage')throw new Error('Expected dedicated loopback staging role/database.');
const db=new pg.Client({connectionString:url.href});await db.connect();
try{
 await db.query('BEGIN READ ONLY');
 const player=(await db.query("SELECT a.username,w.settled_units,w.reserved_units,w.version FROM accounts a JOIN wallets w ON w.account_id=a.id WHERE a.username='stage.player'")).rows[0];
 const funding=(await db.query("SELECT count(*)::int count FROM ledger_transactions WHERE request_id='owner-staging-funding-1000-v1' AND kind='MANUAL_ADD'")).rows[0].count;
 const role=(await db.query('SELECT rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user')).rows[0];
 const rounds=(await db.query('SELECT count(*)::int count FROM staging_rounds WHERE account_id=(SELECT id FROM accounts WHERE username=$1)',['stage.player'])).rows[0].count;
 const profiles=(await db.query('SELECT count(*)::int count FROM game_profiles')).rows[0].count;
 console.log(JSON.stringify({player,fundingTransactions:funding,ownerTestRounds:rounds,productionProfiles:profiles,role},null,2));
 if(funding!==1||profiles!==0||role.rolsuper||role.rolcreatedb||role.rolcreaterole)throw new Error('Staging isolation/funding check failed.');
 await db.query('COMMIT');
}finally{await db.end();}
url.pathname='/new_game_dev';const other=new pg.Client({connectionString:url.href});
try{await other.connect();await other.query('SELECT id FROM accounts LIMIT 1');throw new Error('Staging role must not read development accounts.');}
catch(error){if(!['42501','28000'].includes(error.code))throw error;console.log('Staging role cannot read development accounts.');}
finally{await other.end();}
