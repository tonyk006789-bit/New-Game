# V46 — Coral Rush

Coral Rush adds an original seventh fish game, bringing the catalog to 31. It uses eight new creature sprites, four coral cannons, a lagoon playfield, a full-card cover and a separately composed calypso score. Four seats, independent labeled AI, target lock, auto/fast firing, species rules, hit nets, catch coins and the catchable 20× wheel use the existing shared implementation. New tidal lanes are computed identically by client and server.

## Reference limits and approval

The signed-in JUWA lobby exposed Happy Fishing's title, blue-shark card and APP badge. Opening it did not launch a playable browser game. The owner approved continuing with available references and specifically approved original artwork plus existing fish rewards. Earlier supplied screenshots show fish-table conventions, but are not confirmed Happy Fishing captures. No private provider logic, assets, credentials or metadata was obtained or shipped. This is an original implementation, not a verified 100% clone.

## Changed implementation

- Contracts/catalog and math: new game ID, production gate remains closed, species 65–72, append-only species identities, four size tiers, bounded tidal lanes and the existing V31 profile.
- API/database: join enum, burst-count/peer-impact filters and hosted route recognize the new table; migration 022 extends the room allowlist and adds its impact index. Existing outcomes, wallets and odds are unchanged.
- Player: world atlas/regions, background, cannons, guide, AI names, score and win palette; shared shelf and floor use a compact 83,416-byte cover. Coral Rush loads its own atlas and wheel instead of unrelated world atlases.
- Assets: built-in image_gen originals in `apps/player/public/art/coral-{atlas,background,cover}-v46.png`. `scripts/prepare-coral-assets.mjs` produces compressed delivery files. Generation prompts/provenance: `art-prompts-v46.json`; runnable integration manifest: `../config/coral-rush-v46.json`.
- Regression expectations now count 31 games, seven fish worlds and 42 total music scores. Older database expansion tests were using obsolete pre-V31 profile IDs; their requests now use the current configured policy, without relaxing server validation.

## Verification

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/typescript/bin/tsc -p tsconfig.server.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 278 passed across 40 files. Windows sandbox workers initially could not share temporary transform files; normal local execution passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs tests/db/blackjack.test.mjs` — staging suite passed; expansion requests initially failed due to obsolete profile IDs. After fixing those test requests, `node --env-file=.local/staging/runtime.env --test tests/db/blackjack.test.mjs` passed all 10 tests, including Coral Rush evaluated awards, replay and ledger conservation.
- Local PostgreSQL migration 022 applied successfully. Database was initially stopped and was restarted on its existing loopback port.
- Browser: actual local authenticated table loaded and played; after 502 accepted test hits, stake units totaled 12,550, awards 2,625 and the displayed balance 878.90 matched the database wallet exactly (starting 978.15). AI points remained separate. No hosted test wagers were placed by the agent.
- Browser visual inspection caught the inherited reef backdrop overriding the inline world image; the new theme now explicitly selects the lagoon backdrop. Screenshots: `screenshots/v46/coral-720p.png`, `screenshots/v46/coral-phone-landscape.png`. Checked 1280×720 and 844×390 landscape; desktop viewport emulation does not certify native orientation locks or real-device frame rate.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed; existing lazy Three.js dealer chunk still exceeds Vite's 500 kB advisory threshold.

## Deployment and rollback

- `node scripts/vercel-build.mjs` and `node --test tests/deployment/vercel.test.mjs` — 4 passed.
- `node node_modules/vite/bin/vite.js build --config apps/admin/vite.config.ts`, `node scripts/vercel-operator-build.mjs` and `node --test tests/deployment/vercel-operator.test.mjs` — build passed, 3 deployment tests passed.
- Hosted migration 022 followed an encrypted consistent backup of 24 tables. All 22 wallet balances/versions and account identities remained unchanged.
- Player published at https://new-game-test-topaz.vercel.app/; deployment `dpl_FBqBy1hJLqUdxedmFChLZJaYD1K1`, immutable URL https://new-game-test-3f2f31ylq-tonyk006789-7532.vercel.app/. Entry `index-DL5nALjY.js`.
- Operator catalog published at https://new-game-operator.vercel.app/; deployment `dpl_4QD3urx2FJji7JA1XNJ1uT69zLGA`, immutable URL https://new-game-operator-1lnzwm2zx-tonyk006789-7532.vercel.app/. Entry `index-B89jzsvs.js`.
- `.local/verify-v46-live.mjs` verified both live entry bundles against local SHA-256, no-store HTML, health endpoints, 31 catalog entries/seven fish games and exact new asset bytes. Unauthenticated joins and operator account reads returned 401. Live check evidence is saved in `screenshots/v46/live-checks.json`.
- Local browser confirmed the new cabinet in Walk the Floor and the complete displayed tier table. Rules pause the table and disable firing.

Migration 022 changes no balances, account identities or historical receipts. Rollback uses the previous player/operator builds while retaining the additive schema and all new rooms/receipts; do not delete historical Coral Rush activity or reverse player credits.

Android/iOS builds, signing, physical devices and exact Happy Fishing live behavior remain unverified. Production mathematics remains unapproved.
