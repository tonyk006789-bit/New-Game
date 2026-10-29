# V50 — virtual dashboard pools, downward reels and horizontal slots

## Owner request and decisions

The owner requested changing dashboard amounts, top-to-bottom slot motion, half the slot catalog restricted to horizontal wins, and a review of every game's rules. After initially choosing a wager-funded pool, the owner rejected the proposed funding/payout policy and requested a separate self-made virtual pool without player contributions. The implemented interpretation was communicated explicitly: independent display-only values, no contributions or awards. The rejected 1% contribution and random jackpot proposal was not implemented.

## Changes

- `WinShowcase.vue`, `virtual-pools.ts`: Minor/Major/Jackpot now vary every three seconds on a six-hour presentation cycle. Starts are 25/500/5,000; increments are .01/.07/.25 per tick. Cards, explanatory details and game rules identify these as virtual displays that cannot be won. Values do not read or write wallets, RNG outcomes or the ledger. Real settled results remain in Play History. Reduced-motion and background behavior are retained; lobby polling for personal totals is removed.
- `ReelStage.vue`, `game-motion.ts`: reverse the reel strip and travel direction together. Previous symbols start at the bottom of the strip; the accepted result sits at the top. Translation increases from negative displacement to zero, moving symbols downward with the existing acceleration, braking, staggered stops, held reels and instant/reduced-motion settlement.
- `packages/game-math/src/index.ts`: exactly 8 of 16 slot/feature games use three horizontal paylines: Temple Lights, Neon Sevens, Ruby Rush, Disco Diamonds, Outlaw Sevens, Jade Fortune, Sapphire Crown, Midnight Express. Temple's existing profile is unchanged; the other seven use `stage-straight-v50`. Keep the original profiles for historical 3- and 5-reel receipts; do not infer a new rule solely from grid width. Celestial retains its nine lines; other features remain collections, locks or clusters.
- `apps/api/src/staging.ts`: register and hash the new version for future accepted rounds. Stale profiles fail before charging; historical idempotency replay runs before new-profile validation. The global paying-round setting remains unchanged.
- `CabinetGame.vue`, `GameRules.vue`, contracts catalog: update headers, current line maps and instructions; retain historical line maps when replaying an old receipt. Rules explain the paying-first test model and remove outdated personal-win-total descriptions.
- Added focused regression tests, a reproducible offline simulation script and [all-game rules review](RULES_REVIEW_V50.md).

## Validation

- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 293 passed, 45 files. First run found one stale V28 profile expectation; fixed it and the complete rerun passed. Includes negative-to-zero motion, monotone braking, exactly eight horizontal profiles, diagonal exclusion, historical awards, configured sampler and virtual-clock boundaries.
- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/typescript/bin/tsc -p tsconfig.server.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed; final changed rules/catalog/DB test files rechecked.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` — 22 passed in an isolated local PostgreSQL schema, including current exact settlements, historical same-width diagonal replay, duplicate requests, stale profiles, balances/reservations, rate revisions and fish/wheel regression checks. Existing pg concurrent-query deprecation warning remains; no failed assertions.
- `node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` — 51 passed. These are reference examples, not evidence for live production mathematics.
- `node scripts/rules-review-v50.mjs` — 280,000 offline seeded rounds across 28 cases; every configured-version receipt reevaluated to its sampled award. Results saved to `rules-simulation-v50.json`; no accounts or remote data accessed.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed; existing lazy dealer chunk advisory remains (917.40 kB, 276.66 kB gzip). Final entry `index-BLW78fMB.js`; stylesheet `index-Bn82stKl.css`.
- `node scripts/vercel-build.mjs` and `node --test tests/deployment/vercel.test.mjs` — packaging passed and all four routing/configuration tests passed. `git diff --check` passed.
- Browser: lobby at 390×844 had no horizontal document overflow and displayed changing virtual amounts with clear labels/details. Outlaw at 844×390 showed all controls; one local 0.25-credit spin returned zero, changing the local test balance from 878.05 to 877.80. Sapphire at 390×844 displayed three horizontal overlays. Rules dialogs verified three paths for all eight designated cabinets and nine for Celestial. No captured JavaScript errors. Browser animation API inspection was unsupported; direction/braking is covered by the motion regression tests and source/strip review rather than a claimed native frame recording.
- Screenshots and DOM observations are saved under ignored `reports/screenshots/v50/`. Physical Android/iPhone checks remain deferred; viewport checks are not native performance certification.

## Deployment and rollback

Target is the existing authorized player project, https://new-game-test-topaz.vercel.app/. No operator UI or account data changes, database migration, new secret, paid service or provider integration is needed. The player deployment bundles its updated API. Operator management UI remains unchanged.

Do not roll back accepted rounds, ledger postings, immutable history or setting revisions. Prefer a forward fix. A presentation-only rollback may restore V49 visuals while retaining V50 historical evaluation. A full V49 rollback would restore old rules for future rounds and lose correct V50 historical line-map/evaluator support; do not use it as an automatic rollback after V50 stakes have been accepted. No accounting data rollback is needed.

Published successfully to https://new-game-test-topaz.vercel.app/.

- Implementation commit: `7072a41`.
- Deployment: `dpl_56WrVjCq97ZvGLh32D8yyWbSP7Pa`, https://new-game-test-88luej3vq-tonyk006789-7532.vercel.app/ — READY and production alias assigned.
- Exact publication command: `node --import ./.local/vercel-web-gateway.mjs .cache/vercel-tools/node_modules/vercel/dist/vc.js deploy --prebuilt --prod --yes --global-config 'C:/Users/kcdre/OneDrive/Documents/ChatGPT/New Game/.local/vercel-cli' --scope tonyk006789-7532 --no-color`.
- `node .local/verify-v50-live.mjs` — all 27 JS/CSS/model SHA/cache checks passed, health 200, unauthenticated session 401, catalog 31, `stage-straight-v50` present and Outlaw catalog metadata updated.
- Live browser update banner reloaded the new version and restored the existing session. The virtual lobby and Outlaw's three horizontal rule diagrams/20% disclosure were verified. Hosted credits remained 423.55; no hosted stake or account mutation was performed. No captured JavaScript errors. Final screenshot: `reports/screenshots/v50/live-lobby.png`.
- Initial Git commit lacked a configured identity; used the same per-command Codex identity as the previous commits, without changing global Git configuration. This did not affect the built or published files.
