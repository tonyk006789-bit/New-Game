import {build} from 'esbuild';
import {cp,mkdir,writeFile,readdir,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
const output=resolve('.local/vercel-operator/.vercel/output');
if(!output.startsWith(resolve('.local/vercel-operator/.vercel')+ '/'.replace('/',process.platform==='win32'?'\\':'/')))throw new Error('Unexpected output path');
// Only generated output is replaced; project linkage and private credentials stay outside it.
await rm(output,{recursive:true,force:true});
await mkdir(`${output}/functions/operator.func`,{recursive:true});
await cp('apps/admin/dist',`${output}/static`,{recursive:true});
for(const name of ['_redirects','_headers'])await rm(`${output}/static/${name}`,{force:true});
await writeFile(`${output}/static/robots.txt`,'User-agent: *\nDisallow: /\n');
// These optional packages belong to unused Nest validation/serialization and native PG paths.
// The player handler validates with Zod and uses the ordinary pg driver.
await build({entryPoints:['apps/api/src/vercel-operator-handler.ts'],outfile:`${output}/functions/operator.func/index.cjs`,bundle:true,platform:'node',format:'cjs',target:'node24',external:['pg-native','class-transformer','class-validator'],alias:{'@new-game/contracts':resolve('packages/contracts/src/index.ts'),'@new-game/game-math':resolve('packages/game-math/src/index.ts')}});
await writeFile(`${output}/functions/operator.func/.vc-config.json`,JSON.stringify({runtime:'nodejs24.x',handler:'index.cjs',launcherType:'Nodejs',maxDuration:30}));
const headers={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self' blob:; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"};
await writeFile(`${output}/config.json`,JSON.stringify({version:3,routes:[{src:'/(.*)',headers,continue:true},{src:'/v1/(.*)',dest:'/operator?__route=$1'},{src:'/assets/(.*)',headers:{'Cache-Control':'public, max-age=31536000, immutable'},continue:true},{handle:'filesystem'},{src:'/.*',dest:'/index.html'}]},null,2));
console.log(`Vercel output ready: operator static assets and staff-only Node API (${(await readdir(`${output}/functions/operator.func`)).length} function files).`);
