# V39 — continuous dealers and lightweight catalog artwork

The dealer was crossfading four independently drawn full-body poses. Face, shoulder and hand positions changed between frames, creating jumps and ghosting. Each blackjack table now retains its distinct original character on one continuous Pixi mesh. Smooth sleeve-to-wrist deformation keeps the face pinned, returns the hand to rest between cards, and leaves no continuously running WebGL ticker when idle. Cards move continuously from shoe to hand to table. Card flights carry the correct visible face, preserve the hidden dealer card, and arrive without the previous overshoot. The breathing loop no longer restarts between poses.

Renderer startup, pause, reduced motion, context loss and unmount have explicit cleanup/fallback behavior. Local navigation testing caught a context-loss callback after renderer destruction; the final build guards it. The scaled blackjack controls stay on one row on narrow physical viewports. These are lightweight animated 3D-rendered characters, not full skeletal 3D models or live human dealers.

All 30 full-art thumbnail compositions are now flattened into individual 480×480 WebP delivery assets, 16–76 KB each, totaling 1,340,896 bytes. No smaller, minimalist redesign was introduced. The shelf and Walk the Floor share these images, replacing per-card multi-megabyte scene/atlas downloads and SVG/filter composition. Visible cards load eagerly; only the next eight cards are prefetched after a delay, at most two at a time. Prefetch stops on teardown/backgrounding and skips data-saving/2G connections. The three dealer delivery images are about 52 KB each; the lobby background is 201 KB. Content-hashed paths receive immutable caching; entry HTML remains uncached.

## Changed files and asset provenance

- `BlackjackDealer.vue`, `BlackjackGame.vue`, `dealer-motion.ts`, `blackjack-v37.css`: motion, delivery and controls.
- `GamePoster.vue`, `GameShelf.vue`, `ArcadeLobby.vue`, `poster-prefetch.ts`, lobby background references in `arcade-v7/v8/v9/v10.css` and `neon-vegas.css`: loading and composition.
- `presentation-assets.json`, `public/art/delivery/`: 34 original-art delivery copies; SHA-256 provenance in `reports/asset-manifest.json` and `presentation-assets-v39.json`.
- `apps/player/tools/`: development-only export surface preserving the former thumbnail composition. Not shipped by Vite/Vercel. Capture its full page with CUA, save tile coordinates, then run `scripts/optimize-presentation-assets.mjs` with Sharp available as `SHARP_MODULE`. This is format/size optimization of existing original artwork; no external assets or new ImageGen artwork.
- Vercel packaging and delivery-budget/continuous-mesh regression tests.

Live verification also caught a cold-start CSP fallback. The final dealer imports the same static-uniform adapter as the fish renderer (`pixi.js/unsafe-eval`, which removes the eval requirement); CSP is unchanged. The live canvas must report `data-renderer="mesh"`, not merely display the fallback image.

No game math, ledger, passwords, hierarchy, database or operator changes. Double Deck and European retain their free-preview restrictions. No migration or accounting rollback is needed.

## Acceptance

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 35 files / **248 tests passed**, including continuous mesh bounds, no mesh folding, pinned face, complete catalog coverage, asset hashes and size budgets. Existing accepted-card/hidden-card/split/European sequencing tests remain green. After the final flight adjustment, the 11 dealer/delivery tests were rerun and passed.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed; entry `index-CaS0d07b.js`, stylesheet `index-jroGmsS9.css`.
- `node scripts/vercel-build.mjs` and `node --test tests/deployment/vercel.test.mjs` — passed; **4 deployment tests** including immutable delivery assets and exclusion of local export tools.
- From `apps/mobile`, `node node_modules/@capacitor/cli/bin/capacitor copy` — Android/iOS/web copy passed. Initial sandbox copy returned EPERM; the authorized workspace-only retry succeeded. This is asset copying, not native compilation or physical-device certification.
- `node scripts/asset-manifest.mjs` — 161 assets recorded.

CUA checks at 1280×720 and 844×390 verified all three separate dealers; opening deals, dealer settlement, safe pause/resume through Rules, post-hand cleanup, repeated table navigation, and all 30 decoded thumbnail images across all four shelf pages. Walk the Floor uses the same compact images. On the local Royal test account, a 0.50 stake immediately changed 978.65 to 978.15; the completed losing hand remained 978.15. No hosted hand or hosted wallet mutation was submitted.

A 12-second local desktop observation spanning an opening deal reported p95 8.4 ms, zero long tasks, and zero frames above 34 ms (maximum 16.8 ms). This is a limited desktop-browser sample, not a guarantee of zero lag on phones or slow networks. Physical Android/iPhone testing and native compilation remain unverified under the owner's device deferral.

Local evidence: `reports/screenshots/v39/` contains source thumbnail capture, per-card decode results, phone screenshots and performance JSON. These are ignored local artifacts. The optimization script requires recapturing the documented local export surface when regenerating assets in a new checkout.

## Publication / rollback

Publish to the existing owner-authorized player project. Keep the operator project unchanged. Deployment confirmation and live asset checks are recorded below after publication.

Rollback: redeploy V38 player `dpl_Bt91tBbqdRaRwbmKEUEV2ueFihee`, or revert V39 and rebuild. No database rollback.
