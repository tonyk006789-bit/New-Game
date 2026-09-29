# Agent console acceptance — 29 September 2026

## Result

Implemented and verified the local staging operator console at `http://127.0.0.1:5184/`. The player game remains at `http://127.0.0.1:5183/`. Source remains separate from the player/native bundle. Public Vercel operator deployment and admission of newly created players are awaiting the separately requested owner approval; the existing five-player hosted gateway still rejects every operator route.

## Changed areas

- `apps/api/src/accounts.ts`, `auth.ts`, `password.ts`: assigned-agent player creation/edit/reset/suspension, recent verification, idempotent account operations, staff own-password changes, and a login/account lock that serializes credential resets with sign-ins.
- `apps/api/src/ledger.ts`: dedicated player-to-own-agent REDEEM, deterministic two-wallet locking, both version checks, available-credit bounds, immutable balanced postings and durable idempotency.
- `apps/api/src/operator.ts`, `app.ts`: scoped dashboard, account search/filter/sort/pagination, credit/game/reward records, printable receipt data and own settings.
- `apps/admin/src/App.vue`, `api.ts`, `Dialog.vue`, `style.css`, `main.ts`: independent admin client, dashboard/cards, account tables, action review, reload-safe pending credit requests, scoped records, native accessible dialogs, password settings and responsive navigation.
- `database/migrations/011_agent_console.sql`: additive operation kinds and query indexes.
- `tests/db/operator.test.mjs`, `backend.test.mjs`, `hosted.test.mjs`: new database acceptance plus permission and hosted-exposure regressions. An existing cabinet test still expected `practice-v1`; its expectation was corrected to the already implemented `practice-cabinets-v2`. No game rule was changed for that correction.
- `scripts/setup-operator-demo.mjs`, `package.json`: repeatable guarded local fixture and `test:operator` command.
- `AGENTS.md`, `docs/OWNER_UPDATES.md`, `docs/LOCAL_MVP.md`, `docs/AGENT_CONSOLE.md`: approved permission exception, workflows and operational notes.

## Exact verification commands and results

Commands ran from the repository with the bundled Node runtime on PATH. Windows sandbox child-process spawning initially returned EPERM for Node test runners; the same commands were then run with reviewed process permissions. This was an environment restriction, not a passing test result.

| Command | Final result |
|---|---|
| `pnpm lint` | Passed, no warnings |
| `pnpm typecheck` | Passed |
| `pnpm build:server` | Passed |
| `pnpm build:admin` | Passed; separate operator assets |
| `pnpm build:vercel` | Passed; existing player-only static/function build, not deployed |
| `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs` | Passed, 14 tests including the suite parent |
| `node --env-file=.local/runtime.env --test tests/db/backend.test.mjs` | Passed, 16 tests |
| `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs tests/db/hosted.test.mjs` | Passed, 23 tests |
| `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs tests/db/hosted.test.mjs` | Final repeat after credential-lock/hash placement and hosted-route assertions: 22 passed |
| `pnpm test:unit` | 83 passed, 13 files |
| `pnpm test:integration` | 16 passed |
| `node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` | 50 passed; reference models only, not production game approval |
| `pnpm test:vercel` | 4 passed; verifies admin exclusion and route boundaries |
| `node --env-file=.local/staging/runtime.env scripts/database.mjs migrate` | Applied 011 locally; previous migrations preserved |
| `node --env-file=.local/staging/runtime.env scripts/setup-operator-demo.mjs --fund-play-credits` | Own demo branch/accounts created; one authenticated 100.00-credit Main Admin ADD |

Secret scan: 269 tracked/new source and generated artifact files checked against 19 local private values; zero matches.

New database coverage includes concurrent create/redeem retries, changed-body idempotency conflicts, role/CSRF/origin denial, branch isolation in row/count/receipt queries, negative/over-reserved protection, two-wallet stale conflicts, game-settlement/redeem races, exact bigint JSON beyond Number.MAX_SAFE_INTEGER, concurrent password verification without lock-upgrade deadlocks, reset/session revocation, own-account password change and no credential values in audit. Tests use isolated temporary schemas, removed after execution; hosted databases were not used.

## Browser evidence

Using the local demo agent through the real UI:

1. Dashboard loaded three actual zero-credit players and the agent's manually funded 100.00 credits.
2. Recharged Alex by 10.00: player 0.00 → 10.00, agent 100.00 → 90.00. Receipt `c4b32031-95d4-4e02-ac64-050d33e2fb12`.
3. Redeemed 2.00: player 10.00 → 8.00, agent 90.00 → 92.00. Receipt `7c9650fa-0e7f-4fb5-befa-ada887c83df4` shows -2.00 and +2.00 postings.
4. Verified receipt opening, record navigation, settings identity/session list and mobile account filtering.
5. Inspected desktop and 390×844 phone layout; table scroll is confined to its panel, with no page-width overflow. Responsive menu works. Browser error/warning log was empty after the final check.
6. Fixed the post-commit modal's stale available-balance snapshot and duplicate dialog title IDs found during visual inspection.

Ignored local evidence (contains local fixture account details):

- `reports/screenshots/operator-console/dashboard-desktop.png`
- `reports/screenshots/operator-console/players-desktop.png`
- `reports/screenshots/operator-console/players-mobile.png`
- `reports/screenshots/operator-console/redeem-receipt.png`
- `reports/screenshots/operator-console/settings-desktop.png`
- `reports/screenshots/operator-console/settings-mobile.png`

Local demo passwords are available only in `.local/operator-demo/LOGINS.md` and its private JSON source. No sample credentials are included in web assets. Existing five human tester accounts and their balances were untouched.

## Remaining / rollback

Remote operator publication awaits owner approval. The existing player site's five-account admission restriction remains in place until explicitly broadened. No new Vercel/Neon resources, payments, external JUWA mutations or hosted-database migrations occurred.

Retain migration 011 when rolling back application code; disable new routes to stop new REDEEM actions. Do not delete historical records or narrow constraints over existing REDEEM entries. Corrections require new authorized transactions. See `docs/AGENT_CONSOLE.md` for full migration/rollback notes.

Physical Android/iPhone, macOS signing and app-store acceptance remain untested/deferred. This web/admin change does not certify those requirements. No production payout math was approved or altered.
