# V27 — neon Vegas theme and no repeated round banners

## Implemented

The owner's first screenshot identified the full-width Minor Win panel below the spin controls. Removed `WinAward.vue` and all three production consumers (CabinetGame, FeatureGame and GamePreview), including its unused styles and asset-manifest entry. Slot and keno results now use their existing WIN meter and concise status line. Theme-specific finite win effects remain. Ordinary fish catch cards say CAUGHT instead of MINOR WIN or MAJOR WIN; specific treasure/jackpot catches retain their own presentation. The lobby's cumulative award totals are separate and remain visible.

Added player-only `neon-vegas.css`: dark indigo surfaces, magenta selected controls/spin buttons, violet cabinet trim and cyan edge lighting. Replaced emerald surfaces in the header, category bar, lobby background, summary meters, cabinet shelf/captions, walking-floor trim, login, settings, dialogs, fish lounge, game controls and footer. Original illustrated game worlds remain distinct. Shared QR foreground is dark violet with a white background; no link or sharing behavior changed. Existing reduced-motion behavior, contrast/focus indications and responsive layout remain.

Changed files: `apps/player/src/CabinetGame.vue`, `FeatureGame.vue`, `GamePreview.vue`, `FishRewardReveal.vue`, `SharePanel.vue`, deleted `WinAward.vue`, `arcade-v24.css`, `main.ts`, new `neon-vegas.css`; updated `tests/browser/WinEffectsCheck.vue`, `scripts/asset-manifest.mjs`, `reports/asset-manifest.json` and owner/evidence documents. No new libraries or third-party artwork.

## Acceptance

Bundled Node 24 / pnpm on Windows:

- `pnpm typecheck` — passed after component/fixture changes.
- `pnpm lint` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit/win-presentation.test.ts tests/unit/win-effects.test.ts tests/unit/credit-presentation.test.ts --maxWorkers=2` — 13 existing regression tests passed. No new implementation-mirroring tests added for this reversible UI change.
- `pnpm build:vercel` — passed; final player entry `index-AAm1131n.js`, stylesheet `index-DCs2Flrl.css`. One attempt hit a transient Windows file lock on Pixi's transformVertices module (OS error 32); retry passed without dependency changes. Deployment tests after the successful final build passed.
- `node --test tests/deployment/vercel.test.mjs` — 4 passed against the final emitted output, including protected-route isolation and exclusion of dev-only previews.
- `node scripts/asset-manifest.mjs` — 74 original asset/presentation entries.
- `git diff --check` — passed; CRLF notices are informational.
- Source search for `WinAward`, `committed-win`, `MINOR WIN` and `MAJOR WIN` in player source/dev fixture returned no matches.

Browser acceptance at localhost: three authorized 0.25 test spins (two zero returns, then one 0.50 return). On the winning round, the normal WIN meter showed 0.50, the status showed one matching line, and there were zero `.committed-win` nodes / no Minor or Major Win text. Local test credits changed from 989.65 to 989.40 through those actual settlements; no balance reset. This verifies a positive-result layout, not just the idle screen.

Inspected lobby, spin controls, settings, share dialog and login in the new palette. Reduced Motion still activated and was restored. A 390×844 browser viewport had document/body widths of 375 with no horizontal overflow; three summary meter targets were approximately 110×118. The category row intentionally scrolls horizontally and now uses a dark neon scrollbar. Temporary viewport override was reset. Browser console had no errors; local test account was signed back in after checking login. Native Android/iPhone performance remains unverified.

Local ignored evidence: `reports/screenshots/v27/local-lobby.png`, `win-without-banner.png`, `settings.png`, `mobile-lobby.png`, `login.png`. Screenshot scaling in the browser mobile override is imperfect; DOM dimensions above provide the layout check.

## Data and rollback

No migration, math/profile change, credential change, hosted round, credit grant or operator update. The existing authorized player Vercel project is the publication target. Roll back by redeploying V26; preserve all wallets and round receipts. UI-only changes did not require repeating database accounting or native builds.

## Publication

- Source commit `9ab8c44` pushed to GitHub main.
- Deployment `dpl_J1Jsc1hSY8nzkLEj8t76sPM7Ljh3` is READY at https://new-game-test-topaz.vercel.app/. Public entry is `index-AAm1131n.js`.
- Thirteen public checks passed: both site health endpoints, test flag, twenty-game catalog, art/audio availability, expected unauthenticated 401s, operator-route 404 on the player site, and matching release entry. The operator remains on `index-CT1MaUjW.js`.
- A fresh background browser tab restored the existing hosted login and rendered the violet header/magenta category selection. Credit display was 1,601.80, matching the user's supplied screenshot. No hosted round, login submission or logout occurred. Browser console had no errors; document width 1265 within viewport 1280.
- Evidence: `reports/screenshots/v27/live-lobby.png`, `live-ui-checks.json`, `live-route-checks.json`. The existing Vercel same-vendor process-local gateway was used with TLS enabled; no credentials, permissions or OS security settings changed.
