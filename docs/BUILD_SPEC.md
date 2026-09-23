# Build specification | version 2.0
**Status:** implementation specification, not deployed software. Current owner constraints supersede v1 assumptions. Sources are indexed in `RESEARCH.md` / `sources.json`.

## 1. Product and release scope
Build an independent invitation-only social arcade. Player installs on Android and iOS; operator accesses a responsive web console. Provide one original 5x3 slot, one original keno game and one four-seat fish table. The reference images inform categories, controls and scene composition only. Do not copy protected names, symbols, characters, audio or executable content into release builds.

Credits have no purchase price, exchangeability, cash-out or valuable-prize redemption. All accounts start at zero. Main admin manually adds/removes credits. Game settlement still posts stakes and legitimate winnings automatically; no discretionary grant, refill, daily-reward or promotion system is included. A zero-balance player sees 'No credits available. Contact your administrator.' and may view rules/history; there is no claim or buy button.

## 2. Identity and hierarchy
Proposed smallest hierarchy: MAIN_ADMIN -> SUB_DISTRIBUTOR -> AGENT -> PLAYER. Main admin is the top-level administrative account. Do not mandate a separate platform-owner tier; a distinct nonroot main-distributor tier is an owner decision. Separate authenticated staff identities from player identities, even when a person holds both.

Main admin can manage the hierarchy and manually adjust eligible wallets. Sub-distributors see/manage the permitted agents and players in their own subtree. Agents see/manage their assigned players. Players see only their own account, rounds and balance. Those noncredit management capabilities must be explicitly approved in the permission matrix. None of these lower roles acquires root powers by inheritance.

Lower-tier transfers are default-denied pending D02. If approved, transfer existing credits only between explicitly allowed related wallets; do not create supply. A lower account never invokes ADD/REMOVE by pretending a transfer is an adjustment. Every endpoint, collection, export, aggregate, websocket message and cache key enforces scope. An organization move requires owner approval and must not rewrite past transaction scope.

## 3. Administrator credit controls
Implement separate commands ADD and REMOVE; no editable balance field. Required inputs: target account, direction, positive amount, mandatory reason, unique request key and current wallet version for preview reconciliation. Use integer minor units (proposed 100 per displayed credit) and decimal strings in API payloads.

Each adjustment produces immutable balanced postings against system issuance/removal accounts, with audit actor, timestamp, reason, before/after balance, correlation ID and optional related transaction. Main admin can add directly to a player or an eligible operator wallet. Operator budgets are not a prerequisite for root ADD; lower-tier distribution, if later approved, is a separate existing-credit transfer.

REMOVE is capped at available balance: settled balance minus reserved credits. It cannot produce negative player balances, take credits committed to an accepted action, invalidate a settled win or erase previous activity. A held amount may be released only through its actual game/transaction lifecycle. Removing all available credits while a round is pending does not suppress that round's later valid award. Optional suspension blocks new actions, not settlement of accepted ones.

Require administrator MFA and recent privileged verification before an adjustment, with a clear confirmation screen. Reject stale previews rather than silently using changed data. Scope checks and fresh authentication happen on the server. The reference helper in this kit plans postings from trusted inputs only; it does not implement any of these authentication or database guarantees.

## 4. Durable ledger and concurrency
One PostgreSQL-backed credit service is shared by admin, slots, keno and fish. Non-system wallets are nonnegative. Every movement has balanced entries. Wallet projections reconcile with the ledger. Corrections are new authorized, linked transactions; original transactions stay readable. A reversal may fail if its debit would exceed available balance; it must never silently create debt.

Mutations use actor+operation-scoped idempotency and a canonical request hash. Same key/same payload returns the original committed result. Same key/changed payload fails. Apply deterministic wallet-lock ordering or equivalent guarded transactions; update balances, postings, audit events and outcome state atomically. A stale preview or transient failure does not authorize duplicate credits. Proposed outbox events publish only committed changes; clients recover via a monotonic wallet revision/snapshot rather than assuming socket delivery is complete.

## 5. Game authority and approval
The server validates stake and rule version and records the result. Client animations display the persisted award. A retry cannot generate a replacement result after an accepted/committed round. Approved mathematics is immutable and versioned for new rounds; accounts have no personal probability settings. Root credit authority is not authority to select an individual player's win/loss.

Slot target wording is unresolved. Do not activate a production profile until D01 plus paytable, denomination, math version/hash and approval evidence are recorded. The 30%-hit/96%-return and 10%-hit/30%-return samples are educational, not defaults. Verify that every weighted result corresponds to a valid 5x3 grid and evaluates to the published payout. No session quota or bank-dependent outcome filtering.

Keno: use approved selection/draw rules and exact match probabilities; publish each supported paytable. The slot rate does not apply automatically. Fish: server owns room epoch, target IDs, shot costs, accepted attempts, awards and ordering. Approve the capture/damage model independently. Serialize competing captures and durable award settlement; do not treat an animation collision or a client claim as proof of payout. Invalid-target charging rules must be explicitly documented.

## 6. Architecture and mobile delivery
Proposed pnpm TypeScript workspace:
- `apps/player`: Vue lobby/navigation plus PixiJS game scenes; bundled game shell/assets.
- `apps/mobile`: Capacitor configuration and checked-in Android/iOS project source, using the built player client.
- `apps/admin`: responsive operator console; separate build and access surface.
- `apps/api`: NestJS identity, hierarchy, ledger, round and reporting endpoints.
- `apps/rooms`: Colyseus fish rooms using shared authorized settlement services.
- `packages/contracts`, `packages/domain`, `packages/ui`, `packages/game-math`: explicit ownership and tests.

This is an installable native shell around shared web-rendered gameplay, not a claim of fully native rendering. Capacitor supports this cross-platform route [M01-M03]. Real-device performance of representative fish density is a Sprint 0 acceptance gate. If it fails after a bounded optimization pass, present measured results and an engine-change proposal; do not silently introduce a second renderer or extend the schedule without approval.

Player apps share one server account/balance; same-account multi-device behavior must be explicit. Proposed baseline: a new active gameplay session takes over the previous one with a visible notice, while account/history access can remain available. Already accepted rounds still settle. Test Android-to-iOS recovery. No offline credit-staked play. Package stable executable game logic in reviewed builds; do not use remote-code updates to evade platform review. Backend rule metadata and approved assets use versioned, integrity-checked delivery.

## 7. Security, privacy and mobile quality
Server-enforced identity/scope, rate limits, schema validation, audit logging and least-privilege services. No provider secrets or admin endpoints embedded as privileged client capabilities. Protect sessions using an explicitly reviewed browser/mobile authentication design; mobile long-lived credentials go into platform-secure storage, not plaintext preferences or localStorage.

On background/lock/connection loss, stop accepting new local actions and stop auto-action controls. On resume, reauthenticate as needed, fetch authoritative balance and unsettled/last round, then render one recovered result. Do not resubmit all queued touches. Test interrupted audio, safe areas, Android back, iOS gestures, texture pressure and sustained fish scenes. No claims of physical-device performance based only on desktop screenshots.

## 8. Reporting and experience
Admin dashboard: player counts/activity, manually added/removed credits, existing-credit transfers if approved, game stakes, game payouts and net game flow. Do not label play-credit activity as cash revenue. Exclude admin changes from observed game return calculations. Show sample size, game/math version, total stake, gross payout, hit rate and net-winning-round rate separately. No target guarantees for small samples.

Player interface: clear current balance, game stake, gross award, net round change, pending state and credit history showing admin adjustments. Main admin UI: Add Credits and Remove Credits with target identity, scope, amount, reason, before/after preview, available/reserved split and durable receipt. Tablet and phone admin layouts use cards/details rather than clipping a desktop table.

## 9. Delivery gates
S0 native/runtime proof and reproducible workspace; S1 durable manual controls with no grant paths; S2 one end-to-end slot on both platforms after approved math; S3 keno/reporting; S4 multiplayer fish; S5 device/security/recovery; S6 beta and release preparation. Store approval and external review timing are outside the engineering estimate. All game/legal/age-rating disclosures must accurately describe the actual no-money experience [M07-M11].
