# Separate Vercel operator deployment

Project: `new-game-operator` (`prj_Sm45nUZgi55xqTVUJlVHXySPic4B`) in the existing free Vercel team. The existing player project remains `new-game-test`; its linkage in `.vercel/project.json` is untouched. Netlify is not deployed by this workflow.

## Build and runtime

- `pnpm build:server`
- `pnpm build:vercel-operator` builds the independent admin app and its staff-only Node 24 function into `.local/vercel-operator/.vercel/output`.
- `node --test tests/deployment/vercel-operator.test.mjs` verifies the actual generated handler and routing.
- Deploy with the official Vercel CLI using `--cwd .local/vercel-operator --prebuilt --prod`. This private directory contains the separate project linkage, never the root player linkage.

Server-only environment: DATABASE_URL (existing dedicated Vercel test database, TLS), GAME_ENV=hosted-test, HOSTED_APP=operator, HOSTED_TEST_PLATFORM=vercel, HOSTED_TEST_PROJECT_ID and VERCEL_PROJECT_ID matching this operator project, HOSTED_TEST_SITE_ID matching the existing database marker, HOSTED_TEST_PROFILE=stage-paying30-v2, exact HTTPS ALLOWED_ORIGINS, NODE_ENV=production. Vercel supplies VERCEL=1. Never expose the connection string through VITE variables, source code, logs or static assets.

The staff transport permits only console routes. It enforces staff login, an independent HttpOnly/Secure/SameSite cookie, exact origins, CSRF, bounded JSON, unique query parameters and strict route rewriting. The shared business layer checks branch authorization again. Receipt and account queries have database pagination and validated filters.

To allow newly managed players in the Vercel game, set HOSTED_PLAYER_ADMISSION=managed **on the player project**, and deploy its updated restricted player handler. Staff remain unable to log into the player gateway. No public registration, automatic funding, cash functionality or changed game math is added.

## Database and recovery

Verify the existing test database marker and save an encrypted/access-controlled private backup before applying migrations 011 and 012. Record existing wallet versions/balances before and after migration; these migrations do not change balances. Provision sample accounts only through authenticated creation, starting at zero. Existing Main Admin/sub-contractor/agent credentials can be reused without password reset.

Keep migration 011/012 and all ledger history during rollback. Do not restore an older database snapshot over new accepted activity. An older application lacking archive/ancestor checks is not a safe rollback while staff branches are blocked. Roll back deployment only to an access-compatible version, or pause traffic first.

## Status

Build, database integration and local responsive checks pass. Vercel project exists. Credential upload requires the explicit database-secret approval requested after automatic approval review rejected the first attempt. No operator deployment is claimed live until health, password login and branch-management checks succeed on its public URL.
