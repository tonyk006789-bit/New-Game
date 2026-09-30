# V15 — original cabinet expansion and lobby refinement

Date: 30 September 2026. Target: the existing Vercel player test environment.

## Delivered implementation

Eleven games are available, including Ruby Rush (Neon Sevens test model), Sapphire Crown (Jade Fortune test model) and Solar Fortune (Coin Carnival test model). These are fully connected themed cabinets, with server-generated outcomes, persisted rounds, exact stake/award postings and durable recovery. The owner expressly selected reuse of existing test payout rules. Production approvals remain null.

The new `stage-cabinets-v1` profile identifies these aliases without modifying `stage-paying30-v2` or historical receipts. Ruby Rush has five paylines; Sapphire Crown has nine with crown wilds; Solar Fortune locks center sun coins and presents up to three respins. All retain 0.25–20.00-credit quarter-step stakes.

The lobby defaults to a paged eight-card shelf with original painted posters, favorite hearts, keyboard/page controls, horizontal swipe and category/search filtering. The walking-character lobby remains selectable and now paginates all eleven games. Only the three added games carry NEW ribbons.

Cabinet presentation adds original themed symbols, reel start/stop sounds, per-line win review, locked-reel framing, illustrated symbol paytables, and celebrations showing actual committed returns. Existing win-before-balance presentation is retained. Reduced-motion and background pause behavior remain respected.

## Reference coverage and limits

Reference: [Cash Frenzy](https://product.cashfrenzy777.com/webv1001/), entered through the owner's supplied [landing page](https://www.cashfrenzy777.com/m).

Observed lobby details: purple/neon framing, compact category rail, character-led game posters, favorite hearts on cards, NEW/HOT markers and animated seasonal accents. These informed visual hierarchy, card density and favorites. We use truthful NEW markers, not fabricated popularity or jackpots.

The authenticated canvas was clipped in captures and later failed capture. Resetting the viewport, reloading and a temporary fresh tab did not resolve it. Full game names, all menus, paytables, bonus mechanics, spin timing and win sequences were not verified. The owner agreed to operate prize-based plays; live-play observation remains pending. This is a bounded reference study, not an exhaustive scrape. No provider artwork, source code, private customer export or credentials are included in this project.

Artwork: `apps/player/public/art/cabinet-posters-v15.png` and `cabinet-symbols-v15.png`, generated with built-in ImageGen. Exact prompts: `art-prompts-v15.json`; hashes and provenance: `asset-manifest.json`. SVG view boxes use measured atlas bounds to prevent neighboring sprites bleeding into reels.

## Acceptance evidence

- `pnpm lint` — passed, zero warnings.
- `pnpm typecheck` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 109 tests passed across 15 files. Includes 300 deterministic seeds per alias against its base practice/staging outcome and exact award.
- `pnpm build:server` — passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` — 16 tests passed in an isolated PostgreSQL test schema. New tests reject wrong profiles without changing wallets, verify each new cabinet's exact award, and replay/recover without duplicate charges. Existing ledger, concurrency, fish, wheel and password tests also passed.
- `node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` — 50 reference tests passed. These reference helpers are not evidence of production accounting or an approved production payout profile.
- `pnpm build:vercel` — passed after final art cropping; player bundle and restricted Node function emitted.
- `node --test tests/deployment/vercel.test.mjs` — four tests passed against the final emitted build.
- `node scripts/asset-manifest.mjs` — 33 original assets recorded.

Restricted child-process invocations initially failed with Windows `spawn EPERM`; the same checks passed with approved process permissions. They were environment failures, not test assertion failures.

Browser checks through the in-app browser: all eleven games reachable across two shelf/floor pages; favorite filtering; each new free-preview cabinet; five reels settling to fifteen symbols; Solar Fortune locks and three-respin completion; on-demand Ruby rules and illustrated paytable; normal-speed rolling state and reduced-motion immediate presentation. Desktop screenshots are saved under ignored `reports/screenshots-v15/`.

Authenticated local smoke test: one 0.25-credit round in each new cabinet, using the existing `stage.player` sample. All three completed with persisted zero-return results, reducing its available balance from 989.40 to 988.65. Solar Fortune finished with four of five reels locked after three respins. Browser warnings/errors: none. No local credits were replenished; the sample session was signed out and presentation preferences restored. Hosted human-test accounts were not used for gameplay. A positive-award ribbon was code-reviewed and covered by the existing award/presentation tests, not observed in these three manual rounds.

Phone breakpoint inspection: 390×844 showed two 157.5px shelf columns with no horizontal overflow; Ruby's five reels and spin control stayed in bounds. At 844×390, five reels and spin remained inside the viewport. Screenshot scaling is unreliable with explicit viewport overrides, so these breakpoint checks use DOM layout measurements; physical Android/iPhone rendering, audio listening and native lifecycle certification remain untested.

## Changed areas

- Catalog/contracts and game math: three new IDs, alias profile and original production gate.
- API practice/staging/hosted adapter: allowed routes, profile selection, hashes and recovery.
- Player: shelf, walking pagination, posters/symbols, cabinet effects, reels/audio and rules.
- Tests: alias equivalence, production gating and authoritative PostgreSQL round acceptance.
- Documentation/art evidence: owner approval, prompts, provenance and this report.

## Migration and rollback

No database migration, provider integration, environment-secret transfer or account setup is required. No hosted credit balances are changed by deployment. Main Admin's earlier manual funding and all accepted awards remain intact.

After any new-cabinet round is accepted, keep its route/profile/recovery support when rolling back presentation. An older API that predates these IDs cannot service their recovery requests. Hide new shelf entries or revert presentation only while preserving the compatible API; never delete rounds, ledger entries or profile receipts to perform a rollback.

## Publication

Published and verified: **https://new-game-test-topaz.vercel.app/**.

- Source commit: `98e8c0a1e2bbcd0e7d05cd4dfe73c84db25a25d3`, pushed to the owner's GitHub `main` branch.
- Vercel deployment: `dpl_Mb8FJxQpkUnLzCLTa2cCP5ZfTzxc`, READY.
- Immutable build: https://new-game-test-p2xyfkicw-tonyk006789-7532.vercel.app/.
- Command: `node .cache/vercel-tools/node_modules/vercel/dist/vc.js deploy --prebuilt --prod --yes --global-config .local/vercel-cli --scope tonyk006789-7532 --no-color`.
- Public health is `ok`; environment reports the unchanged base profile and `stage-cabinets-v1`; catalog returns eleven games including all three additions. An operator API path on the player site returns 404.
- The existing Player 1 browser session restored after refresh, showing 983.80 before and after deployment. New lobby and Ruby Rush controls loaded on the public URL. No hosted round was played. Console warnings/errors: none. Screenshot: ignored `reports/screenshots-v15/live-lobby.png`.
- Operator and Netlify were not deployed. No schema, accounts, passwords or hosted credit funding were changed.
