# V16 — varied reels and upright cabinets

Date: 30 September 2026. Target: the existing Vercel player test environment.

## Implemented formats

| Game | Format | Behavior |
| --- | --- | --- |
| Neon Sevens | 3 reels × 3 rows | Five active lines, pale mechanical reel strips |
| Ruby Rush | 3 reels × 3 rows | Five active lines, crimson cabinet |
| Sapphire Crown | Portrait, 5 reels × 3 rows | Nine lines, crown wild and upright crown header |
| Aurora Vault | Portrait, 3 columns × 5 rows | Same fifteen independent cells, lock and pulse sequence |
| Solar Fortune | 5 reels × 1 visible row | Individual rounded reel windows; sun coins lock through up to three respins |
| Jade Fortune, Coin Carnival, Temple Lights | Wide 5 × 3 | Existing line/hold formats retained |
| Ember Relics | Wide 6 × 5 | Existing cluster cascades retained |

Portrait cabinets stay upright and centered on desktop. On landscape viewports up to 1000px wide and 600px high they show a rotation prompt, hide the game controls and block new play. Rotation does not cancel or resample an accepted result. Returning upright does not start another spin.

The owner specifically approved Neon/Ruby's three-reel test profile: five lines, triple returns of cherry 1×, bell/BAR 2×, gem 3× and seven 5×, with roughly 30% positive-return rounds. `stage-classic3-v1` identifies new rounds. Existing `stage-paying30-v2` and `stage-cabinets-v1` definitions remain unchanged. Historical five-reel receipts render, recover and evaluate unchanged; the next accepted spin uses three reels. The rules dialog now shows the three-symbol paytable and five three-column line diagrams.

Solar presents its existing center scoring row throughout every frame; no paying symbol is omitted. Aurora rearranges the same fifteen independent cells. Neither changes its payout model. Quarter-credit stakes through 20.00 and win-before-balance presentation remain. Production approvals remain null.

## Changed files

- `packages/game-math/src/index.ts`, `apps/api/src/staging.ts`: versioned classic profile, generation, legacy evaluation and profile discovery.
- `packages/contracts/src/index.ts`: cabinet format descriptions.
- `apps/player/src/cabinet-layout.ts`, `App.vue`: layout selection and portrait gate.
- `CabinetGame.vue`, `ReelStage.vue`: dynamic reel count, visible rows, historical geometry, upright header and single-row playfield. Reel animation rebuilds strips to the target column count when a five-reel receipt precedes a three-reel round.
- `GameRules.vue`, `arcade-v16.css`, `main.ts`: correct paytables/line diagrams and distinct responsive cabinet styling.
- Unit and PostgreSQL staging tests, owner steering, asset manifest and this report.

## Acceptance evidence

- `pnpm typecheck` — passed after final component edits.
- `pnpm lint` — passed, zero warnings after final component edits.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 114 tests passed across 16 files. Includes 2,000 sampled rounds per classic title, exact approved triple awards, historical five-reel evaluation and 100 Solar sequences retaining their scoring row and held columns.
- `pnpm build:server` — passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` — 17 tests passed in an isolated PostgreSQL test schema. Tests verify exact evaluated awards, new/old profile handling, replay/recovery with unchanged balances, and existing concurrency/credit guards.
- `pnpm build:vercel` — passed; player assets and restricted server function emitted.
- `node --test tests/deployment/vercel.test.mjs` — four tests passed against that build.
- `node scripts/asset-manifest.mjs` — 34 original art entries recorded. Existing original illustrations are reused; no new provider art or code imported.
- `git diff --check` — passed.

Some restricted child-process invocations returned Windows `spawn EPERM`; the same commands passed with approved process permissions. The initial unit pass exposed stale five-column fixture expectations and an unintended diagonal in a new single-line fixture. Corrected fixtures passed the complete suite.

Browser acceptance through the in-app browser:

- Guest Neon/Ruby settle to three columns and nine symbols; Ruby's rules show only three-symbol rewards and all five paths.
- Local `stage.player` restored its old five-reel Ruby receipt at 988.65 credits. One explicit 0.25-credit test round with normal motion settled to three reels/nine symbols, returned zero and left 988.40. The account was signed out; no refill occurred.
- Normal-motion Solar was observed in its rolling state with five reels/one row, then finished with five symbols, four held reels and three respins. Reduced-motion preview completion was also checked.
- Sapphire/Aurora fit upright desktop cabinets; Aurora has three CSS columns and five rows. Sapphire's authenticated stake controls at 390 × 844 had no horizontal overflow; the spin button bottom was 793.5px and right edge 353.3px.
- At 844 × 390, Sapphire shows only the rotation prompt and navigation. Rotating during a free spin completed the result, hid the cabinet and disabled spin; no replacement round started.
- A final phone check found Sapphire inherited a column-direction flex container, collapsing its reel area. Explicit row direction fixed it; all five reel windows measure 420.5px high at 390 × 844 in guest mode. Aurora has fifteen cells, a 383.6px board and controls ending at 808px with no horizontal overflow.
- Desktop Solar originally had an overly narrow layout during review; correcting its flex container restored five 207.6px-wide reel windows. Desktop Aurora's controls ended at 691px within the 720px viewport.
- Browser warning/error log: empty. Presentation preference and viewport overrides restored after QA. Screenshots: ignored `reports/screenshots-v16/ruby-three-reel.png`, `sapphire-portrait.png`, `aurora-portrait.png`, `solar-single-row.png`.

Viewport override screenshots scale unreliably in this browser, so phone checks use DOM geometry and visible accessibility state. Physical Android/iPhone rendering, audio listening and native lifecycle certification remain untested; these are not native acceptance results.

## Migration and rollback

No database migration, account provisioning, secret transfer or credit funding is required. Hosted tester wallets and operator funding are not changed by deployment.

After a classic three-reel round is accepted, preserve `stage-classic3-v1`, its evaluation and recovery support when reverting presentation. An older API which generates five-reel results under the older IDs is not a compatible full rollback. Keep both old/new receipt support, or temporarily close new spins while retaining recovery. Never delete or rewrite accepted rounds or ledger postings.

## Publication

Published and verified: **https://new-game-test-topaz.vercel.app/**.

- Source commit: `6f3a51cb597d7a7956b93a00096b09f290043441`, pushed to the owner's GitHub main branch.
- Vercel deployment: `dpl_HjKRTKb4KpApysoqZfjuFLNMPMWx`, READY.
- Immutable build: https://new-game-test-70wadtakg-tonyk006789-7532.vercel.app/.
- Command: `node .cache/vercel-tools/node_modules/vercel/dist/vc.js deploy --prebuilt --prod --yes --global-config .local/vercel-cli --scope tonyk006789-7532 --no-color`.
- Public health is `ok` in `private-test` mode; environment lists `stage-classic3-v1` alongside unchanged base/expansion profiles and keeps production approval false.
- The existing Player 1 session restored, showing 984.55. The new lobby format labels, Ruby's preserved five-reel historical receipt and Sapphire's upright layout loaded on the public URL. No hosted round was played. Screenshot: ignored `reports/screenshots-v16/live-sapphire-portrait.png`.
- Netlify and the operator site were not redeployed. No schema, account, password or hosted credit-funding changes were made.
