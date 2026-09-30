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

Verify the existing test database marker and save an encrypted/access-controlled private backup before applying migrations 011, 012 and 013. Record existing wallet versions/balances before and after migration; these migrations do not change balances. Provision sample accounts only through authenticated creation, starting at zero. Existing Main Admin/sub-contractor/agent credentials can be reused without password reset.

Keep migrations 011–013 and all ledger history during rollback. Do not restore an older database snapshot over new accepted activity. An older application lacking archive/ancestor checks is not a safe rollback while staff branches are blocked. Roll back deployment only to an access-compatible version, or pause traffic first.

## Status — 30 September 2026

Live operator URL: **https://new-game-operator.vercel.app/**
Live player URL: **https://new-game-test-topaz.vercel.app/**

Operator deployment: `dpl_5WiGkoeef8qn756Jf5Y67fxKuL9z`.
Player deployment: `dpl_EoywYHwDjs59jRYhbMBXPKbbDCPL`.

The owner approved the credential transfer; the database connection is stored only in Vercel's server-side encrypted environment. Migration 013 adds numeric display IDs, login device records, IP metadata and hashed API key settings. All eight existing wallets were unchanged by the migrations. A zero-credit `operator.sample` account was subsequently created through the authenticated agent workflow to validate managed player admission.

Live checks passed for health, Main Admin and Agent password login, every report/settings endpoint, zero-start account creation, managed player login, role separation, logout and denial of operator routes on the player deployment. Existing staff credentials are reused without resets. Private owner login reference: `.local/vercel-operator/OPERATOR_LOGINS.md` (not committed).

`Login Device` uses an opaque HttpOnly device cookie; review is off initially. The first password-authenticated device receives review authority. While review is off, a recently password-verified browser can enable it and becomes an approved review device. Turning review on revokes other unapproved sessions. Once enabled, only existing review devices can approve or disable review. Keep an approved review device available. The UI refuses to reject or remove review authority from the current review device. There is no public bypass/reset endpoint.

`API Download` generates a secret shown once and stores only its hash. An empty whitelist denies all requests. Exact source IP restrictions and live account/ancestor checks apply to every request. API credentials are read-only and cannot create sessions or invoke console mutation routes; account/credit operations use console sessions. Password changes/reset revoke API keys. The Vercel adapter uses the platform's client-IP header, documented in [Vercel request headers](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for). Local Nest uses the socket IP; no arbitrary forwarded header is trusted there.

Do not roll back to a version that ignores enabled device review, API revocations, or ancestor/archive access rules. Keep migration 013 and revoke/disable new credentials before any access-compatible rollback. No database rollback may erase accepted accounting history.
