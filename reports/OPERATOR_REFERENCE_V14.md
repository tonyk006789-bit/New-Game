# Operator reference refinement and Vercel acceptance — 30 September 2026

## Result and scope

Operator URL: https://new-game-operator.vercel.app/
Player URL: https://new-game-test-topaz.vercel.app/

Final operator deployment: `dpl_5WiGkoeef8qn756Jf5Y67fxKuL9z`. Player deployment: `dpl_EoywYHwDjs59jRYhbMBXPKbbDCPL`.

Rebuilt the operator presentation around the authenticated JUWA STORE reference, preserving the owner's approved Main Admin → Sub-contractor → Agent → Player management and immutable credit ledger. Agent Rewards and Wager Bonus pages are disabled by the owner's explicit confirmation. No provider mutation, private customer export, copied key/code, paid service, Netlify release or game-math change occurred.

Changed code: `apps/admin/src/App.vue`, `style.css`, `api.ts`, new `DevicePanel.vue` and `ApiPanel.vue`; API authentication, accounts, password, reports, ledger IP metadata and hosted transports; new `device.ts`, `operator-api.ts`, `operator-reports.ts`; migration 013; direct-login fixture adapters and operator tests. Deployment still uses the established separate prebuilt operator output.

## Acceptance

- Sidebar matches Admin Management / Game User / Setting and their observed page names. Removed invented standalone Audit log / Organization / Adjustments navigation and decorative dashboard additions.
- Compact editor dropdown, numeric IDs, status controls, account filters, records, printable receipts and settings verified in the browser. Root sub-contractor actions are present on the public deployment.
- All account creation/edit/reset/status/archive, transfer, redeem, scope, idempotency and concurrency checks run against actual isolated PostgreSQL schemas. New wallets start at zero.
- New round report proves one record per committed round and `before - stake + award = after`. Totals are scoped before aggregation and do not count stake/payout postings as two rounds.
- Device review tests cover initial authority, first activation from a different browser, pending login without a session, approval, non-reviewer rejection, session revocation, cross-account denial, and self-lockout protection.
- API tests cover hash-only persistence, empty whitelist denial, explicit source-IP acceptance, read-only routes, branch scope, rotation, password-reset revocation and absence of secrets in audit records.
- Live API checks: operator health; Main Admin/Agent password login; all nine read/report/settings endpoints; creation of `operator.sample` at zero; player admission on the public game; rejection of staff on the player site and players on the operator site; denial of operator routes on the player deployment; logout.
- Desktop and 390px browser checks: operator pages render, modal controls are usable, horizontal table scrolling stays within the panel, and mobile header/menu fit the viewport. Fixed header wrapping and editor-menu clipping found during inspection.

## Commands and results

Runtime: bundled Node 24.19.0 and pnpm 11.19.0. Commands ran from the repository root using their absolute bundled executable paths where needed.

| Command | Result |
|---|---|
| `pnpm lint` | Passed, no warnings |
| `pnpm typecheck` | Passed |
| `pnpm build:server` | Passed |
| `pnpm build:vercel-operator` | Passed; separate admin static files + Node 24 function |
| `pnpm build:vercel` | Passed; updated player API, no operator UI in player artifacts |
| `pnpm test:unit` | 83 passed |
| `pnpm test:integration` | 16 passed |
| `node --env-file=.local/runtime.env --test tests/db/backend.test.mjs` | 16 passed |
| `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs tests/db/operator-hosted.test.mjs tests/db/hosted.test.mjs tests/db/staging.test.mjs` | 48 passed |
| `node --test tests/deployment/vercel.test.mjs tests/deployment/vercel-operator.test.mjs` | 7 passed |

Total: **170 passing tests**, including Node parent-suite counts. The new report fixture initially hit the real 250ms play cooldown; it now waits between its two independent test rounds. Sandbox child-process restrictions and a stopped local database were resolved before test execution. The final security adjustment also passed the 7-test operator hosted suite separately.

Credential scan of tracked/nonignored files and both deployment outputs found no private values. Ignored evidence/credentials/backups were never added to the deployment artifacts or Git.

## Hosted migration and evidence

The owner explicitly approved storing the existing dedicated test database secret in the operator Vercel project. Server-only encrypted environment configuration is complete. Encrypted consistent logical snapshots were saved privately before migrations 011–013. Pre/post snapshots showed all eight existing wallets unchanged. One zero-credit sample wallet was added afterward through the authenticated agent creation API; existing balances and passwords were not changed and no hosted round was played.

Private evidence:

- `.local/vercel-operator/live-verification.json` (live checks, no passwords).
- `.local/vercel-operator/OPERATOR_LOGINS.md` (owner credentials; ignored).
- `.local/vercel/operator-backup-*/` (encrypted logical backups + separate local keys; ignored).
- `reports/screenshots/operator-v14/` (browser evidence; ignored).

## Limits and rollback

Observed parity covers the signed-in STORE portal and owner screenshots. Hidden JUWA administrator tiers, unknown rebate rates and proprietary integration behavior are not claimed replicated. API settings are real but the original integration API is intentionally read-only; all requested account and credit management works in the operator console. Unrecorded historic IPs display a dash. Disabled bonus pages do not pretend to contain pending rewards.

Keep migrations 011–013 and all immutable accounting history. A rollback must preserve ancestor/archive restrictions, active device review and API-key revocation; otherwise pause traffic and perform authorized credential/access recovery first. Never overwrite live balances with a backup. Native device performance, Android/iOS signing and store acceptance remain deferred, not passed. No production payout rules were approved.
