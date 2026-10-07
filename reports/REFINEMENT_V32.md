# V32 — optional Nickname, mobile orientation and half-catalog smaller stakes

## Delivered behavior

- Every operator tier may create its direct child with omitted, empty or whitespace Nickname. The server uses the normalized account username as the display label, with the existing 100-character display limit. New wallets remain zero; credentials, hierarchy and historical accounts are unchanged.
- Exactly 15 of 30 games accept 0.10 and 0.20 in addition to the existing 0.25–20.00 choices. Nine slots/features: Neon Sevens, Ruby Rush, Disco Diamonds, Outlaw Sevens, Temple Lights, Jade Fortune, Celestial Wilds, Ember Relics, Clockwork Vault. Three keno games: Orchard Numbers, Meteor Keno, Bamboo Keno. Three fish worlds: Reef Party, Polar Odyssey, Cosmic Tides.
- The twelve remaining non-blackjack games retain a 0.25 minimum. The three blackjack cabinets retain 0.50 steps; Double Deck and European remain free previews pending their separate payout approval. No probability, multiplier or jackpot rule is changed. Accepted historical receipts still replay before checking new stake/profile rules.
- Twenty-five games use fixed 1280×720 landscape frames; Sapphire Crown, Aurora Vault, Midnight Express, Clockwork Vault and Celestial Wilds use fixed 450×800 portrait frames. Auto fit scales the full cabinet uniformly into safe-area bounds. Keno, slot, feature, fish and blackjack layouts keep controls inside the frame. Bottom fish plaques clear the controls.
- Game entry requests the assigned orientation through the official pinned Capacitor Screen Orientation 8.0.2 plugin or browser Screen Orientation API. Leaving releases it. Unsupported touch-device orientations show an inert-game rotate-to-play screen, pausing new inputs/animations; accepted actions still settle on the server. Native iPad configuration requests full-screen operation.

## Changed files

- Account creation: `apps/api/src/accounts.ts`, `apps/admin/src/App.vue`.
- Stake choices/versioning: `packages/game-math/src/stakes.ts`, `index.ts`, `apps/api/src/staging.ts`, migration `021_game_stake_choices.sql`, player `api.ts`, `BetControls.vue`, `GameRules.vue`.
- Mobile presentation: player `App.vue`, `GameViewport.vue`, `game-screen.ts`, `orientation.ts`, `screen-v32.css`, `main.ts`; root/mobile package manifests and lockfile; generated Android plugin settings, iOS package references and `Info.plist`.
- Evidence: database/unit fixtures, owner notes, original-asset manifest and this report.

## Acceptance evidence

- `pnpm typecheck`, `pnpm lint`, `pnpm build:server` — passed on final source.
- `pnpm test:unit` — 196 passed in 29 files. Includes exactly 15 lower-stake catalog IDs, invalid choices, integer awards, 25/5 orientation mapping, frame bounds and rotation gating.
- `pnpm test:integration` — 23 passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs tests/db/operator.test.mjs` — 42 passed in isolated PostgreSQL schemas. Covers omitted/empty/whitespace names through all three tiers, zero starting wallets, duplicate creation replay, long-name fallback and oversized supplied names; every selected slot/keno at 0.10, recovery/exact settlement and rejection on other games; all six fish worlds with 0.10 where selected and existing charges/awards/replay. Initial runs found an import extension mismatch and stale test profile IDs; corrected before the passing run.
- `pnpm build:vercel`, `pnpm build:vercel-operator` — passed. Player entry `index-Dd8DxYds.js`, CSS `index-B6RQyrm-.css`; operator entry `index-B3duwpan.js`.
- `node --test tests/deployment/vercel.test.mjs tests/deployment/vercel-operator.test.mjs` — seven passed, including fail-closed configuration, API limits and privileged/player separation.
- `pnpm --dir apps/mobile exec cap sync` — passed for both platforms, two native plugins discovered. `pnpm build:android` — blocked: Java/JAVA_HOME absent. `node scripts/native-build.mjs ios` — blocked: macOS/Xcode required. No native build or physical orientation-lock certification is claimed.
- Browser checks: 844×390 landscape Meteor Keno, five-reel Jade Fortune, Ember Relics, Reef Party and Royal Blackjack; 390×844 Midnight Express and Clockwork Vault; 1180×820 Neon Sevens. Full-frame 16:9/9:16 proportions and visible controls verified, lower stake chosen, no horizontal document overflow. Blackjack width and bottom fish plaque clearance were corrected during this check.
- Local operator screenshot confirms blank `Nickname (optional)` with `required=false`; actual creation was verified through the database API tests. No new password was entered through browser automation.
- Screenshots: `reports/screenshots/v32/meteor-landscape.png`, `midnight-portrait.png`, `blackjack-landscape.png`, `reef-landscape.png`, `neon-tablet.png`, `nickname-optional.png`. These browser checks do not certify physical Android/iOS performance. No hosted wager is required for release verification.

## Platform limits and sources

Browsers do not universally support orientation locking, and some require full screen. See [MDN ScreenOrientation.lock](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock). The native integration follows [Capacitor Screen Orientation](https://capacitorjs.com/docs/apis/screen-orientation), including iPad full-screen requirements. Android large-screen policies may ignore requested locks; the rotation gate remains available. Secure native login/distribution and real-device release gates remain the existing project limitations.

## Migration and rollback

Migration 021 only extends the round stake constraint to allow 10/20 integer units on the fifteen explicitly versioned game profiles. It preserves old quarter-step rounds and blackjack split/double aggregate limits. No balance, credential, existing round or global-rate setting is updated. Applied locally and to the authorized hosted test database after saving an encrypted consistent backup of all 24 public tables (8,162,506 bytes) under ignored `.local/vercel/stakes-backup-021-*`. All 17 hosted wallets, balances, reservations, versions and account identity/password hashes were unchanged immediately after migration.

Retain migration 021 and all accepted receipts if reverting presentation. Never restore a narrower database constraint after 10/20-unit rounds exist. Prefer a forward fix that retains V32 receipt/recovery support; if smaller stakes must later be disabled, introduce a new profile for future actions without rewriting history. The optional-name UI/API and frame CSS can be reverted independently.

## Publication

Pending final hosted migration verification and publication to both existing Vercel test sites.
