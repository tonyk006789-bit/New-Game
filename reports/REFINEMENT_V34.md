# V34 — replace the existing win-rate slider with paying-round frequency

## Change

`apps/admin/src/GamePolicyPanel.vue` now presents the existing Main Admin control as **Slot & Keno Paying Rounds**. The slider has explicit **Fewer paying rounds · 5%** and **More paying rounds · 50%** endpoints, a live selected percentage, an active-frequency readout, and matching review/save/history wording. It explains that every new round has the selected chance of returning credits, with no guaranteed session win count. Award amounts remain fixed.

This replaces the old Win Rate presentation in Main Admin → Setting → Setting. It retains the same global server setting and password-verified, audited, idempotent save operation. No new math, reward multiplier, second slider, player setting, database migration or actual rate change is introduced. Fish, blackjack and accepted results remain unchanged. Other changed files are the owner notes and this evidence report.

## Verification

- `pnpm typecheck` and `pnpm lint` — passed.
- `pnpm exec vitest run tests/unit/game-policy.test.ts` — nine passed, including low/high frequency thresholds for every Slot/Keno game and identical winning outcomes/awards across settings.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs` — 21 passed in an isolated PostgreSQL schema. Existing frequency-control checks verify Main Admin-only access, password verification, input bounds, CSRF/origin protection, concurrent request replay, immutable/audited revisions, accepted-result replay and stale-client rejection before charging.
- `pnpm build:vercel-operator` — passed; operator entry `index-BvF_u7wa.js`.
- `node --test tests/deployment/vercel-operator.test.mjs` — three passed.
- Browser: signed in with the existing local Main Admin fixture. Slider keyboard endpoints selected 50% and 5%, updated the percentage and explanation, and enabled Review change. Review showed the exact 20% → 50% change and password field; Cancel returned to editing. Restored the draft to the active 20% without submitting a save. Screenshot: `reports/screenshots/v34/paying-round-slider.png`.
- No new tests were added for this wording-only replacement; existing behavior tests and actual UI interaction cover the required behavior. A pre-existing pg concurrency deprecation warning occurred in the database suite; all checks passed.

## Migration and rollback

No migrations or data changes. Revert the component or redeploy the prior operator build to roll back the presentation. Keep current policy revisions, audit records and historical rounds. Player/native builds are unchanged.

## Publication

- Source commit `507607c` pushed to GitHub main.
- Operator deployment `dpl_5fCtaKqFxrrPi5s5YDkvxmQ7egXi` is READY at https://new-game-operator.vercel.app/.
- `node .local/verify-v34-live.mjs` — eighteen read-only checks passed, including the exact new operator bundle and frequency labels, health, authentication boundaries, unchanged player bundle/catalog and existing policy revision 1 at 20%. Evidence: `reports/screenshots/v34/live-route-checks.json`.
- No hosted frequency change, wager or balance operation was submitted. Existing player deployment remains unchanged. Local browser draft was restored without saving; viewport overrides were reset and the verification tab closed. Final `git diff --check` passed.
