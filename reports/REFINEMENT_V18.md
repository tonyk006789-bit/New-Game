# V18 — direct-parent operators and original Abyss table

## Delivered behavior

- Main Admin manages direct sub-contractors only. Sub-contractors create/manage direct agents only. Agents create/manage their own individual players. Account lists, creation, profile changes, passwords, suspension/archive and credit operations enforce this on the server, not just through hidden menu items.
- Main Admin ADD/REMOVE is limited to its own wallet or direct sub-contractors. Recharge transfers the parent's available credits to a direct child; Redeem returns available credits to that parent. Both preserve supply, immutable history, reservations, wallet versions and durable request IDs. Individual player records/receipts belong to the assigned agent; higher operators get branch aggregates grouped by their direct staff children.
- Abyss Legends has a new original volcanic caldera, four separate cannon designs, matching lounge/poster backgrounds and colored projectile trails. The persistent jackpot wheel spins when a confirmed boss catch arrives, including a real peer's catch. Its displayed amount is the committed receipt, with no separate RNG or extra award. Animation finishes before the existing 900 ms wallet reveal. Reduced motion skips rotation.
- Explicit setup scripts now authenticate each parent and persist each ledger leg before sending. Legacy completed allocations never refill; an unfinished old direct-player adjustment stops for receipt review. No provisioning script was run on hosted data in this change.

## Changed areas

`apps/api/src/{store,accounts,ledger,operator,operator-reports}.ts`, the admin console, fish renderer/atlas/SVG components, new `AbyssJackpotWheel.vue`, `boss-reveal.ts`, `arcade-v18.css`, two original PNG assets, provisioning helpers, PostgreSQL fixtures and regression tests, policy configuration and owner guidance.

Art source: built-in ImageGen, original prompts in `reports/art-prompts-v18.json`; hashes/provenance in `reports/asset-manifest.json`. Runtime crop coordinates are hand-inspected; no external game assets are included.

## Acceptance evidence

Commands run with the pinned Node 24/pnpm runtime on Windows:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm test:reference` | 50 passed; illustrative math only |
| `pnpm test:unit` | 104 passed, including paid-boss-only wheel receipts and lost-response provisioning recovery |
| `pnpm test:integration` | 20 passed |
| `pnpm build:server` | Passed |
| `node --env-file=.local/runtime.env --test tests/db/backend.test.mjs` | 16 passed |
| `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs tests/db/operator-hosted.test.mjs tests/db/hosted.test.mjs` | 34 passed |
| `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` | 18 passed (also run in the initial combined database command) |
| `pnpm build:vercel` | Player bundle passed |
| `pnpm build:vercel-operator` | Separate operator bundle passed |
| `pnpm test:vercel` | 4 passed |
| `node scripts/asset-manifest.mjs` | 44 original assets recorded |

The database tests create isolated local schemas. They verify bypass denial, direct-child flags/counts, individual record restrictions, root/sub rollups, supply-neutral transfers and redeems, reserved amounts, concurrent retries, reset/archive behavior, and committed game settlement. Outdated fixtures using administrator shortcuts and the pre-three-reel Neon profile were corrected.

Browser evidence in ignored local `reports/screenshots-v18/`: Main Admin sub-contractor list/create dialog, sub-contractor agent list/actions, agent player list, and Abyss desktop/mobile-layout captures. Browser inspection does not certify physical Android/iOS performance. No native build or new physical-device test was performed; owner still has no test devices.

## Data, deployment and rollback

Before publication, a read-only hosted audit found nine wallets and zero accounts with an invalid hierarchy parent. Existing accounts already have the required hierarchy, so no migration or account reassignment is necessary. Prior manual funding records remain immutable even when their historical targets would now be prohibited.

Target links: https://new-game-test-topaz.vercel.app/ and https://new-game-operator.vercel.app/. Deployment IDs and post-publication checks are recorded below after verification.

Published from source commit `1a34435f6dd3798f0f9bcc60a4d364479cfa60d0` on GitHub main:

- Player: `dpl_n3ov3jWBDP4CdvofRGL2Dftxcs6h`, READY, https://new-game-test-j275dk05t-tonyk006789-7532.vercel.app/; alias https://new-game-test-topaz.vercel.app/.
- Operator: `dpl_9DrnH4YXgxo58zRkwoNLq1B2LfTB`, READY, https://new-game-operator-lt9nask3j-tonyk006789-7532.vercel.app/; alias https://new-game-operator.vercel.app/.
- Existing Main Admin, sub-contractor and agent sign-ins passed through the public operator API. Each list contained only its direct child role; totals used the matching rollup. Main/sub individual player lists were empty, game-record access returned 403 and individual player receipts/records returned 404.
- Existing tester sign-in and both new PNGs passed on the player site. The rendered Abyss table has all four new cannons and the persistent wheel; no console warnings/errors were returned. Landscape content viewport 844 × 390 was inspected and the temporary viewport override reset.
- `.local/check-v18-wallets.mjs` read-only comparison confirmed **all nine balances, reservations and wallet versions unchanged**, and no invalid parents, after publication and API verification. No hosted shots, claims, adjustments, resets or new accounts were performed.
- Public verification details remain local in `.local/vercel/v18-live-checks.json`; screenshots in `reports/screenshots-v18/abyss-live.png` and `abyss-landscape.png`. No private credentials or customer exports were committed.

Rollback visuals by reverting the V18 player art/components. Preserve the stricter server permission rules on both deployments; rolling the operator back to V17 would reopen the reported bypass. There is no database rollback. Do not rerun provisioning to refresh tester balances.

Remaining limits: no physical-device certification; jackpot reveals reuse the existing approved test fish awards and do not implement a progressive pool. The PostgreSQL client emits a known query-queue deprecation warning in concurrency fixtures; it does not fail the tests. Hosted database SSL is currently verified under the pinned pg version; its future-major-version warning is unchanged.
