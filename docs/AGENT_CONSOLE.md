# Agent console — 29 September 2026

A separate responsive operator web app at **http://127.0.0.1:5184/** uses the same authoritative PostgreSQL accounting functions as local staging games. It is not part of the player or native bundle. The hosted player gateway remains restricted to its existing five testers; public operator hosting requires the separate owner approval requested during this iteration.

## Workflows

- **Dashboard:** registered/enabled players, sign-ins in the last 24 hours, yesterday's new/recharged/redeemed players, transfer amounts, all-time transfer amounts and available player credits. Yesterday uses UTC and is labeled. Manual issuance and game winnings are separate from recharge totals. Activity means a real sign-in, not invented online occupancy.
- **Players:** server-side exact-ID/literal-text search, active/suspended filtering, registration/name/available-balance sorting, bounded pagination. Actions are based on server capabilities and checked again on every mutation.
- **Create:** Main Admin creates the next hierarchy tier under a selected parent; Agent creates PLAYER only under itself. Every account begins at zero. Names can be edited; login IDs and branches remain unchanged.
- **Recharge:** move the operator's own available credits to an active lower role in its subtree. The existing transfer restrictions remain.
- **Redeem:** AGENT only; move available credits from that agent's own PLAYER into the actor's own wallet. No root/sub-distributor redemption, arbitrary recipient, minting, retirement, cash conversion or access to reserved amounts. Inactive own players can be collected from; suspension never hides/deletes their balance.
- **Account access:** Main Admin or assigned Agent can reset lower-player passwords and suspend/reactivate. All target sessions are revoked for password/status changes, and credits/history are preserved. Display-name changes are audited without signing players out. Root recovery remains separate.
- **Records:** UTC date/account/receipt filters, database counts/pagination, signed wallet changes and immutable receipts. Game ledger receipts also show the committed round, game, profile, stake and award. A stake and any positive award appear as separate ledger entries. Reward records refer only to the approved daily wheel; no agent commission or promotional bonus was added.
- **Settings:** own identity, real login count/time, own active sessions and authenticated password change. Tokens, hashes, TOTP secrets and CSRF secrets are never returned by the settings API. Password changes sign out all sessions. No invented device names or IP history.

## Security and correctness

Cookie sessions, CSRF and allowed-origin checks are shared with the API. Account management and redemption require recent staff verification; root actions retain TOTP. Agents may not manage other agents, distributors, root or players in another branch. Sub-distributors do not acquire account-management powers.

Migration **011_agent_console.sql** adds REDEEM and durable account-operation idempotency constraints plus query indexes. No balances, accounts, game outcomes or previous migration files are rewritten. Wallet locks are deterministic; both source and destination versions must match. Balanced append-only postings and wallet reconciliation remain database constraints. Agent credits never subsidize or suppress accepted game awards.

A credit request keeps its request ID during retries and is saved in session storage before submission. Only the request details are stored there, never credentials. A reload restores an unfinished request for checking/replay. Definite validation/stale-wallet rejection refreshes balances for a new review. Server idempotency remains authoritative.

Record reads require both current account scope and the event's historical branch scope. Receipts expose only wallet postings inside the caller's branch; an incoming distributor transfer does not disclose that distributor's outside wallet balance. Dashboard metrics are calculated from one database snapshot. Bigint amounts and wallet versions remain decimal strings through JSON.

## Local use

1. `pnpm build:server`
2. `node --env-file=.local/staging/runtime.env scripts/database.mjs migrate`
3. `./scripts/start-staging.ps1` (the existing local PostgreSQL server must be running on port 55432).
4. Optional isolated acceptance fixture: `node --env-file=.local/staging/runtime.env scripts/setup-operator-demo.mjs --fund-play-credits`
5. Open the operator URL above; private local demo credentials are in `.local/operator-demo/LOGINS.md`.

The fixture creates its own branch and zero-start accounts through authenticated account creation. Its optional 100-credit manual ADD uses Main Admin MFA, a saved durable request key and an immutable receipt. Re-running it cannot refill a spent wallet. It never resets existing tester passwords or balances. It rejects remote databases.

## Migration / rollback

Apply 011 before starting this API version. Previous migrations are checksum protected. Roll back application code to disable the new routes while retaining migration 011 and all posted REDEEM/account-operation history. Do **not** narrow ledger/idempotency checks after these records exist, delete ledger rows, or restore an older wallet snapshot over newer accepted transactions. A mistaken credit movement requires a new authorized corrective transaction; it is never removed from history. New indexes can be dropped separately during an operational rollback if necessary.

## Reference coverage and limits

Authenticated JUWA dashboard, player-management table/filter/sort actions, empty create form and account settings were observed. The owner-provided recharge/redemption screenshots informed record layouts. The reference's external commission rules, production gambling math, player data and integration/API packages were not copied. This console uses original Vue/CSS and this project's own authentication/ledger.

Desktop and 390px browser layouts were inspected. Browser emulation is not physical Android/iPhone certification. No native engine or packaging changed in this ticket. Evidence: `reports/AGENT_CONSOLE_VERIFICATION.md`.
