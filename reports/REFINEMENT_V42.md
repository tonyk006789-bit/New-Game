# V42 — finger articulation and card contact

The owner accepted the V41 characters but found their finger motion unnatural. V41 drove nearly every joint with one shared grip value and a static palm-relative card offset. V42 uses individual finger/joint timing, a calibrated opposed thumb/index pinch, restrained finger spreading, damped release and a gradual return to rest. The index releases first; thumb and supporting fingers follow. Card rotation now follows the actual hand, and its flight inherits the hand's release velocity instead of restarting from zero speed.

## Implementation and limits

- `dealer-hand.ts`: anatomical flex/splay axes, bounded per-model contact solving, critically damped tendon response, approximate fingertip/card/felt clearance and deterministic timeline sampling. The solver preserves bone lengths; accepted game data never enters its decisions.
- `dealer-hands.json` and `scripts/prepare-dealer-hands.mjs`: six precomputed hand calibrations, bound to the SHA-256 of the three unchanged V41 GLBs. The runtime uses these results and does not run the iterative calibration during table loading or gameplay.
- `dealer-rig.ts` and `dealer-motion.ts`: articulated hands, coupled card position/orientation, continuous release velocity and 22 mm of smoothly introduced wrist clearance while the fingers open. Card pickup/release/landing and deal-cue timings remain unchanged.
- `DealerCheck.vue`: local-only close-up, timeline inspection and six-second WebM capture. It is not in the deployed player bundle.
- `tests/unit/dealer-hand.test.ts`: real shipped bone transforms, contact accuracy, source/calibration integrity, fixed segment lengths, deterministic recovery, table clearance, bounded joint changes and continuous card release. Existing deal/motion tests are retained.

The approach uses bounded joint rotations and damped responses rather than a general rigid-body or soft-tissue simulator. Reference concepts were checked against the official [Three.js IK documentation](https://threejs.org/docs/pages/CCDIKSolver.html) and [MuJoCo dynamics documentation](https://mujoco.readthedocs.io/en/latest/computation/index.html). This implementation adds no physics engine or runtime dependency. There are no new models, textures, music, gameplay rules, wallet operations or operator changes.

## Acceptance evidence

- `node scripts/prepare-dealer-hands.mjs` — six deterministic calibrations generated for the unchanged models.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — **37 files, 261 tests passed**.
- Tests initially detected excessive contact error in the male hand, then an abrupt release when the index met the felt. Per-model opposed-contact calibration and wrist clearance corrected these failures before publication.
- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed. Entry `index-D89imd7_.js`, CSS `index-DOnYYtLt.css`; the on-demand dealer chunk is `dealer-rig-L-YwQKqb.js` (629.83 KB / 159.76 KB gzip). Existing >500 KB chunk warning remains; the renderer is lazy-loaded only for blackjack.
- Inspected all three characters in the local close-up fixture at grip, release and recovery. Pinch endpoint error in the inspected hold pose was approximately 0.7 mm per pad. No console errors/warnings were recorded.
- Local evidence in ignored `reports/screenshots/v42/`: `double-grip.png`, `european-grip.png`, and a six-second `double-hand-motion.webm` (674,301 bytes). These are desktop-browser checks, not physical-phone evidence or a zero-glitch guarantee.

Deployment and final live verification pending.

## Migration and rollback

No migration, account/credit change or operator deployment is needed. Revert this presentation revision or restore V41 deployment `dpl_2xr62emSEyAZYSvxHXdp4myDMwUR`. Existing accepted results and ledger history remain intact. Physical Android/iPhone testing remains deferred under the owner's earlier instruction; no native performance certification is claimed.
