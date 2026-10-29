# V51 — mobile-market review and presentation clarity

Date: 29 October 2026. Baseline: `f08a75a` (deployed V50).

Owner request: rigorously compare the complete catalog against Google Play and other marketplace examples, identify small animation/UI/UX/gameplay/metadata gaps, and refine the existing platform. Detailed evidence, all 31 game rows, source URLs and remaining work are in [MOBILE_MARKET_REVIEW_V51.md](MOBILE_MARKET_REVIEW_V51.md).

## Changes

- Keno: `GamePreview.vue`, `KenoTicket.vue`, `keno-ticket.ts` — genuine six-number Quick Pick, complete ticket across number pages, selected-stake paytable, explicit matches, native focus-managed dialog and Escape isolation.
- Catalog/rules: `game-facts.ts`, `GameFacts.vue`, `GameRules.vue`, `BlackjackRules.vue`, `GameShelf.vue`, `ArcadeLobby.vue` — all 31 orientations, mechanisms and minimum stakes; both unapproved blackjack variants visibly marked Free Preview before entry.
- Blackjack: `BlackjackGame.vue` — current-hand emphasis, action eligibility explanations and additional double/split credit cost. Existing server action list still controls permission.
- Fish: `FishScene.vue` — lock target/species/tier/chance/return, capture chances in Species, explicit active AUTO cadence. Opening Species stops AUTO; it cannot be restarted while the guide is open and does not restart on closing. Accepted hits still settle.
- Rendering: `GamePoster.vue`, `ReelStage.vue`, `clarity-v51.css`, `main.ts` — cover load reveal/failure fallback, row-by-row final symbol labels, finite settled-match emphasis, coarse-touch targets, and the Temple Lights landscape-height correction.
- Evidence: `performance-probe.ts` adds visibility/focus counters to the existing development-only performance tool; it is excluded from production. `tests/unit/player-clarity.test.ts` covers ticket/evaluator parity, selection constraints and full-catalog metadata.

No new art payload, payout profile, stake option, probability policy, ledger behavior, account setting, grant or backend endpoint. No database migration. No operator redeploy required.

## Acceptance evidence

- All 31 games opened at 844×390 landscape / 390×844 portrait, with game facts read from their Rules panels. Five portrait games retained. Local screenshots and `catalog-mobile-audit.json` are in `reports/screenshots/v51/` (ignored generated evidence).
- Four initial loading captures were revisited; Phoenix Falls was explicitly checked after its action became enabled and in a subsequent screenshot call.
- Temple Lights now fills the logical landscape frame. One local spin: 877.80 before, 877.55 while spinning, then 878.05 after a committed 0.50 return. No restart. Local test credits only; no hosted or third-party wagers.
- Keno ticket: six sampled picks displayed, complete 0–6 match return ladder at 0.25, readable 844×390 modal scroll. Escape originally bubbled to the app and exited the game; fixed and verified that focus returns to “Open Keno ticket and paytable” with Meteor Keno still open.
- Double Deck: free-preview hand deals to visible player decisions; unavailable double and split reasons shown, current hand highlighted. No credits deducted.
- Fish: Coral, Dynasty, Corsair and Abyss target information visually checked; all seven shared table controls and metadata reviewed. AI still earn independent non-credit points.
- Cover sample at 1280×720: eight current 480-source covers loaded, 325,912 encoded bytes total (~318 KiB); cached transfer 2,400 bytes; zero identity-strip requests in the lobby. This is not a cold-network latency measurement.
- Shelf 12-second local desktop sample: 1,440 frames; p95 8.5 ms, max 9.3 ms, zero frames over 34 ms and zero long tasks; max observed event duration 32 ms.
- First fish sample: only 25 frames; p95 ~1,008 ms, no long tasks. Focus/visibility were not recorded, so its cause is unresolved; it is retained in `fish-performance.json`.
- Focus-instrumented fish repeat: 1,440 frames, zero hidden/unfocused samples; p95 8.4 ms, max 9.8 ms, no frames over 34 ms and no long tasks. Stored in `fish-performance-focused.json`. These samples do not establish low-end phone performance or rule out cold-start stalls.
- No console errors in the final sampled lobby and fish sessions. Initial development selector/loading issues and the caught Escape bug are not reported as passing observations.

## Commands and results

| Command | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` | 46 files, 296 tests passed. Windows sandbox initially prevented workers from reading generated shared temp modules; the same suite passed outside that sandbox. |
| `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` | Passed after correcting two type-inference issues. |
| `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` | Passed. |
| `node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` | 51 passed. Reference checks, not production accounting certification. |
| `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` | Passed. Existing lazy dealer chunk warning remains: 917.40 kB minified / 276.66 kB gzip. |
| `node scripts/vercel-build.mjs` | Passed; generated output restricted to the player and API, no operator application. |
| `node --test tests/deployment/vercel.test.mjs` | 4 passed, including route bounds, unauthenticated credit-play protection and privileged-bundle exclusion. |

The database suite was not repeated for this presentation-only change. No server/domain/ledger code changed. Android/iOS builds, signing and physical-device tests were not run or claimed.

## Publication and rollback

Target: existing authorized `new-game-test` Vercel project and alias `https://new-game-test-topaz.vercel.app/`. Publication status and final live checks are appended below after deployment.

Rollback: redeploy V50 player build `dpl_56WrVjCq97ZvGLh32D8yyWbSP7Pa`, or revert the V51 UI commit and rebuild. No data rollback or migration; all accepted rounds and the V50 historical-profile handling remain intact.

## Remaining issues

Real-phone cold start, long-session memory/thermal behavior, screen-reader behavior and native lifecycle remain unverified. The large dealer chunk and accumulated CSS layering are follow-up engineering work. Store screenshots and promotional footage do not establish live provider mechanics, production mathematics or motion-capture realism. The two extra blackjack variants remain free previews pending explicit credit-rule approval.
