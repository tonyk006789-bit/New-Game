# V25 — dimensional UI, personal win totals and expanded fish worlds

The owner requested removal of generated win examples, a fluid 3D-looking UI, wager-related Minor/Major/Jackpot amounts, more creatures and harder fish captures. The capture-rule decision remains pending; this release does not silently change the approved solo assists.

## Implemented

- Removed the demo ticker, invented amounts, sample celebrations and generated-example captions. `WinShowcase.vue` now reads `/v1/staging/wins`, showing this signed-in player's total settled wagers and actual awarded returns, grouped by the existing below-5×, 5×–below-20× and 20×+ presentation tiers. Clicking a tier explains it; Play History opens committed receipts. Values include returned stakes, exclude wheel/manual credits, and never represent a progressive pool. Empty accounts show zero after a successful response; failures show an error instead of fabricated values.
- Added an authenticated, PLAYER-only, parameterized aggregate in `apps/api/src/staging.ts`, wired through both local and restricted hosted handlers. Account identity comes from the session, with no caller-selected account. Decimal strings/bigints avoid floating-point totals. It is read-only and does not post to any wallet.
- Added perspective cabinet tilt, spring-smoothed pointer response, raised gold/emerald frames, reflected glass, sculpted meter emblems, inset displays, button depression, floor-machine perspective and scene entrances. `depth-motion.ts` runs one animation loop only while a card is moving, excludes touch scrolling, and resets on reduced motion/background/unmount. This is CSS 3D depth and the existing Pixi mesh presentation, not a replacement full 3D game engine.
- Added eight original transparent creatures: Mandarin fish, Ribbon eel, Vampire squid, Copper horseshoe crab, Jade axolotl, Golden arowana, Sea angel and Ice beluga. Two join each world, with radii from 9 to 59 and the existing smaller fish/larger bosses preserved. Raised density from roughly 16 to roughly 22 active targets, bounded to 24 with one boss, with arrivals every 1.5 seconds. Added drifting water light, bubbles and layered creature shadows. No bot award or firing-rule change.
- Shared client/server trajectories advance to `reef-ballistics-v6`. Old accepted receipts replay before version validation; a stale client cannot start a new shot with old trajectory proof. All existing tier rewards and the three paid-hit solo assists remain unchanged.

Main changed areas: `apps/player/src/arcade-v25.css`, `depth-motion.ts`, `App.vue`, `LoginScreen.vue`, `GameShelf.vue`, `FishingLobby.vue`, `WinShowcase.vue`, `GameRules.vue`, `FishScene.vue`, `fish-worlds.ts`, `reef-textures.ts`, `win-presentation.ts`, `main.ts`; API route/controller/aggregate; shared game-math creature schedule; database and unit tests. Original image asset: `apps/player/public/art/reef-expansion-v25.png`. ImageGen prompt/provenance: `reports/art-prompts-v25.json`; hashes in `reports/asset-manifest.json`.

## Decisions and research

The owner was asked whether amounts should represent actual awards, potential stake-based awards or new shared pools. With no answer yet, the stated implementation assumption is personal actual awarded totals plus total wagered. No new pool or payout rules are inferred. A separate pending question proposes removing three free solo attempts and returning to one paid-hit attempt at the already approved 30%/20%/10%/4% tier chances. It is not implemented without the owner's answer.

[MDN transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style) informed preserve-3D/perspective and flattening constraints. [Pixi mesh guidance](https://pixijs.com/8.x/guides/components/scene-objects/mesh) informed retaining the existing animated MeshPlane creatures. Previous supplied references informed the casino treatment; there is no claim of a newly inspected authenticated JUWA session or complete provider clone.

## Validation

Bundled Node 24 and pnpm on Windows:

- `pnpm lint` — passed.
- `pnpm typecheck` — passed, including final component/API changes.
- `node node_modules/vitest/vitest.mjs run tests/unit --maxWorkers=2` — 151 tests passed across 24 files. A subsequent added four-world coverage test passed with `node node_modules/vitest/vitest.mjs run tests/unit/reef-density.test.ts --maxWorkers=2` (5/5); 152 unique unit tests now covered.
- `pnpm build:server` — passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` — 19 passed in an isolated local PostgreSQL schema. Covers actual accounting, concurrent/idempotent impacts, old receipts, all tiers, solo assists, and personal aggregate identity/scope/zero history/exclusion of grants and wheel credits. Read-only totals left the wallet unchanged. The expected dedicated-database gate error was exercised. A pg concurrent-query deprecation warning remains in the existing test path.
- `pnpm build:vercel` — passed; player entry `index-D7tIWimR.js` plus restricted Node API.
- `node --test tests/deployment/vercel.test.mjs` — 4 passed against emitted output. Initial sandbox subprocess attempts returned EPERM; supported elevated reruns passed.
- `node scripts/asset-manifest.mjs` — 70 assets recorded.
- `git diff --check` — passed, apart from informational Windows line-ending notices.

Browser verification: local lobby renders recorded 272.75 wagered and 154.75/92.50/15.00 tier returns for the test account; credit balance stayed 989.65. The Sunken Dynasty scene showed its new axolotl/arowana with transparent edges, three labeled independent bots, four cannons and varied sizes. No paid shot or wheel spin was made. Interactive tier details opened correctly. A hovered cabinet produced a CSS matrix3d transform; Reduced Motion removed all 11 depth transforms and the lobby entrance animation, and was restored afterward. At a 390×844 browser viewport the document width was 375 with no horizontal overflow and meter targets approximately 110×118. Temporary viewport overrides were reset. Browser screenshot scaling is imperfect at the emulated mobile viewport, so DOM measurements accompany it; no physical-device performance claim is made.

Evidence: `reports/screenshots/v25/local-lobby.png`, `sunken-dynasty.png`, `mobile-layout.png`. During live source editing Vite temporarily reported a removed demo export; final typecheck/build and a fresh published page are the acceptance checks, not that transient HMR state.

## Data and rollback

No migration, account creation, credit grant, reset or operator change. No new paid service. Publication uses the existing owner-authorized player Vercel project. Rollback must redeploy the matching V24 player and API together because trajectories changed; preserve all wallets, ledger rows, rooms and accepted receipts. Native Android/iPhone verification remains deferred. Harder catches and any shared jackpot-pool design remain pending explicit rules approval.

## Published and verified

- Source commit `fa6c5b7` pushed to `tonyk006789-bit/New-Game` main.
- Deployment `dpl_9877GXHTSwisnQZyE8mEff9VkAL2` is READY at https://new-game-test-topaz.vercel.app/. Public entry matches `index-D7tIWimR.js`.
- Public health/environment/catalog/art/audio checks passed. Twenty games remain listed. Unauthenticated `/v1/staging/wins` and blackjack return 401; operator account routes on the player domain return 404. The separate operator is healthy with unchanged `index-CT1MaUjW.js`.
- The existing signed-in player session restored on reload. Live UI showed total wagered 2,346.00 and Minor/Major/Jackpot actual returns 590.50 / 1,488.50 / 345.00. Neither Generated examples nor DEMO appears. Browser console reported no errors. No login was submitted, no hosted round was placed, and the existing session was left open. Balance displayed 1,578.05.
- Live evidence: `reports/screenshots/v25/live-lobby.png`, `live-ui-checks.json`, `live-route-checks.json`; screenshots are local ignored artifacts. The live viewport also had no horizontal overflow (615 wide, document 600).
- Vercel used the already established process-local official web API gateway because direct `api.vercel.com` connectivity was unavailable previously. TLS remained enabled; no OS networking or security settings were changed.
