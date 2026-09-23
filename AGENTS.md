# New Game | authoritative repository guidance, iteration 2
Read this file and the v2 documents before coding. This kit replaces the earlier grant/refill and web/PWA-first assumptions.

Read `docs/OWNER_UPDATES.md` for direct owner steering received during implementation. The owner approved branch transfers of existing credits and deferred physical-device testing until devices are available for the MVP. The local backend now enforces the matrix in `docs/LOCAL_MVP.md` with PostgreSQL authorization/ledger tests. Payout math remains undecided.

## Confirmed boundaries
Private group; non-purchasable, nonredeemable play credits; no money, prizes of value, crypto, live JUWA dependency or provider credentials. Android and iOS player applications are required. Admin is a responsive web console unless separately requested. Original or properly licensed release art only.

## Credits and permissions
- MAIN_ADMIN has manual ADD and REMOVE authority. Treat the main/admin distributor as the root for the initial hierarchy; do not silently add a separate owner tier. A separate main-distributor role is optional and must be approved.
- Proposed minimum hierarchy: MAIN_ADMIN -> SUB_DISTRIBUTOR -> AGENT -> PLAYER. Branch restrictions apply on the server to every read, write, export, aggregate and socket action.
- Lower-tier transfers are authorized only from the actor's own wallet to a lower role in that actor's subtree. All other directions are denied. Do not inherit issuance/removal authority.
- Start every new non-system wallet at zero. Do not implement welcome bonuses, daily credits, automatic top-ups, promotional credit campaigns, scheduled grants or claim endpoints. A local test fixture may invoke the same authenticated/manual adjustment workflow, never create live player balances silently.
- Owner-approved exception (23 September): the local/hosted test daily wheel in `docs/OWNER_UPDATES.md` may award its explicitly approved equal-chance rewards once per 24 hours to a player with positive available credits. No automatic spin, zero-balance claim, refill or production game-math approval is implied.
- Game stakes and committed game winnings are separate authorized ledger events, not automatic grants. Settled winnings must not depend on an operator budget or discretionary approval.
- ADD and REMOVE create immutable balanced ledger entries, with actor, target, reason, request ID, before/after balance and wallet version. Require privileged-session verification. Do not implement direct balance overwrite.
- Remove only available credits. Never take reserved amounts, make a player wallet negative, erase round history, cancel a previously accepted award or create hidden debt. A reversal is a new linked, authorized transaction.
- One PostgreSQL-backed authoritative ledger; integer units / bigint, decimal-string serialization. Enforce durable idempotency and transactional race protection. Pure reference helpers are not that backend.

## Mathematics
- No approved meaning of 30% yet. `config/product-decisions.json` intentionally has null production targets/profile.
- Do not copy the v1 96% illustration into production configuration. Both named slot examples are tests only. Scaffold generic evaluation and reports, but block actual credit-staked slot play until the owner approves the metric, paytable, profile and version.
- Keno and fish models need their own approvals. A slot-only target is not a fish capture rate or a keno paytable.
- No per-player odds, adaptive loss recovery, budget-based suppression, guaranteed 3 wins per 10 spins, fake occupancy or hidden bots.
- The server owns outcomes; clients present committed results. Every slot grid must evaluate to its persisted award. Retries cannot resample an accepted round.

## Mobile implementation
Proposed shared client: Vue/TypeScript plus PixiJS, packaged in Android/iOS using Capacitor. NestJS core API, Colyseus rooms and PostgreSQL remain the proposed backend. Pin compatible revisions in Sprint 0. Record a real Android and iPhone rendering/lifecycle smoke test early, including fish-scene density; browser emulation does not certify native performance. Do not silently switch engines if a gate fails.
Use platform-secure credential storage, TLS, safe areas, sound/motion settings and pause/resume recovery. No accepted credit-staked actions while offline or backgrounded. Already accepted actions settle on the server. Keep the privileged admin console out of the player app bundle.

## Work and evidence
Implement one coherent ticket at a time. Preserve unrelated existing work. Obtain permission before paid services, remote publication, production data changes or scope changes. Signing keys and provisioning profiles must never be committed.
Commands available now:
- `node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs`
- `node math-reference/report.mjs`
Sprint 0 must create, execute and document actual workspace commands for install, lint, typecheck, unit/integration tests, web builds, Android build and iOS build. Report unavailable macOS/signing/device steps as blocked, not passed.
Each change: changed files, acceptance evidence, exact commands/results, remaining issues, migrations/rollback notes and screenshots/device recordings for UI changes. Do not report reference tests as proof of production accounting, real-device performance or store approval.
