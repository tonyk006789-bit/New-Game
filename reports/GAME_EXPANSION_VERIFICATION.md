# Five-game catalog and motion verification

18 September 2026, local Windows development workspace. This is the acceptance record for the owner's request to inspect stake.us, add games and improve generic UI/motion. It supplements the earlier account/ledger report; it is not native or production release certification.

## Delivered changes

- `packages/contracts/src/index.ts`: five-entry catalog; Aurora Vault and Ember Relics IDs and descriptions.
- `packages/game-math/src/index.ts`: versioned nonpayable vault/cascade sequence generation, cluster detection, gravity, deterministic guest storyboards, and closed math gates for both additions.
- `apps/api/src/practice.ts`: authenticated server-generated sequences, existing durable actor/request-key persistence, rejection of inappropriate picks, and no ledger changes.
- `apps/player/src/FeatureGame.vue`: two original playable practice games, progression counters, fast playback, skip, history recovery, explicit preparing state, interruption handling and reduced motion.
- `apps/player/src/ReelStage.vue`, `GamePreview.vue`: physical reel-strip translation/deceleration, staggered stops, matching final grid, keno draw balls and match presentation, no stale asynchronous rendering after unmount.
- `apps/player/src/FishScene.vue`: cannon aiming/recoil, projectiles, net effects, tail motion, opposing paths and ray silhouettes. Server capture authority is unchanged; effects do not award credits.
- `apps/player/src/{App,LoginScreen,ArcadeSymbol}.vue`, `main.ts`, `games-v3.css`: expanded catalog, original symbols, new scenes, responsive controls, landscape containment and scene pause behavior.
- Two new project-bound images: `apps/player/public/art/aurora-vault.png` and `apps/player/public/art/ember-relics.png`. Generated with the **built-in image_gen tool**. Exact final prompts are in `art-prompts-v3.json`; hashes/provenance are in `asset-manifest.json`. No Stake or Playson assets were shipped.
- Tests: `tests/unit/practice.test.ts`, `tests/integration/api.test.ts`, `tests/db/backend.test.mjs`, `tests/e2e/{features,preview}.spec.ts`.
- Documentation: `docs/STAKE_REFERENCE_AND_GAME_EXPANSION.md`, `docs/OWNER_UPDATES.md`, `docs/LOCAL_MVP.md`, README and this report. `scripts/asset-manifest.mjs` now records the correct prompt provenance for the new art.

## Commands and results

Bundled Node 24.19.0 and pnpm 11.19.0 were used. The Windows pnpm executable was `C:/Users/kcdre/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm.cmd`. Vite/test subprocess execution required an approved sandbox escalation after the initial `spawn EPERM`; this environment failure was not counted as a pass.

| Exact workspace command | Result |
|---|---|
| `pnpm lint` | Passed on final sources |
| `pnpm typecheck` | Passed on final sources |
| `pnpm test` | 50 reference, 39 unit, 13 HTTP integration tests passed |
| `pnpm test:ledger` | 15 reported tests passed (14 scenarios plus parent), actual PostgreSQL and HTTP API |
| `pnpm test:e2e` | All 21 existing regression cases passed across three layouts; the 12 new cases initially could not launch recording because FFmpeg was missing |
| `pnpm exec playwright install ffmpeg` | Installed Playwright's encoder and Winldd from its official CDN |
| `pnpm exec playwright test tests/e2e/features.spec.ts` | Final full feature run: **12 passed in 2.2 minutes** |
| `pnpm exec playwright test tests/e2e/features.spec.ts --project=landscape` | After the final landscape-only CSS correction: **4 passed in 28.4 seconds** |
| `pnpm build` | Player, admin and server builds passed |
| `pnpm mobile:sync` | Player build and Android/iOS asset synchronization passed; rerun after final UI corrections |
| `pnpm assets:manifest` | 11 original assets recorded |
| `node --env-file=.local/runtime.env scripts/reconcile.mjs` | 5 wallets; settled total 0; no projection mismatches or unbalanced transactions; 0 approved math profiles |

There are **33 distinct passing browser scenarios** across the regression and feature runs, not a claim that the initial combined run passed. The final landscape rerun covers the only later presentation change. Android/iOS compilation was not rerun: the previously recorded Java/SDK and macOS/Xcode blockers remain. Asset synchronization is not an APK/IPA build.

Unit coverage exercises 200 seeds for each new game, lock preservation, pulse resets/termination, no diagonal/wrapped clusters, refill survivor ordering, cleared totals and the six-cascade cap. Database tests submit five simultaneous identical requests for each game, verify one persisted response, history ownership, changed-key conflict, CSRF/role rejection, closed stakes and byte-equivalent wallet snapshots.

Browser coverage verifies expansion/filtering, actual reel transforms, interruption/skip, reduced motion, both saved final boards after reload, no credit change, renderer disposal, and layout containment. A random zero-cascade round exposed a test that raced the short-lived skip control; the test now waits for completion. Recovery testing also caught a stale completion phase during a new request, fixed by explicitly entering `preparing`. Visual review caught the cascade grid overflowing in landscape, fixed with a bounded grid row and flex sizing; a board/control bounds assertion now guards that layout.

## Visual evidence

24 PNG screenshots are in `screenshots-v3/`; 12 browser recordings are in `recordings-v3/`. Desktop is 1440×1000, phone emulation 390×844, landscape 1024×461. These are browser measurements, not physical-device performance evidence.

- [Expanded catalog](screenshots-v3/catalog-desktop.png)
- [Aurora Vault, desktop](screenshots-v3/aurora-complete-desktop.png)
- [Aurora Vault, phone](screenshots-v3/aurora-complete-phone.png)
- [Ember Relics, landscape](screenshots-v3/ember-landscape.png)
- [Vault motion recording](recordings-v3/new-catalog-desktop.webm)
- [Cascade motion recording](recordings-v3/cascades-remove-clusters-desktop.webm)
- [Reels and fishing motion](recordings-v3/reels-physically-translate-and-settle-after-skip-desktop.webm)

Screenshots were visually inspected for desktop, portrait and landscape layouts. The final Ember landscape image shows all five rows above the controls.

## Migration, rollback and remaining work

No migration, grant, balance overwrite, provider integration or remote publication. Existing immutable practice JSON stores the new sequences with `practice-v1`. Keep saved history when reverting code; older clients may omit the new games but must not delete their results. The local API was restarted on its verified port 3000 to load the additions.

Credit-staked games remain disabled under the owner's undecided math instruction. No approved payout target or provider math was adopted. Native secure sign-in, production fish simulation/Colyseus, APK/IPA builds, physical-device checks and release hardening remain as described in `../docs/LOCAL_MVP.md`.
