# Netlify hosted-test deployment — 23 September 2026

## Current status

- Source foundation `0058e618a85708e30dd248ce6827f6de7c0c3bbc` pushed to GitHub `main` and verified against the remote SHA.
- Netlify project `new-game-tonyk006789` created with a dedicated managed PostgreSQL database on the free plan.
- Initial player deploy `6ab36de4fa1799ae8640c66a` published. Chrome rendered the login page at https://new-game-tonyk006789.netlify.app. Netlify currently labels the deployment Private.
- Hosted API implementation and one-time setup are prepared. Official CLI authorization and temporary database token-write access are pending owner confirmation. Hosted users, credit funding and remote game play are **not yet verified**.

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
- `node .cache/netlify-tools/node_modules/netlify-cli/bin/run.js functions:build --filter @new-game/player --src "C:/Users/kcdre/OneDrive/Documents/ChatGPT/New Game/netlify/functions" --functions "C:/Users/kcdre/OneDrive/Documents/ChatGPT/New Game/.cache/netlify-functions"`: passed with official Netlify CLI 27.8.1. Initial invocation without the explicit workspace stopped at the monorepo-selection prompt; the explicit invocation succeeded.

Reference math tests do not establish production accounting. Local PostgreSQL tests do not establish remote connectivity, browser access for other people, or native-device performance.

## Remaining acceptance

Configure the exact hosted environment, deploy migrations/function, run the manual provisioning script twice to verify idempotency, verify five live logins and balances, verify shared four-seat occupancy, revoke temporary database token writes, confirm live service continues operating, and verify access from a browser without the owner's Netlify session. Do not present the URL as ready for five-human testing before these pass.

## Migration and rollback

The new identity table contains no production data. The Netlify baseline installs schema 001–008 on the dedicated empty database. It does not grant credits or create user accounts. Restoring a prior deploy or disabling `GAME_ENV` stops hosted actions while preserving ledger history. Never delete a committed award or overwrite balances during rollback.
