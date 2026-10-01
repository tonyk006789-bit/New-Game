# V17 — casino scores, walking floor and Abyss Legends

Date: 1 October 2026. Existing Vercel player test environment.

## Delivered behavior

- Twelve games in the shelf and walking floor. A complete directory changes floor pages and walks the character to the selected cabinet, including Ruby Rush, Sapphire Crown, Solar Fortune and Abyss Legends. Format labels and truthful NEW ribbons identify the additions.
- Thirteen original synthesized arrangements: lobby plus each of twelve games. Tempo, melody, bass progression, swing and timbre vary; layered kick, snare, hi-hat, bass, chord and lead parts replace the earlier sparse loop. Music/Sound remain independently controllable; scene changes stop the previous track, backgrounding pauses audio, and a music button shows the current track.
- Abyss Legends adds a distinct original seabed and eight detailed assets: anglerfish, leafy seadragon, hammerhead, kraken, nautilus, lobster, treasure chest and leviathan. Reef Party also gains several of these creatures. Size, collision radius and reward tier remain aligned.
- Scheduled arrivals every two seconds; maximum 20 active targets, including at most one boss. Schools include genuinely small fish. Original transparent atlas regions are shared by SVG and WebGL to avoid neighbouring-sprite bleed.
- Both fish worlds have separate branch-scoped four-seat tables, own cannons and real occupancy. Server snapshots every 750ms carry recent committed impacts from the other seats: cannon recoil, trail/net and captured-award labels. There are no simulated players. Misses/in-flight shots are not broadcast; this is bounded impact synchronization, not a WebSocket projectile stream.
- Treasure catches shimmer and reveal their award; boss catches spin a decorative jackpot wheel and reveal their award. Coin particles travel toward the local cannon. At most four reveal cards and 400 effect objects remain in the scene. Reduced motion suppresses spinning/particles. The win remains visible before the existing delayed balance presentation.

## Approved rules and accounting

The owner approved reusing existing fish rewards and reveal effects. Both games use `reef-tiers-v1`: small 1× stake/30% capture per valid hit; medium 3×/20%; large 8×/10%; boss 20×/4%. Treasure is medium tier. The wheel is presentation of an already committed boss award, with no additional random selection, pool or payout.

`reef-ballistics-v5` records changed spawns/species. New shots must carry this version; stale clients receive a refresh message before a debit. Historical accepted requests replay before new-version checks and cannot be charged or sampled again. The server checks variant, branch, seat, target lock, trajectory, available credits and idempotency before settling. Recovery retains the correct fish-game identity. Free practice records also retain the room's game identity. Production game approval remains false.

## Changed areas

- `packages/game-math/src/index.ts`, `packages/contracts/src/index.ts`: catalog, variant-specific spawn/collision/outcome selection and unchanged tier rewards.
- `apps/api/src/practice.ts`, `staging.ts`, `hosted-handler.ts`, migration 014: room identity, bounded peer impacts, shot-version gate, settlement and restricted hosted routing.
- `apps/player/src/FishScene.vue`, `FishRewardReveal.vue`, `reef-room.ts`, `reef-textures.ts`, `abyss-atlas.ts`, `AquaticSprite.vue`, `api.ts`, `staging-state.ts`: rendering, effects, synchronization and recovery.
- `App.vue`, `FishingLobby.vue`, `ArcadeLobby.vue`, `GameShelf.vue`, `GamePoster.vue`, `GameRules.vue`, `SettingsPanel.vue`, `audio.ts`, `music-score.ts`, `arcade-v17.css`, `main.ts`: catalog, navigation, music and presentation.
- Original art, prompt record, asset manifest, regression tests and owner steering.

## Acceptance evidence

Exact commands run with the installed Node/pnpm runtime:

- `pnpm typecheck` — passed.
- `pnpm lint` — passed, zero warnings.
- `pnpm exec vitest run tests/unit tests/integration` — 120 tests passed, 17 files. Then `pnpm exec vitest run tests/unit/audio-lifecycle.test.ts` — one additional test passed. Total 121. Includes 12 distinct score arrangements, spawn limits, every Abyss species' ticket boundaries, collision proof and reconnect recovery.
- Audio lifecycle test verifies a single scheduler, old-track shutdown, independent sound/music mute and background suspend/resume using a fake AudioContext. It does not certify subjective audio quality.
- `pnpm build:server` — passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` — 18 tests passed in an isolated local PostgreSQL schema. Four authenticated players hit simultaneously; rejected cross-world joins/shots; fifth seat denied; concurrent capture awarded exactly once; wallet deltas and idempotent replay checked; stale-version requests rejected without debit.
- `pnpm build:vercel` — passed after final stylesheet changes.
- `node --test tests/deployment/vercel.test.mjs` — four tests passed against that exact emitted function.
- `pnpm assets:manifest` — 39 original art/code assets recorded. `reports/art-prompts-v17.json` contains both ImageGen prompts.
- `git diff --check` — passed.

Browser acceptance using the in-app browser:

- All twelve floor-directory buttons visible; selecting Reef Party on page two changes pages, walks the character and opens its lounge. Selecting Abyss Legends opens a separate lounge with four selectable seats and the correct track title.
- New original creatures, varying sizes, clear cannons and new seabed verified visually. An inherited important background rule was corrected during review; seat labels were moved aside to expose the cannon art.
- At the 844×390 requested browser override (reported content viewport 844×342), no horizontal overflow; canvas bounds x3–841/y45–277; Auto/Lock/Fast controls end at y333, within the content viewport. Override was reset.
- One agent-operated local 0.25-credit shot struck an armored hammerhead, resisted capture and changed displayed credits from 1,002.15 to 1,001.90. No refill occurred. Subsequent local account activity was observed outside that single test and is not counted as agent test play.
- Screenshots saved under ignored `reports/screenshots-v17/`: `abyss-local.png`, `walking-floor.png`. Temporary fixed-award fixture navigation was blocked by the browser; fixture was removed. Catch visual components are implemented, but a live boss/treasure celebration was not independently captured in this browser pass.
- Pixi logged two resource-destruction warnings during local hot reload; no rendering failure was observed. Fresh hosted verification is recorded below.

Physical Android/iPhone rendering, four-device network/load performance and subjective audio listening remain unverified. Browser tests are not native certification. No third-party game assets/code/provider dependencies were shipped.

## Migration and rollback

`014_fish_variants.sql` adds a default Reef Party `game_id` to existing rooms, a variant/branch index and an index for recent room impacts. Applied locally with `node --env-file=.local/staging/runtime.env scripts/database.mjs migrate` and remotely through ignored `.local/migrate-fish-v17-hosted.mjs`.

The hosted migration created an encrypted consistent logical backup of 21 tables before applying DDL. All nine wallets' settled credits, reservations and versions were identical before/after. No account, grant, refill or hosted test play was part of the migration.

Leave additive schema in place when reverting presentation. Once Abyss rounds exist, keep Abyss recovery/evaluation and the v5 server trajectory gate; an old client/server that silently treats Abyss rooms as Reef Party is not a compatible full rollback. Prefer disabling new fish joins/shots while retaining accepted-round recovery during any operational rollback. Never delete or rewrite ledger/round history.

## Publication

Published and verified: **https://new-game-test-topaz.vercel.app/**.

- Source commit `e8d57509d0b514b018eb89811753e794d205a934`, pushed to the owner’s GitHub main branch.
- Vercel deployment `dpl_8RGg98soRLoAnyG8Ws4cr5UH9RaW`, READY. Immutable build: https://new-game-test-68a478grv-tonyk006789-7532.vercel.app/.
- Command: `node .cache/vercel-tools/node_modules/vercel/dist/vc.js deploy --prebuilt --prod --yes --global-config .local/vercel-cli --scope tonyk006789-7532 --no-color`.
- Public database health returned `ok`, catalog returned twelve games including Abyss Legends, and production approval remained false.
- Existing Player 1 session restored at 1,431.30 credits. Opened its new Abyss table, verified four cannon positions, distinct scenery/creatures, music control and quarter-credit stakes. No hosted shots/spins were performed; the displayed balance remained 1,431.30. Fresh hosted warning/error log was empty.
- Public screenshot: ignored `reports/screenshots-v17/abyss-live.png`. The published game tab remains available to the owner. Operator and Netlify were not redeployed.
