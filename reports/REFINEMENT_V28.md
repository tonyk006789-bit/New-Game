# V28 — thirty-game collection

## Scope and approval boundary

The owner requested thirty total games, distinct characters/gameplay, more fish tables and two different blackjack games. The collection now has 16 slot/feature cabinets, six fish worlds, five keno games and three blackjack tables. All thirty appear in the shelf and walking-floor directory; New contains the ten additions, and Premium contains only blackjack.

The earlier approval to build cabinets with existing test rules is reused for slots/keno and the existing size-tier/solo-assist rules are reused for fish. Historical profile definitions and accepted receipts are preserved. The two new blackjack variants introduce different decisions and payout conditions: their engines and free previews are implemented, but owner approval is still pending. Both the UI and server prevent credit-staked deals for these variants. Royal Blackjack remains available with its approved rules. This release therefore has 28 credit-enabled test games and two free previews, not thirty approved payout profiles.

## New games

| Game | Character / world | Interaction |
| --- | --- | --- |
| Corsair Cove | Pirate puffers, anchor crab, spectral captain, ghost galleon | Four-seat bronze-cannon harbor; convoy paths |
| Cosmic Tides | Comet minnows, nebula rays, leviathan, astral mermaid | Four-seat plasma-cannon alien ocean; orbital paths |
| Double Deck Blackjack | Nico, plum lounge dealer | Two decks; dealer hits soft 17; double only on two-card 9–11; free preview pending approval |
| European Blackjack | Camille, Riviera dealer | Six decks; no hole card; dealer second card after player decisions; free preview pending approval |
| Clockwork Vault | Orin the owl clockmaker | Fifteen gears around a clockface; lock/collect pulses |
| Phoenix Falls | Solara the phoenix | Six-column, five-row connected feather cascades |
| Outlaw Sevens | Rhea the sheriff | Three reels, five matching-triple lines |
| Celestial Wilds | Selene the star guide | Portrait five-reel, nine-line cabinet with moon wilds |
| Meteor Keno | Pip the robot navigator | Number grid with three constellation presets |
| Bamboo Keno | Ember the red panda explorer | Lantern grid with three trail presets |

These are distinct themes and presentations across existing game families, not ten newly approved probability models. Added 16 aquatic creatures, eight cannon sprites, eight character portraits, twenty symbol sprites and two original ocean backgrounds. Five final ImageGen assets ship; the superseded draft stays ignored locally. Prompts are in `art-prompts-v28.json` and `art-correction-v28.json`. Explicit atlas crop rectangles prevent neighboring creatures bleeding into sprites. Thirty new original score arrangements bring the catalog/lobby music total to 93. New win colors/particles retain V27's removal of repeated Minor/Major banners.

## Implementation

- Contracts: new `packages/contracts/src/catalog-v28.ts`, thirty valid IDs and premium membership in `index.ts`.
- Math: alias routing and immutable `stage-expansion-v28`, six-world target pools/trajectories and `reef-ballistics-v8` in `packages/game-math/src/index.ts`; independently versioned blackjack engines and approval guard in `blackjack.ts`.
- API: `blackjack.ts`, `practice.ts`, `staging.ts`, `hosted-handler.ts`. New round routing, six branch-scoped lounges, profile validation and unchanged authoritative ledger settlement. No client-authoritative award.
- Player: App/catalog routing; character/symbol/poster rendering; distinct cabinet/fish/keno/blackjack layouts and rules; music/win palettes; new `GameCharacter.vue`, `expansion-theme.ts`, `expansion-v28.css` and five PNG assets.
- Migration: `database/migrations/018_catalog_thirty.sql`. Extends room and stake constraints and adds a new-world impact index. Does not rewrite wallets, identities, receipts or hands.
- Tests: expansion math/collision/blackjack behavior; PostgreSQL routing, real collision settlement and durable retry proof; updated catalog/music/species expectations.

## Acceptance evidence

Bundled Node 24 and pnpm on Windows:

- `pnpm typecheck` — passed, including final template changes.
- `pnpm lint` — passed.
- `pnpm build:server` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration --maxWorkers=2` — 204 passed across 27 files. Includes alias evaluation equivalence over 594 seeded outcomes, old profile identity, collision leads, H17/double restrictions, European draw order, natural ties and split/double losses, hidden shoe protection and music catalog integrity.
- `node --env-file=.local/staging/runtime.env --test tests/db/blackjack.test.mjs tests/db/staging.test.mjs` — 28 passed before the final collision case was added. `node --env-file=.local/staging/runtime.env --test tests/db/blackjack.test.mjs` — 10 passed afterward, giving 29 distinct passing cases across those suites. Includes denied unapproved variants without balance changes, six new alias receipts with exact awards and idempotent replay, all six lounges, paid collision settlement/retry for both new fish worlds, existing blackjack reservations and branch isolation. Uses disposable PostgreSQL test schemas.
- `pnpm build:vercel` — passed after the final phone keno layout fix. Entry `index-DqNk2n2J.js`; CSS `index-DITbeXrw.css`.
- `node --test tests/deployment/vercel.test.mjs` — four passed on emitted output (rerun for final release below).
- `node scripts/asset-manifest.mjs` — 82 original asset/presentation entries.
- `git diff --check` — passed; line-ending notices are informational.

Local browser checks: new fish world backgrounds, sprite crops, four cannons and labeled independent AI scores; free Double Deck and European deals/settlements; European dealer has exactly one card before the player's turn; portrait Celestial five reels; Clockwork fifteen-cell ring without console overlap; Phoenix six-column art; Outlaw three reels; Meteor preset selecting five numbers and a complete twenty-number draw. Phone viewport 390×844 has no horizontal document overflow on checked blackjack/keno layouts. Temporary viewport is reset after verification. Browser emulation is not a native Android/iPhone performance certification.

Three local 0.25-credit paid checks (Outlaw, Clockwork, Meteor) returned zero; local tester balance changed from 989.40 to 988.65 through normal settlements. New blackjack previews and AI visual activity did not change that wallet. No hosted gameplay, refill or account creation is part of this release.

Screenshots, ignored locally under `reports/screenshots/v28`: `cosmic-tides.png`, `clockwork-vault.png`, `outlaw-sevens.png`, `phoenix-falls.png`, `double-deck-preview.png`, `european-mobile.png`, `meteor-mobile.png`, `bamboo-mobile.png`, `celestial-mobile.png`; final live catalog evidence is recorded during publication.

## Migration and rollback

Applied migration 018 to the dedicated local staging database and the existing authorized hosted test database. Before hosted migration, made a consistent AES-256-GCM encrypted snapshot of 22 public tables in ignored `.local/vercel/catalog-backup-018-*`. Hosted migration completed; all 15 wallet balances, reservations, versions and account identities were unchanged.

Rollback by redeploying V27's player build while preserving migration 018 and all accepted receipts/history. Do not roll back database constraints by deleting new rounds or wallets. Old accepted fish retries still replay; old clients must refresh for new v8 shots. New blackjack credit activation requires explicit approval plus additional live-profile DB acceptance, not simply exposing a button. Operator code/bundle is unchanged.

## Publication

Release verification and deployment identity will be appended after the authorized Vercel publication completes.
