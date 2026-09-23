# Arcade v7 and five-person testing — 23 September 2026

## Implemented

- Stakes: 80 valid amounts, 0.25–20.00 in 0.25-credit increments. Integer-unit validation is shared by client, server math and migration 007. Minus/plus/MAX and the amount selector apply to machines and cannons.
- Five-reel Neon Sevens and Coin Carnival with evaluated/persisted grids, animated reel stops and five lock lamps. Their experiment is versioned `stage-paying30-v2`; old accepted v1 receipts replay without resampling or rewriting history. Other reel cabinets already have at least five columns.
- Fish auto fire sends one accepted request at a time; target lock leads moving creatures using the same flight speed as server collision checks. Fast mode changes firing cadence, not projectile speed or odds. Stake changes, offline/background transitions and leaving stop auto fire.
- Original illustrated casino hall with eight cabinets, a three-pose walking character, keyboard/touch navigation, categories, search and favorites. Selecting a cabinet walks to and opens it. Portrait uses a horizontally scrollable hall without overflowing the page.
- Five distinct human-test accounts, each created at zero and manually funded once with 1000.00 credits through Main Admin MFA. No human tester stakes were spent by verification. Five fish seats occupy two real rooms because each room holds four people.
- A separate built-player gateway on loopback 5185 allows only these five identities and a fixed player API list. It blocks admin routes, development sources, local secrets and credit-adjustment APIs. The public environment omits the local sample login. Strict CSP is compatible with Pixi's precompiled uniform/shader support; unsafe evaluation is not enabled in the policy.

## Changed files

Game/UI: `packages/game-math/src/index.ts`, `packages/contracts/src/index.ts`, `apps/api/src/staging.ts`, `apps/player/src/{api.ts,main.ts,App.vue,BetControls.vue,CabinetGame.vue,FishScene.vue,ArcadeLobby.vue,arcade-v7.css}`, original `apps/player/public/art/arcade-{hall,host}-v7.png`.

Persistence/sharing: `database/migrations/007_incremental_stakes.sql`, `scripts/{prepare-human-testers.mjs,share-gateway.mjs,prepare-tunnel-key.mjs,start-shared-test.ps1,stop-shared-test.ps1,verify-shared-test.mjs}`. Earlier tunnel experiments remain isolated in ignored cache/runtime directories; the current startup script uses only Pinggy.

Evidence: unit, database and browser tests under `tests/`; updated staging configuration assertions and screenshot/recording destinations; `reports/art-prompts-v7.json`, `reports/asset-manifest.json`, `reports/staging-math-v2.json`, and the owner/staging/sharing docs. Capacitor assets synced locally to Android and iOS projects.

## Commands and results

Commands used the bundled Node 24 runtime and pinned pnpm. Database and browser commands ran with local-service/child-process permission.

| Command | Result |
| --- | --- |
| `pnpm typecheck` | Passed after final source edits. |
| `pnpm lint` | Passed, zero warnings. |
| `pnpm test` | 50 reference, 65 unit and 16 HTTP integration tests passed. Reference tests are not ledger proof. |
| `pnpm build` | Player, admin and server builds passed. |
| `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` | 9 passed, including max stakes, canonical stake rejection, legacy receipt replay, validated fish proof and accounting. |
| `node --test tests/db/share-gateway.test.mjs` | Passed; route, origin, role/account, secret redaction and Secure-cookie boundary. |
| `pnpm exec playwright test --config playwright.staging.config.ts` | Original 12 cases passed across desktop, portrait and landscape. Three added auto-control cases passed across targeted runs; desktop rerun: `--project=desktop --grep 'fish auto fire'` 1/1. |
| `pnpm exec playwright test` and targeted browser reruns | Original run 45/48; corrected landscape overflow and test foreground timing. All three failed cases passed targeted reruns. Keyboard/walking lobby tests passed desktop and landscape. Not presented as one clean 48-case run. |
| `node scripts/verify-shared-test.mjs --local` | Five distinct logins, exactly 1000.00 available each, five seats across two rooms, built-browser login/lobby/fish/80 stake options passed. No test-account spending. |
| `node scripts/staging-math-report.mjs` | 80,000 offline v2 rounds; paying 29.35–30.96%, observed credit return 40.56–167.24%. These provisional tables are not a balanced production economy. |
| `node --env-file=.local/staging/runtime.env scripts/reconcile.mjs` | Zero mismatched wallets; zero unbalanced transactions. |
| `node scripts/asset-manifest.mjs` | 26 original art assets recorded with hashes and provenance. |
| `pnpm mobile:sync` | Final player build and both Capacitor asset syncs passed. Not native compilation. |

Screenshots: [built lobby](screenshots-v7/shared-lobby-desktop.png), [built fishing table](screenshots-v7/shared-reef-desktop.png), and the desktop/phone/landscape machine screenshots in `screenshots-v7/`. Recordings are in `recordings-v7/`. These are browser observations, not device certification.

## Sharing status

Anonymous GETs to the proposed Pinggy HTTPS URL return the actual player HTML and v2 environment JSON (HTTP 200). Authenticated public verification is pending explicit provider approval after automatic approval review rejected sending the five test passwords through this intermediary. The latest `SHARED_TEST_VERIFICATION.json` explicitly identifies `http://127.0.0.1:5185` as the verified origin. Do not label that report public validation.

Cloudflare allocation was rate-limited, anonymous localhost.run addresses rotated too quickly for human testing, and Localtunnel did not serve reliably. No provider purchase or permanent hosting account was created. Pinggy's free tunnel lasts approximately one hour; the computer must remain awake. See `docs/SHARED_TEST.md` for restart/stop instructions.

## Migrations, rollback and remaining gates

Migration 007 was applied to development and staging. It widens new v2 stakes without modifying any historical receipts. Do not roll an old backend back over v2 results or edit applied migrations. Stop sharing with `scripts/stop-shared-test.ps1`; stopping the gateway leaves balances/history intact. Reverting presentation requires a reviewable file copy because this repository has no committed baseline; avoid broad resets.

Production profile/approval remains null, no provider credentials or copied reference artwork are shipped, and no money/prizes are involved. Native compilation/signing and real Android/iPhone performance remain unverified (Android Java tooling and macOS/Xcode/device gates recorded in earlier reports). Fish networking remains polling; sound remains unimplemented. Free tunnel availability and expiry are external limits, not a permanent deployment.
