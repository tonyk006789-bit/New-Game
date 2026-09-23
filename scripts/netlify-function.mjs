import {build} from 'esbuild';
import {resolve} from 'node:path';

// Compile workspace TypeScript once. Let Netlify trace ordinary runtime
// packages, avoiding duplicate entry names when it transforms workspace exports.
await build({
 entryPoints:['netlify/functions/game-api.ts'],
 outfile:'netlify/functions-build/game-api.mjs',
 bundle:true,platform:'node',format:'esm',target:'node24',packages:'external',
 alias:{
  '@new-game/contracts':resolve('packages/contracts/src/index.ts'),
  '@new-game/game-math':resolve('packages/game-math/src/index.ts'),
 },
});
console.log('Compiled the player function and shared game logic to one ESM entry.');
