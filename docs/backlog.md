# Implementation backlog | iteration 2
49 tickets. S0 implementation has started; see reports/IMPLEMENTATION_PLAN.md for split tickets and acceptance limits. Later sprints are not yet implemented. Owner updates in docs/OWNER_UPDATES.md supersede pending transfer and device-access assumptions.

## S0 - Weeks 1-2 - Foundations + native proof

### NG2-001 | Confirm v2 scope and decision gates
Area: Product | Priority: P0 | Size: M | Status: Implemented; owner decisions recorded, device/distribution inputs deferred
Dependencies: None.
Acceptance: Record D01-D03 and no-money/manual-only boundaries; unresolved slots and transfers disabled; identify devices, reviewer and asset owners.

### NG2-002 | Workspace, dependency locks and CI
Area: Platform | Priority: P0 | Size: M | Status: Implemented locally; remote CI not run
Dependencies: NG2-001.
Acceptance: Clean install/typecheck/build; versioned compatible Vue/PixiJS/NestJS/Colyseus/Capacitor; actual verified commands documented.

### NG2-003 | Android and iOS build projects
Area: Mobile | Priority: P0 | Size: L | Status: Native sources generated; compilation/signing blocked
Dependencies: NG2-002.
Acceptance: Native projects compile in the appropriate toolchains; signing prerequisites explicit; no secrets committed. A missing macOS runner is a blocker, not a pass.

### NG2-004 | Original mobile/admin prototypes
Area: Design | Priority: P0 | Size: M | Status: Prototypes implemented; browser QA recorded
Dependencies: NG2-001.
Acceptance: Review zero-credit, add/remove, lobby, game HUD and reconnect states; safe-area layouts; no grant/claim UI.

### NG2-005 | Physical-device rendering and lifecycle proof
Area: Mobile | Priority: P0 | Size: L | Status: Browser rendering spike implemented; physical device proof owner-deferred
Dependencies: NG2-003,NG2-004.
Acceptance: Slot/keno and dense fish scene run on actual Android+iPhone; collect frame/memory and background/resume evidence; decide runtime gate.

### NG2-006 | Domain contracts and database lifecycle
Area: Backend | Priority: P0 | Size: M | Status: Schemas/migrations/fixtures implemented; PostgreSQL execution blocked
Dependencies: NG2-002.
Acceptance: Schemas for trusted identity, branch scope, wallet revision, integer amounts and idempotency; migrations/isolated two-branch fixtures start users at zero.

### NG2-007 | Math clarification and release gating
Area: Math | Priority: P0 | Size: M | Status: Closed math gate implemented; owner math approval pending
Dependencies: NG2-001.
Acceptance: No default 96% profile; explicit approval gate; exact reference reports; owner choice and remaining profile inputs recorded.

## S1 - Weeks 3-4 - Main-admin credits + hierarchy

### NG2-008 | Identity, invites and privileged sessions
Area: Security | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-006.
Acceptance: Zero-credit invitation activation, staff MFA/step-up, device revocation and mobile secure-session design tested.

### NG2-009 | Hierarchy and scoped permissions
Area: Backend | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-008.
Acceptance: Root MAIN_ADMIN and approved lower roles; deny cross-branch reads/writes/exports; no inherited mint/remove or transfer permissions.

### NG2-010 | Durable ledger and balance projection
Area: Backend | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-006.
Acceptance: Balanced immutable postings, integer limits, reserves, wallet revisions, durable idempotency and ledger rebuild; real database tests.

### NG2-011 | Main-admin ADD/REMOVE service
Area: Backend | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-009,NG2-010.
Acceptance: Mandatory reason and verified authority; available-only removal; stale version conflict; atomically posted audit/ledger; duplicate-safe receipts.

### NG2-012 | Credit-control interface and history
Area: Admin | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-004,NG2-011.
Acceptance: Search target; show branch/available/reserved; amount/reason/preview/confirm; receipt and player-visible history; no balance overwrite.

### NG2-013 | No-grant invariant and optional-transfer gate
Area: Policy | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-009,NG2-011.
Acceptance: No welcome/daily/refill/promotion workers or claim endpoints; zero at create/login/reinstall; lower-tier transfers default-denied; optional spec only after D02.

### NG2-014 | Credit race, reversal and reconciliation suite
Area: Quality | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-010,NG2-011.
Acceptance: Concurrent remove/remove and remove/stake fixtures; no negatives/reserve theft; linked corrections; authority on retries; database failure injection.

## S2 - Weeks 5-7 - Mobile lobby + first slot

### NG2-015 | Native player navigation and zero-credit lobby
Area: Client | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-005,NG2-008,NG2-012.
Acceptance: Android+iOS login/lobby/favorites/rules/history; no claim/purchase buttons; separate admin surface; safe areas/back behavior.

### NG2-016 | Approve slot math and visible evaluator
Area: Math | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-007.
Acceptance: D01 resolved plus signed-off paytable, denominations, version/hash and exact probability report; every reachable grid evaluates correctly.

### NG2-017 | Server-authoritative slot settlement
Area: Backend | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-010,NG2-014,NG2-016.
Acceptance: Debit/result/payout committed consistently; no charge when profile unapproved; retries return original round; root removal race protected.

### NG2-018 | Original slot presentation
Area: Game | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-015,NG2-016.
Acceptance: Original 5x3 visuals/audio/controls; exact committed result rendered; payout/net-change clarity; settings and low-effects mode.

### NG2-019 | Mobile pause/resume and account takeover
Area: Mobile | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-017,NG2-018.
Acceptance: Lock/kill/network-switch/resume recovers original round; same-account device rule enforced; no background/offline queue of paid actions.

### NG2-020 | Slot rules, round and credit history
Area: Client | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-017,NG2-018.
Acceptance: Approved rule version visible; attributable admin changes distinct from stake/payout; pagination and native readable layouts.

### NG2-021 | Two-platform end-to-end alpha gate
Area: Quality | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-019,NG2-020.
Acceptance: Main admin adds credits; player plays approved slot on Android/iOS; admin removes available balance; recovery/history reconcile; record actual devices.

## S3 - Weeks 8-9 - Keno + accurate reporting

### NG2-022 | Keno rules and exact probability approval
Area: Math | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-007.
Acceptance: Selection/draw counts and paytables approved; exact per-selection hit/return report; no inherited slot 30% assumption.

### NG2-023 | Keno server draws and settlement
Area: Backend | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-017,NG2-022.
Acceptance: Unique valid draw; approved payout; idempotent commit; reconnect original numbers; available balance protection.

### NG2-024 | Original keno mobile game
Area: Game | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-015,NG2-023.
Acceptance: Readable 80-number board; selection/quick-pick/erase; matched/drawn states; correct draw animation and rules on both OS families.

### NG2-025 | Scoped operational dashboards
Area: Admin | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-009,NG2-012.
Acceptance: Counts plus manual ADD/REMOVE, game stakes/payouts and optional transfer totals; scope enforced; no cash-revenue labels.

### NG2-026 | Game-return reporting and audit exports
Area: Backend | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-020,NG2-023,NG2-025.
Acceptance: Hit rate/net wins/return with sample size and math version; exclude admin adjustments; exact date boundaries/cursor pagination.

### NG2-027 | Admin balance updates across active devices
Area: Client | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-019,NG2-025.
Acceptance: Monotonic revisions/snapshot recovery; duplicate/lost events safe; no stale balance enables a new stake after removal.

### NG2-028 | Keno and reporting acceptance
Area: Quality | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-024,NG2-026,NG2-027.
Acceptance: Exact tables, retries, native touch layouts, scope/export isolation and full ledger-to-report reconciliation pass.

## S4 - Weeks 10-11 - Four-seat fish tables

### NG2-029 | Approve fish capture and award model
Area: Math | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-007.
Acceptance: D05 resolved; paid/invalid attempts, target ownership and rewards specified; no copied slot target or hidden damage rules.

### NG2-030 | Room lifecycle and authorized seats
Area: Multiplayer | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-009,NG2-015.
Acceptance: Real four-seat occupancy, scoped join tokens, epochs and reconnect snapshots; no fabricated players.

### NG2-031 | Durable fish attempt settlement
Area: Backend | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-014,NG2-029,NG2-030.
Acceptance: Server validates and serializes target claims; only one award; shared ledger + accepted-attempt history; no resampling on retries.

### NG2-032 | Original fish rendering and controls
Area: Game | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-005,NG2-029,NG2-030.
Acceptance: Original sprites/paths/effects; clear attempt cost; readable seat HUD; sustained Android+iPhone density target measured.

### NG2-033 | Fish reconnect and stale-owner fencing
Area: Multiplayer | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-031,NG2-032.
Acceptance: Accepted attempts recover after disconnect/process failure; old room owner cannot settle; background clients stop new commands.

### NG2-034 | Adversarial fish and credit interaction tests
Area: Security | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-031,NG2-033.
Acceptance: Reject forged hit/payout/role, target duplication and malformed messages; test main-admin removal concurrent with attempts.

### NG2-035 | Four-device mixed-platform table gate
Area: Quality | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-032,NG2-033,NG2-034.
Acceptance: One Android/iOS mixed table runs approved rules; each award single/traceable; devices survive network/background changes.

## S5 - Weeks 12-13 - Polish + hardening

### NG2-036 | Final original assets, sound and licenses
Area: Design | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-018,NG2-024,NG2-032.
Acceptance: Approved title/icon/symbols/fish/art/audio; provenance hashes/notices; no private reference images shipped.

### NG2-037 | Mobile accessibility and interaction polish
Area: Client | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-021,NG2-028,NG2-035.
Acceptance: Safe-area, large text, mute/reduced motion, no false-win celebration, touchscreen and back/close reviews.

### NG2-038 | Real-device performance and memory suite
Area: Mobile | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-035,NG2-036,NG2-037.
Acceptance: Named Android/iPhone floor/current devices, 20-minute scenes, transitions/background cycles; frame/memory/crash reports.

### NG2-039 | Service load and chaos tests
Area: Quality | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-028,NG2-034.
Acceptance: Record 100-user synthetic mix/hardware; concurrency, database failover/retry and full reconciliation; publish measured limits.

### NG2-040 | Security/privacy and account lifecycle review
Area: Security | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-037,NG2-039.
Acceptance: Scope matrix, secure tokens/logs, deletion/retention behavior, dependency review, truthful review access/privacy/age-rating inputs.

### NG2-041 | Backup restore and rollback rehearsal
Area: Operations | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-039.
Acceptance: Fresh restore reconciles; schema/app rollback plan preserves accepted rounds and audit; no secret exposure.

### NG2-042 | Release-candidate evidence and owner review
Area: Product | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-036,NG2-038,NG2-040,NG2-041.
Acceptance: Approved math/assets, real-device/UI evidence, no grant paths, no critical integrity issues; explicit residual risks.

## S6 - Weeks 14-15 - Closed beta + release preparation

### NG2-043 | Owner-approved hosting and release accounts
Area: Operations | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-042.
Acceptance: Approved region/budget and platform accounts/runner; external prerequisites listed; no unapproved services or deployment.

### NG2-044 | Signed Android beta/release artifacts
Area: Mobile | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-003,NG2-042,NG2-043.
Acceptance: Reproducible signed APK or AAB for chosen route; version/update test; current verification/signing requirements checked.

### NG2-045 | iOS archive and approved test distribution
Area: Mobile | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-003,NG2-042,NG2-043.
Acceptance: Owner-signed Xcode archive, TestFlight submission/test if approved; no claim of review completion until verified; expiry tracked.

### NG2-046 | Private-group beta and manual-credit operations
Area: Quality | Priority: P0 | Size: L | Status: Not started
Dependencies: NG2-044,NG2-045.
Acceptance: Real invited testers on both platforms; zero onboarding, admin-only adjustment and approved game settlement; feedback triaged.

### NG2-047 | Final distribution/review readiness
Area: Mobile | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-040,NG2-046.
Acceptance: Chosen long-term routes, authentic screenshots, original branding, privacy/age disclosures and reviewer access; distinguish submitted vs approved.

### NG2-048 | Operator runbook and support handover
Area: Operations | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-041,NG2-046.
Acceptance: Manual credit add/remove/reversal, lost-device/session recovery, reconciliation, backup/restore and update procedures documented.

### NG2-049 | Go/no-go and versioned release record
Area: Product | Priority: P0 | Size: M | Status: Not started
Dependencies: NG2-047,NG2-048.
Acceptance: Owner signs off; attach real build/version/math hashes and evidence; rollback available; external approval pending items remain explicit.
