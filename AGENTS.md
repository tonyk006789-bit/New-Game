# New Game | authoritative repository guidance, iteration 2
Read this file and the v2 documents before coding. This kit replaces the earlier grant/refill and web/PWA-first assumptions.

Read `docs/OWNER_UPDATES.md` for direct owner steering received during implementation. The owner approved branch transfers of existing credits and deferred physical-device testing until devices are available for the MVP. The local backend now enforces the matrix in `docs/LOCAL_MVP.md` with PostgreSQL authorization/ledger tests. Payout math remains undecided.

## Confirmed boundaries
Private group; non-purchasable, nonredeemable play credits; no money, prizes of value, crypto, live JUWA dependency or provider credentials. Android and iOS player applications are required. Admin is a responsive web console unless separately requested. Original or properly licensed release art only.

## Credits and permissions
- MAIN_ADMIN has manual ADD and REMOVE authority. Treat the main/admin distributor as the root for the initial hierarchy; do not silently add a separate owner tier. A separate main-distributor role is optional and must be approved.
- Proposed minimum hierarchy: MAIN_ADMIN -> SUB_DISTRIBUTOR -> AGENT -> PLAYER. Branch restrictions apply on the server to every read, write, export, aggregate and socket action.
- Owner-approved exception (29 September): AGENT may redeem only available credits from an assigned PLAYER in the same agent branch back into that agent's own wallet. This is a separate balanced REDEEM transaction, not issuance, retirement, cash redemption or a general upward-transfer permission. Agents may create zero-balance players under themselves and edit/reset/suspend/reactivate those players. See `docs/AGENT_CONSOLE.md`.
- Owner correction (1 October): transfers are authorized only from the actor's own wallet to its direct next-role child. Main Admin → Sub-contractor → Agent → Player; no skipped levels. Main Admin manual ADD/REMOVE targets only its own wallet or a direct sub-contractor. Lower roles never inherit issuance/removal authority.
- Start every new non-system wallet at zero. Do not implement welcome bonuses, daily credits, automatic top-ups, promotional credit campaigns, scheduled grants or claim endpoints. A local test fixture may invoke the same authenticated/manual adjustment workflow, never create live player balances silently.
- Owner-approved exception (23 September): the local/hosted test daily wheel in `docs/OWNER_UPDATES.md` may award its explicitly approved equal-chance rewards once per 24 hours to a player with positive available credits. No automatic spin, zero-balance claim, refill or production game-math approval is implied.
- Game stakes and committed game winnings are separate authorized ledger events, not automatic grants. Settled winnings must not depend on an operator budget or discretionary approval.
- ADD and REMOVE create immutable balanced ledger entries, with actor, target, request ID, before/after balance and wallet version. Owner amendment (3 October): remove Reason sections from all operator forms/reviews/receipts and leave new optional reasons empty; preserve historical reasons and immutable accounting. Require privileged-session verification. Do not implement direct balance overwrite.
- Remove only available credits. Never take reserved amounts, make a player wallet negative, erase round history, cancel a previously accepted award or create hidden debt. A reversal is a new linked, authorized transaction.
- One PostgreSQL-backed authoritative ledger; integer units / bigint, decimal-string serialization. Enforce durable idempotency and transactional race protection. Pure reference helpers are not that backend.

## Mathematics
- No approved meaning of 30% yet. `config/product-decisions.json` intentionally has null production targets/profile.
- Do not copy the v1 96% illustration into production configuration. Both named slot examples are tests only. Scaffold generic evaluation and reports, but block actual credit-staked slot play until the owner approves the metric, paytable, profile and version.
- Keno and fish models need their own approvals. A slot-only target is not a fish capture rate or a keno paytable.
- No per-player odds, adaptive loss recovery, budget-based suppression, guaranteed 3 wins per 10 spins, fake occupancy or hidden bots.
- Owner-approved exception (3 October): test fish tables with exactly one human have three explicitly labeled bot teammates. After each valid paid hit fails its normal capture attempt, up to three free bot attempts use the existing tier chance, stopping on capture. At most one tier award belongs to the human. Bots stop when a second human joins, never hold wallets or count as human occupants, and do not independently grant credits. Use versioned `reef-assist-v1`; preserve all prior receipts.
- The server owns outcomes; clients present committed results. Every slot grid must evaluate to its persisted award. Retries cannot resample an accepted round.
- Owner-approved test expansion (6 October): `stage-blackjack-v1` uses the explicitly approved six-deck rules and reserved stakes in `docs/OWNER_UPDATES.md`. Sunken Dynasty/Polar Odyssey reuse fish tiers and solo assists; Neon Numbers/Pearl Keno reuse Orchard rules through `stage-keno-cabinets-v1`. Premium is featured for every tester; jackpot offers reveal existing awards. Production targets remain null.

## Mobile implementation

Owner credential amendment (3 October): newly set usernames and passwords need at least six characters including a letter and a number. Do not require lowercase-only usernames, mixed case or special characters. Usernames remain case-insensitive; existing usernames/passwords and numeric IDs are preserved. Apply the same policy to all new accounts, password resets and self-service password changes.
Proposed shared client: Vue/TypeScript plus PixiJS, packaged in Android/iOS using Capacitor. NestJS core API, Colyseus rooms and PostgreSQL remain the proposed backend. Pin compatible revisions in Sprint 0. Record a real Android and iPhone rendering/lifecycle smoke test early, including fish-scene density; browser emulation does not certify native performance. Do not silently switch engines if a gate fails.
Use platform-secure credential storage, TLS, safe areas, sound/motion settings and pause/resume recovery. No accepted credit-staked actions while offline or backgrounded. Already accepted actions settle on the server. Keep the privileged admin console out of the player app bundle.

## Work and evidence
Implement one coherent ticket at a time. Preserve unrelated existing work. Obtain permission before paid services, remote publication, production data changes or scope changes. Signing keys and provisioning profiles must never be committed.
Commands available now:
- `node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs`
- `node math-reference/report.mjs`
Sprint 0 must create, execute and document actual workspace commands for install, lint, typecheck, unit/integration tests, web builds, Android build and iOS build. Report unavailable macOS/signing/device steps as blocked, not passed.
Each change: changed files, acceptance evidence, exact commands/results, remaining issues, migrations/rollback notes and screenshots/device recordings for UI changes. Do not report reference tests as proof of production accounting, real-device performance or store approval.


## Owner amendment — 29 September 2026 operator hierarchy
The latest direct owner request and confirmation supersede earlier TOTP and lower-tier management restrictions for this implementation. Operator sign-in and recent verification use passwords without an authenticator. SUB_DISTRIBUTOR is displayed as Sub-contractor and may create/manage its direct AGENT accounts; AGENT may create/manage its PLAYER accounts. REDEEM is authorized only from a direct child in the hierarchy into the parent actor's wallet, including MAIN_ADMIN ← SUB_DISTRIBUTOR and SUB_DISTRIBUTOR ← AGENT. This never grants issuance/removal authority to lower roles. Removal archives accounts and blocks descendant access while retaining all accounting history. See docs/OWNER_UPDATES.md for the explicit owner confirmation and Vercel publication request.

## Owner correction — 1 October 2026 direct parent management

Only the parent actor creates, edits, resets, suspends, archives or funds its direct next-role children. Main Admin cannot create/manage/fund agents or individual players; sub-contractors cannot host players. Individual player lists, game records and receipts belong to their agent. Higher operators retain branch aggregates grouped by their direct staff children. Every new wallet starts at zero. Preserve existing balances and historical ledger entries; do not rewrite historical provisioning to fit new permissions. Abyss Legends must have distinct background/cannons and a persistent jackpot wheel revealing already committed boss awards, under the previously approved fish reward rules.
