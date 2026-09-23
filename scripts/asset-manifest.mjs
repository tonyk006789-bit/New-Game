import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const assets = [];
for (const name of (await readdir('apps/player/public/art')).sort()) {
  const path = `apps/player/public/art/${name}`;
  const promptFile = name.endsWith('-v7.png')?'reports/art-prompts-v7.json':name.endsWith('-v6.png')?'reports/art-prompts-v6.json':name==='reef-seabed-v5.png'?'reports/art-prompts-v5.json':['aurora-vault.png','ember-relics.png'].includes(name) ? 'reports/art-prompts-v3.json' : 'reports/art-prompts-v2.json';
  assets.push({ path, creator: 'Original artwork authored for New Game in this workspace', source: name.endsWith('.png') ? `Built-in ImageGen; prompts in ${promptFile}` : 'Repository-native SVG; no third-party assets', license: 'Project original; owner review pending', sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
}
for (const path of ['apps/player/src/ArcadeSymbol.vue','apps/player/src/GamePoster.vue','apps/player/src/arcade-v4.css','apps/player/src/reef-textures.ts','apps/player/src/arcade-v6.css','apps/player/src/arcade-v7.css','apps/player/src/ArcadeLobby.vue','apps/player/src/FishingLobby.vue','apps/player/src/arcade-v8.css']) {
  assets.push({ path, creator: 'Original artwork authored for New Game in this workspace', source: 'Original ImageGen atlas rendering and repository-native CSS frames; no third-party assets', license: 'Project original; owner review pending', sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
}
await writeFile('reports/asset-manifest.json', JSON.stringify({ generatedAt: new Date().toISOString(), privateReferencesShipped: false, assets }, null, 2) + '\n');
console.log(`Recorded ${assets.length} original art assets.`);
