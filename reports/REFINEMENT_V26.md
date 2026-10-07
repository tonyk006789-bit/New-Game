# V26 — unique win effects, shootable jackpot target and AI scoring

## Changes

- Added original win presentations for all twenty games, using coin fountains, gem shards, orbiting jade, embers, neon trails, pearls, numbered keno balls and blackjack chips. Each game's combination of motion, motif, color and glyph differs. Finite bursts are bounded to 34/48/62 particles by the existing return tier, or 18 on compact fish cards. They use committed results and do not sample or change an outcome. Blackjack effects require an actual winning hand, not a pure push. Existing win-before-wallet ordering remains.
- Fish catches emit 16/26/40/60 coin particles by size plus theme-specific sparks/shards and a ring. Four simultaneous players' committed catches point toward the appropriate cannon. Particle counts and concurrent reveal cards are bounded; motion pauses with the game, and Reduced Motion suppresses particles.
- Replaced the idle decorative spinner with an original moving, collidable Jackpot wheel boss in all four fish worlds. A successful catch returns the already approved 20× shot stake using the existing 4% per-attempt chance and solo assists. The large wheel appears only for 3.2 seconds to reveal a committed wheel catch. Other creatures and bosses retain their own award cards. There is no separate wheel wager, extra payout, grant or progressive pool.
- Added labeled AI crews with names, varied short firing bursts, target focus and switching, impact effects and independent score plaques. Combos require 4/8/14/24 hits on one small/medium/large/boss target for 10/30/80/200 AI points. A 12-second gap expires the combo; scores reset on a new table visit. No wallet/API call or shared-target mutation comes from this scoreboard. AI stops when a second human joins, the game pauses, or the room errors. User requests for natural behavior do not conceal AI identity.
- Advanced shared trajectories to `reef-ballistics-v7` for the new boss roster. Historical accepted receipts still replay before trajectory-version checks. The existing `reef-tiers-v1` and `reef-assist-v1` probabilities and payouts are unchanged.

Core changed files: `apps/player/src/WinBurst.vue`, `win-effects.ts`, `arcade-v26.css`, `bot-score.ts`, `FishScene.vue`, `FishRewardReveal.vue`, `AbyssJackpotWheel.vue`, `AquaticSprite.vue`, `reef-textures.ts`, `CabinetGame.vue`, `FeatureGame.vue`, `GamePreview.vue`, `BlackjackGame.vue`, `GameRules.vue`, `main.ts`, `packages/game-math/src/index.ts`, new original `public/art/jackpot-target-v26.svg`, unit/database/deployment checks and asset manifest. The local-only `win-check.html`/`win-check.ts` plus `tests/browser/WinEffectsCheck.vue` are render fixtures excluded from production.

## Assumptions and limits

The AI points vs human-credit clarification had no response. Implemented the stated separate-score assumption under the owner's previous explicit “Independent shots; keep rewards unchanged” approval. These are AI hit-combo scores, not autonomous credit-paying catches or player wallet balances. AI does not remove a shared fish. The earlier question about removing paid-hit solo assists also remains unanswered, so assists remain. No new authenticated JUWA inspection or complete provider clone is claimed. All new art/effects are original code-native work.

## Acceptance

Bundled Node 24 / pnpm on Windows:

- `pnpm typecheck` — passed after final component/harness changes.
- `pnpm lint` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit --maxWorkers=2` — 161 passed in 25 files. Tests cover all twenty distinct compositions, bounded positive-return effects, separate AI hit combos, inactivity/reset, varied cadence, and all four worlds' wheel collisions / exhaustive 400 captures in 10,000 base-chance tickets.
- `pnpm build:server` — passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` — 19 passed in isolated PostgreSQL test schemas. The existing four-tier case includes target 25, now species 48 (wheel), and verifies miss debit, 20× capture award, wallet arithmetic and exact idempotent replay. Concurrent shots, exactly-one capture, historical receipts and solo assistance remain covered. Expected database gating errors and the existing pg concurrent-query deprecation warning are not deployment failures.
- `pnpm build:vercel` — passed, player entry `index-DLD1IDCn.js`, restricted API bundled. Build tools needed the established sandbox subprocess escalation.
- `node --test tests/deployment/vercel.test.mjs` — 4 passed. Confirms route protections and excludes the dev fixture page/content from static production output.
- `node scripts/asset-manifest.mjs` — 74 original art/audio/presentation assets recorded.
- `git diff --check` — passed after removing whitespace; informational CRLF notices remain.

Browser: all six representative effect families rendered in the local visual harness; particles finished at zero visible and Reduced Motion produced zero particle nodes. Screenshots are explicitly render fixtures, not fabricated live awards. Actual local Abyss and Polar tables rendered the moving wheel, independent firing and labeled score plaques. In a 94.9-second interval AI scores rose from 490/230/500 to 1600/1220/1570 and shots from 411 to 1376, while player shots stayed zero and the balance stayed 989.65. Local browser error log was empty. No browser-paid round or shot, hosted play, grant or balance reset was made. Real Android/iPhone performance remains unverified.

Local ignored evidence: `reports/screenshots/v26/win-effects.png`, `jackpot-target.png`, `scoring-ai.png`, `ui-checks.json`.

## Data and rollback

No migration, hosted account/wallet change, operator change or new paid service. Publication uses the existing authorized player Vercel project. Roll back the matching player and API together to V25 because trajectory proof changed; retain all accepted receipts and ledger rows. The operator site is not redeployed. Cosmetic AI points exist only in the current browser table visit.

## Publication

- Source commit `72d18b4` pushed to GitHub main.
- Deployment `dpl_BaqXc9nGyVj45HG8LAVM2RNJkoZs` is READY at https://new-game-test-topaz.vercel.app/. Public entry matches `index-DLD1IDCn.js`.
- Thirteen public checks passed: both site health responses, test-environment flag, twenty-game catalog, new wheel SVG and existing art/audio, 401 on unauthenticated blackjack/win totals, 404 on operator account routes at the player domain, matching player entry and unchanged operator entry `index-CT1MaUjW.js`.
- Existing hosted session restored without entering credentials. Opened an Abyss table without firing; three AI CREW plaques accumulated 880/880/820 points, player shots remained zero, and the balance stayed 1,601.55 throughout this hosted check. This differs from the earlier V25 balance because the account had subsequent activity outside this check; no cause or change by this release is inferred. Console errors: none. Returned to the lobby without logging the user out.
- Evidence: `reports/screenshots/v26/live-route-checks.json`, `live-ui-checks.json`, `live-fish.png`. Deployment used the established process-local same-vendor Vercel web API gateway; TLS remained enabled, with no OS or networking security changes.
