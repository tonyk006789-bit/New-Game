# Catalog and motion expansion — 18 September 2026

The owner requested public game information from stake.us, more games, and less generic UI and motion. This is an extension of the existing local implementation, not approval of production mathematics, external provider integration or publication.

## Public references inspected

- [Stake's 4 Supershiny Diamonds page](https://stake.us/casino/games/playson-4-supershiny-diamonds-hold-and-win): browser inspection showed game art, provider attribution, favorites, related game cards, category tags and game statistics. The game surface required registration. We did not register, sign in, play a stake, download proprietary assets or inspect private game internals. Actual in-game animation timing was not observable in the public page.
- [Playson's official game description](https://playson.com/game/4-supershiny-diamonds-hold-and-win), retrieved through web search: describes a 5×3 base field, feature combinations and an expanded 5×5 bonus field. The lesson used here is clear separation of game states and strong visual identity. Its features, published RTP and commercial mathematics are not our approved rules.
- [Playson's official catalog](https://www.playson.com/en/games): useful evidence of distinct game families and themed presentation. No listed game is bundled, licensed or represented as implemented in this project.

## Implemented original games

The catalog now has five entries. Aurora Vault and Ember Relics join Temple Lights, Orchard Numbers and Reef Party. Both new games have real authenticated practice endpoints, durable server-generated sequences, history recovery and interactive presentation. Guest versions use reproducible storyboards and are labeled separately.

**Aurora Vault (practice-v1):** 15 cells, three initially locked crystals, three pulses. Each empty cell has a fixed 1/12 chance of receiving a crystal per pulse. New crystals reset the counter to three. The sequence ends at a full board or zero pulses. Crystal colors are decorative; collecting crystals awards no credits. Locked cells never change. These rules apply equally to every player. They are practice mechanics, not an approved credit-staked bonus or slot distribution.

**Ember Relics (practice-v1):** 6 columns × 5 rows, five equally likely relic symbols. Groups of at least four matching edge-connected symbols clear together. Survivors retain their order and drop downward; random replacements enter above them. The sequence ends at no groups or after six cascades. A terminal board at the six-cascade cap can still contain a group, which is intentionally not cleared; the interface reports the limit. No stake, paytable, credit award or conversion exists.

The server samples and commits the complete sequence before sending it. Actor-scoped request keys return the same committed response on retry. A key reused for a different game is rejected. Input cannot supply a grid, award, seed or RNG. History returns only the authenticated player's records. Clients never write wallet projections. Credit-staked endpoints remain closed for all five games.

## Motion and presentation

- Two original generated environments, repository-authored faceted symbols, responsive cabinets, counters and distinct game boards. Prompt provenance is in `../reports/art-prompts-v3.json`; hashes are in `../reports/asset-manifest.json`.
- Aurora: staggered crystal arrival, locked cells, ambient particles, pulse meter, progression and final collection count.
- Ember: falling symbols, cluster highlight, removal and replacement phases, cleared count and capped sequence completion.
- Temple: five vertically translating reel strips with staggered duration, deceleration and landing; final visible cells match the saved grid.
- Keno: animated draw-ball track and match highlights.
- Reef: aimed cannon, visible projectiles and expanding net, alternating swimming directions, tail movement and original ray silhouettes. These effects remain presentation only; shared fishing is still the existing HTTP practice implementation.
- Fast playback and Show Result do not issue another request or alter the saved result. Reduced motion renders the final board immediately. Offline/background interruptions end the local reveal on its committed result. No new requests are initiated while inactive. Existing native authentication and production fish transport limitations still apply.

## Delivery limits

This change does not finish credit-staked rounds, production multiplayer simulation, native secure sign-in, APK/IPA builds or physical-device acceptance. It does not select the meaning of the owner's 30% target. See `LOCAL_MVP.md` for the complete product gap list.

No database migration is needed: existing immutable practice result JSON stores the new versioned sequences. Rolling back the code must retain those history records and original art. There are no wallet or ledger migrations, balance changes or destructive data operations in this ticket.
