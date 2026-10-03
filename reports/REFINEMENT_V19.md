# V19 — smoother game motion

## Changes

- Shared slot reels accelerate gently, cruise, brake over the second half of the timeline and finish with a small mechanical settle. Normal stops are staggered about 225 ms apart: roughly 2.50 seconds for three reels and 2.95 seconds for five, plus rendering overhead. Fast mode retains the same braking shape at 1.85× speed. Timing is independent of awards and does not invent near misses.
- Reel transforms use the current strip height, so a resize during a spin remains aligned. Moving strips use compositor transforms without the old animated whole-strip blur. Skip, pause, navigation and reduced motion still settle to the accepted grid.
- Ember Relics preserves individual surviving symbols across frames. Only cleared positions receive replacements; survivors fall their actual number of rows. Fall, highlight and dissolve have separate, coordinated phases, including fast mode.
- Aurora Vault has gentler crystal docking and staggered cell pulses. Keno balls roll into the result track with a paced reveal, slightly longer final three arrivals and a final reading pause. Speed cannot change halfway through a reveal.
- Both fish tables have damped visual cannon turns, eased recoil recovery and expanding impact nets. Shots still launch immediately on clicks at the authoritative aim angle. Coin paths use elapsed-time equations rather than frame-by-frame integration. Creature trajectories, firing cadence, capture chances and awards are unchanged.
- Existing win-count-before-balance behavior remains in place. No server, ledger, permissions, stake, paytable, hierarchy or hosted funding changes.

## Research used

These sources informed the presentation design; the selected durations are original implementation choices, not measured copies of provider gameplay.

- [Play’n GO: Grid Slots](https://www.playngo.com/series/grid-slots) describes disappearing winning clusters and symbols falling into their spaces. This informed survivor-preserving cascades.
- [GSAP easing documentation](https://gsap.com/docs/v3/Eases/) explains easing as control over animation speed and character. The implementation uses the existing Web Animations API and an integrated smooth acceleration/braking curve, without adding GSAP.
- [PixiJS ticker documentation](https://pixijs.com/8.x/guides/components/ticker) documents elapsed-time updates and ticker lifecycle. Cannon damping and effects remain in the existing Pixi loop.

## Acceptance

Pinned Windows Node 24 / pnpm commands:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm test:unit` | 111 passed, including seven new animation tests |
| `pnpm test:integration` | 20 passed |
| `pnpm test:reference` | 50 passed; reference math only |
| `pnpm build:vercel` | Passed; player and restricted API output |
| `pnpm test:vercel` | 4 passed |

Initial sandbox test attempts hit Windows subprocess `EPERM`; the same commands passed with approved subprocess access.

`apps/player/motion-check.html` is a separate local-development entry. Its eight browser scenarios test actual ReelStage animations: three/five reels, one-row fast, held columns, resize during braking, skip, reduced motion mid-spin and reduced motion initially. All produced the exact expected grid, aligned strips, no remaining strip animations and zero held-column movement. Observed elapsed times were 2,529 ms (three reels), 2,998 ms (five), 1,631 ms (fast five), and about 508 ms for interruption scheduled at 500 ms. The observed reel frame intervals at the 95th percentile were 8–9 ms in this desktop session; this is not a device performance guarantee. The harness and its Vue component are excluded from production output.

Unit checks cover continuous deceleration, exact endpoint alignment, 200 cascade sequences with survivor identity/order and original grids preserved, keno pacing independent of wins, and equivalent cannon damping at simulated 30/60/120 Hz.

Browser evidence is kept locally under ignored `reports/screenshots-v19/`, including `browser-motion-checks.json`. Guest UI checks completed Ruby Rush, Ember Relics (16 cleared across three cascades with surviving tile IDs retained), Aurora Vault (14/15 crystals) and Orchard Numbers (all 20 draws). Cascade and keno Show Result actions stopped immediately at their final grids/draws. Speed controls were disabled during active reveals. Abyss guest auto-fire/lock produced 95 preview shots with moving cannons, projectiles and impact nets, then auto-fire was stopped and the rules dialog paused the scene. No browser console warnings or errors were returned for those game checks. These guest previews did not write round receipts or change hosted balances.

## Migration and rollback

Published source `09368e4ab00cc8bd5a75bfa53a56b4c4821aa1d7` to GitHub main and the Vercel player project:

- Deployment `dpl_5cPaempxazS6uevBaJ4jYJBX4Nmw`, READY.
- Public alias: https://new-game-test-topaz.vercel.app/.
- Immutable deployment: https://new-game-test-d3t3h5l73-tonyk006789-7532.vercel.app/.
- Public HTML and browser DOM reference the expected `index-CTKRez7O.js` and `index-BYieGAS-.css` build. The environment endpoint remained reachable in the existing test configuration. The development harness is absent from the public entry bundle.
- Existing player session restored after reload, and Ruby Rush loaded its saved round and available controls. No hosted spin, daily claim, shot or adjustment was submitted. The displayed account balance stayed 1,427.05 during these read-only checks. Screenshot: `reports/screenshots-v19/ruby-live.png`.
- The existing browser log contained historical Pixi texture-destruction warnings from the older `Geometry-CNKh-uDs.js` build; no error from the new release was observed. The operator deployment was not changed.

No database migration or data write is required. Revert the V19 player components, motion helper and stylesheet, rebuild and redeploy the player project to roll back. Keep the V18 operator hierarchy fixes. No native build or physical-device test is claimed; Android/iPhone hardware is still unavailable.
