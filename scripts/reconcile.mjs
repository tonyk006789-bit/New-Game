import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required.');
const db=new pg.Client({connectionString:process.env.DATABASE_URL});await db.connect();
try{
 await db.query('BEGIN READ ONLY');
 const wallets=(await db.query('SELECT w.id,w.settled_units,w.reserved_units,coalesce(sum(p.units),0)::text ledger_units FROM wallets w LEFT JOIN ledger_postings p ON p.wallet_id=w.id GROUP BY w.id')).rows;
 const unbalanced=(await db.query('SELECT t.id FROM ledger_transactions t LEFT JOIN ledger_postings p ON p.transaction_id=t.id GROUP BY t.id HAVING count(p.id)<2 OR sum(p.units)<>0')).rows;
 const mismatches=wallets.filter(w=>w.settled_units!==w.ledger_units||BigInt(w.reserved_units)>BigInt(w.settled_units));
 const counts=(await db.query('SELECT (SELECT count(*)::integer FROM ledger_transactions) transactions,(SELECT count(*)::integer FROM practice_rounds) practice_events,(SELECT count(*)::integer FROM game_profiles) approved_profiles')).rows[0];
 console.log(JSON.stringify({wallets:wallets.length,settledTotalUnits:wallets.reduce((sum,w)=>sum+BigInt(w.settled_units),0n).toString(),mismatchedWallets:mismatches.length,unbalancedTransactions:unbalanced.length,...counts},null,2));
 await db.query('COMMIT');if(mismatches.length||unbalanced.length)process.exitCode=1;
}finally{await db.end();}
