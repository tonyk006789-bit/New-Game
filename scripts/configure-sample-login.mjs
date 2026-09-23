import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {totp} from '../dist/server/apps/api/src/security.js';
const admin=JSON.parse(await readFile('.local/staging/admin-credentials.json','utf8'));
const file='.local/staging/player-credentials.json',saved=JSON.parse(await readFile(file,'utf8'));
const player=saved.accounts.find(a=>a.username==='stage.player');if(!player||player.role!=='PLAYER')throw new Error('Fund the designated staging player first.');
let cookie='',csrf='';
async function request(path,body){const res=await fetch(`http://127.0.0.1:3001/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{Origin:'http://127.0.0.1:5184','Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await res.json();if(!res.ok)throw new Error(data.message||data.code);if(res.headers.get('set-cookie'))cookie=res.headers.get('set-cookie').split(';')[0];return data;}
if(!(await request('environment')).staging)throw new Error('Isolated staging required.');
csrf=(await request('auth/login',{username:admin.username,password:admin.password,code:totp(admin.totpSecret)})).csrf;
try{
 const password=process.env.STAGING_SAMPLE_PASSWORD||player.password||randomBytes(18).toString('base64url');
 if(!/^[\x21-\x7e]{12,128}$/.test(password)||/[#'"\\]/.test(password))throw new Error('Sample password must be 12–128 printable characters without environment-file quoting characters.');
 await request(`admin/accounts/${player.id}/manage`,{action:'RESET_PASSWORD',password,reason:'Owner requested a visible sample player login for local testing'});
 player.password=password;await writeFile(file,JSON.stringify(saved,null,2),{mode:0o600});
 const envPath='.local/staging/runtime.env',env=(await readFile(envPath,'utf8')).replace(/^STAGING_DEMO_PASSWORD=.*\r?\n?/gm,'');await writeFile(envPath,`${env.trimEnd()}\nSTAGING_DEMO_PASSWORD=${password}\n`,{mode:0o600});
 await writeFile('.local/staging/PLAYER_LOGIN.txt',`Local player: http://127.0.0.1:5183\nUsername: ${player.username}\nPassword: ${password}\nExisting credits are preserved. This command does not fund or refill.\n`);
 console.log('Sample player password configured through authenticated Main Admin. Existing balance unchanged.');
}finally{await request('auth/logout',{});}
