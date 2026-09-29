# Operator hierarchy and deployment verification — 29 September 2026

## Implemented

- Password-only staff login and recent password verification; authenticator fields and console credit-value disclaimers removed.
- Sub-contractor display name for SUB_DISTRIBUTOR, dedicated Sub-contractors/Agents pages, direct-agent creation and management.
- Parent redemption for direct hierarchy pairs with deterministic wallet locks, source/destination versions and durable replay.
- Archive/restore without account deletion; staff suspension/archive blocks descendant login and requests, revokes branch sessions and retains balances/history.
- Shared/exclusive PostgreSQL access lock acquired before account/session/wallet locks, preventing access changes racing accepted requests.
- Independent Vercel admin artifact and staff-only transport. Player transport remains separate and supports explicit managed-player admission.

## Commands executed successfully

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build:server`
- `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs` — 16 passed, including test group. Covers direct-parent creation/management/redemption, concurrent retries, supply conservation, reserved balances, branch archive/suspension/restoration, immutable history and role isolation.
- `node --env-file=.local/staging/runtime.env --test tests/db/operator-hosted.test.mjs tests/db/hosted.test.mjs tests/db/staging.test.mjs` — 29 passed. Includes staff/player audience separation, password-only login, secure cookie, CSRF/origin/body/query checks, environment binding, player rounds and accepted awards.
- `node --env-file=.local/runtime.env --test tests/db/backend.test.mjs` — 16 passed.
- `pnpm test:unit` — 83 passed.
- `pnpm test:integration` — 16 passed.
- `node --env-file=.local/staging/runtime.env scripts/database.mjs migrate` — applied 012 to local staging.
- `pnpm build:vercel-operator` and `pnpm build:vercel` — passed, independent artifacts.
- `node --test tests/deployment/vercel.test.mjs tests/deployment/vercel-operator.test.mjs` — 7 passed against generated Node bundles.

Total: 167 passing test cases/group entries in these commands. These are software/database checks, not production game-math or device certification.

## Browser acceptance

Signed into local Main Admin with ID and password only. Verified sub-contractor role labels, scoped rows, Add credits/Remove credits/Recharge/Redeem, account-edit dialog with Suspend and Remove/archive, and no authenticator field/disclaimer. Inspected desktop at 1366px and mobile at 390px; horizontal table scrolling stays within the panel. Temporary viewport override was reset. Browser bridge pointer clicks were unresponsive in this session; keyboard activation of the same buttons worked. No runtime console errors were reported.

Screenshots (private local artifacts):
- `reports/screenshots/operator-console/login-password-only.png`
- `reports/screenshots/operator-console/subcontractors-desktop.png`
- `reports/screenshots/operator-console/subcontractors-mobile.png`
- `reports/screenshots/operator-console/archive-management.png`

## Migration and publication status

Migration 012 adds only accounts.archived_at and an index. No wallet values or existing ledger rows change. 011 is also required for hosted operator deployment. Never roll back to code that ignores archived ancestors while blocked branches exist; keep history and use an access-compatible rollback or pause traffic.

Separate free Vercel project `new-game-operator` exists. Automatic approval review rejected the initial database-secret upload; explicit owner permission has been requested. No operator URL is reported live yet, and no hosted database migration or balances have been changed in this pass so far. The existing game and Netlify deployments are unchanged pending the approved publication steps.
