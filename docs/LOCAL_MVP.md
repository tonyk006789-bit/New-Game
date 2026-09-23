# Local playable build — 18 September 2026

**22 September update:** isolated staging now supports the owner's 1,000-credit test account, selectable stakes and 30% paying-round experiment. See [STAGING.md](STAGING.md). The practice-only descriptions below refer to the original development environment; production math remains undecided.

This build includes working browser accounts, persistent PostgreSQL credits and eight original **free practice** games. It is not the complete production or native MVP. Credit-staked games remain closed under the owner's instruction to leave payout math undecided. The latest additions and arcade presentation are documented in `JUWA_ARCADE_RESEARCH.md` and `../reports/ARCADE_CABINETS_VERIFICATION.md`.

The latest catalog and motion update adds Aurora Vault and Ember Relics, actual reel-strip motion, crystal collection sequences, cluster cascades, keno draw balls and fishing projectiles. See `STAKE_REFERENCE_AND_GAME_EXPANSION.md` for mechanics and references and `../reports/GAME_EXPANSION_VERIFICATION.md` for acceptance evidence.

## Open it

From PowerShell in this folder, run `./scripts/start-local.ps1`.

- Player: http://127.0.0.1:5173
- Operator: http://127.0.0.1:5174
- Player IDs/passwords: `.local/player-credentials.json`. Use `player.one` or `player.two`.
- Main Admin credentials and authenticator enrollment secret: `.local/admin-credentials.json`. Import its `authenticatorUri` or secret into an authenticator before signing in. Main Admin requires a six-digit code.

These files are local, ignored by Git, and are not web assets. They contain actual development secrets; do not publish them. Accounts were created through the authenticated Main Admin account-creation endpoint and started at zero. Browser acceptance checks explicitly added and removed 1.00 credit through the real admin interface, leaving the test player's balance at zero and preserving the receipts.

The local PostgreSQL 17.11 binaries are in `.cache/postgresql`, with data in `.local/pgdata`, bound only to `127.0.0.1:55432`. Connection configuration is `.local/runtime.env`. The binaries came from the [EDB archive](https://www.enterprisedb.com/download-postgresql-binaries) linked by [PostgreSQL's Windows download page](https://www.postgresql.org/download/windows/). No Windows service, paid service, remote deployment or production database was changed.

For a fresh machine: install Node 24.19/pnpm 11.19 and PostgreSQL 17, create a local `new_game_dev` database, set `DATABASE_URL`, run `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm db:migrate`, and `node scripts/bootstrap-admin.mjs`. Start the API, run `node scripts/create-local-players.mjs`, then `pnpm dev`. The bootstrap refuses to overwrite an existing root account. The local convenience launcher expects the recorded `.local/runtime.env` file.

## Implemented behavior

- Rich original neon lobby; dedicated login; temple reels, orchard keno and reef scenes; favorites/search/categories; phone, desktop and landscape layouts.
- Scrypt password hashes; 12-hour database sessions; HttpOnly SameSite=Strict browser cookies; CSRF and origin checks on mutations; persisted login-attempt limits. Production cookies require Secure. Credentials never enter browser localStorage.
- Main Admin TOTP authentication and five-minute privileged verification. Account creation follows Main Admin → Sub-distributor → Agent → Player. Main Admin can reset lower-account passwords or suspend/reactivate accounts; this revokes those accounts' sessions and preserves their credits/history.
- Zero-start bigint wallets, balanced immutable postings, projection reconciliation, actor/reason/request/before/after/version records, immutable audit, durable idempotency and stale-version rejection. Available amounts exclude reservations. Linked manual reversals exist in the API; there is no balance overwrite or grant endpoint.
- Manual ADD/REMOVE requires verified Main Admin. Transfers move only the caller's existing available balance. No transfer mints supply.
- Neon Sevens practice: 3×3 reels; five explicit straight/diagonal lines; identical triples light their matching cells.
- Jade Fortune practice: 5×3 reels; nine explicit lines; dragons substitute in matching runs of three or more from the left, including all-dragon runs without double-counting a line.
- Coin Carnival practice: center-row coins lock entire reels; up to three further spins move only unlocked columns. New locks do not reset the counter. The whole sequence is saved before it plays; coins are collectibles with no credit value.
- Temple Lights practice: the server samples a 5×3 grid of five equally likely symbols; three or more identical symbols from the left form a matching row. Results are saved and recoverable. This demonstration distribution is **not** a production slot profile or payout rate.
- Aurora Vault practice: three starting crystals lock into a fifteen-cell board. Empty cells can acquire crystals during pulses; additions reset the three-pulse counter. The server persists the entire sequence. Crystals have no credit value.
- Ember Relics practice: edge-connected groups of four matching relics clear from a 6×5 field, then new symbols drop in. A round ends at no groups or six cascades. The full server sequence is saved without a stake or award.
- Keno practice: select 4–10 distinct numbers; the server shuffles 1–80 with cryptographic randomness and persists 20 unique drawn numbers and matches. There is no paytable or award.
- Fishing practice: up to four actual accounts in the same agent branch share a persisted table; empty seats stay empty. Tapping a fish submits a target ID; the server serializes its one-time capture. Each catch contributes one nonredeemable practice point. It has no shot cost or credit award. Rooms last 15 minutes; inactive seats expire after 20 seconds. The client polls snapshots/heartbeats every two seconds and pauses while offline/backgrounded. This is a practice tap-to-catch mechanic, not an approved production damage/capture model.
- Own player wallet/history, branch-scoped operator account lists and reports, root audit viewer. History displays the most recent 100 ledger entries and 30 practice events; export/pagination are future work.

## Transfer permission matrix

| Actor | Source | Recipient | Issuance/removal |
|---|---|---|---|
| Main Admin | Own wallet | Active lower role in its subtree | Separate verified ADD/REMOVE |
| Sub-distributor | Own wallet | Active agent/player in its subtree | Never |
| Agent | Own wallet | Active assigned player | Never |
| Player | None | None | Never |

Sibling, upward, cross-branch and arbitrary-source transfers fail on the server. Only Main Admin creates or changes account access. Organization moves and lower-role account management are not implemented or implicitly authorized.

## What is still required for the complete product

1. Owner-approved slot metric, exact paytable/profile/version; separate keno and fish rules. Credit-staked round acceptance, reservations, financial game settlement, approved math distribution tests and client wager controls remain to be implemented after those decisions. Current practice cannot become credit play just by changing a flag.
2. Production fish simulation, shot/target validation and Colyseus transport. Shared practice currently uses authenticated HTTP snapshots; the separate Colyseus scaffold continues rejecting joins. No engine switch has occurred.
3. Android Java 21/SDK installation and a successful build; macOS/Xcode for iOS; signing/provisioning and physical-device tests. Native sources are synchronized, but **native sign-in is explicitly unavailable** until an HTTPS backend and platform-secure session storage are integrated. Browser authentication is not a completed native authentication design.
4. Production security/deployment work: separate least-privilege database roles, protected/encrypted MFA secrets and enrollment/recovery, operator password recovery, session/device takeover policy, rate-limit/load review, backup/restore testing, pagination, observability and release review. The current local database role owns its development schema. Application checks and database invariants are tested; this is not a production security certification.

## Commands and migrations

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:ledger`, `pnpm test:e2e`, `pnpm build`, `pnpm mobile:sync`, `pnpm build:android`, `pnpm build:ios`, `pnpm assets:manifest`.

Read-only ledger reconciliation: `node --env-file=.local/runtime.env scripts/reconcile.mjs`. It reports projection mismatches and unbalanced transactions without changing data.

`test:ledger` requires local PostgreSQL and builds the server. It creates a randomly named isolated schema, runs the actual API, verifies ledger races and scope, and drops only that test schema. Browser tests use the dedicated local accounts and preserve their manual test receipts. CI setup is supplied but has not run remotely.

Migrations 002–004 add identity/session tables, immutable ledger, practice outcomes, room scoping and reconciliation constraints. The trigger correction is a separate forward migration because the previous migration had already been applied locally. There is no destructive rollback: stop the new API if needed, retain the schema/history and apply forward corrections. Reversing an adjustment appends another authorized transaction; it never edits the original.

See `../reports/MVP_IMPLEMENTATION_VERIFICATION.md` for exact validation and screenshots. The original S0 reports are historical records, not the current implementation status.
