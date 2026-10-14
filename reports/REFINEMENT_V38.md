# V38 — separate dealer characters for the three blackjack games

## Changes

The owner requested different characters for different blackjack games. Royal Blackjack keeps the original woman with a brown bob, black/gold waistcoat and bow tie. Double Deck now has a man with dark hair, a neat beard and burgundy waistcoat. European has a different woman with a black hair bun, navy waistcoat, blue shirt and necktie.

`BlackjackDealer.vue` selects one distinct atlas and accessible character description for each typed game identity; `BlackjackGame.vue` supplies that identity. `blackjack-v37.css` removes the shared hard-coded image and adjusts the new characters' lower fade so their resting hands stay visible. The existing four-pose motion and accepted-card delivery sequence are unchanged. The selected table loads only its own dealer image, shared by its four pose elements.

Original assets generated through the **built-in ImageGen tool** using the V37 sheet solely as a framing/pose reference:

- `apps/player/public/art/blackjack-double-dealer-v38.png` — 1,630,460 bytes.
- `apps/player/public/art/blackjack-european-dealer-v38.png` — 1,447,140 bytes.

Both PNGs preserve transparent alpha and are stored in the repository. The complete prompts are in `reports/art-prompts-v38.json`; provenance and hashes are in `reports/asset-manifest.json`. These remain 3D-rendered sprites, not live human dealers or rigged meshes.

No game mathematics, credits, ledger, server behavior, operator UI or database changes. Double Deck and European remain free previews under their existing approval status. No migration.

## Verification

- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed.
- `node node_modules/eslint/bin/eslint.js apps/player/src/BlackjackDealer.vue apps/player/src/BlackjackGame.vue --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit/blackjack-dealing.test.ts` — 7 existing presentation regression tests passed. No payout or implementation-mirroring tests were added for the asset selection.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — passed; player entry `index-DdiSPBRo.js`, stylesheet `index-2K8Y_M8z.css`.
- `node scripts/vercel-build.mjs` — passed.
- `node --test tests/deployment/vercel.test.mjs` — 4 passed.
- From `apps/mobile`, `node node_modules/@capacitor/cli/bin/capacitor copy` — Android/iOS/web asset copy passed. Native compilation and physical-device performance remain untested.
- `node scripts/asset-manifest.mjs` and `git diff --check` — passed.

Local browser checks confirmed different faces, hair, clothing and selected image URLs on the three tables. The new Double Deck and European dealers were inspected at desktop size and 844×390 phone viewport, including their opening-deal poses. Preview gameplay left the real wallet at 978.65. Screenshots are ignored local artifacts under `reports/screenshots/v38/`. Physical-device certification is not implied.

## Publication and rollback

Source `015a668` pushed to the existing GitHub main branch. Player deployment `dpl_Bt91tBbqdRaRwbmKEUEV2ueFihee` is READY at https://new-game-test-topaz.vercel.app/. Operator remains on V36; no hosted credit actions were submitted.

- Publication used the existing Vercel project and encrypted configuration via the same `deploy --prebuilt --prod --yes` official CLI workflow recorded in V37.
- `node .local/verify-v38-live.mjs` — **23 read-only checks passed**. New player entry `index-DdiSPBRo.js`; unchanged operator entry `index-BPWS4sI-.js`; all three PNG content types and SHA-256 hashes match the workspace. Entry HTML remains uncached, protected API routes remain protected, and approved settings/catalog remain unchanged.
- The public browser loaded the new entry through the existing safe Reload update control. Refresh an old phone tab once to receive this version.
- Both new characters were also verified on the public Vercel tables without dealing a hosted hand. Public screenshots: `reports/screenshots/v38/live-double-deck.png` and `live-european.png`; no browser console errors. Temporary viewport override was reset and the local verification tab closed. The public European table remains open as the deliverable.

Rollback: redeploy player `dpl_22YXwMYTVyQCQqHWHsidd97Fp4FJ`, or revert V38 and rebuild. No database rollback.
