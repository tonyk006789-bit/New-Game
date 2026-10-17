import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const assets = [];
for (const name of (await readdir('apps/player/public/art',{withFileTypes:true})).filter(entry=>entry.isFile()).map(entry=>entry.name).sort()) {
  const path = `apps/player/public/art/${name}`;
  const promptFile = name.endsWith('-v38.png')?'reports/art-prompts-v38.json':name.endsWith('-v37.png')?'reports/art-prompts-v37.json':name==='fish-atlas-final-v28.png'?'reports/art-correction-v28.json':name.endsWith('-v28.png')?'reports/art-prompts-v28.json':name.endsWith('-v25.png')?'reports/art-prompts-v25.json':name.endsWith('-v23.png')?'reports/art-prompts-v23.json':name.endsWith('-v22.png')?'reports/art-prompts-v22.json':name.endsWith('-v18.png')?'reports/art-prompts-v18.json':name.endsWith('-v17.png')?'reports/art-prompts-v17.json':name.endsWith('-v15.png')?'reports/art-prompts-v15.json':name.endsWith('-v10.png')?'reports/art-prompts-v10.json':name.endsWith('-v7.png')?'reports/art-prompts-v7.json':name.endsWith('-v6.png')?'reports/art-prompts-v6.json':name==='reef-seabed-v5.png'?'reports/art-prompts-v5.json':['aurora-vault.png','ember-relics.png'].includes(name) ? 'reports/art-prompts-v3.json' : 'reports/art-prompts-v2.json';
  assets.push({ path, creator: 'Original artwork authored for New Game in this workspace', source: name.endsWith('.png') ? `Built-in ImageGen; prompts in ${promptFile}` : 'Repository-native SVG; no third-party assets', license: 'Project original; owner review pending', sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
}
for (const path of ['apps/player/src/ArcadeSymbol.vue','apps/player/src/GamePoster.vue','apps/player/src/arcade-v4.css','apps/player/src/reef-textures.ts','apps/player/src/arcade-v6.css','apps/player/src/arcade-v7.css','apps/player/src/ArcadeLobby.vue','apps/player/src/FishingLobby.vue','apps/player/src/arcade-v8.css','apps/player/src/GameShelf.vue','apps/player/src/arcade-v15.css','apps/player/src/arcade-v16.css','apps/player/src/arcade-v17.css','apps/player/src/music-score.ts','apps/player/src/FishRewardReveal.vue','apps/player/src/arcade-v18.css','apps/player/src/AbyssJackpotWheel.vue','apps/player/src/abyss-cannons.ts','apps/player/src/WinShowcase.vue','apps/player/src/arcade-v24.css','apps/player/src/arcade-v25.css','apps/player/src/depth-motion.ts']) {
  assets.push({ path, creator: 'Original artwork authored for New Game in this workspace', source: 'Original ImageGen atlas rendering and repository-native CSS frames; no third-party assets', license: 'Project original; owner review pending', sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
}
for (const path of ['apps/player/src/WinBurst.vue','apps/player/src/win-effects.ts','apps/player/src/arcade-v26.css','apps/player/src/neon-vegas.css','apps/player/src/GameCharacter.vue','apps/player/src/expansion-theme.ts','apps/player/src/expansion-v28.css','apps/player/src/screen-v29.css','apps/player/src/layout-v31.css','apps/player/src/screen-v32.css','apps/player/src/GameViewport.vue','apps/player/src/BlackjackDealer.vue','apps/player/src/blackjack-v37.css']) {
 assets.push({path,creator:'Original animation authored for New Game',source:'Repository-native CSS, TypeScript and Vue; no third-party assets',license:'Project original',sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
}
for (const name of (await readdir('apps/player/public/audio/v23')).filter(name=>name.endsWith('.wav')).sort()) {
 const path=`apps/player/public/audio/v23/${name}`;
 assets.push({path,creator:'Original synthesized instruments for New Game',source:'scripts/render-music-bank.py; no third-party recordings or soundfonts',license:'Project original',sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
}
for(const path of ['apps/player/src/music-collections.ts','apps/player/src/ResolutionControl.vue','apps/player/src/experience-v35.css','apps/player/src/sound-design.ts']){
 assets.push({path,creator:'Original composition and interface authored for New Game',source:'Repository-native musical scores and Vue; original V29 instrument bank, no third-party music',license:'Project original',sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
}
for (const name of (await readdir('apps/player/public/audio/v29')).filter(name=>name.endsWith('.wav')).sort()) {
 const path=`apps/player/public/audio/v29/${name}`;
 assets.push({path,creator:'Original synthesized ensembles for New Game',source:'scripts/render-music-v29.py; independent V29 synthesis, no third-party recordings',license:'Project original',sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
}
for(const asset of Object.values(JSON.parse(await readFile('apps/player/src/presentation-assets.json','utf8')))){
 const path=`apps/player/public${asset.url}`;
 assets.push({path,creator:'Original New Game artwork, optimized delivery copy',source:`${asset.source}; scripts/optimize-presentation-assets.mjs; no new external art`,license:'Project original; owner review pending',sha256:createHash('sha256').update(await readFile(path)).digest('hex')});
}
const dealers=JSON.parse(await readFile('reports/dealer-models-v40.json','utf8'));
for(const asset of dealers.assets){const path=`apps/player/public${asset.url}`;assets.push({path,creator:dealers.creator,source:`${dealers.source}; ${asset.original}; scripts/prepare-dealer-models.mjs`,license:dealers.license,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});}
for(const file of ['reports/dealer-models-v41.json','reports/dealer-posters-v41.json','reports/dealer-models-v44.json','reports/dealer-posters-v44.json']){const catalog=JSON.parse(await readFile(file,'utf8'));for(const asset of catalog.assets){const path=`apps/player/public${asset.url}`;assets.push({path,creator:catalog.creator,source:`${catalog.source}; ${file}`,license:catalog.license,sha256:createHash('sha256').update(await readFile(path)).digest('hex')});}}
await writeFile('reports/asset-manifest.json', JSON.stringify({ generatedAt: new Date().toISOString(), privateReferencesShipped: false, assets }, null, 2) + '\n');
console.log(`Recorded ${assets.length} original or licensed art assets.`);
