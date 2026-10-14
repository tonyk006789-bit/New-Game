# V37 — animated dealer for all blackjack tables

## Changes

The owner requested a decent 3D character dealing from the far side of every blackjack table. Royal Blackjack, Double Deck Blackjack and European Blackjack now use an original professionally dressed female dealer. The visual is a **3D-rendered four-pose transparent sprite**, not a rigged WebGL mesh or a live person. One 1.4 MB PNG is shared across the tables. Warm, plum and blue room/felt treatments distinguish their surroundings.

- `BlackjackDealer.vue`, `blackjack-v37.css`, `public/art/blackjack-dealer-v37.png`: idle breathing, drawing, extending and releasing a card, a far-side table rail, card shoe and chips. Transforms and opacity avoid a continuous JavaScript rendering loop. Reduced motion and pause stop character animation.
- `BlackjackGame.vue`, `blackjack-dealing.ts`: alternate player/dealer opening deliveries, show each card on landing, animate only new hits, retain the two split cards while dealing their replacements, turn the existing hole card before extra dealer cards, and respect European no-hole-card order. Card positions derive from the rendered targets, including uniformly scaled game frames. Hand totals use only cards already displayed. Restored hands appear immediately. Pending action/recovery, immediate stake presentation and delayed accepted-award presentation remain intact.
- `tests/unit/blackjack-dealing.test.ts`: seven presentation regressions for opening order, hidden hole card, hit, dealer turn/draw order, split, natural/new preview round and European natural.
- `main.ts`, `scripts/asset-manifest.mjs`, prompt/asset records: load and document the original character and styling.

No server outcome, payout probability, reward, stake choice, account, operator or hierarchy change. Double Deck and European remain free previews under their existing approval status. No database migration.

## Verification

Using the pinned local Node runtime:

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — **244 passed, 34 files**.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed; entry `index-B2GYUBlD.js`, stylesheet `index-VnxwZaa2.css`.
- `node scripts/vercel-build.mjs` — passed.
- `node --test tests/deployment/vercel.test.mjs math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` — **55 passed**. First sandbox run blocked the local HTTP fixture with EACCES; rerun with localhost access passed. Historical reference probabilities are not production math approval.
- In `apps/mobile`, `node node_modules/@capacitor/cli/bin/capacitor copy` — Android/iOS/web asset copies succeeded. Native compilation, signing and physical Android/iPhone performance were not tested.

Browser checks used the local nonredeemable-credit fixture. Royal opening reduced 978.15 to 977.65 immediately, kept the second dealer card face down, and restored the same unfinished hand without a repeated deal after reload. Standing revealed dealer 7/7/8 (22), player 20 won 1.00, and the balance became 978.65 after reveal. Double Deck HIT retained the existing two cards while the new third card waited for delivery. European opened with exactly one dealer card; DOUBLE added one player card before dealer draws and did not change the real wallet in its free preview. Reduced motion showed the full hand immediately with no waiting/flying cards; opening Rules during a deal cleared the flight and paused the dealer.

All three table layouts inspected at a landscape phone viewport (844×390); Royal also inspected on desktop. Screenshots are local ignored evidence under `reports/screenshots/v37/`. These checks are not physical-phone performance certification. Split motion is covered by the deterministic presentation test; no random browser pair was forced.

## Publication and rollback

Player publication pending final route/asset verification. Operator remains on V36. No hosted play, new service, credentials transfer or hosted wallet adjustment is needed.

Rollback: redeploy previous player `dpl_ATPZp86cttqNdyvpehr5W8pJGdof`, or revert V37 and rebuild. Preserve all database balances and accepted rounds; no schema rollback.
