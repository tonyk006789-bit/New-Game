# V49 — blackjack dealer, table and card presentation

Owner request: further refine blackjack character realism, make the table resemble a real table, and improve card distribution. Applies to Royal, Double Deck and European Blackjack. This is presentation work; the three existing licensed identities, approved rules, preview restrictions and server results remain intact.

## Implementation

- `dealer-rig.ts`: closer framing, a broad warm area light, quieter rim light and adjusted skin specular/normal response. Existing detailed Rocketbox models, textures, skeletons and V42 finger calibration are retained. The table now shares the dealer's lighting and shadows. Area-light lookup textures initialize once across game switches; model loads remain lazy and the renderer keeps its existing resolution/frame-rate budget.
- `blackjack-table.ts`: procedural D-shaped felt table, padded leather rail, lacquered wood underside, metal piping and striped chip stacks in a tray. Each game has its own palette. Small repeatable material textures are generated once per table; no new network art or copied provider assets.
- `blackjack-dealing.ts`, `dealer-rig.ts`: extend release-to-land travel from 240 to 340 ms while keeping the 1,120 ms deal cadence. Estimate release position at the actual animation clock, add the moving card's contact shadow, and rotate the hole card in 3D. Preserve the V48 same-paint handoff to the accessible DOM card and interruption/fallback behavior.
- `blackjack-cards.ts`, `PlayingCardFace.vue`, `BlackjackGame.vue`: shared rank/suit/pip definitions for held and settled cards, mirrored indices and pip layouts, simple original court artwork and readable accessibility labels. Correct card counts and outcomes are untouched.
- `blackjack-v49.css`, `main.ts`: table composition, compact total badges, card faces and calmer surrounding room. The WebGL scene covers the former flat table edge/chip decoration; existing artwork remains available as a fallback.
- `tools/DealerCheck.vue`: development fixture includes deal/turn modes and release/landing checkpoints, with local motion recording. Not included in the production entry.
- `tests/unit/blackjack-cards.test.ts`: pip-count, placement and court-label coverage.

## Reference and technical basis

Reviewed the official [Three.js physical-material documentation](https://threejs.org/docs/pages/MeshPhysicalMaterial.html) and [RectAreaLight documentation](https://threejs.org/docs/pages/RectAreaLight.html). Area lights provide broad PBR illumination but do not cast shadows; the directional key retains shadow responsibility. Existing V48 public blackjack reference research remains applicable. This is real-time skeletal presentation, not filmed dealers, motion capture or a full physical hand/card simulation.

## Validation

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed, including a final pass after lighting cleanup.
- `node node_modules/typescript/bin/tsc -p tsconfig.server.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed; changed files rechecked after final cleanup.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 288 tests passed across 44 files. Includes existing dealing, hand contact, motion continuity and accepted-outcome tests plus two card-art tests.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed. Final lazy dealer chunk 917.40 kB / 276.66 kB gzip; existing Vite 500 kB advisory remains. No model-size increase.
- `node scripts/vercel-build.mjs` and `node --test tests/deployment/vercel.test.mjs` — passed; all four deployment tests. The initial sandboxed test attempt could not connect to its temporary localhost server (EACCES); the normal Windows run passed. `git diff --check` passed.
- Browser: reviewed all three distinct dealers and tables at 1280×720; European at 844×390 with all actions and hand results visible. Temporary viewport overrides reset. No captured JavaScript errors.
- Double Deck free-preview deal and stand: player 13, dealer bust 24, preview return 1.00. European free-preview deal and hit: player bust 26, preview return 0.00. Credit display remained 878.05. Royal recovered its previous settled hand without replaying or changing its result. No new hosted stake, manual credit adjustment or account mutation.
- Royal fixture: inspected thumb/index contact at 450/650 ms (0.7 mm reported pad error), face detail, 3D turn and landing checkpoints; saved six-second local motion recording. Contact calibration applies to the carried card; rest/turn debug distances are not carry-contact measurements.
- Desktop browser 12-second European deal probe: 1,439 animation-frame callbacks, p95 8.4 ms, maximum 16.6 ms, zero frames over 34 ms, zero long tasks, maximum recorded event 48 ms. This measures browser scheduling on this computer, not dealer-render FPS or native-phone GPU performance.
- Local screenshots, probe output and recording: ignored `reports/screenshots/v49/`.

## Publication and remaining limits

Vercel publication and final deployment checks pending. No database migration, operator deployment, mathematics or balance migration is required.

Physical Android/iPhone rendering, native lifecycle and real-device performance remain unverified. The existing models retain their real-time mesh limitations; this release does not claim cinematic human realism or universal glitch-free rendering.

Rollback: restore V48 player deployment `dpl_5hoo5nQXhSYzuK6qc7Cw7YkpT3Yw` (https://new-game-test-efy65q3q9-tonyk006789-7532.vercel.app/). No accounting rollback is needed.
