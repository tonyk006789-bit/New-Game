# V47 — original game identities, compact controls and music

The owner requested research first, then distinct logos, characters and reel symbols across the existing catalog, better mobile presentation and more music. Catalog size remains 31. This is a presentation/audio change; no outcome probabilities, reward amounts, game IDs, accepted receipts, wallet behavior or account permissions change.

## Research before implementation

Primary references inspected on 20 October 2026:

- [Jackpot Party on Google Play](https://play.google.com/store/apps/details?hl=en&id=com.williamsinteractive.jackpotparty): listing and promotional screenshot showing a themed wolf/wheel cabinet, recognizable symbols and prominent primary action.
- [Slotomania on Google Play](https://play.google.com/store/apps/details?hl=en_US&id=air.com.playtika.slotomania): listing/screenshots and its [official Despicable Wolf trailer](https://www.youtube.com/watch?v=ldqCprYStXs). Observed character introduction and win presentation; this was promotional footage, not an authenticated live gameplay audit.
- [Dragon King on Google Play](https://play.google.com/store/apps/details?hl=en&id=com.yueyou.topfish): public fish-game listing only.
- [Android touch-target guidance](https://developer.android.com/guide/topics/ui/accessibility/views/apps-views), [Android game optimization](https://developer.android.com/games/optimize), [web animation performance](https://web.dev/articles/animations-guide), and [reduced-motion guidance](https://www.w3.org/WAI/WCAG22/Techniques/css/C39).

Findings applied: maintain a recognizable character and symbol vocabulary across cover, title, reels and paytable; reserve phone space for the main play surface and primary actions; keep animations bounded and motion preferences respected. The audit found different covers sharing classic cherry/BAR/bell/seven symbols, only a subset of games using a character, whole-frame scaling shrinking controls, and a global music override that can make every game use the same collection. Research did not establish private payout logic or authorize provider artwork. No APK, provider media or proprietary runtime was copied.

## Implementation and assets

- `game-identity.ts`, `GameBrand.vue`, `GameCharacter.vue`, `ArcadeSymbol.vue`, `GamePoster.vue`: complete catalog identity mapping; original per-game hosts and symbols for all 16 slot/feature games and five keno games. Existing seven fish worlds and three licensed 3D blackjack dealers remain distinct. Six typography treatments plus each game's name/color/host are used in the shelf, Walk the Floor, headers and marquees.
- Classics now include neon music equipment, expedition artifacts, disco instruments and frontier objects. Wild cabinets use jade artifacts, royal regalia, railway objects and celestial instruments. Collectors use carnival, space and pirate objects. Vaults/cascades use polar treasures, clockwork parts, volcanic relics and phoenix relics.
- Logical symbol keys remain unchanged. `GameRules.vue` and accessible reel labels translate them to the new names while preserving evaluated awards. Existing saved grids still evaluate identically.
- Built-in image_gen original sources: `design/identity-v47/{classics,wilds,collectors,features,keno}.png`. Prompt record: `art-prompts-v47.json`. `scripts/prepare-identity-v47.mjs` creates 21 hashed WebP strips and `identity-art.json`: 1,240,082 bytes total, largest 85,642 bytes. Source PNGs are authoring files outside public delivery. Explicit SVG cell clipping prevents adjacent symbols leaking into wide viewports.
- `identity-v47.css`, `GameViewport.vue`, `keno-pages.ts`, `GamePreview.vue`: compact landscape controls use a 48-CSS-pixel target after scaling; portrait controls receive the same minimum. Phone keno pages display 40 numbers, or 20 on the narrowest frames, while retaining selection across all 80. Desktop retains the complete grid. Keno selected/drawn contrast and narrow credit readouts are improved. Fish controls fit within the frame. The five portrait games and 16:9 landscape frames are retained.
- Matching-symbol effects use finite transform animations, with different movement for expedition, music and railway themes. Reduced-motion and paused states suppress them. Existing reel deceleration, cascade, fish and dealer animation systems remain intact.
- `music-v47.ts` adds 12 original two-bar compositions in six collections: Velvet Electric, Desert Chrome, Tokyo Afterglow, Golden Orchestra, Island Frequency and Orbital Rush. Total: 31 game themes, one lobby theme and 22 collection tracks (54 compositions).
- `music-score.ts` adds compact chord voicings, longer phrases and rests. `scripts/render-music-v47.py` creates 32 original synthesized instrument samples (4,724,608 bytes), fixes increasing phase/vibrato deviation and refines plucks, winds and strings. These are procedural instruments, not live recordings. The generated manifest records duration, RMS and peak; sample peaks are normalized to 0.8.
- `music-sampler.ts` loads only the current playlist's instruments, shares in-flight requests, caches decoded samples and retries failed loads. `audio.ts` guards stale loads and stops scheduling on mute/background. Settings show all collections; an in-game button restores that game's own score when a global collection was selected.
- `scripts/vercel-build.mjs` gives hashed identity strips and versioned V47 audio immutable caching. Shared contracts change four catalog descriptions only.

## Validation

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/typescript/bin/tsc -p tsconfig.server.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 283 passed across 42 files. Coverage includes catalog/symbol coverage, strip hashes and size limits, unique phrases, bounded score events, complete keno pagination, concurrent sample loading/retry and audio lifecycle. Initial restricted Windows execution could not access shared Vitest temporary worker files; approved normal local execution passed.
- `node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` — 51 passed. These reference checks do not certify production accounting.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed. The existing lazy Three.js dealer bundle still exceeds Vite's 500 kB advisory.
- Browser: shelf covers, Ruby Rush, its remapped paytable, desktop Bamboo Keno, 568×320/844×390 compact keno, 390×844 Midnight Express and Clockwork Vault, Royal Blackjack and Coral Rush. Checked 1280×720 desktop and both phone orientations. Minimum phone action heights measured approximately 48 CSS px (rounding <0.01 px). Keno selections 1 and 80 survived pagination and viewport changes.
- Local test Bamboo draw: 0.10 debited from 878.15 to 878.05 before reveal; settled return 0.00. Local Ruby spin: 0.10 debited from 878.05 to 877.95 before reels stopped; settled return 0.00. No hosted wagers, wallet adjustments or resets were made.
- A 12-second local Ruby animation probe at an 844×390 browser viewport recorded 1,436 frames, p95 8.4 ms, max frame 16.8 ms, zero frames over 34 ms and zero long tasks. This desktop-browser measurement is not a physical-phone frame-rate guarantee.
- New Golden Orchestra collection reached `ready`, both tracks were selectable, and restoring per-game mode selected Ruby's Crimson Sprint. Music was turned off after testing. No JavaScript errors observed. Existing GPU warnings appeared for Three.js precision and Pixi texture teardown during unrelated dealer/fish navigation; no visible failure was observed.
- Local screenshots and timing evidence: `screenshots/v47/`. Screenshots are ignored by Git because local acceptance screens can include account details.

## Deployment, remaining checks and rollback

No database migration is required. No operator deployment is required for these player presentation changes. Production mathematics remains unapproved. Physical Android/iPhone tests, native orientation-lock behavior and device audio quality remain unverified; browser emulation is not native-device certification.

Rollback: redeploy the prior V46 player build. Keep every receipt and balance unchanged. New image/audio assets are additive and can remain cached; do not remove or rewrite game history.

Published player deployment: `dpl_9WbTqLb78n1MDbtuyTjj6g8q4Fny`, immutable URL https://new-game-test-ewzy096xa-tonyk006789-7532.vercel.app/, current alias https://new-game-test-topaz.vercel.app/. Implementation commit: `92a9549`.

- `node scripts/vercel-build.mjs` and `node --test tests/deployment/vercel.test.mjs` — passed, four deployment tests. Regenerating the previous protected `.vercel/output` directory required approved normal local execution after a sandbox EPERM.
- Live entry `/assets/index-D_1e4AfR.js`, CSS `/assets/index-L61dOWeE.css`.
- `.local/verify-v47-live.mjs` verified SHA-256 and immutable caching for 55 assets: JS/CSS, all 21 identity strips and all 32 instrument samples. HTML is no-store; health returned 200; unauthenticated account access returned 401; catalog contains 31 games.
- Browser confirmed the published slot shelf and Walk the Floor use the new identities. The live tab remains open. No hosted plays were placed. Evidence: `screenshots/v47/live-checks.json`, `live-slot-catalog.png`, `live-floor.png`.
