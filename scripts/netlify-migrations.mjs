// Prepare the initial Netlify migration from the authoritative existing SQL.
// Run deliberately when creating a new hosted environment, never on startup.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const sources=['001_foundation.sql','002_accounts_ledger_practice.sql','003_room_scope_and_projection.sql','004_balance_trigger_record_fix.sql','005_staging_rounds.sql','006_final_wallet_reconciliation.sql','007_incremental_stakes.sql','008_hosted_test_scope.sql'];
const directory='netlify/database/migrations/0001_arcade_test';
let sql='-- Initial hosted schema. Source migrations are preserved verbatim below.\n';
for(const source of sources)sql+=`\n-- Source: database/migrations/${source}\n${await readFile(`database/migrations/${source}`,'utf8')}\n`;
await mkdir(directory,{recursive:true});await writeFile(`${directory}/migration.sql`,sql,{flag:'wx'});
console.log('Prepared the initial hosted schema. No accounts or credits were created.');
