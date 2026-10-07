# V31 — landscape keno, larger reels and approved test rate controls

## Owner decisions and implementation

- Fixed all five keno layouts, especially Meteor and Bamboo: the character belongs in the side panel, the 80-button board has eight explicit rows, and landscape phones place presets/drawn balls beside the board. Portrait retains the full board and controls. No forced stretching or cropped buttons.
- Celestial Wilds, Midnight Express and Sapphire Crown reserve more space for the actual reels. The decorative train/crown header is 62px; the reel body has a 350px minimum before automatic fitting. Existing larger slot layouts retain their geometry and payout evaluation.
- All six fish worlds keep more creatures on screen: small/medium/large swim windows increase to 42/44/46 seconds. Arrival spacing remains 1.5 seconds, population is bounded at 31 with one boss. Server and client use `reef-ballistics-v9`; old accepted receipts still recover.
- Explicit owner approval: `reef-challenge-v31` uses 15%/10%/5%/2% capture per paid hit, returning the existing 1×/3×/8×/20× stake. One attempt per hit; no free solo assists. Independent labeled AI points require 8/14/24/40 impacts. AI points do not change human credits or remove shared fish.
- Explicit owner approval: Main Admin's **Setting → Slot & Keno Win Rate** controls one global 5–50% positive-return chance in 1% steps, initially 20%. Reward amounts are unchanged. This is not RTP or profit, does not use player history, and does not control fish or blackjack.
- The setting requires password verification and Main Admin authority, rejects extra/account-specific fields, records immutable versions and an audit event, checks the expected revision and persists idempotent requests. Row locks serialize new accepted rounds against changes. Each receipt records its rate/revision/profile/hash. Historical profile definitions remain unchanged. Stale clients fail before debit, refresh the setting and require another explicit play action.
- Player game rules show the current rate and fish probabilities. Production game play remains closed. The two additional blackjack variants remain free previews pending their separate owner approvals.
- Password policy already accepts `abc123` and `ABC123`: at least six characters with one letter and one digit; no uppercase or special-character requirement. Verified creation at each operator tier, password reset, self-service changes, login and session revocation. No existing credential was rewritten.

## Changed areas

Player: `GamePreview.vue`, `layout-v31.css`, `main.ts`, `GameRules.vue`, `api.ts`, `staging-state.ts`, `bot-score.ts`.

Shared/backend: `packages/game-math/src/index.ts`, `game-policy.ts`, `staging.ts`, local/hosted route handlers, migrations 019/020. Operator: `GamePolicyPanel.vue`, `App.vue`. Tests cover new math/transport/settings and adapt existing physics/accounting fixtures to the new profiles. Guidance, staging notes and the original-asset manifest are updated.

## Acceptance evidence

- `pnpm typecheck`, `pnpm lint`, `pnpm build:server` — passed.
- `pnpm test:unit` — 192 passed; subsequent targeted `pnpm exec vitest run tests/unit/stake-transport.test.ts` — 4 passed, including the additional stale-policy test (193 unit tests in the final suite).
- `pnpm test:integration` — 23 passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs tests/db/operator.test.mjs` — staging's 20 tests passed. The operator suite initially found two old-profile fixtures; after correcting those requests, `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs` passed all 20. Tests use isolated, disposable PostgreSQL schemas.
- New database coverage: authorization for Main Admin only, CSRF/origin checks, five-minute verification, 5–50 bounds, one revision/audit under duplicate retries, competing revision conflict, immutable history, unchanged wallets when modifying rates, old accepted receipt replay, stale client rejection and new round profile/hash. Existing ledger reconciliation and game/redemption races pass.
- `node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs` — 51 passed after rerunning with subprocess permission. These are reference checks, not proof of live ledger behavior.
- `node scripts/asset-manifest.mjs` — 117 original entries.
- `pnpm build:vercel`, `pnpm build:vercel-operator` — passed. Player `index-C9q1xZfE.js`, CSS `index-yCVHJiph.css`; operator `index-EJtVsjaU.js`.
- `node --test tests/deployment/vercel.test.mjs tests/deployment/vercel-operator.test.mjs` — 7 passed, including audience separation, fail-closed configuration and routing/body limits.
- Browser at 1180×820: Meteor/Bamboo board uses approximately 480px height, 53px cells, without the old empty upper half. At 844×390 Meteor uses full width with fit scale 1, board 691×223px; controls remain visible. At 390×844 Bamboo cells are approximately 30×46px, with no horizontal document overflow. Celestial's phone reel area is approximately 351×481px; Midnight's tablet reel area approximately 421×339px, with a 62px train header.
- Main Admin local UI saved 20% → 21% → 20% using password verification, creating revisions 2 and 3 and showing successful receipts. Hosted initial setting remains revision 1 at 20%. No hosted game was played for validation.
- Screenshots under `reports/screenshots/v31`: `bamboo-landscape.png`, `celestial-phone.png`, `midnight-reels.png`, `admin-rate.png`; additional release evidence follows publication. Browser emulation is not physical Android/iOS certification.
- `git diff --check` — passed.

## Migration and rollback

019 adds an immutable probability version table and a current revision pointer initialized to the approved 20%. 020 extends the idempotency operation check. Both are additive; no historical rounds or ledger entries are rewritten.

Applied to local and hosted test databases. Before hosted migration, saved a consistent encrypted logical backup of 22 tables (7,514,766 encrypted bytes) under ignored `.local/vercel/probability-backup-019-*`. Confirmed all **16 wallets**, balances, reservations, versions and account identity/password hashes unchanged immediately after migration. Backup keys and credentials are not committed.

Preserve migrations and immutable receipts on rollback. A probability correction is another verified revision, never a history rewrite. Prefer a forward correction retaining V31 profile/recovery support; blindly redeploying pre-V31 API code would restore old odds for new rounds and is not an approved rollback of the new math. Presentation CSS can be reverted independently. No new paid service, account funding or native release.

## Publication

- Source commit `84b5cca` pushed to GitHub main.
- Player deployment `dpl_BFUfHV7un41qWddZ1KFkT5HnN7w1` is READY, aliased to https://new-game-test-topaz.vercel.app/.
- Operator deployment `dpl_7Q84F29QYeBF9knVdULLya5hX1Ri` is READY, aliased to https://new-game-operator.vercel.app/.
- Eighteen read-only public checks passed: both health endpoints, exact player/operator entry hashes, 30 game IDs, current policy revision 1 at 20%, both approved V31 profiles, art/audio availability and authentication/audience separation. Evidence: `reports/screenshots/v31/live-route-checks.json`.
- Hosted browser restored the player session and displayed the corrected Meteor board. Its Rules panel shows **20%**, **Revision 1**. No hosted stake, draw or spin was submitted. Additional screenshots: `meteor-live-landscape.png`, `meteor-live-tablet.png`, and local `sapphire-reels.png`.
- The public operator bundle and protected policy endpoint are verified. Its prior browser session expired; the existing locally stored operator sample password was rejected on one sign-in attempt, so authenticated slider interaction was verified locally rather than claimed as a hosted UI pass. No password was reset or changed.
