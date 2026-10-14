# V40 — jointed blackjack dealer motion

V39 bent a single raster image. Its arm could not bend at the elbow or grip a card, and the separately timed card path appeared detached. V40 removes that deformation renderer and uses actual skinned 3D body, arm, wrist and finger joints, with inverse kinematics and a stable elbow bend. The hand reaches the deck, closes, carries a card, releases it and returns to the same rest position. A shared start time ties the card flight to the hand. Head/upper-body follow and contact shadows support the motion. The hole-card turn now finishes within its actual reveal window; the previous 350 ms turn was interrupted after 240 ms.

Royal uses a brown-haired woman with a black waistcoat; Double Deck uses a dark-haired bearded man with a burgundy waistcoat; European uses a woman with dark hair buns and a navy waistcoat. These are stylized, jointed game characters, not filmed dealers or photorealistic human animation. All accepted cards, stake/award timing, game mathematics and free-preview restrictions are unchanged.

## Implementation and provenance

- `BlackjackDealer.vue`, `dealer-rig.ts`, `dealer-motion.ts`, `BlackjackGame.vue`, `blackjack-dealing.ts`, `blackjack-v37.css`: skeletal renderer, choreography, lifecycle and card integration. Three.js 0.186.1 is loaded only when entering blackjack. Vue/Pixi game implementations remain in place. Strict CSP is retained.
- `public/art/dealers`, `dealer-models.json`: two licensed base rigs and four hair components. They support three distinct table characters. Individual files are 128–1,735 KiB with content-hashed filenames and immutable cache headers. Previous small fallback portraits remain available.
- Source: [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html), free Standard archive from the creator's itch.io page. CC0 license included in `public/art/dealers/LICENSE.txt`; SHA-256, source names and modifications in `reports/dealer-models-v40.json` and the updated asset manifest. No scripts or executables from the asset archive were run; no paid assets were purchased.
- `scripts/prepare-dealer-models.mjs`: reproducible asset packaging from the locally downloaded standard archive; texture/buffer delivery copies, original uniforms and motion code. No source account/provider credentials.
- `tools/dealer-check.*`, `tools/DealerCheck.vue`: local, unstaked motion fixture for inspecting pickup/carry/release/return frames for all three dealers. Excluded from the Vite/Vercel output.
- `tests/unit/dealer-rig.test.ts`: arm-length/reach constraints, continuous wrist/grip, return-to-rest, separate hole-card reach, model integrity and finger skeletons. Removed the superseded image-warp tests while retaining the 30-thumbnail delivery budget tests.

## Validation

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — **36 files, 250 tests passed**. The initial sandbox-only focused run failed in its temporary transform cache; the same focused run outside that cache passed 13 tests. The full run above passed.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed; final entry `index-DHgK1SuT.js`, CSS `index-On4dLmQc.css`. Dealer-only lazy chunk is 625 KB / 159 KB gzip. Vite reports its normal >500 KB chunk warning; it is not downloaded for the lobby/other game types.
- `node scripts/vercel-build.mjs` and `node --test tests/deployment/vercel.test.mjs` — **4 deployment checks passed**, including strict API separation and model cache headers.
- `node scripts/asset-manifest.mjs` — 167 original/licensed assets recorded.
- From `apps/mobile`, `node node_modules/@capacitor/cli/bin/capacitor copy` — Android, iOS and web copy passed. This is not native compilation or device certification.
- Local browser: inspected the three characters, wrist orientation, uniform edges and pickup/carry/release poses. An actual Double Deck preview completed its opening/settlement with no console warning/error and unchanged 978.15 test balance. A 12-second desktop-browser sample spanning a deal measured 1,440 browser frames, p95 8.5 ms, maximum 9.1 ms, zero frames >34 ms and zero long tasks. The 3D renderer itself is capped at 60 FPS and stops when idle. These figures do not certify phones or guarantee no lag.
- At 844×390 browser viewport, completed a free-preview split, stand, hit, Rules interruption and final settlement. The controls fit, delivery completed when interrupted by Rules, and the test balance stayed unchanged. This is responsive browser evidence, not a physical phone test.
- The first live V40 check exposed blocked embedded textures: Three's image-bitmap loader fetched blob URLs under `connect-src`. The corrected loader decodes through `TextureLoader` and the existing `img-src` policy; CSP was not relaxed. Missing textures now reject the model and select the portrait fallback. The local fixture mirrors the strict deployed CSP. Typecheck, focused lint, 13 focused tests, player/Vercel builds and 4 deployment tests passed again after this correction.
- `node .local/verify-v40-live.mjs` — **63 live route, cache, asset hash and format checks passed** against the final deployment. The 30 optimized lobby thumbnails remain unchanged.
- Final public browser check: entry `index-DHgK1SuT.js`, one dealer canvas and `data-renderer="jointed-3d"`; textured face/hands confirmed. Completed a Double Deck free-preview opening deal and stand with dealer hole-card reveal and additional draws. The hand settled, DEAL became available again, and the 1,598.05 balance stayed unchanged. No new console warnings/errors after the corrected deployment. Screenshot: `reports/screenshots/v40/live-double.png`.

Screenshots and sample measurements are in the ignored local `reports/screenshots/v40/` directory. Physical Android/iPhone checks remain deferred under the owner's existing instruction. Browser rendering can fall back to the existing still portrait if WebGL/model loading fails; in that case card results still complete safely.

## Publication and rollback

Published to [the existing Vercel player link](https://new-game-test-topaz.vercel.app/). Source commits: `1b92825` (jointed dealers) and `4cbc521` (CSP-compatible texture decoding). Final READY deployment: `dpl_AsFUMxN5jt3rrBFqXqWxAABcshGm`, deployment URL `https://new-game-test-m3asensrd-tonyk006789-7532.vercel.app`. The first V40 deployment `dpl_95Vu7xxt5D8Fuqimn6JWTejGVCsg` was superseded after the live texture issue was caught.

No operator deployment or hosted credit-staked play was performed. No database migration. Roll back by redeploying the previous V39 player deployment `dpl_8bVFxkE975xCoVmcvTyyv1DbxSCB`, or reverting V40 and rebuilding; accounting and saved rounds require no rollback.
