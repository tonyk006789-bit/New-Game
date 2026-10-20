# V48 — category reference review, motion and thumbnail delivery

Owner request: review Google Play imagery/video across the existing game categories, refine animation, and return thumbnails to the earlier full-picture composition with lighter loading. The catalog remains 31 games. This release changes player presentation only.

## Reference review

Inspected public Google Play galleries and available embedded developer trailers on 20–21 October 2026:

| Category | Primary reference | Evidence and application |
| --- | --- | --- |
| Slots | [Slotomania](https://play.google.com/store/apps/details?hl=en_US&id=air.com.playtika.slotomania), [official trailer](https://www.youtube.com/watch?v=ldqCprYStXs) | Promotional themed cabinets, character introduction and coin/win presentation. Retain distinct original game identities; use short local contact feedback and readable stops. |
| Keno | [Keno Classic](https://play.google.com/store/apps/details?id=com.lepshy.keno.classic.casino) | Gallery shows separate picked/drawn/matched states, draw history and persistent controls. No trailer was offered on this listing; no claim of video-verified keno motion. |
| Blackjack | [BlackJack 21](https://play.google.com/store/apps/details?id=eu.mvns.games), [developer trailer](https://www.youtube.com/watch?v=c-dB824MWHQ) | Gallery shows an uncluttered felt, overlapping card hands, totals and persistent actions. Promotional video includes win presentation. Preserve the existing distinct 3D dealers and fix the card handoff timing found in our code. |
| Fish | [Dragon King](https://play.google.com/store/apps/details?hl=en&id=com.yueyou.topfish), [developer trailer](https://www.youtube.com/watch?v=dR_h-Rae7Kc) | Gallery and footage show perimeter cannons, swimming targets, projectile/net feedback and boss reward presentation. Apply softer impacts and a compact expanding net without moving collision paths. |

These are public promotional references, not live authenticated gameplay or evidence of private payout logic. No provider artwork, executable, APK, audio or hidden metadata is copied. Reference games' advertising, sales, grants, reward pools and mathematics are not imported.

Coverage: shared reel/cascade/vault presentation covers all 16 slot/feature cabinets; keno motion covers Orchard Numbers, Neon Numbers, Pearl Keno, Meteor Keno and Bamboo Keno; shared dealer handoff covers Royal, Double Deck and European Blackjack; fish motion covers Reef Party, Abyss Legends, Sunken Dynasty, Polar Odyssey, Corsair Cove, Cosmic Tides and Coral Rush. Distinct existing themes and original in-game art remain.

## Findings and changes

- `GamePoster.vue`: V47 layered the original cover with an additional symbol/character strip and multiple SVG images. Restore one edge-to-edge cover, retaining the existing original composition and caption placement. The unique V47 symbols/characters remain inside games.
- `scripts/prepare-posters-v48.mjs`, `poster-assets.json`, `poster-source.ts`: generate 240px and up-to-480px hashed WebP variants from existing delivery covers, with responsive `srcset`/`sizes`. Original sources remain unchanged. Preserve original aspect/content; do not upscale smaller source covers.
- `poster-prefetch.ts`: warm only two adjacent covers, one decode at a time, after visible covers finish. Skip speculative work on data-saving/slow connections and stop on background/unmount. Both shelf and floor share the same responsive sources.
- Full catalog cover weights: old covers **1,424,312 bytes**; small variants **400,018 bytes** (71.9% less); larger variants **1,309,120 bytes**. Largest small cover is **25,606 bytes**. Removing lobby identity overlays also avoids the **1,240,082-byte** set of 21 symbol strips when browsing the entire catalog. These are asset-size comparisons, not measured end-to-end download-time guarantees.
- `floor-avatar.json`, `ArcadeLobby.vue`: resize the original walking sprite to 768×512 and encode lossless WebP. Preserve its frame coordinates and green-key treatment. Transfer size decreases from **1,803,830** to **374,886 bytes** (79.2% less).
- `game-motion.ts`, `motion-v48.css`: reel travel remains smoothly decelerated but no longer reverses after reaching the accepted symbol. A finite opacity contact rim replaces animated reel-window shadows. Cascade highlight and vault docking use gentler transform motion.
- `GamePreview.vue`: keno balls use category-specific entry directions with smooth track movement. Matched cells receive a small bounded pulse, other drawn cells gently settle, and recovered results do not replay the latest-ball animation. Existing fast/reduced-motion controls remain.
- `BlackjackDealer.vue`, `BlackjackGame.vue`: the renderer emits the landing event on the same paint that removes the 3D card; the table card becomes visible on that event. A delayed fallback covers unavailable WebGL/still artwork. Preserve card order, hole-card behavior, finger rig, payout timing, interruption recovery and accepted server hand.
- `FishScene.vue`: replace lateral hit shaking with a bounded soft compression and gentler size-dependent swimming sway. Nets expand and settle locally. Authoritative paths, target radii, shot timing, crew scoring and capture odds are unchanged.
- `performance-probe.ts`: development-only image audit and hide control. Not included in the release build.

## Validation

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/typescript/bin/tsc -p tsconfig.server.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — **286 passed across 43 files**. Includes complete cover/hash/size coverage, walking-sprite budget, monotonic reel stops, bounded fish impact/expansion and existing dealer/card continuity tests. Earlier draft checks exposed an unnecessarily strict source-width expectation and motion-size bounds; corrected before the final pass.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed; lazy dealer chunk advisory remains.
- `node scripts/vercel-build.mjs` and `node --test tests/deployment/vercel.test.mjs` — passed; four deployment tests. Normal Windows execution was used for Vitest workers and replacing the verified generated output directory.
- Reference commands: `node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` — 51 passed. Reference helpers do not certify production accounting.
- Browser responsive checks: 390×844 shelf and 844×390 gameplay. Original covers fill cards without V47 overlays. At phone width all eight observed covers loaded the 240px variants; zero identity-strip requests were recorded before entering a game.
- First observed eight covers total **105,856 bytes** from the manifest. The browser transport exposed zero encoded-body bytes for these local image responses, so that value is not reported as measured network throughput. DOM `currentSrc`, decoded completion and expected file bytes were recorded.
- Local Ruby spin: 877.95 → 877.85 while reels rolled, settled return 0.00. Meteor Keno: 877.85 → 877.75 during reveal, then 878.05 after the committed 0.30 return. Royal Blackjack: 0.50 stake, completed stand/settlement, 877.55 remaining. Coral Rush: one 0.25 shot, committed 0.75 catch, 878.05 remaining. No manual credit adjustment or hosted play was performed.
- Royal Blackjack 12-second desktop-browser probe at 844×390: 1,434 frames; p95 8.5 ms; maximum 33.4 ms; zero frames over 34 ms; zero long tasks; maximum recorded event 40 ms. This measures browser frame scheduling on this computer, not native phone GPU performance.
- Browser: reviewed local shelf, walking floor, Ruby reels, Meteor reveal, Royal card handoff and Coral shooting/independent AI scores. No JavaScript errors were captured during these checks.
- Inspected all four walking-floor pages: 31 cabinets, exactly one cover image each and zero character/object overlay elements. The optimized walking sprite rendered correctly at the normal viewport.
- Screenshots and loading/timing evidence are in ignored `reports/screenshots/v48/`; they can contain local test-account information.

## Deployment and limits

No database migration, operator deployment, game-math change or account mutation is required. Published player alias: https://new-game-test-topaz.vercel.app/.

- Implementation commit: `7c03e8c`.
- Ready Vercel deployment: `dpl_5hoo5nQXhSYzuK6qc7Cw7YkpT3Yw`, https://new-game-test-efy65q3q9-tonyk006789-7532.vercel.app/.
- Published with `node --import ./.local/vercel-web-gateway.mjs .cache/vercel-tools/node_modules/vercel/dist/vc.js deploy --prebuilt --prod --yes --global-config 'C:/Users/kcdre/OneDrive/Documents/ChatGPT/New Game/.local/vercel-cli' --scope tonyk006789-7532 --no-color` — READY and production alias assigned.
- `node .local/verify-v48-live.mjs` — passed all 65 asset SHA/cache checks (entry JS/CSS, 62 responsive covers and walking sprite); health 200, unauthenticated session 401, catalog 31. Live entry `/assets/index-D8zYangk.js`, stylesheet `/assets/index-B7G6qSS0.css` match the verified build.
- Reloaded the existing live browser session and reviewed shelf and walking floor. All eight slot covers in the observed page decoded correctly, with exactly one image per card. The optimized walking sprite rendered cleanly. No JavaScript errors were captured; no hosted game plays or account changes were made.
- Published UI evidence: `reports/screenshots/v48/live-slot-shelf.png`, `live-walking-floor.png`, `live-image-audit.json` and `live-checks.json` (ignored local evidence).

Physical Android/iPhone tests, native lifecycle/orientation behavior and device GPU/audio performance remain unverified. The existing lazy Three.js dealer chunk still exceeds Vite's 500 kB advisory. No claim of universal zero lag or a 100% provider clone.

Rollback: redeploy V47 player deployment `dpl_9WbTqLb78n1MDbtuyTjj6g8q4Fny`. New images are additive and immutable; original assets and every accepted receipt/balance remain available.
