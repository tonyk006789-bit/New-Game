# Netlify hosted-test deployment — 23 September 2026

## Current status

- **Active:** https://new-game-tonyk006789.netlify.app is accessible without the owner's Netlify login. All five existing tester passwords work on the hosted site.
- Final verification found **1,000.00 credits per tester**, five original funding transactions, zero unbalanced ledger transactions, zero wallet mismatches and zero approved production profiles.
- All eight games settled through the live API. Identical retries and recovery retained original receipts. Four authenticated players occupied one fish table; the fifth could not take an occupied seat. A cannon trajectory was validated and settled, then replayed unchanged.
- Temporary database token-write access was disabled in Netlify. New logins for all five accounts and fish-table join/leave mutations still passed afterward. Chrome successfully displayed Player 5's lobby with 1,000.00 credits.

## Build history before activation

- Source foundation `0058e618a85708e30dd248ce6827f6de7c0c3bbc` pushed to GitHub `main` and verified against the remote SHA.
- Netlify project `new-game-tonyk006789` created with a dedicated managed PostgreSQL database on the free plan.
- Initial player deploy `6ab36de4fa1799ae8640c66a` published. Chrome rendered the login page, initially behind Netlify's Private access gate.
- Hosted implementation commit `fe18ab47d31710548699681f6315494cd74f0a18` was pushed and deployed as `6ab376838a152d00098358b3`. Netlify confirmed **Migrations applied** and **Published**. The four hosted variables were saved for the published branch only. Before activation, an unauthenticated external request received HTTP 401 from Netlify's private-site protection.
- A live request caught a function startup failure. Inspection reproduced duplicate `game-api.mjs` entries when Netlify transformed the TypeScript workspace packages. The build now precompiles those sources to one ESM entry. The corrected archive has no duplicate paths.
- Corrected commit `023b4ab439c3343810c9d9eda8ae29e24f313b43` published as deploy `6ab379490c69220008585819`. This remains the active application version. Netlify lists one active function; runtime logs show completed invocations without the previous handler exception. A PostgreSQL warning confirms the current `sslmode=require` alias verifies the server certificate; the dependency is pinned. Chrome initially blocked direct JSON-page inspection, but subsequent public HTTP and browser login checks passed after activation.

## Changes

Added a Netlify native function and player-only HTTP adapter; explicit hosted-test project/profile/TLS guards; database identity marker migration; secure hosted session cookie; a three-connection pool limit; a manual, idempotent five-account provisioning script; and a Netlify SQL baseline. Existing authentication, game settlement, accounting and room functions remain authoritative. Hosted environment responses never disclose the local sample password.

Key paths: `apps/api/src/hosted-handler.ts`, `apps/api/src/environment.ts`, `apps/api/src/auth.ts`, `apps/api/src/store.ts`, `apps/api/src/staging.ts`, `netlify/functions/game-api.ts`, `database/migrations/008_hosted_test_scope.sql`, `netlify/database/migrations/0001_arcade_test/migration.sql`, `scripts/provision-hosted-test.mjs`, `scripts/netlify-setup.mjs`, `docs/NETLIFY.md`.

## Executed validation

- `pnpm lint`, `pnpm typecheck` and `node --check scripts/provision-hosted-test.mjs`: passed after final packaging cleanup.
- `pnpm build:server`: passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/hosted.test.mjs`: **7 passed, 0 failed**, using an isolated PostgreSQL schema removed afterward. Tests include five independent sessions, admin/out-of-audience denial, origin/CSRF/body-size checks, concurrent durable round replay, automatic recovery, four seats, fifth-player seat conflict, database scope and logout.
- `pnpm test`: **50 reference + 70 unit + 16 integration = 136 passed**.
- `pnpm test:netlify`: **3 passed**.
- `pnpm build:netlify`: passed; publishes player assets and same-origin function rewrites.
- After the startup fix, `pnpm build:netlify`, `pnpm test:netlify-bundle` (1 passed), and `pnpm lint` passed. The official function builder produced a 770-file archive with exactly one entry module and zero duplicate paths. Publication scan checked 295 source paths against 17 private credential values, with no findings.
- `node .cache/netlify-tools/node_modules/netlify-cli/bin/run.js functions:build --filter @new-game/player --src "C:/Users/kcdre/OneDrive/Documents/ChatGPT/New Game/netlify/functions" --functions "C:/Users/kcdre/OneDrive/Documents/ChatGPT/New Game/.cache/netlify-functions"`: passed with official Netlify CLI 27.8.1. Initial invocation without the explicit workspace stopped at the monorepo-selection prompt; the explicit invocation succeeded.

Reference math tests do not establish production accounting. Local PostgreSQL tests do not establish remote connectivity, browser access for other people, or native-device performance.

## Live activation evidence

- `pnpm build:server`: passed for the provisioning code.
- `node .cache/setup-hosted-connection.mjs`: retrieved only this project's connection through the authorized official Netlify API; saved it privately with `sslmode=verify-full`. No connection secret was printed or committed.
- `node --env-file=.local/hosted/runtime.env scripts/provision-hosted-test.mjs`: **passed twice**. Both runs reported 100000 integer units for each tester. Account creation began at zero; Main Admin MFA and manual ADD funded each account once. The second run replayed receipts.
- `node .cache/verify-hosted-live.mjs`: **passed**. Five independent secure-cookie sessions; public page and database health; admin-route denial; seven cabinet/keno games at 0.25 and 20.00-credit stakes; duplicate settlement/recovery; four real fish seats; fifth-seat conflict; validated cannon impact and replay. Eight total verification rounds were recorded.
- `node --env-file=.local/hosted/runtime.env .cache/finish-hosted-acceptance.mjs`: **passed**. The eight verification rounds produced a net 59.50-credit gain for tester.one. An MFA-protected manual REMOVE offset only that verification gain, preserving all accepted outcomes/history. All five final balances were 100000 units. Ledger reconciliation and exactly-once original funding passed.
- Netlify database UI: **Allow personal access tokens full access to the production database = unchecked**, save completed.
- `node .cache/check-hosted-final.mjs`: **passed after permission cleanup**. Public HTTP 200; health HTTP 200; all five logins with 1,000.00 credits; seat-four join/leave mutations; verification sessions revoked afterward.
- Chrome: actual sign-in as tester.five reached the eight-game interactive lobby and displayed **Player 5 / 1,000.00**.

Private evidence: `.local/hosted/live-acceptance.json` (run `fe11e7ed-7b53-4235-af8d-cf55a66768e2`), `.local/hosted/accounts.json`, and `.local/hosted/TESTER_LOGINS.md`. These and the one-time `.cache` verification helpers are intentionally untracked. Hosted credentials match the IDs/passwords already given to the owner. No recurring credit refill was introduced.

## Remaining limits

The requested hosted activation is complete. Production game mathematics remain undecided, and physical Android/iPhone acceptance remains deferred. This verification covers five test accounts, not larger-scale load or native-device certification.

## Migration and rollback

The new identity table contains no production data. The Netlify baseline installs schema 001–008 on the dedicated empty database. It does not grant credits or create user accounts. Restoring a prior deploy or disabling `GAME_ENV` stops hosted actions while preserving ledger history. Never delete a committed award or overwrite balances during rollback.
