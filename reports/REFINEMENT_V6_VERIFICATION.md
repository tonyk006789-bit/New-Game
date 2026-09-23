# Painted arcade refinement — v6

The player build now renders the new art inside all eight working games. The reef has eight painted species and four detailed mechanical cannons; the slots and feature games use sixteen painted symbols, darker reel faces, engraved gold surrounds, lit paylines and a compact play deck. Keno retains interactive 80-number selection, a twenty-number reveal and saved results, with clearer buttons, lamps and stake controls.

## Access

Open http://127.0.0.1:5183/ and use **USE LOGIN**, then **SIGN IN**.

- Player: `stage.player`
- Password: stored privately in ignored `.local/staging/PLAYER_LOGIN.txt` on the configured development machine.

This is the existing explicitly funded test account. Configuring its sample password does not add or refill credits. Its login is returned only by the isolated staging environment when `STAGING_DEMO_PASSWORD` is configured; the development/production environment does not expose it. The password reset was performed through authenticated Main Admin with MFA; no authentication bypass or admin credential is included in the player bundle.

## Implementation and behavior

- `ArcadeSymbol.vue` clips the actual original raster atlas into individual symbols. `reef-textures.ts` applies a GPU chroma matte once to each creature/cannon crop and reuses twelve cached textures. Source images are preserved unchanged. No flat vector fallback is used for the fish scene.
- `FishScene.vue` rotates each player's cannon, applies recoil, moves a projectile along a ray, shows collision nets, hit displacement, particles and a captured-return label. The four seats show actual room members; empty seats contain unoccupied machines, not fake players.
- `reefFlight` in `packages/game-math/src/index.ts` traces a 780-unit/second projectile, with a 5-unit radius, at 120 geometric steps/second. Relative swept-circle intersections find the first moving target, including crossings between steps. Offscreen fish wraps do not create false collisions across the table. This is 2D collision physics, not a 3D rigid-body simulation.
- `apps/api/src/staging.ts` independently reconstructs the trajectory from the authenticated seat, room epoch, angle and firing time. It rejects wrong/expired/early impact claims or already captured targets before accepting a stake. A shot that misses is free. The existing independent 30% capture / 3× gross return experiment remains unchanged.
- A pending shot that has not reached the server is cancelled on backgrounding. Already accepted results settle atomically on the server and are recovered through the existing durable request mechanism. Existing older accepted fish receipts remain replayable.
- `BetControls.vue` places 0.25/0.50/0.75 stakes, gross win and net change beside the game controls. It prevents stake changes during an active presentation and conceals the next award until the presentation ends. The top staging banner, win-rate panel, rendering labels and FPS/density controls are removed from play. Paytables and measured statistics are in Game Information and History. Pending-round recovery stays visible when needed.

## Reference research

The supplied screenshots informed dense symbol faces, machine surrounds, bottom control decks, visible turrets, net bursts and differentiated aquatic targets. The public [Stake 4 Supershiny Diamonds page](https://stake.us/casino/games/playson-4-supershiny-diamonds-hold-and-win) identifies a gem/fruit slot with feature spins; this informed jewel clarity and cabinet presentation, not its advertised mathematics. The previously inspected [JUWA lobby](https://w.juwa2.com/game/home) informed the compact arcade collection; its web page could not be fetched by the search tool on this pass. The official [JDB Shade Dragons Fishing page](https://www.jdbgaming.com/en/games/fish-shooting/shade-dragons-fishing) describes special cannons and an underwater dragon-palace setting, informing the richer turret treatment and layered reef. No provider credentials, code, logos, art or payout tables were imported.

## Assets and changed files

Built-in ImageGen produced `public/art/reef-creatures-v6.png`, `reef-cannons-v6.png` and `casino-symbols-v6.png`. Exact prompts and generation mode are in [art-prompts-v6.json](art-prompts-v6.json); hashes/provenance are in [asset-manifest.json](asset-manifest.json). The original v5 seabed remains in use. The creature/cannon atlases use an intentional green matte removed by the renderer; the symbol atlas has alpha. All three are actually used in game rendering.

Main changes: player `FishScene.vue`, `reef-textures.ts`, `ArcadeSymbol.vue`, `BetControls.vue`, `arcade-v6.css`, `App.vue`, `LoginScreen.vue`, `StagingPanel.vue`, `CabinetGame.vue`, `FeatureGame.vue`, `GamePreview.vue`, `ReelStage.vue`, `api.ts`, `staging-state.ts`, `main.ts`; API `staging.ts`; shared `game-math/src/index.ts`; `configure-sample-login.mjs`; asset-manifest script; physics/database/browser tests; staging Playwright output directory; `.gitignore`; owner/access documentation.

## Verification

- `pnpm lint` and `pnpm typecheck`: passed.
- `pnpm test`: 50 reference, 61 unit and 16 HTTP integration tests passed. Reference math examples remain test illustrations, not production accounting evidence.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs`: 8 tests passed, including forged/stale/future trajectories, legacy receipt replay, exact evaluated awards, idempotency, branch/origin/role gates, immutable postings and reserved-credit protection.
- `pnpm exec playwright test --config playwright.staging.config.ts`: all 9 game/recovery scenarios passed across desktop 1440×1000, phone 390×844 and landscape 1024×461.
- `pnpm exec playwright test tests/staging-e2e/login.spec.ts --config playwright.staging.config.ts`: 3 sample-login tests passed. No test rounds were played with the owner's account.
- `pnpm test:e2e`: initially 44/48 passed. Three landscape feature-layout assertions exposed a board/control overlap, now fixed. One admin test's trace cleanup collided with the concurrent staging test output directory; those output directories are now separate. `pnpm exec playwright test tests/e2e/features.spec.ts tests/e2e/accounts.spec.ts --project=landscape` then passed all 7 targeted checks, covering every failed scenario. All 48 distinct regular-browser scenarios have passing evidence.
- `pnpm exec playwright test tests/staging-e2e/staging.spec.ts --config=playwright.staging.config.ts --project=landscape`: all 3 passed after the final spacing fix; game-board/control separation is now asserted in staging tests too.
- `pnpm build`: player, separate admin and server passed. `pnpm mobile:sync` rebuilt the final player without unresolved asset warnings and synchronized Android/iOS source projects.

Earlier exploratory checks found and fixed atlas overflow, phone keno stake overflow, landscape Quick Pick overlap landscape feature-board overlap and the Temple Lights reel/control boundary. 39 final screenshots are in `screenshots-v6/`; 9 game recordings are in `recordings-v6/`. [Reef](screenshots-v6/reef-landscape.png), [Neon Sevens](screenshots-v6/neon-sevens-desktop.png), [Aurora Vault](screenshots-v6/aurora-vault-landscape.png), [phone keno](screenshots-v6/orchard-numbers-phone.png), and [sample login](screenshots-v6/login-desktop.png).

## Migrations, rollback and remaining work

No database migration or math-profile change is required. Historical rounds, balances and the one-time funding receipt are retained. Roll back presentation by restoring the listed source files and rebuilding both the player and API; retain database history. Remove `STAGING_DEMO_PASSWORD` from the ignored staging environment to hide the sample credential display, and use authenticated Main Admin to change the sample password if desired. Never overwrite balances or drop historical records as part of rollback.

Android compilation still requires Java/JAVA_HOME; iOS compilation requires macOS/Xcode. No signed APK/IPA or physical Android/iPhone performance acceptance is claimed. Native secure credentials/TLS, production room transport, audio and production approvals remain unfinished. Browser tests use Chrome/software WebGL and do not certify native performance.

Final ledger reconciliation: staging has 23 wallets, 190 transactions, zero mismatched wallet projections, zero unbalanced transactions and zero production profiles. `stage.player` remains at **1,000.00 available credits**, reserved 0, wallet version 1, exactly one manual funding transaction and zero owner test rounds. Development has five wallets with a total of zero credits and no reconciliation failures. All QA residual credits were retired and QA accounts disabled by the fixture teardown.

Final native command evidence: `pnpm build:android` exited 9009 because JAVA_HOME/Java is unavailable; `pnpm build:ios` exited 1 with the explicit macOS/Xcode requirement. These are blocked, not passed. `pnpm mobile:sync` passed for both source projects. The final API was restarted through its verified loopback process, and the running login page visibly shows the sample player/password and USE LOGIN button.
