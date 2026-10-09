# V35 — neon lounge, responsive workflow and action sound design

## Delivered changes

- `experience-v35.css` and `App.vue`: compact neon navigation, readable balances and actual win totals, quieter chrome, full-art game cards, mobile layout, visible focus and preserved catalog search/page/scroll on return. History loads when opened, and wallet polling cannot overlap itself.
- `ArcadeLobby.vue` and `GameShelf.vue`: floor animation runs only while walking; avatar movement uses compositor translation. Shelf paging is preserved by the parent, with distinct paging and favorite cues. Cabinet artwork now fills the floor screens instead of collapsing to zero height; the phone floor accepts vertical and horizontal swipes, and header controls have 44-pixel targets.
- `ReelStage.vue`, `WinBurst.vue`, `WinMeter.vue`, `WinShowcase.vue`: shorter filler strips preserve existing reel braking/result timing; remove expensive rolling symbol filters, hide completed win particles and skip unchanged total-count animations. Win feedback remains tied to committed awards.
- `FishScene.vue` and `reef-textures.ts`: shared effect geometry and transparent atlas sources, no unnecessary Pixi event traversal, 60 FPS rendering cap and a loading state. Cleanup handles sparse creature arrays, destroys scene-owned render textures, and preserves cached atlas sources on re-entry. A cleanup exception found during verification was fixed and the enter/leave/re-enter path rechecked.
- `sound-design.ts`, `audio.ts`, `BlackjackGame.vue`, `FeatureGame.vue`, `GamePreview.vue`: original synthesized navigation, paging, entry/back, favorite, shot/impact, reel, keno, card, feature and family-specific win cues. Rapid events are coalesced and effects are limited to 32 simultaneous voices. Music/sound switches remain separate; muting/backgrounding stops effects. No third-party recordings were added.
- `main.ts` imports the visual layer. A development-only `?profile=1` diagnostic supports repeatable local measurements and is absent from the production bundle. Asset manifest and regression tests were updated.

No server, payout, odds, stake, ledger, credential, operator hierarchy or account changes. All 30 games and existing music collections remain. The two unapproved blackjack variants remain free previews. No database migration or hosted credit operation is required.

## Verification

Commands used the pinned Node 24.19 runtime. Direct Node entry points were used after the pnpm wrapper could not locate its executable; child-process commands needed the normal escalated execution context on Windows.

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 225 tests across 32 files passed. New checks cover distinct bounded sound plans, rapid-fire voice limits, mute cleanup and sparse/duplicate fish texture ownership across repeated cleanup.
- `node scripts/asset-manifest.mjs` — 122 original assets recorded.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` and `node scripts/vercel-build.mjs` — passed; final entry `index-CoEw7zkE.js`. Rebuilt after the final floor-art CSS correction and refreshed both mobile copies.
- `node --test tests/deployment/vercel.test.mjs math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` — 55 passed. Historical illustrative reference mathematics is not approval of production odds or evidence of production accounting.
- `rg -l 'Development performance probe|Measure 12 seconds|installPerformanceProbe|performance-probe' apps/player/dist` — no matches (expected exit 1).
- From `apps/mobile`, `node node_modules/@capacitor/cli/bin/capacitor copy` — Android/iOS/web assets copied successfully. Native compilation, signing and physical-device performance are not claimed.
- Browser at 1280×900 and 390×844: local fixture sign-in, responsive lobby, page-two entry/back restoring page and focused game, phone-width artwork and pagination, fish enter/leave/re-enter with intact textures and no captured console errors. One local Disco Diamonds round and one local Meteor Keno draw completed with immediate stake display and restored controls. Double Deck free preview dealt, stood, revealed dealer and returned to Deal. No hosted wagers were made.

## Measurement scope

Twelve-second desktop development samples, warm artwork, music muted, 1280×900 viewport. Same category sequence: Slots → Keno → Fish → All.

| Metric | Before | After |
| --- | ---: | ---: |
| Maximum observed event duration | 240 ms | 64 ms |
| 95th-percentile rAF interval | 20.2 ms | 8.6 ms |
| rAF intervals over 34 ms | 7 | 3 |
| Maximum rAF interval | 115.7 ms | 107.6 ms |

Active fish-table sample: rAF p95 8.5 ms, maximum 10.7 ms, no intervals over 34 ms. This is browser callback cadence, **not measured fish FPS** (fish rendering is capped at 60). These are small local diagnostic samples, not formal INP certification or a zero-lag guarantee. Occasional frame spikes remain; device, browser, network and first-load costs vary. The existing large artwork and legacy CSS still contribute to initial loading.

Local evidence: `reports/screenshots/v35/baseline-categories.txt`, `updated-categories.txt`, `fish-frames.txt`, `fish-reentry.png`, `mobile-lobby.png`, `mobile-floor.png`, `neon-lobby.png`. Screenshots are ignored local artifacts. Phone header controls measured 44×44 pixels; page width stayed within the viewport. Walking-floor art measured about 91 pixels inside its 95-pixel screen, replacing the collapsed layout. No physical Android/iPhone smoke test was available.

## Sources and design rationale

The implementation follows [PixiJS performance guidance](https://pixijs.com/8.x/guides/concepts/performance-tips) on shared graphics, reduced filtering and noninteractive children, and [web.dev animation guidance](https://web.dev/articles/animations-guide) on transforms/opacity and selective compositor hints. These are implementation references, not a claim of access to new proprietary JUWA features.

## Migration / rollback

None. Redeploy the previous player deployment or revert this presentation commit and rebuild/copy the web assets. Keep all existing database history, policy revisions and operator deployment. Existing player deployment before this release: `dpl_FvBtJUxcHbiir2thtH135GfiZNic` (`index-BqVvXRQJ.js`).

## Publication

- Source commit `c681665` pushed to GitHub main.
- Player deployment `dpl_6TAmafB3TZCR8R54nQEqQauHFsJ8` is READY and aliased to https://new-game-test-topaz.vercel.app/.
- `node .local/verify-v35-live.mjs` — 18 read-only route/asset checks passed: exact new player entry, unchanged operator entry, health, protected endpoint boundaries, all 30 catalog identities and approved profiles. Hosted paying-round setting remains revision 1 at 20%.
- Browser loaded the published login screen with no captured console errors. Screenshot: `reports/screenshots/v35/live-login.png`. No hosted wagers, wallet actions or account changes were submitted. The logged-in gameplay screenshots and interaction checks above used the local fixture.
- Final rebuilt deployment checks: four passed. Strengthened the rapid-audio test to explicitly enable effects and assert exactly 32 voices under 100 rapid calls; it passed. The development probe was again confirmed absent from the final release assets.
- Operator deployment unchanged. Viewport override reset; local verification tab closed. Native assets copied, but native builds and device tests remain unavailable.
