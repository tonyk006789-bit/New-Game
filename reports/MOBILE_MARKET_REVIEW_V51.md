# V51 mobile-market comparison — 29 October 2026

Scope: all 31 current cabinets (16 slots, five Keno, seven fishing tables, three blackjack variants), their catalog metadata, controls, rules, assets, animation code and phone-sized browser screens. This is a presentation and usability iteration. No payout, probability, ledger or account policy changes.

## Evidence and its limits

Public Google Play listings were read; representative store gallery images were opened for Jackpot Party, Keno Four Card, Casino Blackjack and Dragon King. Jackpot Party's linked official trailer was sampled at its opening cabinet montage and final reel/win sequence. That is promotional evidence, not a measurement of live spin timing. No third-party credit-staked play, APK extraction, private provider APIs or proprietary asset copying was performed. Store descriptions are publisher claims; review anecdotes and star ratings were not treated as verified gameplay mathematics or performance measurements.

All 31 local cabinets were opened at 844×390 landscape or 390×844 portrait; their rules metadata was read through the UI and a screenshot captured. Loading-state captures were revisited. This is browser emulation on this Windows machine, not Android/iPhone hardware certification. Representative local play and free blackjack decisions supplement those entry-screen checks; this is not an exhaustive playthrough of every possible game outcome.

## Primary reference register

| Key | Source | What was actually useful |
|---|---|---|
| S1 | [Jackpot Party — SciPlay](https://play.google.com/store/apps/details?hl=en&id=com.williamsinteractive.jackpotparty) | Gallery: large reels, framed winning symbols, prominent spin/stake controls and decorative characters outside the result area. [Official linked trailer](https://www.youtube.com/watch?v=-ZUFy7MIxJg): cabinet montage and reel-result emphasis, sampled only. The listing's large themed catalog is a publisher claim, not a reason to reproduce its bonus economy. |
| S2 | [Slotomania — Playtika](https://play.google.com/store/apps/details?hl=en-US&id=air.com.playtika.slotomania) | Listing: themed cabinet discovery and social/event features. We keep recognizable covers and concise mechanics; clubs, tournaments and promotional grants are separate product work. |
| S3 | [Cashman Casino — Product Madness](https://play.google.com/store/apps/details?hl=en&id=com.productmadness.cashmancasino) | Listing: distinct cabinet features and collection breadth. This supports explaining our collection/lock mechanics clearly; it does not establish a common payout standard. |
| K1 | [Keno Four Card — Senior Games Club](https://play.google.com/store/apps/details?hl=en&id=com.keno.classica) | Gallery: current ticket and match-return table close to the board; quick/erase controls; selected and hit cells visibly differ. Four-card wagering and its extra features are not implemented here. |
| K2 | [Keno — Ironjaw Studios](https://play.google.com/store/apps/details?hl=en&id=keno.numbers.board) | Listing: quick selection, erasing and pace controls. Our five Keno games already had those controls, but Quick Pick incorrectly repeated one fixed example. |
| B1 | [Casino Blackjack — Blue Wind Studio](https://play.google.com/store/apps/details?hl=en&id=com.bluewind.blackjack) | Gallery: readable ranks, prominent hand total, curved table, chip/stake placement and explicit bust result. The illustrated rules differ from ours and were not copied. |
| B2 | [Blackjack by MobilityWare+ — Apple App Store](https://apps.apple.com/us/app/blackjack-by-mobilityware/id6469052640) | Listing/release notes describe split-card, flip and chip-animation polish and distinct tables. Public iPhone/iPad support is distribution metadata, not proof our web app runs natively. Apple's listing reports 120.2 MB; that installed-app figure is not comparable to an individual web cover. |
| B3 | [Blackjack — Clockwatchers](https://play.google.com/store/apps/details?hl=en_US&id=com.clockwatchers.blackjack) | Listing: large cards and uncomplicated play. Supports emphasizing the current decision rather than adding a new side-bet interface. |
| F1 | [Dragon King: fish table games](https://play.google.com/store/apps/details?hl=en&id=com.yueyou.topfish) | Gallery: four corner cannons, differentiated creatures, a large boss, highly layered hit effects and reward numerals. Dense promotional imagery reinforces the need for readable targeting feedback in our own scenes. It does not disclose capture algorithms. |
| F2 | [Banca Fishing](https://play.google.com/store/apps/details?hl=en&id=com.gold.fishing.banca.game) | Search-indexed publisher description: themed bosses and fortress/cannon presentation. Full-page retrieval timed out; used only as a limited thematic reference, not verified animation evidence. |
| A1 | [Android accessibility guidance](https://developer.android.com/guide/topics/ui/accessibility/apps) | At least 48dp touch targets. Our browser checks use CSS-pixel bounds as a practical approximation, not native dp certification. |

Store metadata can vary by country, device and cache. For example, the live Nepal Dragon King page identified Wildego while cached text used DeeDeeFun. The audit records URLs and observed presentation, not an asserted global publisher/age-rating snapshot. Ads, in-app purchases, privacy labels and age ratings belong to those publishers; none is copied into our metadata.

## Changes implemented

1. **Ticket clarity across five Keno games.** A readable ticket dialog shows every selected number across board pages, distinguishes matches with a checkmark and color, and gives the complete return ladder for 4–10 picks at the selected stake. It clearly distinguishes the paytable from historical receipts. Native modal focus, Escape handling, scroll, close target and reduced-motion behavior are covered. Quick Pick now samples six unique editable numbers rather than repeating the old six-number example. It never generates or changes an outcome.
2. **Game facts across all 31.** Rules panels show intended orientation, mechanism, minimum stake and credit/preview mode. The two unapproved blackjack variants are labeled FREE PREVIEW on the shelf and walking-floor cabinet, before entry.
3. **Blackjack decisions across three variants.** The active hand is more obvious. During the player's turn, the UI explains double/split eligibility or the extra available credits required. Server-provided available actions remain authoritative. No basic-strategy recommendation, insurance, surrender or side bet was introduced.
4. **Fishing target clarity across seven tables.** Lock-on identifies the species, tier, per-hit chance and current-stake catch return. It updates only when the target or stake changes, not every animation frame. Species guides include per-hit capture chances. Opening the species guide stops AUTO and requires a deliberate restart. AUTO's active cadence is explicit; it is no longer labeled merely “cannon ready.” No invented health bar, extra capture attempts or hidden bots.
5. **Slot result presentation.** Bounded staggered symbol emphasis follows settled matches, with reduced-motion support. Reel accessibility labels describe the actual final symbols row by row. Existing downwards motion and braking remain. Temple Lights' legacy viewport-relative height was corrected to use the fixed game frame; its reels now fill the available landscape area instead of leaving a large blank lower region.
6. **Cover resilience.** Existing full covers and optimized 240/480 WebP variants are retained. Covers reveal after loading; a failed image shows a readable fallback rather than a broken-image icon. No extra character overlay, shimmer loop, image request or larger artwork was added. Coarse-pointer shelf controls retain 48px hit areas even on wider touch displays.

## Every-game comparison and disposition

Every row received the shared facts/rules metadata and shelf/asset checks. “Preserved” means reviewed existing behavior, not a claim of a new game mechanic.

| Game | Reference | Game-specific review / refinement |
|---|---|---|
| Temple Lights | S1/S2 | Fixed wasted landscape height; large five-reel board; three horizontal rows, actual symbol names and settled-match emphasis. |
| Neon Sevens | S1 | Neon travel symbols; three horizontal lines; readable row result and bounded match emphasis. |
| Ruby Rush | S1 | Expedition symbols and three current horizontal lines; historical five-line receipt warning retained rather than rewritten. |
| Disco Diamonds | S1/S2 | Music-themed symbols; three horizontal triples; slot feedback refinements, no duplicated generic 777 paytable art. |
| Outlaw Sevens | S1/S2 | Western symbols; three horizontal triples; correct current line count and minimum displayed. |
| Jade Fortune | S1/S3 | Wild dragon/tea/court symbols; left-origin matches across three rows; wild semantics and line map preserved. |
| Sapphire Crown | S1 | Portrait crown/wild cabinet; three current rows; portrait scaling and stake controls checked. |
| Midnight Express | S1 | Portrait locomotive wild; larger reel area preserved; current three-row rules surfaced. |
| Celestial Wilds | S1/S3 | Portrait moon-wild cabinet; nine lines remain intentionally different from the horizontal-only group. |
| Coin Carnival | S3 | Center-row collection locks whole reels; three respins, no counter reset; locked reels remain distinct. |
| Solar Fortune | S3 | Single-row solar collection; five required targets; no claim of line wins or extra respin wager. |
| Pirate Gold | S3 | Doubloon collection, held-reel lamps and remaining respins; pirate art preserved. |
| Aurora Vault | S3 | Portrait 15-cell hold board; new locks reset three pulses; collection return remains custom. |
| Clockwork Vault | S3 | Portrait clockface/gear collection; independent identity with shared approved vault evaluator. |
| Ember Relics | S1/S3 | 6×5 connected-group clears; bounded fall/removal effects, no diagonal clusters. |
| Phoenix Falls | S1/S3 | Phoenix cascade board; loading readiness revisited; shared cascade rules explicitly retained. |
| Orchard Numbers | K1/K2 | Ticket/paytable, true Quick Pick and paged selection review; harvest identity preserved. |
| Neon Numbers | K1/K2 | Ticket/paytable and match checkmarks; circuit theme; no new bonus stake. |
| Pearl Keno | K1/K2 | Ticket/paytable; pearl number shapes remain readable; no separate prize pool. |
| Meteor Keno | K1/K2 | Ticket includes picks from all number pages; constellation presets remain editable and do not change odds. |
| Bamboo Keno | K1/K2 | Same ticket improvements; lantern presets and landscape cell spacing checked. |
| Royal Blackjack | B1/B2/B3 | Six-deck approved credit profile, visible active-hand/decision costs; saved hand display checked. |
| Double Deck Blackjack | B1/B2 | FREE PREVIEW before entry; two decks, H17 and restricted doubles; free-preview dealing/decision flow tested. |
| European Blackjack | B1/B2 | FREE PREVIEW before entry; second dealer card later and all-bets dealer-natural rule remain explicit. |
| Reef Party | F1/F2 | Lock species/chance/award; separate AI points; loaded scene revisited. |
| Abyss Legends | F1/F2 | Abyss characters/cannons retained; locked target info; boss wheel still an existing 20× catch. |
| Sunken Dynasty | F1/F2 | Dynasty species and jade cannons; loaded scene and lock information checked. |
| Polar Odyssey | F1/F2 | Ice creatures/crystal cannons; target tier/return without fake cumulative health. |
| Corsair Cove | F1/F2 | Harbor and bronze cannons; initial empty/loading capture replaced with populated scene. |
| Cosmic Tides | F1/F2 | Alien species and plasma cannons; same readable target information and explicit chance. |
| Coral Rush | F1/F2 | Tidal lanes, coral characters and intercept lock; no inferred JUWA assets or hidden math. |

## Important remaining gaps

- **Hardware performance:** cold start, GPU thermals, memory pressure, background recovery, sound interruptions, safe areas and screen-reader behavior need real Android/iPhone testing. Desktop viewport tests cannot certify “no lag.”
- **Art/animation production:** blackjack has a rigged dealer and readable card layer, but is not motion-capture/live-action quality. Store promotional videos cannot supply finger physics. Professionally authored animation clips and lower-device LOD work remain separate production improvements.
- **Scene payloads:** thumbnail delivery is already small; dealer geometry/textures and scene-specific art are the larger cold-start risks. This iteration preserves on-demand loading. A new compression/LOD pipeline requires measured device baselines, not arbitrarily shrinking all imagery.
- **Gameplay breadth:** several themed cabinets intentionally share approved evaluators. Four-card Keno, new side bets, bonus economies, missions, free-spin packages, multiplayer tournaments and additional payout profiles were not silently added from competitor listings.
- **Economy:** our slot/Keno paying-round construction and fishing capture model remain custom tests. Production targets remain unapproved; the V50 rules review and return simulation still apply. Virtual dashboard pools remain clearly display-only.
- **Release metadata:** no Play/App Store release listing, final screenshots, rating questionnaire, privacy/data-safety submission or store approval is implied. Platform account deletion/data retention requirements need a release-specific review before submission.
- **Maintainability:** accumulated CSS layers still make responsive regressions possible. Temple's height defect demonstrates why the next structural UI work should consolidate per-game layout ownership after these visual baselines, without changing all styles at once.

## Evidence locations

`reports/screenshots/v51/` contains all 31 phone captures, the UI metadata audit JSON, reference comparison contact sheets and representative interaction/performance evidence. Generated screenshots remain local under the repository's existing ignore policy. Exact checks, publication and rollback are in `REFINEMENT_V51.md`.
