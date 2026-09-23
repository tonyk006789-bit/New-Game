# Staging implementation verification — 22 September 2026

Local browser staging implements the owner's latest clarification: **1,000 manually issued test credits**, **0.25/0.50/0.75 stakes**, and **30% of rounds returning any credits**. Production math remains undecided. This is implemented gameplay and accounting, not an artwork-only preview.

## Delivered behavior

- All eight games accept experimental stakes on staging, save the complete server outcome, evaluate its credit award and settle balanced ledger entries atomically. Normal development practice remains free and production round routes remain closed.
- A separate PostgreSQL role/database, ports, allowed origins and session cookie isolate staging. The dedicated role was verified unable to read development accounts.
- Player `stage.player` has **100000 minor units / 1,000.00 credits**, zero reserved, version 1, **one funding transaction** and no QA rounds. Credentials are only in ignored local files; player-only instructions are `.local/staging/PLAYER_LOGIN.txt`.
- Funding was performed through Main Admin login, MFA and the ordinary manual ADD endpoint. Re-running `fund-staging.mjs` replayed the same receipt. It does not refill a played-down balance.
- Win-rate panel reports actual per-game/profile rounds, paying frequency and uncertainty, net-win frequency, staked/returned credits, observed return and net result. Manual adjustments are excluded. The published paytables explicitly explain conditional sampling and the separate fish experiment.
- Lost responses retain the original stake, picks, game and request ID through reload. Recovery returns the accepted result without a second debit. New client actions are blocked offline/backgrounded; accepted transactions finish on the server.
- The reef includes eight original species, distinct anatomy and speed, a detailed generated seabed, real participant seats, cannon/projectile/net feedback and server-validated target positions. Completed tables start a fresh target set. No hidden bots or provider dependencies are present.

## Commands and results

Commands ran from the workspace using bundled Node 24.19.0 and pnpm 11.19.0. Windows sandbox restrictions initially prevented child processes; the same local build/test commands succeeded after approved execution outside that restriction. No remote service was published.

| Command | Result |
| --- | --- |
| `pnpm lint` | PASS, zero warnings/errors after removing two unused test helpers |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS: 50 reference, 57 unit, 16 HTTP integration tests |
| `pnpm test:ledger` | PASS: 15 PostgreSQL subtests plus parent, 16 reported |
| `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` | PASS: 7 PostgreSQL staging subtests plus parent, 8 reported |
| `pnpm exec playwright test --config playwright.staging.config.ts` | PASS: 9 tests, 2.7 minutes, desktop/phone emulation/landscape |
| `pnpm test:e2e` | PASS: all 48 existing account, practice and motion regressions, 7.1 minutes; together with staging, 57 browser tests passed |
| `node scripts/staging-math-report.mjs` | PASS: 80,000 offline trials; paying frequency 29.39–30.60% by game |
| `node --env-file=.local/staging/runtime.env scripts/reconcile.mjs` | PASS: 13 wallets, total 100000 minor units, 0 wallet mismatches, 0 unbalanced transactions, 0 production profiles |
| `node --env-file=.local/staging/runtime.env scripts/verify-staging.mjs` | PASS: one owner funding, exact untouched balance, nonprivileged database role, development accounts inaccessible |
| `pnpm build` | PASS: player, admin and API builds; player/API rebuilt after final changes |
| `pnpm mobile:sync` | PASS: final web assets copied to Android and iOS projects |
| `pnpm build:android` | BLOCKED: Java unavailable / JAVA_HOME unset; no APK claimed |
| `pnpm build:ios` | BLOCKED: Windows, no macOS/Xcode; no IPA claimed |
| `node scripts/asset-manifest.mjs` | PASS: 18 original art records |

Final development reconciliation also passed: 5 wallets, total balance zero, 44 transactions, 99 practice events, zero mismatched wallets, zero unbalanced transactions and zero approved production profiles. A final read-only staging check again confirmed `stage.player` at exactly 1,000.00 credits, with one funding transaction and zero owner test rounds.

The staging SQL suite exercises concurrent identical requests, conflicting request IDs, every round game's visible award, strict request validation, role/CSRF/origin restrictions, reserved credits, invalid fish aim, capture retries, fresh tables after exhaustion, immutable history, account-scoped statistics, empty production approvals and fail-closed environment gating. Tests use temporary schemas and remove only those schemas.

The UI suite uses separate manually funded QA players, retires their remaining test credits and disables them after testing. It covers all seven round machines and their stake amounts, credit-meter reconciliation, published statistics, lost-response reload/recovery, eight fish species and actual server-accepted shots. Tests capture screenshots and video. An initial UI test had a race between checking the skip button and its animation ending, plus a race unhooking a dropped-response handler before completion. The final suite uses reduced motion for deterministic settlement coverage and waits for the injected response drop; motion itself remains covered by the existing regression suite. A landscape footer overlap was fixed and visually reviewed. A room-expiry equality bug found by the additional rollover test was fixed and its PostgreSQL test rerun successfully.

## Statistical interpretation

The initial simulated **credit returns range 39.70–177.00%**, despite all games targeting 30% paying rounds. These are provisional engineering paytables, not a tuned common RTP. Jade and Aurora can grow credits on average under this experiment. Nothing selects a production return target. Exact observations and the profile definition are in `staging-math-v1.json`; the six-pick keno case is stated there.

## Evidence and changed files

- [Access, rules, architecture and research](../docs/STAGING.md).
- [Updated owner decisions](../docs/OWNER_UPDATES.md).
- [Landscape machine](screenshots-v5/neon-sevens-landscape.png), [reef](screenshots-v5/reef-landscape.png), [phone statistics](screenshots-v5/statistics-phone.png). **36 screenshots** in `screenshots-v5/` and **9 recordings** in `recordings-v5/` cover the three layouts.
- [Selected ImageGen prompt and provenance](art-prompts-v5.json). Only the opaque seabed was selected. Fish sprites are original Pixi graphics; failed atlas transparency attempts were not shipped.

Main changes: `apps/api/src/{environment,staging,auth,ledger,practice,app,main}.ts`; `packages/game-math/src/index.ts`; migrations `005_staging_rounds.sql` and `006_final_wallet_reconciliation.sql`; player `api.ts`, `staging-state.ts`, `StagingPanel.vue`, `staging-v5.css`, `reef-art.ts`, `FishScene.vue`, `App.vue`, `LoginScreen.vue`, `CabinetGame.vue`, `FeatureGame.vue`, `GamePreview.vue`, `main.ts`; both Vite configurations; `public/art/reef-seabed-v5.png`; staging setup/start/funding/simulation/verification scripts; staging unit/database/UI tests; the updated reef accessibility assertion; documentation and art manifest.

## Migrations, rollback and remaining limits

Migrations 005/006 were applied locally to staging and development. 005 creates immutable staging history with ledger-link checks. 006 makes deferred wallet reconciliation compare the final projection, allowing a stake and award in one transaction while still rejecting direct balance edits. Neither rewrites historical transactions or approves production profiles.

To disable staging, stop its exact loopback API/player/admin processes and retain the database and credentials. Do not drop history, overwrite balances, edit applied migrations or use a broad git reset; the repository has no committed baseline. A manual adjustment correction must append an authorized reversal. See `docs/STAGING.md` for startup and rollback details.

No Android/iPhone hardware testing, native secure-account flow, TLS deployment, signed installation, store release or production Colyseus fish synchronization is claimed. The native device deferral remains in force. Browser layouts and FPS do not certify native performance. Production paytables, target returns and versions still require owner decisions.
