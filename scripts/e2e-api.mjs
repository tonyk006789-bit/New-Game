import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
const run=args=>new Promise((resolve,reject)=>{const child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(`Setup failed: ${args[0]}`)));});
await run(['scripts/database.mjs','migrate']);
try{await access('.local/admin-credentials.json');}catch{await run(['scripts/bootstrap-admin.mjs']);}
const {createApi}=await import('../dist/server/apps/api/src/app.js');const app=await createApi();await app.listen(3000,'127.0.0.1');
await run(['scripts/create-local-players.mjs']);
console.log('Local browser acceptance backend ready.');
