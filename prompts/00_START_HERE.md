# Codex assignment | iteration 2 | S0
Read AGENTS.md, docs/CHANGELOG_V2.md, docs/BUILD_SPEC.md, docs/DECISIONS.md, docs/CREDIT_CONTROL.md, docs/MOBILE_DELIVERY.md and docs/SPRINT_PLAN.md. Inspect the repository and preserve existing unrelated work. This is the v2 plan, not the old web/PWA-first/grant-enabled baseline.

## Objective
Foundations + native proof. Implement S0 only. Planning window: Weeks 1-2; report actual effort and blockers.

## Scope tickets
- NG2-001: Confirm v2 scope and decision gates
- NG2-002: Workspace, dependency locks and CI
- NG2-003: Android and iOS build projects
- NG2-004: Original mobile/admin prototypes
- NG2-005: Physical-device rendering and lifecycle proof
- NG2-006: Domain contracts and database lifecycle
- NG2-007: Math clarification and release gating

## Non-negotiable constraints
Main admin manually adds/removes credits. Zero initial balances; no welcome/daily/refill/promotion grants or claim endpoints. Game winnings settle normally under approved rules. Lower-tier credit transfers default-denied pending D02. Android and iOS must be developed and tested; no browser-only substitute. No active slot profile until the owner clarifies 30% and approves the actual math; the 96% example is not the product setting. No root/player-specific odds, reserved-credit theft or direct balance overwrite. Use independent original/licensed assets and no live JUWA keys.

## Acceptance
Reproducible workspace, original UI baseline, Android/iPhone lifecycle and fish-density smoke; unresolved math stays disabled.

Implement one coherent reviewed ticket at a time. Record dependencies and block only the specific unresolved feature. Preserve database/audit history. Never claim a pure reference helper is a durable authenticated backend. Obtain approval before paid services, remote publication or destructive live changes.

## Verification and report
Run the supplied tests before changing reference files:
`node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs`
`node math-reference/report.mjs`
Run the actual workspace tests/builds added in S0; show exact commands and outcomes. Native build, signing and physical-device steps unavailable in this environment must be explicitly blocked, not passed. Return changed files, acceptance evidence, test results, relevant UI screenshots/device recordings, migrations/rollback and remaining decisions. Stop at the sprint review gate.
