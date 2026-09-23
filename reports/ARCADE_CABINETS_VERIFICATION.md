# Eight-game arcade verification

22 September 2026 — local Windows workspace. Implements the owner's request for more games and illustrated slot-machine/casino presentation. Production mathematics remains undecided. This report is browser/local-backend evidence, not native release certification.

## Delivered

- **Neon Sevens:** three reels, five matching paths, classic seven/cherry/bell/BAR/gem symbols.
- **Jade Fortune:** five reels, nine paths, wild-dragon substitutions, one evaluated result per line and visible matching paths.
- **Coin Carnival:** full-column locks when center-row coins land, up to three respins of only unheld reels, locked-reel indicators and remaining-spin count.
- All three are implemented as authenticated, server-generated, versioned, transactionally saved practice rounds. Same-key retries return the same result. Guest previews are separate deterministic storyboards. No credits are staked or awarded.
- Eight distinct games in a compact four-by-two desktop/landscape collection; two columns on phone-size screens. Filters, search, favorites and the existing player login remain functional.
- Original illustrated symbols, posters, neon city backdrop, arcade reef floor, gold/chrome frames, marquee bulbs and spin buttons replace the active cinematic backgrounds. Existing feature/keno/fish mechanics and motion are retained.
- Reels decelerate and stop in sequence. Locked reels do not move during subsequent respins. Stop, offline interruption and reduced motion settle the already selected result. Reload restores the latest saved result for that game.

## Changed files

| Area | Files |
|---|---|
| Catalog and rules | `packages/contracts/src/index.ts`, `packages/game-math/src/index.ts` |
| Server routing | `apps/api/src/practice.ts` |
| Player integration | `apps/player/src/App.vue`, `LoginScreen.vue`, `main.ts` |
| New game and tile components | `apps/player/src/CabinetGame.vue`, `GamePoster.vue` |
| Reel renderer and symbols | `apps/player/src/ReelStage.vue`, `ArcadeSymbol.vue` |
| Arcade presentation | `apps/player/src/arcade-v4.css`, `apps/player/public/art/arcade-floor.svg`, `reef-table.svg` |
| Verification | `tests/unit/cabinets.test.ts`, `tests/integration/api.test.ts`, `tests/db/backend.test.mjs`, `tests/e2e/cabinets.spec.ts`, `preview.spec.ts`, `features.spec.ts` |
| Provenance | `scripts/asset-manifest.mjs`, `reports/asset-manifest.json` |
| Documentation | `README.md`, `docs/LOCAL_MVP.md`, `docs/OWNER_UPDATES.md`, `docs/JUWA_ARCADE_RESEARCH.md`, this report |
| Generated outputs | Player/admin/server distributions, synchronized Capacitor Android/iOS assets, browser reports/screenshots/recordings |

No new dependency, database migration, role, balance workflow, external provider connection or approved math profile was introduced. Earlier artwork files remain available for rollback; current screens use the new code-authored presentation. Private reference screenshots were not copied into the application.

## Commands and acceptance evidence

Commands ran from the workspace using bundled Node 24.19.0 and pnpm 11.19.0. The pnpm executable was `C:/Users/kcdre/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm.cmd`. Local worker/browser/build processes used approved execution escalation where required by the Windows sandbox.

| Exact workspace command | Result |
|---|---|
| `pnpm typecheck` | Passed after final source changes |
| `pnpm lint` | Passed after final source changes |
| `pnpm test` | **50 reference, 47 unit, 16 HTTP integration tests passed** |
| `pnpm test:ledger` | **16 reported tests passed**: 15 scenarios plus parent, against an isolated PostgreSQL schema and actual API |
| `./scripts/start-local.ps1` | Started local PostgreSQL, API, player and admin services |
| `pnpm exec playwright test tests/e2e/cabinets.spec.ts --project=landscape` | Initial review: 4 passed, 1 failed because the lobby exceeded viewport height; subsequently fixed |
| `pnpm test:e2e` | **48 passed in 7.1 minutes**, one complete final run across desktop, phone-size and landscape |
| `pnpm build` | Player, admin and server builds passed |
| `pnpm mobile:sync` | Rebuilt player and synchronized existing Android/iOS assets successfully |
| `pnpm assets:manifest` | 16 provenance/hash records: 13 static assets plus 3 code graphics sources |
| `pnpm build:android` | **Blocked**: `JAVA_HOME` unset and Java not found; no APK produced |
| `pnpm build:ios` | **Blocked**: this Windows environment has no macOS/Xcode; no IPA produced |
| `node --env-file=.local/runtime.env scripts/reconcile.mjs` | Five wallets; settled total zero; no projection mismatches or unbalanced transactions; zero approved profiles |

Reference-suite percentages remain test illustrations; they are not production accounting or approval evidence. No production math setting was changed.

The new unit tests exercise exact straight/diagonal fixtures, partial-line rejection, left-origin wild substitution, all-wild lines without duplicates, malformed-grid rejection, immediate/full and exhausted coin sequences, and 900 seeded rounds checking whole-column preservation and evaluated results.

The new PostgreSQL scenario submits five concurrent identical requests for each cabinet, checks a single stored response, exact history replay and identical wallet snapshots, and rejects client grids/seeds/awards/picks, lower-operator access, invalid CSRF and cross-game key reuse. All stake endpoints remain closed.

New browser cases cover the eight-tile layout, actual reel transforms, stop controls, complete coin sequences, authenticated grid equality to the server response, exact restoration after reload, a deliberately lost response followed by same-key recovery, offline behavior and reduced motion. Existing account, ledger UI, shared fish, keno and feature-game regression tests also pass. Layout checks cover horizontal overflow, full landscape lobby height, minimum symbol height and reel/control separation.

Visual review corrected the initial landscape overflow and enlarged the reel area. Coin lock indicators were also adjusted to reveal only landed frames while preserving previously locked columns throughout later respins. Final UI sources were not edited during the complete passing browser run.

## Visual evidence

24 new screenshots in `reports/screenshots-v4/` and 15 recordings in `reports/recordings-v4/`. The complete regression run also refreshed existing generated `screenshots-v2/`, `screenshots-v3/` and `recordings-v3/` artifacts with the current presentation; older reports describe the earlier implementation, not immutable screenshot snapshots.

- [Eight-game landscape lobby](screenshots-v4/lobby-landscape.png)
- [Neon Sevens](screenshots-v4/Neon-Sevens-landscape.png)
- [Jade Fortune](screenshots-v4/Jade-Fortune-landscape.png)
- [Coin Carnival](screenshots-v4/Coin-Carnival-landscape.png)
- [Phone-size lobby](screenshots-v4/lobby-phone.png)
- [Phone-size Jade Fortune](screenshots-v4/Jade-Fortune-phone.png)
- [Complete coin sequence recording](recordings-v4/coin-sequence-holds-reels-and-finishes-all-respins-landscape.webm)

Desktop viewport 1440×1000; phone emulation 390×844 with device pixel scaling; landscape 1024×461. These are browser renders. No Android/iPhone hardware was available, as already deferred by the owner. Manual in-app-browser review also verified the classic cabinet's five-line overlay.

## Research, limits and rollback

Research observations and source links are in `docs/JUWA_ARCADE_RESEARCH.md`. The provided JUWA landing page links to a public web lobby; both were inspected. The owner screenshots informed landscape composition. No provider gameplay/paytable, private API, downloaded application or third-party game asset was adopted.

Still incomplete: approved production math and credit-staked settlement; native secure authentication/TLS deployment; Java/Android build tooling and macOS/Xcode builds; physical-device acceptance; sound/music; distribution/signing and release review. Practice collectibles are not play-credit awards. The four-seat fish implementation remains the previously documented HTTP practice system, not completed Colyseus production settlement.

No SQL migration or data rollback is needed. To reverse this iteration, restore the prior catalog/math/API/player source version together, rebuild all bundles and resync Capacitor. Keep persisted practice records and ledger history intact. Do not remove wallet entries or rewrite earlier results. The repository has no initial committed baseline, so use a retained workspace snapshot if rollback is required; do not assume `git reset` can restore the earlier untracked source tree. Local services remain available through `scripts/start-local.ps1`.
