# Netlify private-group test

Player site: https://new-game-tonyk006789.netlify.app

Project ID: `df1f4e3c-07cc-4d97-af78-27bb84e9225f`. The site builds `main` from `tonyk006789-bit/New-Game`, at the repository root, using `pnpm build:netlify`. Only `apps/player/dist` is published. The admin console, local account files and development servers are not published.

## Hosted player API

`netlify/functions/game-api.ts` adapts native HTTP requests to the existing PostgreSQL authentication, room, round and ledger functions. It accepts only the player route allowlist and five named tester accounts. It exposes no account-management, credit-adjustment or admin routes. Sessions are secure HttpOnly cookies; mutations require the exact allowed origin and CSRF token. Bodies are limited to 16 KiB. API responses are uncached JSON; they never fall through to the app shell.

The build first compiles workspace code into one ESM entry in the ignored `netlify/functions-build` directory, which is the deployment function directory. This avoids duplicate function filenames produced when the hosted bundler transforms multiple TypeScript workspace package exports. Netlify then traces normal runtime dependencies.

Use these environment variables in the Netlify production deployment context. This context identifies the published Git branch, not approved production game mathematics:

```text
GAME_ENV=hosted-test
HOSTED_TEST_SITE_ID=df1f4e3c-07cc-4d97-af78-27bb84e9225f
HOSTED_TEST_PROFILE=stage-paying30-v2
ALLOWED_ORIGINS=https://new-game-tonyk006789.netlify.app
```

Netlify supplies `SITE_ID` and the managed `NETLIFY_DB_URL`; the official `@netlify/database` package retrieves the connection string at runtime. No database secret belongs in a `VITE_*` setting, source file or build output. Leave `GAME_API_ORIGIN` unset for this function. It remains an optional, validated external HTTPS player-service override.

Hosted mode requires the exact project ID, the experimental profile, a remote PostgreSQL URL with required TLS, and a matching `hosted_test_environment` database marker. The local staging guard still rejects remote databases. Production targets and profiles remain undecided. A missing or inconsistent hosted configuration fails closed.

The pool uses at most three connections per function instance. Four-seat fishing uses the existing transactional room membership and polling API; it does not require a long-running Colyseus server. Real-device performance and native app distribution remain unverified.

## Database and one-time account setup

A dedicated Netlify Database was created for this site on 23 September 2026. The baseline `netlify/database/migrations/0001_arcade_test/migration.sql` contains repository migrations 001–008, generated once by `scripts/netlify-migrations.mjs`. Netlify applies SQL migrations before publishing. Future schema changes require a new numbered migration; do not regenerate or edit an applied baseline.

Migrations create schema only. They do not create people, allocate credits or refill wallets. The separate manual command below requires an explicitly confirmed site ID and a private environment file:

```sh
pnpm build:server
node --env-file=.local/hosted/runtime.env scripts/provision-hosted-test.mjs
```

The private file needs `DATABASE_URL`, the hosted variables above, `SITE_ID`, and `CONFIRM_HOSTED_SETUP` equal to the site ID. Obtain the dedicated connection string through the official Netlify CLI/API without printing it. If database token-write access is enabled for setup, disable it afterward.

The script bootstraps an isolated zero-balance Main Admin, then signs in with MFA and uses ordinary authenticated account creation and manual ADD operations. Each of the five existing tester IDs/passwords is reused for this separate database. Every player starts at zero and receives exactly one authorized 1,000-credit adjustment. Persisted request IDs and receipts make reruns replay that adjustment rather than refill the wallet. Existing account identity, role, branch and credentials must match. Keep `.local/hosted/accounts.json` so interrupted setup remains recoverable.

Private tester instructions are written to `.local/hosted/TESTER_LOGINS.md`; credentials are never returned by the hosted environment endpoint. The local staging database and its balances are unchanged. Test accounts and credits are not yet considered ready until the live acceptance checks in the deployment report pass.

## Validation and rollback

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:netlify
pnpm build:server
node --env-file=.local/staging/runtime.env --test tests/db/hosted.test.mjs
pnpm build:netlify
pnpm test:netlify-bundle
```

The hosted integration test uses a disposable schema in local PostgreSQL. It covers five independent logins, secure cookies, branch restrictions, origin/CSRF checks, durable round retries and recovery, four seats with a fifth-player conflict, database identity mismatch and logout. It is evidence for server behavior, not proof that the remote deployment is configured.

Unsetting `GAME_ENV` disables the function. Restoring an earlier Netlify deployment rolls back code and player assets without rewinding accepted rounds or ledger entries. Leave applied schema and ledger history intact. No down migration deletes accounts or balances. A site rollback alone is not a database rollback.

Node is pinned to `24.19.0`, pnpm to `11.19.0`, and database SDK to `2.0.1`. Do not set `NODE_ENV=production` during dependency installation because the build needs development tools. Historical screenshots and recordings remain local and are excluded from publication.

References: [managed PostgreSQL](https://docs.netlify.com/build/data-and-storage/netlify-database/), [connection API](https://docs.netlify.com/build/data-and-storage/netlify-database/api/), [SQL migrations](https://docs.netlify.com/build/data-and-storage/netlify-database/migrations/), [Functions request API](https://docs.netlify.com/build/functions/api/).
