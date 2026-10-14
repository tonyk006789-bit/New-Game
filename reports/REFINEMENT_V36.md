# V36 — six-character forms and consistent live credits

## Request and findings

The owner reported a phone account-creation form still demanding a 12-character password and stale credits in **all games on phone** until restarting. The approved policy remains at least six characters including a letter and a number, optional Nickname, and existing credentials preserved.

Before editing, the public operator entry `index-BvF_u7wa.js` already contained six-character constraints and optional Nickname. The supplied screenshot contains the older 12-character/lowercase-only UI. This supports an outdated loaded page, but the user's physical phone/cache was not inspected and its exact cause is not proven.

The player session was a plain non-reactive object. App kept a separate account ref updated through revision events, and blackjack's computed affordability read that non-reactive object. Polls and component meters therefore did not share a dependable reactive source. Local testing also exposed that a cookie/account change in another tab could replace the account underneath a mounted game.

## Changes

- `packages/contracts/src/index.ts`, `apps/admin/src/App.vue`, `apps/player/src/SettingsPanel.vue`: one shared browser credential binding (minimum 6, letter and number, existing 256-character technical cap) for creation, reset, change and confirmation. Operator submission also uses the existing server-compatible password schema. No nickname requirement or new mixed-case/punctuation requirement. The same operator component serves Main Admin, Sub-contractor and Agent.
- `apps/player/src/api.ts`, `App.vue`: one reactive, version-checked account/wallet; displayed balances and blackjack affordability observe it directly. Account requests explicitly bypass caching. Late account polls cannot regress a newer wallet, resurrect a signed-out session or switch the account inside a mounted game. Resume/reconnect triggers an account refresh.
- `BetControls.vue`: an animation completion cannot release a submitted stake display while its outcome is still awaiting recovery. Definitive rejection and idempotent recovery retain their existing handling.
- `BlackjackGame.vue`: serialize background hand polls, discard responses overtaken by a player action, and restore an existing hand without replaying its award animation or temporarily subtracting an old award again.
- `packages/ui/src/ClientUpdateNotice.vue`, `client-release.ts`, package export, both Vercel build scripts: entry HTML uses `no-store`; hashed assets retain immutable caching. An open updated client checks for a newer entry and offers an explicit reload at a safe point. No forced reload during a hand, pending round, credit action or account form. A page that predates this release still needs one manual refresh to receive this code.
- Regression coverage adds reactive meter updates, slow-poll/session races, release detection, browser/server credential agreement, all six fish recovery identities, and real six-character create/reset/self-change workflows across the hierarchy.

No game mathematics, profile setting, stake choices, hierarchy, existing passwords or hosted wallet values changed. No database migration.

## Verification

Pinned Node 24.19 runtime; direct executable entry points. Windows sandbox initially blocked Vitest temporary worker files and localhost database access; the same tests/checks were rerun in the authorized local execution context.

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — **237 passed across 33 files** on the final source.
- `node node_modules/typescript/bin/tsc -p tsconfig.server.json` — passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs` — **22 passed**, real local PostgreSQL with an isolated disposable schema. Includes every parent resetting a six-character password, every role changing its own, optional Nickname, zero-start wallets, login revocation, scope and balanced accounting checks.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` and the equivalent admin command — passed. Final player entry `index-SYUrjxnr.js`; operator entry `index-BPWS4sI-.js`.
- `node scripts/vercel-build.mjs` and `node scripts/vercel-operator-build.mjs` — passed.
- `node --test tests/deployment/vercel.test.mjs tests/deployment/vercel-operator.test.mjs math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` — **58 passed**. Historical illustrative math tests are not production mathematics approval.
- From `apps/mobile`, `node node_modules/@capacitor/cli/bin/capacitor copy` — Android/iOS/web copies succeeded. Native compilation, signing and physical-device performance are not claimed.
- `node --env-file=.local/staging/runtime.env scripts/reconcile.mjs` — 56 local wallets / 1,370 transactions; **zero mismatched wallets and zero unbalanced transactions** after browser testing.

Browser verification used the local nonredeemable-credit fixture, not hosted wagering or account changes. At 844×390, Outlaw Sevens showed 987.90 → 987.65 as spinning started and retained 987.65 afterward. Orchard Numbers showed 987.65 → 987.40 before draw completion. Royal Blackjack showed 987.40 → 986.90 on deal and 987.90 after its committed 1.00 return. Reef Party updated costs and caught awards while firing, reaching 978.15 after all pending reveals; the balance carried back to the lobby. These are sampled game-family checks, not a manual playthrough of all 30 games or a physical-phone certification.

At 390×844 the operator create modal showed optional Nickname and DOM minimum 6 plus the shared letter/number pattern on Account, Password and Confirm password. No new browser credentials were entered or changed. Actual create/reset/change behavior was exercised by isolated API tests.

Local screenshots: `reports/screenshots/v36/operator-create-phone.png`, `keno-stake.png`, `blackjack-settled.png`, `fish-after-shots.png`. Screenshots are ignored local artifacts. Physical Android/iPhone checks remain unavailable; network latency and device rendering performance are not guaranteed by these checks.

## Publication and rollback

Source commit `eb0ce45` pushed to the existing GitHub main branch. Both prebuilt deployments completed READY using the existing project configurations, encrypted settings and official Vercel CLI gateway. No new credentials, services, hosted wagers or balance adjustments were submitted.

- Player: `dpl_ATPZp86cttqNdyvpehr5W8pJGdof`, https://new-game-test-topaz.vercel.app/.
- Operator: `dpl_BL3BJDd5cZNe8ZPBCJvpqoAUSmvW`, https://new-game-operator.vercel.app/.
- Deployment command from the root: `node --import ./.local/vercel-web-gateway.mjs .cache/vercel-tools/node_modules/vercel/dist/vc.js deploy --prebuilt --prod --yes --global-config "C:/Users/kcdre/OneDrive/Documents/ChatGPT/New Game/.local/vercel-cli" --scope tonyk006789-7532 --no-color`. Operator used the same CLI/options from `.local/vercel-operator` with `../../` gateway and CLI paths.
- `node .local/verify-v36-live.mjs` — **20 read-only route/asset checks passed**. Exact new entry hashes, health endpoints, role/API protection, catalog 30, unchanged approved profile setting (revision 1 / 20%), six-character operator policy, optional Nickname and no old 12-character constraint. Both `/` and `/index.html` return `Cache-Control: no-store`.
- Browser loaded both public login pages, confirmed their exact new entry hashes and captured no console errors. Evidence: `reports/screenshots/v36/live-route-checks.json`, `live-player-login.png`, `live-operator-login.png`.
- Viewport override reset. Local verification tabs closed; both live links retained as deliverables. One refresh of an old open phone tab is required to load V36.

Rollback: redeploy the preceding player `dpl_6TAmafB3TZCR8R54nQEqQauHFsJ8` and operator `dpl_5fCtaKqFxrrPi5s5YDkvxmQ7egXi`, or revert this source change and rebuild. Preserve all database receipts and balances; no schema rollback or password reset is needed.
