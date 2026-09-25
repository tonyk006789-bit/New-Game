# Responsive cannons and per-game rules — 25 September 2026

## Changes

- `FishScene.vue`: one projectile per click, multiple shots in flight, independent impact callbacks, captured-target exclusion, and a fixed auto cadence (250 ms normal / 125 ms fast). Clicks no longer wait for a previous projectile, request or win animation. Stakes are captured when firing; controls cannot change a stake mid-flight. A 48-outstanding-shot client backpressure guard bounds stalled work.
- `api.ts`, `staging-state.ts`: each fish hit has its own saved request and recovery record. Uncertain responses reconcile through the existing tombstone/receipt endpoint. Slots keep their single-round gate. Account polling cannot overwrite a newer wallet version; returned receipts update the account without an extra HTTP poll per shot.
- `fish-wallet.ts`: displayed balances advance through committed wallet versions after their catch presentation, even if HTTP responses arrive out of order. Polling cannot reveal an unseen future award. This changes display timing only, never authoritative balances.
- API fish throttle allows up to 20 accepted hits per second per player instead of the slot-style 250 ms gate. Transactional wallet locks, scope/CSRF checks, target validation and durable idempotency remain. Impact submission grace is 10 seconds (firing at most 12 seconds ago) to accommodate a network burst. Missed/expired/caught targets remain free.
- Shared `reef-ballistics-v4`: arrivals every three seconds, at most fourteen active targets / one boss, uncaught migration every 240 seconds. All sixteen species, size variation and `reef-tiers-v1` probabilities/returns remain. Caught IDs never respawn.
- `GameRules.vue` / `App.vue` / `BetControls.vue`: on-demand rules for all eight games, controls and return descriptions, fish tier table, and diagrams for each active payline. Opening rules pauses new actions. The old statistics and manual recovery interface stays removed.

## Acceptance

- `pnpm typecheck`: passed.
- `pnpm lint`: passed, zero warnings.
- `pnpm test:unit`: **83 tests / 13 files passed**. New tests cover eight concurrent client submissions, stake snapshots, network loss and multi-request recovery, hidden/offline rejection, stale polling, and ordered win-before-balance presentation. Spawn checks cover 960 seconds, at most fourteen targets / one boss, all sixteen species and size variation.
- `pnpm build:server`: passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs tests/db/hosted.test.mjs`: **23 passed** in disposable schemas on local PostgreSQL. Eight concurrent distinct impacts all settled (133 ms for the burst test), eight unique wallet versions, exact total debit, identical retries with no extra charge. All fish tiers, rejected trajectories, ordinary game awards, ledger consistency, recovery, five logins and four-seat isolation passed.
- `pnpm build:vercel`: passed. Final assets `index-BUEpo4dK.js`, `FishScene-WW9tMY2J.js`, `index-COpxsa0-.css`.
- `pnpm test:vercel`: **4 passed**, including the actual Vercel preserved-path rewrite shape.
- Browser: local sample login, fishing lobby/table, eight rapid clicks produced exactly eight launched shots. Local sample balance went from 989.90 to 989.40 through committed test hits (no refills). No renderer errors. Checked each of the eight rules dialogs; phone-width (390 × 844) keno rules remained readable and scrollable. Opening rules disables gameplay behind it. Hosted tester balances were not used for gameplay acceptance.
- Screenshots (ignored local evidence): `screenshots/reef-v12/fish-rules.png`, `reef-rapid-fire.png`, `slot-rules.png`, `keno-rules-phone.png`.

Initial Vitest execution needed worker-process permission; rerun passed. PostgreSQL was initially unavailable on the configured port; the existing local server was restarted on 127.0.0.1:55432, then all database tests passed. No migrations or fixture grants were applied to the hosted environment.

## Deployment / rollback

Target: existing **https://new-game-test-topaz.vercel.app/**. Publication status is recorded below after verification. No new provider, project or database is introduced. Tester passwords, balances and ledger history are preserved. Netlify remains on its earlier deployment.

No database migration is needed. Roll back the Vercel code deployment only; do not restore old balances or erase receipts. Previously accepted outcomes replay unchanged. Refresh an already-open browser after updating because the client and server must use the same trajectory schedule.

Physical Android/iPhone rendering, lifecycle and performance remain unverified; the owner deferred device testing. Browser emulation is not native acceptance. Fish-room synchronization still uses polling. The hosted experiment does not approve production mathematics.

### Published and verified

- Code commit: `602da3d`, pushed to `origin/main` in the owner's New-Game repository.
- Vercel deployment: `dpl_7zfHqhB15QSidfiJbhicVphGofqB`, READY. Immutable URL: https://new-game-test-kn8hi2dei-tonyk006789-7532.vercel.app. Stable alias: https://new-game-test-topaz.vercel.app/.
- Command: `node .cache/vercel-tools/node_modules/vercel/dist/vc.js deploy --prebuilt --prod --yes --global-config .local/vercel-cli --scope tonyk006789-7532 --no-color`.
- Publication scan: 258 source/build text files checked against 14 private credential values, zero findings. `git diff --cached --check` passed.
- `node .local/vercel/verify-v12.mjs`: exact tested JS/CSS hashes served; healthy restricted API; public environment has no sample password; admin endpoint denied; all five existing ordinary logins succeeded with Secure/HttpOnly cookies. No hosted rounds, daily claims, funding or password edits were performed. Private evidence: `.local/vercel/verification-v12.json`.
- Deployed browser verification: existing Player 1 session restored, rules dialog loaded, reef rendered with the additional mixed-size creatures and all four cannons. No console errors. Balance remained 1,005.30 throughout this read-only game inspection. The temporary verification seat was released. Screenshots: ignored `screenshots/reef-v12/vercel-fish-rules.png` and `vercel-reef.png`.
