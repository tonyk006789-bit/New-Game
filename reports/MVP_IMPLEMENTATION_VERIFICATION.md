# Account, accounting, practice-game and UI verification

Date: 18 September 2026. Local Windows workspace. This report supersedes S0's disconnected-prototype status. It does not claim production readiness or native-device acceptance.

This records the accounts/ledger implementation. The later five-game catalog and motion update, with updated test totals and recordings, is documented in `GAME_EXPANSION_VERIFICATION.md`.

## Changes

- Player: rebuilt `apps/player/src/App.vue`, new real `LoginScreen.vue` and API client, original `ArcadeSymbol.vue`, themed slot/keno interface, interactive Pixi fish scene, persisted practice recovery/history, browser session restore/logout, zero-balance and offline states. Authenticated practice and guest storyboards are distinct. Native account calls fail closed pending secure native integration.
- Operator: real staff login, Main Admin MFA, database account lists, create/manage/reset/suspend functions, adjustment review/confirmation/receipts, branch transfers, scoped overview/history and root audit viewer. Admin code remains in the separate admin bundle.
- Server: `apps/api/src/{app,auth,security,store,accounts,ledger,practice}.ts`; scrypt credentials, PostgreSQL sessions, CSRF/origin checks, privileged verification, scoped accounts/ledger/reporting, immutable practice results and shared practice tables. No credit-game math was approved or enabled.
- Database: migrations `002_accounts_ledger_practice.sql` through `004_balance_trigger_record_fix.sql`. Balanced postings, projection reconciliation, immutable audit/receipts/idempotency, session revocation, branch-scoped practice tables. Applied migration hashes are preserved. The 004 forward migration corrects a record-field issue found by real PostgreSQL tests.
- Assets: five original ImageGen PNGs plus repository-authored SVG symbols. Prompts: `reports/art-prompts-v2.json`; source and SHA-256 manifest: `reports/asset-manifest.json`. Private reference images were not copied into public assets.
- Tooling: project-local PostgreSQL 17.11 on loopback, bootstrap/zero-account fixture scripts, local launcher, real database tests, updated browser tests and CI definition. `.local` credentials/database state and `.cache` binaries are excluded from Git.

## Executed acceptance evidence

Commands were run with bundled Node 24.19.0 and pnpm 11.19.0. Windows sandbox subprocess failures required authorized reruns outside the sandbox; they were not counted as test successes.

| Command | Result |
|---|---|
| `pnpm add -Dw @types/pg@8.15.6` | Installed and lockfile updated |
| `node --env-file=.local/runtime.env scripts/database.mjs migrate` | 001–004 applied on real PostgreSQL |
| `node --env-file=.local/runtime.env scripts/bootstrap-admin.mjs` | Created one zero-balance Main Admin; credentials written to ignored local file |
| `node scripts/create-local-players.mjs` | Created distributor, agent and two zero-balance players via authenticated Main Admin API; no grants |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed |
| `pnpm test:reference` | 50 passed; mathematical illustrations remain tests only |
| `pnpm test:unit` | 29 passed, including RFC TOTP vector and salted password verification |
| `pnpm test:integration` | 11 HTTP boundary checks passed |
| `pnpm test:ledger` | 14 reported tests passed (13 scenarios plus parent), against real PostgreSQL and actual HTTP API |
| `pnpm test:e2e` | **21 passed in 2.6 minutes**, across desktop, 390×844 phone and 1024×461 landscape; landscape lobby fits the viewport |
| `pnpm build` | Player, admin and server compilation passed |
| `pnpm mobile:sync` | Android/iOS generated projects synchronized successfully |
| `pnpm build:android` | Blocked: JAVA_HOME/Java unavailable; no APK produced |
| `pnpm build:ios` | Blocked: Windows host has no macOS/Xcode; no IPA produced |
| `pnpm assets:manifest` | Recorded nine original assets |
| `node --env-file=.local/runtime.env scripts/reconcile.mjs` | Five development wallets, zero total settled units, zero mismatches, zero unbalanced transactions, zero approved game profiles |

Database scenarios cover zero-start hierarchy, wrong-password/MFA/role/branch denials, eight simultaneous retries returning one committed receipt, mismatched idempotency payloads, competing removals/stale versions, recent privileged verification, CSRF/origin enforcement, own-wallet branch transfers, linked reversals, append-only and reconciliation constraints, persisted slot/keno practice, branch-separated fish tables and simultaneous capture, reserved-credit protection, password-reset/suspension session revocation, audit access and logout. The reservation test injects a test-only reserve to prove removal protection; it does not certify an implemented game-reservation lifecycle.

Browser acceptance covers real player login and session restoration, saved slot recovery, keno drawing/history, sign-out, verified Main Admin add/remove with durable receipts, two real player contexts joining one fish table, favorites/search/categories, guest slot/keno controls, offline suspension and renderer disposal. Browser credit tests explicitly add and remove 1.00 through the UI; receipts stay in local history and the final test balance is zero. Earlier small-screen failures were fixed and rerun. The two-renderer phone test requires a longer initialization timeout under software WebGL; it is not a physical-device performance pass.

Screenshots in `reports/screenshots-v2/`: login, lobby, slots, keno, reef, authenticated practice slots/fishing and admin review on desktop/phone/landscape. These were visually inspected for framing, controls and overflow. Browser screenshots do not certify native performance.

## Outstanding work and rollback

`docs/LOCAL_MVP.md` lists remaining approved-math/staked-game, native-auth/build, production Colyseus and release/security work. The full handoff product is not complete. No store release, native binary, physical-device pass, remote deployment, or production security certification is claimed.

No live data was changed. No destructive down migration exists. Preserve local history, stop the new API if necessary, and apply forward corrective migrations. Credit corrections use new linked transactions, never direct balance editing or removal of previous receipts. Test schemas are isolated and removed after tests; development accounts and their history remain intact.
