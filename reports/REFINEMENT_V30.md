# V30 — fuller game thumbnails

The owner rejected V29's inset, minimal thumbnails and requested artwork filling the entire card. Replaced the inset framing across all 30 games with full-card illustrations, larger characters/symbols, and title overlays. This is a presentation-only correction.

## Changes

- `apps/player/src/GamePoster.vue`: full-bleed SVG artwork with top/subject-aware framing for existing poster atlases, preserving clip rectangles so neighboring atlas cells cannot bleed. Fish cards combine a larger boss with their own ocean background. Classic slots use layered hero/support symbols over original scenes; keno uses a fuller five-ball composition; Royal Blackjack uses enlarged cards and chips.
- `apps/player/src/screen-v29.css`: artwork extends to all four inner card edges, taller cards, colored borders, larger titles and gradient caption overlays. Mobile captions grow with their text instead of clipping longer titles. Automatic game fitting from V29 remains unchanged.
- `reports/asset-manifest.json`: refreshed hashes for the modified presentation. All artwork is reused original project art; no new image generation, external media or dependency.
- `docs/OWNER_UPDATES.md`: records this correction as superseding the minimal thumbnail preference.

## Acceptance

- `pnpm typecheck` — passed.
- `pnpm lint` — passed.
- `node scripts/asset-manifest.mjs` — 116 original asset/presentation entries.
- `pnpm build:vercel` — passed; player entry `index-oyQ-Qie7.js`, CSS `index-BkQhlqSs.css`.
- `node --test tests/deployment/vercel.test.mjs` — four passed.
- `git diff --check` — passed after removing an extra EOF blank line.
- Browser visual inspection of all four shelf pages at desktop width: all 30 games have full-card artwork and readable captions. Existing atlas images are intentionally framed more closely to fill each card, not letterboxed into narrow central strips.
- At 390×844, two-column cards remain within document width (375px content within 390px viewport). All eight visible caption text bottoms remain 9px inside their respective card bottoms, including two-line blackjack names. No horizontal overflow.
- Walk the Floor renders the same revised posters (eight on the current floor), with all 30 directory entries retained.
- Local screenshots: `reports/screenshots/v30/desktop-catalog.png`, `mobile-catalog.png`. Browser viewport checks are not physical-device certification. No local or hosted game was played for this change.

## Migration / rollback

No migration, ledger, math, music, account or operator changes. Revert the two presentation files and redeploy the prior player build to restore V29's thumbnail treatment. Preserve all wallets and game history.

## Publication

- Source commit `0307395` pushed to GitHub main.
- Vercel deployment `dpl_EKQ5aL4WsSSCJLuhcC96CLDmGVeY` is READY and aliased to https://new-game-test-topaz.vercel.app/.
- Sixteen public live checks passed, including the exact `index-oyQ-Qie7.js` release, all 30 game IDs, art availability, health, staging flag and authentication boundaries. Operator remains on `index-CT1MaUjW.js`.
- Live route evidence: `reports/screenshots/v30/live-route-checks.json`.
- Hosted browser verified the exact release and eight full-card posters on page one after submitting the already filled tester login. No game actions were submitted. Saved `reports/screenshots/v30/live-catalog.png`; reset the temporary viewport and retained the catalog tab for the owner.
