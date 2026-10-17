# V44 — refined realistic blackjack dealers

## Outcome

Refine the three accepted blackjack characters rather than replacing their identities. Existing Microsoft Rocketbox MIT sources supply the additional detail. Skin and clothing now use artist-authored specular variation converted into bounded roughness, higher-resolution face normal maps, better-preserved texture detail, physical nonmetallic reflectivity and restrained cloth sheen. The source specular maps are not measured PBR scans; their conversion is an approximation, not a claim of cinematic photorealism.

Prefiltered room illumination provides broad surface reflections; balanced key/fill/rim light retains face shape. The lighting follows the official [RoomEnvironment](https://threejs.org/docs/pages/RoomEnvironment.html), [PMREMGenerator](https://threejs.org/docs/pages/PMREMGenerator.html) and [physical-material](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) capabilities. This adds no external HDR download or full-screen postprocessing. Small coordinated eye glances hold between movements, look toward carried cards and accompany the existing blinks and restrained facial expression.

The original geometry/skeleton, V42 finger articulation, opposed card contact and card flight remain. All thirty games, blackjack rules, wallets, credentials and backend remain unchanged. No database migration or operator release.

## Changed files

- `dealer-rig.ts`: one-time room reflection map, balanced lighting, texture filtering, shader precompilation before revealing the dealer, disposal of environment resources and render-density budget (maximum 2.1 million backing pixels; device/display scale aware).
- `dealer-motion.ts`: deterministic paired eye movement and mild asymmetric smile variation independent of game outcomes.
- `scripts/prepare-realistic-dealers.mjs`, new `reports/dealer-models-v44.json`, three new GLBs, `dealer-models.json`: original MIT sources, source/output hashes, physical material metadata and validated nonconstant roughness maps. Models are 3.68 / 4.26 / 5.20 MiB and load only at their respective blackjack table. This is larger than V41; immutable caching and lazy loading remain.
- `dealer-hands.json`: new asset hashes; the six existing hand calibrations are otherwise unchanged.
- `scripts/prepare-dealer-posters.mjs`, `reports/dealer-posters-v44.json`, three new WebPs, `dealer-posters.json`: matching rendered loading portraits, approximately 37 / 36 / 65 KB.
- `apps/player/tools/DealerCheck.vue`: local-only face close-up, clock-driven expression recording and safe poster-export recovery; not included in the player build.
- `tests/unit/dealer-surfaces.test.ts`: source/output integrity, model budgets, unchanged bone transforms, physical material maps and coordinated bounded gaze. Existing finger-contact/dealing tests remain.
- Asset manifest script/report and owner update record the new provenance and scope.

## Acceptance evidence

- `node scripts/prepare-realistic-dealers.mjs` — three licensed models generated; decoded output maps checked for nonconstant roughness and zero metalness. An initial intermediate conversion exposed incorrect Sharp raw-buffer metadata; explicit dimensions/channels fixed it before release. Intermediate unused GLBs were removed.
- `node scripts/prepare-dealer-hands.mjs` — six calibrations rebound to new model hashes.
- `node scripts/prepare-dealer-posters.mjs` and `node scripts/asset-manifest.mjs` — matching portraits, 179 recorded original/licensed assets.
- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 265 tests / 38 files passed. Focused dealer run: 26 tests passed.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed; entry `index-UUl9TDbZ.js`, dealer chunk `dealer-rig-QWmiUUXK.js` (634.65 KB / 160.96 KB gzip). Existing optional renderer chunk-size advisory remains.
- `node scripts/vercel-build.mjs` and `node --test tests/deployment/vercel.test.mjs` — four deployment checks passed.
- From `apps/mobile`: `node node_modules/@capacitor/cli/bin/capacitor copy` — Android/iOS/web copies succeeded. This is not native compilation, signing or physical-phone testing.
- `git diff --check` — no whitespace errors.

Visual checks inspected all three faces, clothing, glasses, grip and release in the local fixture. Opposed pad error at the inspected carry pose remains approximately 0.7 mm. Local screenshots and the six-second `dealer-motion.webm` are in ignored `reports/screenshots/v44/`. During hot edits the dev page briefly logged a missing export before reload; the final build/typecheck passed. The desktop shader compiler also emitted a floating-point precision advisory while compiling the room environment; it did not prevent rendering. Physical-device performance remains unverified.

## Publication and rollback

Continue the existing authorized player Vercel project. Live identity and verification will be appended after publication. No hosted credit-staked action or account mutation is needed.

Rollback: restore V43 player deployment `dpl_2Jf9tnCoqh7YWaoVBXJT1HZMYBqv` or revert this presentation revision and rebuild. Existing hashed V41 models/posters remain available. No database or ledger rollback is required.
