# Codex assignment | iteration 2 | S1
Read AGENTS.md, docs/CHANGELOG_V2.md, docs/BUILD_SPEC.md, docs/DECISIONS.md, docs/CREDIT_CONTROL.md, docs/MOBILE_DELIVERY.md and docs/SPRINT_PLAN.md. Inspect the repository and preserve existing unrelated work. This is the v2 plan, not the old web/PWA-first/grant-enabled baseline.

## Objective
Main-admin credits + hierarchy. Implement S1 only. Planning window: Weeks 3-4; report actual effort and blockers.

## Scope tickets
- NG2-008: Identity, invites and privileged sessions
- NG2-009: Hierarchy and scoped permissions
- NG2-010: Durable ledger and balance projection
- NG2-011: Main-admin ADD/REMOVE service
- NG2-012: Credit-control interface and history
- NG2-013: No-grant invariant and optional-transfer gate
- NG2-014: Credit race, reversal and reconciliation suite

## Non-negotiable constraints
Main admin manually adds/removes credits. Zero initial balances; no welcome/daily/refill/promotion grants or claim endpoints. Game winnings settle normally under approved rules. Lower-tier credit transfers default-denied pending D02. Android and iOS must be developed and tested; no browser-only substitute. No active slot profile until the owner clarifies 30% and approves the actual math; the 96% example is not the product setting. No root/player-specific odds, reserved-credit theft or direct balance overwrite. Use independent original/licensed assets and no live JUWA keys.

## Acceptance
Zero-start accounts; audited ADD/REMOVE; branch permissions; no grant paths; concurrency/retry tests.

Implement one coherent reviewed ticket at a time. Record dependencies and block only the specific unresolved feature. Preserve database/audit history. Never claim a pure reference helper is a durable authenticated backend. Obtain approval before paid services, remote publication or destructive live changes.

## Verification and report
Run the supplied tests before changing reference files:
`node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs`
`node math-reference/report.mjs`
Run the actual workspace tests/builds added in S0; show exact commands and outcomes. Native build, signing and physical-device steps unavailable in this environment must be explicitly blocked, not passed. Return changed files, acceptance evidence, test results, relevant UI screenshots/device recordings, migrations/rollback and remaining decisions. Stop at the sprint review gate.
