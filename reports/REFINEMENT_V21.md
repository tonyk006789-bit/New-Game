# 3 October 2026 — flexible credentials and solo fish assistance

## Changes

- `packages/contracts/src/index.ts` defines one new-credential policy: at least six characters including an ASCII letter and a number. Either letter case is accepted; symbols are optional. The technical input cap is 256 characters. Usernames are trimmed and compared case-insensitively; passwords retain their exact case. Numeric account IDs are unchanged.
- `apps/api/src/accounts.ts`, `password.ts` and `auth.ts` apply this policy to account creation, operator password resets and self-service password changes while preserving sign-in for existing credentials. `apps/admin/src/App.vue` and `apps/player/src/SettingsPanel.vue` use the same validation and help text. No existing account is renamed or forced to change its password.
- `database/migrations/016_flexible_usernames.sql` relaxes the old lowercase-character whitelist while retaining normalized, unique usernames and all legacy rows. API validation applies to new credentials. Historical developer fixture IDs without numbers remain legacy IDs; new account creation must use the current policy.
- `packages/game-math/src/index.ts` adds the owner-approved `reef-assist-v1` test profile. When exactly one active human occupies a Reef Party or Abyss Legends table, three explicitly labeled bot teammates can make up to three free capture attempts after a resisted paid hit. Each attempt uses the existing size-tier chance. Attempts stop at the first capture and return at most one existing tier award to the human who paid for the hit.
- `apps/api/src/staging.ts` makes membership checking and the assisted result authoritative and transactional. The same room membership lock used by join/leave prevents a new human from racing the solo-assist decision. The receipt records the human result and individual bot attempts. One stake and at most one award are posted; bots have no wallet or reserved seat. Historical accepted receipts replay unchanged and cannot resample.
- `apps/api/src/practice.ts` and `apps/player/src/reef-room.ts` expose bots separately from real occupancy. A second human can take an open seat and disables assistance. `apps/player/src/FishScene.vue` adds coordinated cannon aiming, recoil, traveling assist projectiles, impact nets and the existing committed catch/treasure/wheel celebrations. Wallet presentation waits for the volley and win reveal. Pending effect timers are cleared on pause/unmount; reduced-motion presentation is supported.
- `apps/player/src/api.ts`, `FishingLobby.vue` and `GameRules.vue` use the new fish profile, explain bot assistance and show per-attempt and total solo chances. `AGENTS.md` and `docs/OWNER_UPDATES.md` record the explicit owner approval. All other game rules and the operator hierarchy remain unchanged.

## Approved test mathematics

For solo play, the maximum four independent attempts give `1 - (1 - p)^4`. If the human succeeds, no bot attempt is needed. Rewards are multiples of the single paid shot stake, not cumulative bot awards.

| Tier | Each attempt | Solo total | Maximum award |
| --- | --- | --- | --- |
| Small | 30% | 75.99% | 1× |
| Medium | 20% | 59.04% | 3× |
| Large | 10% | 34.39% | 8× |
| Boss | 4% | 15.065344% | 20× |

With two or more humans there is one paid attempt and no bot attempts. The wheel and treasure effects reveal the existing committed award; no progressive pool or additional prize was introduced. This is an approved test-profile change, not approval of production game mathematics.

## Acceptance evidence

Commands used the pinned Node 24 / pnpm runtimes on Windows.

| Command | Result |
| --- | --- |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed |
| `pnpm test:unit` | 118 passed |
| `pnpm test:integration` | 20 passed |
| `pnpm test:reference` | 51 passed; reference checks only |
| `pnpm build:server` | Passed |
| `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs tests/db/operator.test.mjs` | 39 passed in isolated local PostgreSQL schemas |
| `node --env-file=.local/staging/runtime.env --test tests/db/operator-hosted.test.mjs tests/db/hosted.test.mjs tests/db/operator.test.mjs tests/db/staging.test.mjs` | Hosted gateway suites passed; initial staging fixture names lacked a digit and were corrected before the focused 39-test rerun above |
| `node --env-file=.local/runtime.env --test tests/db/backend.test.mjs` | 16 passed in an isolated local PostgreSQL schema |
| `pnpm build:vercel` | Passed |
| `pnpm build:vercel-operator` | Passed |
| `pnpm test:vercel` | 4 passed |
| `node --test tests/deployment/vercel-operator.test.mjs` | 3 passed |

New tests cover six-character credentials across every operator tier, mixed-case sign-in, optional punctuation, rejected missing letter/number, case-folded duplicates, password reset/change and session revocation without wallet changes. Fish tests cover both variants, every target and possible successful attempt, early stopping, all-miss outcomes, human join/leave, one stake/award under concurrent duplicate requests, no database bot seats, stale-profile rejection and unchanged old receipt replay. Existing PostgreSQL tests emitted a concurrent-query deprecation warning without test failures.

Browser checks on local staging: the account form exposes minimum length 6 and the shared letter/number pattern. Existing `console.agent` sign-in/session remains usable. The empty create form was inspected and dismissed without creating or modifying accounts. Abyss Legends guest preview displayed three BOT TEAMMATE / FREE ASSISTS plaques and animated assist volleys (153 human shots and 455 bot shots observed); opening Rules stopped auto fire. Rules display the approved chances and one-award limit. No browser warning/error logs were observed during this fish check. Screenshots are retained locally in ignored `reports/screenshots-v21/`:

- `six-character-credentials-local.png`
- `abyss-bot-teammates-local.png`

No hosted paid rounds, claims, credit changes or password changes were used for visual verification. Browser guest previews do not certify server accounting; the isolated PostgreSQL tests exercise that behavior. Android/iPhone hardware testing remains unavailable.

## Migration and rollback

Migration 016 was applied to local staging and the existing shared Vercel test database. Before the hosted change, all 21 public tables were read in a consistent read-only transaction and saved as an encrypted local logical backup under ignored `.local/vercel/credentials-backup-016-*`. All 15 hosted wallets retained identical settled amounts, reservations and versions. A digest comparison confirmed all usernames, public IDs and password hashes unchanged. No secrets or backup contents were committed.

Retain migration 016 on application rollback: restoring the old whitelist after valid new usernames have been created may fail. Do not rename accounts or alter their passwords to force a schema rollback. Revert fish client and API together if necessary, retaining all accepted receipts and ledger history. Prefer a new profile version for any subsequent rule change. Old `reef-tiers-v1` accepted rounds remain replayable; an unaccepted request carrying that old profile is rejected before charging.

## Publication

Vercel deployment details and live verification will be recorded after publication.
