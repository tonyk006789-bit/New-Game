# V23 — twenty games, replacement music and independent fish bots

The owner requested a complete music replacement, Royal Blackjack as the only Premium game, independent fish-bot targeting and a total of twenty games. The owner explicitly selected independent visual shots with rewards unchanged. Earlier approval to add cabinets using existing test profiles continues to apply.

## Delivered changes

- Replaced every playlist with 63 original 32-bar arrangements: three per game and three in the lobby. Fourteen original additive/FM/noise-synthesized WAV instruments replace the old oscillator music voice. Arrangements include disco, house, jazz, tropical and cinematic styles, with introductions, bridges, fills, stereo positioning and filtered echo. Music/sound switches remain independent; track selection persists per scene during the session. The first-click instrument-loading bug was fixed.
- Added Disco Diamonds (three reels/five lines), Midnight Express (portrait five-reel wilds) and Pirate Gold (five-reel hold-and-respin). All twenty games appear in both the shelf and walking-floor directory. The new cabinets use the same evaluated outcome distributions and multipliers as Neon Sevens, Jade Fortune and Coin Carnival respectively. New immutable profile identity `stage-cabinets-v23` avoids changing earlier profile hashes.
- Royal Blackjack is the only Premium-marked game and the only result in the Premium collection. Existing fish/keno games remain available in their ordinary categories.
- All four fish worlds show three labeled visual bot cannons on solo tables. They select separate visible targets, predict moving-target collisions, avoid player-locked/in-flight/recent targets and other bots' in-flight targets, stagger shots and recoil independently. Cosmetic shots never submit API actions, remove fish or grant credits. The existing server-owned `reef-assist-v1` paid-hit attempts and at-most-one-tier-award settlement remain unchanged. Bot activity stops when a second human joins. Reduced motion uses restrained impacts.
- Original poster and symbol atlases are integrated in the three playable cabinets. Prompts: `reports/art-prompts-v23.json`. Audio source: `scripts/render-music-bank.py`; metadata: `apps/player/public/audio/v23/manifest.json`. Hash/provenance inventory: `reports/asset-manifest.json`. No third-party artwork, recordings or soundfonts were included.

## Acceptance evidence

Executed on Windows with the bundled Node 24 runtime and pnpm 11:

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm test:unit` — 146 passed. Includes 480 seeded new/base cabinet equivalence comparisons; actual-collision bot exclusion checks across four worlds; all 63 score arrangements; one audio scheduler, scene/track replacement, independent mute and background lifecycle.
- `pnpm test:integration` — 23 passed, including twenty catalog entries and production credit-play gating for new cabinets.
- `pnpm test:reference` — 51 passed; these remain reference checks, not proof of hosted accounting.
- `pnpm build:server` — passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs tests/db/hosted.test.mjs` — 29 passed against isolated local PostgreSQL schemas. New cabinets persist exact evaluated awards and replay without extra charges; existing solo-assist math, simultaneous fish catches and four-human seating passed. Expected negative-case logs and an existing pg query-serialization deprecation warning occurred.
- `pnpm build:vercel` and `pnpm build:vercel-operator` — passed. The first operator bundle attempt hit a transient Windows file lock on an rxjs dependency; the subsequent full build passed.
- `node --test tests/deployment/vercel.test.mjs tests/deployment/vercel-operator.test.mjs` — 7 passed against the emitted functions.
- `python scripts/render-music-bank.py` — fourteen generated WAV samples, approximately 1.27 MB total, normalized sample peaks 0.86. No claim of subjective listening approval is made; browser loading and playback controls were verified.
- `node scripts/asset-manifest.mjs` — 64 assets recorded.
- Local browser: twenty-game lobby, Premium-only Blackjack, first-click audio status `ready`, all three new preview spins complete. Sunken Dynasty displayed three different bot targets simultaneously (18, 23, 20); while the player targeted 36/45, bots targeted 41/44. Preview credits remained zero. Desktop 1280×800 layout had no horizontal overflow. Screenshots are in ignored local `reports/screenshots/v23/`.

## Data and rollback

No database migration, account provisioning, refill or credential change is required. Existing profile objects/hashes remain unchanged. Keep a V23-compatible API for accepted new-cabinet receipts if the UI is rolled back. Never delete settled rounds or modify balances as a rollback. Previous profiles and fish outcomes retain their existing versions.

Android/iPhone hardware rendering, native builds/signing and production payout approval are not certified by these browser/local tests. Public release verification is recorded below after deployment.

## Published release

- Source commit `44da4e4` pushed to GitHub `tonyk006789-bit/New-Game` main.
- Player deployment `dpl_9Ee5n8XFPFfTnvvgwUaCbj1zGkX3` is READY at https://new-game-test-topaz.vercel.app/ with entry `index-BKN8D4pv.js`.
- Operator deployment `dpl_AHy3bgBSw9LLjctJFpVq7rYXAMCa` is READY at https://new-game-operator.vercel.app/ with entry `index-CT1MaUjW.js`.
- Public HTTP checks passed for both health endpoints, the test environment, all twenty catalog games, restricted unauthenticated blackjack/operator routes, both original atlases and sampled instrument files. Evidence: local `reports/screenshots/v23/live-route-checks.json`. No hosted tester account or balance was altered during acceptance.
- Live Guest UI verified twenty walking-floor directory entries, correct new cabinet names/labels, Blackjack-only Premium, music status ready, and labeled independent Sunken Dynasty bot activity (three bots, increasing shot counter with no player shot). All four fish worlds were also exercised locally with increasing independent bot shot counters. The live fish scene emitted no browser errors; prior V22 Pixi cleanup warnings remain outside this release's claimed fixes.
- Screenshots include `live-independent-bots.png`, `premium-only-blackjack.png`, `disco-diamonds.png`, `midnight-express.png`, `pirate-gold.png` in the ignored local evidence directory. Temporary desktop viewport override was reset.
