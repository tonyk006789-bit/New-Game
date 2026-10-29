# V52 — stable card dealing and fitted game layouts

29 October 2026. Owner request: fix aspect-ratio/gameplay glitches when dealing, hitting and doubling, and check other games for the same issue.

## Reproduced problem and changes

At 844×390, Royal Blackjack's felt changed from 249.378 to 231.567 CSS pixels after a deal because the decision hint was inserted into the flex layout. The player's cards moved vertically by about 14.075 pixels. Action and connection messages could repeat that resize. Mobile controls also had a fixed row smaller than their enlarged touch targets.

- `BlackjackGame.vue`, `blackjack-v49.css`: reserve one 64-logical-pixel feedback region for hints, status, errors and reconnect messages. Reserve adequate control height at every fit scale. Anchor ordinary card fans so a new hit does not shift the already dealt cards; bound larger fans. Adjust short-table card sizes and remove decorative lettering where it would overlap hands.
- `blackjack-dealing.ts`, `BlackjackDealer.vue`, `dealer-rig.ts`: measure destinations in the actual renderer's coordinate box. Retarget an active delivery when the table/camera resizes, retaining its ID and start time. A resize does not recreate its texture or replay its animation. Hidden/zero-size destinations cannot produce invalid coordinates.
- `CabinetGame.vue`: the original-rules notice for historical slot receipts now lives in the existing status row. Loading an old receipt and starting a new spin no longer adds/removes an independent layout row. Original evaluation/profile handling is retained.
- `screen-v32.css`: long status text remains scrollable within its reserved row; an in-game connection banner overlays the paused game instead of pushing the 100dvh stage below the screen.
- `tests/unit/blackjack-dealing.test.ts`: scale/offset-invariant destinations and zero-size rejection.

No payout, odds, card rules, stake, ledger, account, operator, or database changes. All 31 games remain. Royal is the approved credit blackjack variant; Double Deck and European remain free previews.

## Browser acceptance evidence

Evidence files are local/ignored under `reports/screenshots/v52/`.

- `layouts.json`: all 31 cabinets checked in authenticated play-credit mode at 844×390 landscape or 390×844 portrait. No visible button/select exceeded its fitted frame; no alert was present. All seven fish tables reached their loaded scenes. These are layout checks, not exhaustive plays of every outcome.
- `blackjack-actions.json`: Royal Deal/Hit/Double/settlement, European Double with 844×390 → 1280×720 resize, Double Deck Split and Double on a split hand, and Rules interruption/recovery. Royal's 844×390 felt stayed 220.882 pixels high after the change. The 667×375 credit-backed Royal test stayed 213.1185 pixels high with control y=281.68945 through ready, dealing, dealt, Double and settled states.
- Existing Royal player cards retained the same coordinates before/during/after Hit. Split hands stayed separately readable. Dealer/model failures retain the existing still-image and timed-landing fallback.
- `gameplay-layouts.json`: accepted local Neon Sevens spin, Meteor Keno draw, Phoenix Falls cascade, Clockwork Vault pulses and their settled results retained their respective playfield rectangles. Their local stakes used the normal authenticated test-credit workflow; no manual balance changes or hosted wagers.
- `resolutions.json`: at a 1920×1080 viewport, 720p fits to 1280×720 and 1080p/2K fit to 1920×1080, preserving 16:9 and keeping controls within bounds. The five portrait cabinets retain 9:16.
- Screenshots include `double-deck-split.png`, `royal-small-phone.png`, `european-double-desktop.png`, `keno-settled.png`, `vault-settled.png`, and catalog views. Some initial contact-sheet captures were taken during loading/viewport repaint; the final JSON and named action screenshots are the acceptance evidence.

## Commands and results

| Command | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` | 46 files, 298 tests passed. Initial sandbox worker-temp ENOENT failures resolved by running the unchanged suite outside the Windows sandbox. |
| `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` | Passed. |
| `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` | Passed. |
| `node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` | 51 passed; reference checks are not production accounting certification. |
| `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` | Passed, 1,036 modules. Existing lazy dealer chunk warning remains: 917.49 kB / 276.69 kB gzip. |
| `node scripts/vercel-build.mjs` | Passed outside sandbox after generated-output EPERM. Script validates its generated output path before replacement. |
| `node --test tests/deployment/vercel.test.mjs` | 4 passed outside sandbox after localhost EACCES on the first attempt. Includes route safety and privileged application exclusion. |

Local database initially needed its documented localhost port 55432 restored after restart. No fixtures, balances or data were rewritten. Early preview checks ran before reloading the test configuration; the final catalog sweep and representative game rounds used authenticated play-credit mode.

## Publication, rollback and limits

Publication targets the existing authorized player project `new-game-test` and https://new-game-test-topaz.vercel.app/ . Live verification is recorded below after deployment.

Rollback: redeploy V51 deployment `dpl_2nsj5npVPyPBVtXhCh4VHYyA1LoW` or revert the V52 source commit and rebuild. No migration/data rollback is needed. Accepted rounds and receipts are preserved.

Physical Android/iPhone orientation, address-bar behavior, background recovery, WebGL loss and thermal performance are not certified by these desktop browser checks. No native build/signing/device test was run. The large dealer renderer chunk and cold-start cost remain. This fixes reproduced layout jumps; it is not a guarantee of zero bugs on every device or every possible hand.

### Deployed and verified

- Source commit: `3c27e5f`, pushed to the existing repository's main branch.
- `vercel deploy --prebuilt --prod --yes` through the existing CLI/gateway: READY, deployment `dpl_3J7P1Mxw5BLkJLk2LWr6SrEbMM56`.
- Immutable URL: https://new-game-test-mnegy6fas-tonyk006789-7532.vercel.app/ ; alias https://new-game-test-topaz.vercel.app/ .
- `node .local/verify-v52-live.mjs`: 27 deployed JS/CSS/model assets matched local SHA-256; no-store HTML and immutable asset caching confirmed; health 200, unauthenticated me 401, catalog 31, V50 historical profile retained.
- Entry `/assets/index-B_B2qQWB.js`; CSS `/assets/index-BfMSjlMD.css`.
- Live UI after Reload update: authenticated Royal Blackjack restored the existing settled hand and rendered the jointed 3D dealer. At 844×390, frame=693.333×390, felt height=220.8815, feedback height=34.6667. Screenshot: `reports/screenshots/v52/live-royal-phone.png`.
- Hosted balance was 422.30 before and after verification; no hosted wagers submitted. Local test balance ended at 877.55 after four 0.25 slot/keno/feature stakes (Clockwork returned 1.50) and a 0.50 Royal deal plus 0.50 Double (zero return). Earlier blackjack checks used free previews.
