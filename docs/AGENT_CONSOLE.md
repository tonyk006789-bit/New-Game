# Agent console — 30 September 2026

The separate operator application is live at **https://new-game-operator.vercel.app/**. The associated player application is **https://new-game-test-topaz.vercel.app/**. Both use the existing dedicated Vercel test PostgreSQL database. Operator code and routes are not served by the player deployment. See `VERCEL_OPERATOR.md` for build, deployment, credentials and recovery.

## Reference pages and working behavior

The authenticated JUWA STORE account was inspected read-only. Original Vue/CSS now follows its dark header, gray accordion navigation, white compact tables and blue controls. No provider code, credentials or customer data is part of this product.

| Group | Pages | Behavior |
|---|---|---|
| Admin Management | Home | Ten real branch metrics, login time/IP/count. Activity means a login within 24 hours. Yesterday is a UTC day. |
| Admin Management | Total Account | Date-filtered played/won/recharged/redeemed/net-credit totals by agent; each player and committed round is counted once. |
| Admin Management | Agent Rewards | Rewards, Records and Rules tabs; disabled by explicit owner instruction. No invented rewards or rates. |
| Admin Management | Sub-contractors, Agents | Owner-requested hierarchy management, shown only to authorized staff. |
| Game User | User Management | Account/numeric-ID search, registration/account/balance sorting, pagination, editor dropdown and status controls. |
| Game User | Redeem Record, Recharge Record, Reward Record | Scoped immutable transactions with before/after values, operator, date, IP when known, and printable receipts. Reward Record contains the previously approved daily wheel. |
| Game User | Game Records | One row per committed round with its actual stake, award and before/after balance. |
| Game User | Wager Bonus FAQ | Matching bonus page, disabled. No deposit-match credits or wagering restriction. |
| Setting | Setting | Own account information and current-password-authenticated password change. |
| Setting | API Download | Generate/copy a once-shown key, edit exact IP whitelist, download original API documentation, and copy this platform's API address. Integration access is read-only. |
| Setting | Login Device | Real device records, filters, approval/rejection, review-device permission and optional review enforcement. |

Removed standalone Audit log, Organization and Adjustments screens and the invented dashboard/quick-start design. Audit records and manual credit authority remain on the server. Higher JUWA roles and undocumented provider APIs were not observable; the owner's approved hierarchy and accounting rules take precedence.

## Accounts and credits

Main Admin → Sub-contractor (`SUB_DISTRIBUTOR`) → Agent → Player. Main Admin manages the scoped hierarchy; sub-contractors manage direct agents; agents manage assigned players. Create always starts the next-role wallet at zero. Login IDs/branches are not silently edited or reassigned.

Recharge transfers the operator's own available credits to an active lower role in its branch. Redeem moves available credits from a direct child back to the parent actor. Skipped-level or unrelated redemption is denied. Only Main Admin may issue or retire credits through Add/Remove. Reservations cannot be taken, balances cannot become negative, and accepted winnings remain independent of operator funds.

Editor actions include edit nickname, reset password, recharge, redeem and owner-approved archive/restore. Status changes suspend/reactivate. Staff archive/suspension blocks descendants; restoration does not undo individually suspended child accounts. Password and access changes revoke affected sessions while retaining all balances and history.

Record filters, aggregates, pagination and receipts apply both current branch authorization and historical event scope. Incoming transfers never disclose an outside distributor's wallet. Integer credit units and versions stay decimal strings through JSON. A new numeric `public_id` is for display; original UUID identities remain intact. Historic IPs not previously captured show a dash instead of fabricated data.

## Authentication and API settings

Password-only login and five-minute recent-password verification replace authenticator codes, as requested. HttpOnly/Secure cookies, CSRF, exact-origin checks, login rate limits and server-side roles remain. Credit request IDs are saved in session storage before submission so retries recover the same receipt rather than duplicating a transaction; no password or session secret is stored there.

Login Device uses a separate opaque HttpOnly cookie, not a fingerprint. Review begins disabled. The first device receives review authority; while review is off, any recently verified signed-in browser can enable it and approve itself. Once enabled, only an approved review device may administer review. Activation revokes other unapproved sessions. Rejecting a device revokes its sessions; the current review device cannot reject itself or remove its own review authority. Device responses never contain cookie/session hashes.

API keys are generated on request, shown once, and stored only as hashes. Empty IP whitelists deny all access. Rotation invalidates old keys; password change/reset revokes them. Integration routes expose only the operator's account, assigned players, records and rounds. They recheck account and ancestor status for each query. They cannot issue sessions, create/manage accounts or move credits. Those actions use the console's session/verification workflow. No live JUWA integration exists.

## Run and verify

- `pnpm build:server`
- `node --env-file=.local/staging/runtime.env scripts/database.mjs migrate`
- `./scripts/start-staging.ps1` with the existing local PostgreSQL server on port 55432.
- `pnpm build:vercel-operator` for the separate operator artifact.
- `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs tests/db/operator-hosted.test.mjs`

Local URL remains http://127.0.0.1:5184/ for development. Owner credentials are in ignored `.local/vercel-operator/OPERATOR_LOGINS.md`; none are in source or static assets. The existing five human tester credentials/balances were preserved. The new `operator.sample` player remains at zero.

## Migration and rollback

Apply migrations 011–013 before this API. Migration 013 adds numeric presentation IDs, registration and transaction IP metadata, devices and API-key settings; it makes no accounting changes. An encrypted consistent logical backup was saved before hosted migration because bundled pg_dump 17 cannot back up the hosted PostgreSQL 18 server. All eight preexisting wallet balances/reservations/versions were unchanged.

Retain migrations and immutable history on rollback. Do not restore an old wallet snapshot over accepted activity. Disable new traffic or roll back only to a version that retains ancestor/archive restrictions, API revocations and enabled device-review enforcement. First revoke keys/disable review through an authorized recovery process if a legacy version cannot enforce them. Balance corrections are new authorized ledger transactions, never edits/deletions.

Evidence: `../reports/OPERATOR_REFERENCE_V14.md`. Desktop and 390px browser checks are not physical Android/iPhone certification. Native builds, signing/store acceptance and production payout approval are unchanged and remain separate gates.
