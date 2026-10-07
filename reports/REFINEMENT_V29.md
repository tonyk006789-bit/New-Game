# V29 — screen fitting, individual music, immediate stake display and clean thumbnails

## Scope

Owner requested mobile/iPad-friendly game proportions and automatic fitting, a wholly replaced music catalog with different rhythms per game, immediate stake deductions in the displayed main balance, and minimal thumbnails without cropped artwork. This is a player presentation release. No game probability, reward, hierarchy, account, API authorization or ledger rule changes; no database migration.

## Implementation

- `apps/player/src/GameViewport.vue`, `screen-v29.css`, `App.vue`, `main.ts`: shared automatic whole-cabinet fitting with safe-area padding, resize/orientation handling, actual-size toggle and optional browser fullscreen. Wide cabinets use available screen width; portrait cabinets remain centered rather than blocking landscape play. Fitting scales uniformly and retains the entire control deck. Fish canvas retains its 1200:600 world proportions instead of stretching creatures to screen height.
- `GamePoster.vue`, `AquaticSprite.vue`, `screen-v29.css`: one contained focal illustration and one caption per card, fewer decorative overlays, explicit atlas clip rectangles, full portrait artwork letterboxed rather than cropped. Shared posters also reach fish lounges and Walk the Floor.
- `music-score.ts`, `music-sampler.ts`, `audio.ts`, `MusicControls.vue`, `SettingsPanel.vue`: 31 new 64-bar compositions, one for each of 30 games plus lobby. Each has separately written melodic phrases and rhythmic patterns, meter, ensemble and harmonic progression. Includes swing, drum-and-bass, calypso, dub, waltz, tango, jazz, synthwave, western rock and other game-specific styles. Runtime no longer uses the previous music bank. The next-track control is hidden for single-score scenes.
- `scripts/render-music-v29.py`, `public/audio/v29`: 32 original synthesized sample instruments, 7,540,608 WAV bytes. All samples derive from additive/FM/noise synthesis, with no imported recording or soundfont. They are synthesized instruments, not recordings of live performers. Existing mute, background pause and audio-unlock behavior remains.
- `credit-presentation.ts`, `api.ts`: show the submitted stake immediately while the request is in flight. On acceptance, hide only the committed award until its win reveal. A definitive rejection restores the authoritative display; an ambiguous timeout retains the pending deduction until receipt recovery. Recovery does not create another round or resample.
- `BlackjackGame.vue`: immediate DEAL/DOUBLE/SPLIT display deduction, with accepted reservations coming from the server. Restored transport commands do not deduct again or access a missing local hand. Already accepted hands and awards still settle normally.
- `fish-wallet.ts`: out-of-order shot receipts show costs as soon as received while withholding awards for the catch reveal; duplicate receipts do not double count, and idle reconciliation handles external adjustments. Fish still charges server-verified accepted hits under the existing rules, not missed visual projectiles.
- Tests: `credit-presentation.test.ts`, new `stake-transport.test.ts`, `fish-wallet.test.ts`, `abyss-music.test.ts`, `audio-lifecycle.test.ts`. Updated asset provenance in `scripts/asset-manifest.mjs` and `reports/asset-manifest.json`.

## Acceptance evidence

Bundled Node 24 and pnpm on Windows:

- `pnpm typecheck` — passed after final component changes.
- `pnpm lint` — passed after final component changes.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration --maxWorkers=2` — 207 passed across 28 files. Includes immediate in-flight deduction, definitive rejection, uncertain timeout and receipt recovery, out-of-order fish awards/costs, integer precision, audio lifecycle, and 31 unique melody/rhythm fingerprints independent of pitch or tempo.
- `node scripts/asset-manifest.mjs` — 116 original asset/presentation entries.
- `pnpm build:vercel` — passed. Final entry `index-CN3Mwy_Q.js`; CSS `index-B1aAoJyM.css`.
- `node --test tests/deployment/vercel.test.mjs` — four passed. Initial sandbox attempt could not spawn Node; same command passed with the normal subprocess permission. Initial development lint encountered transient EBUSY; retry passed. An old music-title expectation was updated to the replacement catalog before the passing full run.
- `git diff --check` — passed (line-ending notices only).

Browser checks used local staging and the supported in-app browser:

- Outlaw at 1280×720, 1024×768, 390×844 and 844×390: whole cabinet and spin controls fit, no vertical document overflow. Auto-fit can switch to actual size.
- Celestial portrait cabinet centered on a landscape tablet; no rotation-blocking overlay.
- Double Deck, Phoenix and Meteor tested at 390×844: content bottoms respectively approximately 843.5, 795.9 and 836.9 within the 844px viewport.
- Corsair at 1024×768: canvas 1018×509, complete game height 646. At 844×390: complete game height 390 with uniformly scaled 2:1 canvas. All cannon/stake controls remain accessible. Room joined and left normally without shots.
- All four shelf pages expose the 30 games, artwork stays inside its own atlas cell, and Walk the Floor retains all 30 labeled navigation entries.
- Celestial music changed to “Lunar Arpeggios”; audio bank reached `ready`. Muted again after testing. Numeric/sample and scheduling checks establish technical validity; no claim of professional acoustic review.
- A local 0.25 Outlaw spin immediately changed displayed balance from 988.65 to 988.40 during “Saving,” then returned zero. A local Royal Blackjack 0.50 DEAL showed 987.90 during “Dealing,” before new cards arrived. The accepted hand was stood and pushed for 0.50; final local balance 988.40. No pending hand was left open.
- Local browser error log empty. The in-app browser did not enter native fullscreen when requested; automatic fitting and rules modal worked. Actual fullscreen behavior remains browser-dependent and is not claimed as verified here.

Screenshots (ignored local evidence) under `reports/screenshots/v29`: `phone-slot.png`, `phone-blackjack.png`, `tablet-fish.png`, `clean-catalog.png`, plus final hosted evidence recorded below. Phone/iPad viewport tests are browser emulation, not physical-device or signed native-app certification.

## Limitations and rollback

No database or operator deployment is required. Roll back by redeploying the previous V28 player build, preserving every wallet and accepted receipt. This changes presentation timing, not accounting timing: server settlement remains authoritative. Double Deck and European Blackjack remain free previews pending the earlier explicit payout approval question. No new approval is inferred from this UI/music request.

## Publication

Pending final GitHub push, Vercel deployment and live verification.
