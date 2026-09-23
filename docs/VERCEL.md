# Separate Vercel five-player test

The owner selected a separate test environment on 23 September 2026. Do not copy Netlify wallets, replace its database marker, or run Vercel setup using `.local/hosted/runtime.env`.

## Build and transport

- `pnpm build:vercel` builds the player and emits the Vercel Build Output API v3 directory at `.vercel/output`.
- The bundled Node 24 function exposes the same restricted player route allowlist as the existing hosted adapter. No Main Admin API or console is published. API requests route before the SPA fallback; JSON bodies are limited to 16 KiB.
- `pnpm test:vercel` executes the emitted function through an HTTP server, tests the body limit, and checks output routing. PostgreSQL adapter tests cover login, sessions, project binding and the database identity marker.
- The share QR uses the current deployed origin, or an explicit `VITE_PUBLIC_ARCADE_URL` at build time. It no longer points every deployment to Netlify.

## Provisioning after account setup

1. Finish the Vercel account's security prompt, then create the project on the free plan. No paid upgrade is authorized. A database provider's account/terms prompt may also need the owner.
2. Create a dedicated PostgreSQL database for this environment. Require TLS and preserve provider certificate validation. Do not reuse the current Netlify database or copy its data.
3. Set server-only `GAME_ENV=hosted-test`, `HOSTED_TEST_PLATFORM=vercel`, `HOSTED_TEST_PROJECT_ID` to the exact `prj_…` ID, a new UUID as `HOSTED_TEST_SITE_ID`, `HOSTED_TEST_PROFILE=stage-paying30-v2`, `DATABASE_URL`, and `ALLOWED_ORIGINS` to the exact HTTPS player origin. Vercel's system environment supplies `VERCEL=1` and `VERCEL_PROJECT_ID`; enable system environment variables in the project if needed.
4. Save the private setup environment to `.local/vercel/runtime.env` (ignored), including the same project binding and `CONFIRM_HOSTED_SETUP=<new UUID>` for the explicit manual setup invocation. Apply `node --env-file=.local/vercel/runtime.env scripts/database.mjs migrate` to the **empty, dedicated Vercel database**. These migrations are checksum-tracked and transactional.
5. Run `pnpm build:server`, then `node --env-file=.local/vercel/runtime.env scripts/provision-hosted-test.mjs` manually. It creates zero-start accounts and funds each tester once via authenticated Main Admin MFA/manual ADD. It writes private logins to `.local/vercel/TESTER_LOGINS.md`, uses a new root identity, and cannot silently refill wallets on repeat. Never invoke it during build or server startup.
6. Publish with the official Vercel CLI or linked Git project. For a prebuilt deployment use `vercel deploy --prebuilt --prod` after project linkage and environment configuration. Verify the exact deployed commit, API health, five ordinary logins, four real seats, and the fish profile. Do not print tokens or database URLs.

The runtime checks both the Vercel project ID and the database's separate UUID marker. A mismatched project/database fails closed. Game production approval is still null; this is the owner-authorized five-person experiment.

## Rollback and isolation

Redeploy the previous Vercel code if necessary while preserving accepted awards and ledger history. New fish requests use `reef-tiers-v1`; old accepted requests replay their immutable receipts. No schema change is required for the new fish profile. Existing Netlify deployment/accounts stay intact; commits for this move use `[skip netlify]` to avoid updating that deployment.

Implementation follows [Vercel Build Output primitives](https://vercel.com/docs/build-output-api/primitives) and [Build Output routing](https://vercel.com/docs/build-output-api/configuration). Deployment status and exact test evidence are in `../reports/REEF_V11_VERCEL.md`.
