# V41 — realistic blackjack dealers and motion

The owner rejected V40's cartoon proportions. This revision replaces the stylized superhero bases with three distinct realistic human rigs: Royal's brown-haired woman in a pinstripe suit, Double Deck's dark-haired man in a charcoal suit and tie, and European's blonde woman with glasses and a burgundy jacket. Actual clothing geometry and detailed skin, fabric, hair and normal textures replace the painted uniform mask. Models retain natural body proportions, facial shapes, fingers and distinct appearances.

Motion now derives palm orientation and finger flex axes from each model's skeleton. The wrist continues through release instead of coming to a complete stop. Small breathing, gaze, blinks and facial expression accompany the existing accepted-card sequence. Shadow rendering is limited to a 1024px map and the felt in front of the dealer. Dealing renders at up to 60 FPS, idle secondary movement at up to 24 FPS; hidden/paused and reduced-motion states stop the loop. The original server outcomes, stakes, timing of credit settlement and preview restrictions are unchanged.

## Changed files and provenance

- `apps/player/src/dealer-rig.ts`, `dealer-motion.ts`, `BlackjackDealer.vue`, `blackjack-v37.css`: model integration, materials, lighting, calibrated joints, secondary animation and matching fallback display.
- `apps/player/src/dealer-models.json`, `dealer-posters.json`, `public/art/dealers`: content-hashed delivery models (1.97–2.86 MiB each) and 33–53 KB matching WebP portraits. The on-demand renderer is still confined to blackjack; the 30 existing catalog thumbnails are unchanged.
- Source: [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox), specifically Business_Female_04, Business_Male_03 and Business_Female_02. MIT copyright/license is shipped in `ROCKETBOX-LICENSE.txt`. `reports/dealer-models-v41.json` records source FBX/texture hashes, output hashes and modifications. No executable code from the asset repository was run and no asset was purchased.
- `scripts/prepare-realistic-dealers.mjs`: reproducible asset-only FBX/TGA conversion using the pinned Three.js loaders/exporter, indexed geometry, six selected facial shapes and compressed embedded textures. `scripts/prepare-dealer-posters.mjs` processes transparent renders exported through the local fixture's visible PNG link. `reports/dealer-posters-v41.json` records the resulting artwork.
- `apps/player/tools/DealerCheck.vue`: local-only close-up/timeline inspection and poster export. This fixture is excluded from the shipped application. `scripts/asset-manifest.mjs` records all 173 original/licensed assets.
- `scripts/vercel-build.mjs` and deployment tests add immutable caching for the hashed model and poster files. The strict CSP and API boundary remain intact.
- `tests/unit/dealer-rig.test.ts`: wrist velocity at release, bounded secondary motion, three independent models, source/output integrity, facial and finger bones, delivery budget; retains existing limb/reach and historical V40 asset checks.

## Acceptance evidence

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 36 files, **253 tests passed**. The sandbox-only first focused run could not read its generated temporary transform cache; the full run outside that restriction passed.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed. The dealer-only lazy chunk remains about 623 KB / 158 KB gzip and retains Vite's >500 KB warning. It is not part of lobby loading.
- `node scripts/vercel-build.mjs` and `node --test tests/deployment/vercel.test.mjs` — **4 passed**. The initial sandbox run could not replace existing output or bind/connect to the local test listener; the same commands with the required filesystem/network access passed.
- Inspected all three identities, face textures, transparent spectacle lenses, clothing, palm placement, grip and release in the local strict-CSP fixture. Replaced opaque spectacle masking with alpha blending after visual inspection. Matching loading portraits are generated from the actual models, avoiding a return to cartoon artwork while loading.

- Full local Double Deck preview: opening deal, HIT, STAND, hole-card reveal and dealer draws completed. A second hand was interrupted by the Rules dialog, resumed, then split its aces into two hands; the controls and card destinations remained coherent. The local wallet remained 978.15 throughout these free previews.
- Browser landscape at 844×390 fits the entire table and controls. Temporary browser viewport overrides were reset afterward; this is not physical-phone evidence.
- A 12-second desktop-browser sample covering hit delivery and idle secondary motion measured 1,439 browser animation frames, p95 8.5 ms, maximum 14.3 ms, zero frames over 34 ms, zero long tasks, and maximum measured event duration 24 ms. This measures browser scheduling, not a guarantee of renderer FPS on phones. The initial opening sample measured a 56 ms maximum event duration and zero long tasks. Supported PCF shadows replaced a deprecated shadow-map alias identified during console inspection.
- From `apps/mobile`, `node node_modules/@capacitor/cli/bin/capacitor copy` — Android, iOS and web copy passed after providing access to replace the existing generated directories. No native build/signing/device validation is claimed.
- Final focused asset/motion run: `node node_modules/vitest/vitest.mjs run tests/unit/dealer-rig.test.ts tests/unit/blackjack-dealing.test.ts` — **14 passed**.

Publication verification is pending. Evidence files are kept in ignored `reports/screenshots/v41/`.

## Limits and rollback

These are improved real-time 3D game characters, not motion-captured actors or cinematic/filmed humans. No claim of ultra-photorealistic rendering or zero lag is made. Physical Android/iPhone testing remains deferred under the owner's earlier instruction. Models remain larger than V40 because of the richer geometry/textures; they load only when entering their table, are cached immutably, and have compact matching fallbacks.

No database migration, operator deployment, odds change, balance change or hosted credit-staked action is required. Revert this presentation revision or redeploy V40 `dpl_AsFUMxN5jt3rrBFqXqWxAABcshGm` to roll back. Accepted rounds and ledger history need no rollback.
