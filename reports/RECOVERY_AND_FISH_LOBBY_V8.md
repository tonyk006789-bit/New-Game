# Recovery and four-seat fishing lobby — 23 September 2026

## Result

The manual Recover Round panel appeared whenever a normal request was in progress because the UI rendered directly from the persisted pending request. It is now removed. Normal play stays in the cabinet; connection interruptions reconcile automatically online and in the foreground, with only a small connection status while unresolved.

Recovery calls a separate authenticated endpoint with the saved request. It acquires the same actor/request lock as settlement and returns an already committed receipt unchanged. If the request was never accepted, it persists a cancellation receipt with no ledger movement. A late original request then fails without charging. Recovery cannot resample an accepted result or create a new stake. Local pending state survives account reauthentication; retries are bounded to a three-second cadence and requests time out after 15 seconds.

Reef Party now opens a dedicated Ocean Lounge before entering the renderer. Players see actual occupancy and four selectable numbered seats on each table, can open a new table, join a particular seat or return to their own seat. A full table rejects a fifth arrival. The back arrow returns to the lounge and releases the seat immediately. All table lists, snapshots, joins and departures are authenticated and branch-scoped. Four separate browser accounts were observed together in seats 1–4; empty seats remain empty.

Removed the game-information button/dialog and the experimental paytable/statistics UI, including its duplicate panel in player history. Play and credit history remain. Backend statistics and documented experimental mathematics remain intact. No production math/profile change, balance overwrite or automatic refill was introduced.

## Changed files

- Player flow: `apps/player/src/App.vue`, `api.ts`, `staging-state.ts`, `FishScene.vue`, `main.ts`; new `FishingLobby.vue`, `reef-room.ts`, `arcade-v8.css`; removed `StagingPanel.vue`.
- API: `apps/api/src/staging.ts`, `practice.ts`, `app.ts`. New recovery, table-list and leave routes; join accepts an optional room and numbered seat.
- Shared player: `scripts/share-gateway.mjs` permits these exact new player routes behind its existing five-account boundary. `scripts/verify-shared-test.mjs` follows the new lounge flow. No third-party authenticated verification was attempted during this change.
- Evidence/tests: `tests/db/staging.test.mjs`, `tests/db/share-gateway.test.mjs`, `tests/staging-e2e/staging.spec.ts`, new `four-seat-lobby.spec.ts`, guest/account browser tests and `scripts/asset-manifest.mjs`.
- Updated owner steering, staging/sharing instructions and README. Existing original hall and seabed artwork were reused.

## Executed verification

| Command | Result |
| --- | --- |
| `pnpm typecheck` | Passed. |
| `pnpm lint` | Passed, zero warnings. |
| `pnpm test` | 50 reference, 65 unit and 16 HTTP integration tests passed. Reference tests are not accounting proof. |
| `pnpm build:server` | Passed; verified development/staging API processes restarted. |
| `pnpm build:player` | Passed; built player gateway restarted with new allowlisted routes. |
| `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` | 11 passed, using a separate temporary PostgreSQL schema. Includes recovery/cancellation, four selected seats, concurrent fifth-seat rejection, branch isolation, leaving/switching and existing settlement/ledger cases. |
| `node --test tests/db/share-gateway.test.mjs` | Passed, including new player-route allowlist and existing admin/source/identity boundary checks. |
| `pnpm exec playwright test --config playwright.staging.config.ts --project=desktop` | Original 5 cases passed: login, all seven cabinets, lost committed response, fish shot and auto controls. |
| Same config with `--project=desktop --grep 'four distinct\|unsent round'` and targeted reruns | Both new cases passed. Four-browser case initially exceeded five-second renderer/animation waits under software rendering; final run uses reduced motion and bounded 20-second readiness assertions. Four distinct accounts still join through the actual UI. |
| Same config with `--project=phone --project=landscape --grep-invert 'four distinct'` | 12/12 passed. Across targeted runs, 19 distinct staging/browser cases pass. |
| `pnpm exec playwright test tests/e2e/preview.spec.ts --grep 'painted fish\|slot preview\|reel preview'` | 3/3 matching guest-fishing cases passed: desktop, portrait and landscape entry/exit through the new lounge. |
| `node --env-file=.local/staging/runtime.env scripts/reconcile.mjs` | Zero mismatched wallets and zero unbalanced transactions. |
| `node scripts/asset-manifest.mjs` | 28 original assets/source artifacts recorded with hashes. |
| `pnpm mobile:sync` | Player build plus Android and iOS asset sync passed. This is not native compilation or device certification. |

Screenshots: [four concurrent players](screenshots-v8/four-real-players.png), [actual table selection](screenshots-v8/table-selection.png), [phone playfield](screenshots-v8/reef-phone.png), [landscape lounge](screenshots-v8/fishing-lobby-landscape.png), [recovered phone game](screenshots-v8/recovered-phone.png). Viewport recordings are in `recordings-v8/`; the first desktop checks retain their `recordings-v7/` paths. Test accounts are separate from the five human testers; no human test balance was reset or spent by these checks.

## Deployment, persistence and remaining limits

Local development and staging are running the updated API and player. Preview: http://127.0.0.1:5183/. Refresh an older open tab to load the new client. The shared gateway serves the updated built player if an authorized tunnel is running. The previous free public URL remains subject to its original expiry; external authenticated verification still awaits the earlier provider approval.

No schema migration is required. Existing four-seat SQL constraints, room data and historical rounds are preserved. Cancellation receipts are durable records in the existing idempotency store. Do not delete them or revert the backend to a revision that treats cancellation receipts as playable outcomes. Stop the local gateway/tunnel to roll back exposure; retain the database. Reverting presentation requires a reviewed file copy because the repository has no committed baseline.

The current room service still uses polling, expires disconnected seats after 20 seconds and rotates 15-minute rooms. A table that expires must be selected again from the lounge. Real Android/iPhone validation remains deferred; native builds/signing retain the previously documented Java/macOS/device blockers. Production mathematics remains undecided and disabled.
