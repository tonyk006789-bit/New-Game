# Local foundation verification — 17 September 2026

**Result: local prototype and web/server builds verified; full S0 native/database acceptance remains incomplete.** Work was carried out in one local implementation session in the initially empty `New Game` workspace, on branch `codex/arcade-foundation`.

## Executed evidence

Commands below were run from the workspace with the bundled Node 24.19.0 and pnpm 11.19.0. The Windows executable was `C:\Users\kcdre\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd`. Test/build subprocesses and npm access required the host's normal permission mechanism; that mechanism was used, not disabled.

| Exact workspace command | Observed result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS, current lockfile installed successfully |
| `pnpm peers check` | PASS, no peer dependency issues |
| `pnpm lint` | PASS, zero reported lint issues |
| `pnpm typecheck` | PASS, Vue/TypeScript checked |
| `pnpm test:reference` | PASS, 50 tests; also run before modifying the handoff references |
| `pnpm test:unit` | PASS, 26 tests after malformed decimal input handling was corrected |
| `pnpm test:integration` | PASS, 11 actual local HTTP tests |
| `pnpm test:e2e` | PASS, 10 tests, 39.6 seconds in the final complete run |
| `pnpm build` | PASS, separate player/admin Vite bundles and TypeScript API/rooms compilation |
| `pnpm --dir apps/mobile exec cap add android` | PASS, native Android source project generated |
| `pnpm --dir apps/mobile exec cap add ios` | PASS, Xcode/SPM source project generated |
| `pnpm mobile:sync` | PASS, both native projects synchronized to the current player bundle |
| `pnpm build:android` | BLOCKED, Gradle wrapper reports no JAVA_HOME or java executable; no APK created |
| `pnpm build:ios` | BLOCKED, this host is Windows; macOS/Xcode required; no archive created |
| `pnpm test:db` | BLOCKED, DATABASE_URL/running PostgreSQL unavailable; no SQL test claimed as passed |
| `pnpm math:report` / `node math-reference/report.mjs` | PASS, educational report; active profile remains null |
| `pnpm assets:manifest` | PASS, four original SVG files recorded with hashes |
| `pnpm dev` | RUNNING at delivery, player port 5173 and operator port 5174, loopback only |

**97 tests passed** across 50 reference, 26 domain, 11 HTTP, and 10 browser cases. Reference mathematics and planning helpers are not production accounting evidence. HTTP tests verify safe refusal and catalog status, not implemented authentication or settlement.

Browser coverage: lobby filters, favorites persistence, slot visual storyboard, offline/reconnect input gating, keno selection limits and sample reveal/reset, 80-fish rendering and canvas disposal, exact admin amount preview, available-only removal rejection, and disabled confirmation. Each runs at desktop 1440×1100 and phone viewport 390×844. The browser is installed Chrome with software WebGL; device emulation does not certify Android/iPhone behavior or performance. No horizontal overflow was observed in the tested states.

## Visual artifacts

- `screenshots/player-lobby-desktop.png` and `screenshots/player-lobby-phone.png`
- `screenshots/slot-desktop.png` and `screenshots/slot-phone.png`
- `screenshots/keno-desktop.png` and `screenshots/keno-phone.png`
- `screenshots/fish-desktop.png` and `screenshots/fish-phone.png`
- `screenshots/admin-accounts-desktop.png` and `screenshots/admin-accounts-phone.png`
- `screenshots/admin-adjustment-desktop.png` and `screenshots/admin-adjustment-phone.png`

Desktop evidence captures the full page; phone evidence captures the actual viewport. These screenshots were inspected for layout. No physical-device recording exists.

## Changed areas

- Imported the v2 handoff and retained its private reference images outside source control and release assets.
- Added the pnpm workspace, pinned lockfile, TypeScript/lint/build configuration, local scripts, CI definition and run documentation.
- Added `apps/player`, `apps/admin`, `apps/api`, `apps/rooms`, and generated `apps/mobile/android` and `apps/mobile/ios`.
- Added shared contracts, fixed-point presentation helpers, explicit math refusal, a generic explicit-paytable evaluator and reusable UI/icon code.
- Added original vector art and canvas-rendered fish; no release assets were copied from private screenshots.
- Added transactional migration/fixture source, validation/HTTP/browser tests, screenshot evidence and updated S0 backlog state.
- Recorded the owner's instruction to keep math undecided, approve branch transfers of existing credits in principle, and defer device testing. The one supplied transfer-policy assertion was updated to match that direct instruction while asserting the runtime gate stays closed.

## Boundaries and next work

There is no authenticated invite/session flow, database-backed ledger, functioning credit mutation/transfer endpoint, production game payout, multiplayer fish table, signed mobile artifact, remote deployment or executed CI run. The UI is an honest preview: all balances are zero, fixtures are labeled, animations create no credit activity, and the API refuses staked actions.

The database migration has not been executed here. No production data was touched. Migration/rollback guidance is in `docs/DEVELOPMENT.md`; there is no destructive down migration. Credentials and signing materials were not created or committed.

Next implementation milestone is authenticated zero-start accounts and durable manual credit accounting, including the owner-approved branch transfer rules. Actual math approval remains necessary before credit-staked games. Device testing is owner-deferred and is detailed in `DEVICE_TEST_PLAN.md`.
