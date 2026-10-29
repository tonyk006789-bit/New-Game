# V50 game-rules review — 29 October 2026

Reviewed the executable evaluators, player rules, profile routing and catalog for all 31 games. There is no single universal casino rulebook for every slot or fishing cabinet. This private play-credit platform has custom test mathematics; it is not a certified casino implementation.

## Reference comparison

- Blackjack card values, dealer competition, hit/stand/double/split, 1:1 wins, 3:2 naturals and returned-stake pushes follow the common structure described by [Bicycle](https://bicyclecards.com/how-to-play/blackjack). Deck count, soft-17 behavior, splitting limits and insurance are house choices; each variant below must be read separately.
- Commercial slots define their own paylines, wild behavior and feature rules. Fixed lines and different bonus features are normal, rather than a requirement that every game use diagonals. See [PokerStars' slot rules overview](https://www.pokerstars.es/help/articles/casino-slots-rules-overview/76459/). Our multipliers apply to the total round stake, not a separately priced line bet.
- The 20-distinct-numbers-from-80 structure is consistent with [The Lott's Keno explanation](https://help.thelott.com/hc/en-us/articles/4416859934873-How-do-I-play-the-Keno-game). Our 4–10 selection range, linear match rewards and conditioned draws are custom; they are not that operator's product or paytable.
- [UK Gambling Commission RTS 7](https://www.gamblingcommission.gov.uk/manual/remote-gambling-and-software-technical-standards/rts-7-generation-of-random-outcomes) is a useful engineering benchmark for outcomes matching disclosed probabilities, real-device simulation and rule changes. Our paying-first conditional sampler and live global rate setting should not be represented as a certified unconditioned casino RNG model. This comparison is not a legal determination about the private test platform.

## Important findings

1. Slot/Keno outcomes first choose paying versus nonpaying using the approved global setting, then sample a valid matching result. The resulting grid or draw always evaluates to its saved return. Keno therefore does **not** follow the ordinary unconditional hypergeometric draw distribution. Player rules now explicitly explain the two-step model.
2. The global 5%–50% setting means probability of any positive return, not profit frequency or RTP. A 1× return only returns the stake. The setting remains global, versioned and disclosed; it does not affect blackjack or fish.
3. The offline V50 sample used 20%, 10,000 rounds per case, 21 Slot/Keno games plus all seven Keno pick counts: 280,000 rounds. Sample paying frequency across the 21 games was 19.09%–20.37%; gross return was 26.65%–117.16%. Celestial Wilds exceeded 100% in that sample. This is an explicit indication that the custom economy is not tuned to a common casino return target, not a certified RTP estimate or production approval. Full data: `rules-simulation-v50.json`. No live setting was changed.
4. Exactly eight of sixteen Slots now have only three horizontal winning rows. Existing per-match multipliers stay unchanged, but removing lines changes the conditional award distribution and can change expected return. Seven changed cabinets have a new `stage-straight-v50` profile; Temple already used horizontal rows. Old receipts retain their original paylines and awards.
5. Dashboard Minor/Major/Jackpot are independent virtual displays. They increase on a six-hour clock cycle and restart. They have no contributions, eligibility, winners, payouts or ledger effect; they are labeled display-only and cannot be won. They are **not** progressive jackpot liabilities. Fish wheel targets continue to pay the existing boss catch award.

## Coverage of every catalog game

All slot and keno rows below use the custom global paying-round sampler. Listed multipliers are total returns including stake, unless blackjack profit is explicitly stated.

| Game | Current implemented rules | Review result |
| --- | --- | --- |
| Neon Sevens | 3 reels, 3 horizontal rows; matching triples 1×/2×/2×/3×/5× by symbol | V50 horizontal-only; custom paytable |
| Ruby Rush | Same triple evaluator with expedition symbols | V50 horizontal-only; custom paytable |
| Disco Diamonds | Same triple evaluator with music symbols | V50 horizontal-only; custom paytable |
| Outlaw Sevens | Same triple evaluator with western symbols | V50 horizontal-only; custom paytable |
| Jade Fortune | 5 reels, 3 horizontal rows; left-origin 3/4/5 matches 2×/4×/8×; substituting wild; one payment per row | V50 horizontal-only; custom paytable |
| Sapphire Crown | Same five-reel evaluator with crown wild | V50 horizontal-only; portrait retained |
| Midnight Express | Same five-reel evaluator with locomotive wild | V50 horizontal-only; portrait retained |
| Temple Lights | 5 reels, 3 horizontal rows; left-origin 3/4/5 matches 2×/3×/5× | Existing horizontal-only profile preserved |
| Celestial Wilds | 5 reels, 9 paths including diagonals/zigzags; 3/4/5 matches 2×/4×/8×; moon wild | Original nine-line evaluator preserved; custom returns |
| Coin Carnival | Center coin locks its reel; up to 3 included respins; all 5 center coins pay 5× | Collection feature, not a line-match slot |
| Solar Fortune | Same center-coin collection shown as one visible row | Collection evaluator preserved |
| Pirate Gold | Same collection evaluator with doubloons | Collection evaluator preserved |
| Aurora Vault | Start with 3 locked cells; new locks reset 3 pulses; 15-cell board; return `max(0, locked − 7)×` | Custom hold feature; no extra respin stake |
| Clockwork Vault | Same lock/pulse evaluator with gears | Custom hold feature preserved |
| Ember Relics | Edge-connected groups of 4+ clear on 6×5; maximum 6 cascades; return `floor(total cleared / 12)×` | Custom cluster feature; diagonals do not connect |
| Phoenix Falls | Same cluster/cascade evaluator with phoenix relics | Custom cluster feature preserved |
| Orchard Numbers | Pick 4–10; draw 20 distinct from 80; 4–6 picks return `max(0, hits − 1)×`; 7–10 return `max(0, hits − 2)×` | Keno structure; custom conditioned draw/paytable |
| Neon Numbers | Same Keno evaluator; Quick Pick selects editable numbers | No separate bonus stake or better preset odds |
| Pearl Keno | Same Keno evaluator with pearl presentation | Custom Keno rules preserved |
| Meteor Keno | Same evaluator; constellation presets only select numbers | Custom Keno rules preserved |
| Bamboo Keno | Same evaluator; lantern presets only select numbers | Custom Keno rules preserved |
| Royal Blackjack | 6 decks freshly shuffled each round; stand all 17s; 1:1 win profit, 3:2 natural profit, push returns stake; initial 0.50–20.00 in 0.50 steps; first-two-card double; one same-rank split; split aces one card; no insurance/surrender | Common blackjack structure with disclosed house restrictions; sole credit-enabled blackjack profile |
| Double Deck Blackjack | 2 decks, hit soft 17, double only totals 9/10/11; otherwise shared split and payout rules | Implemented free preview only; new credit mathematics still unapproved |
| European Blackjack | 6 decks, no dealer hole card until settlement; dealer natural takes all non-natural wagers including split/double amounts | Implemented free preview only; new credit mathematics still unapproved |
| Reef Party | Small/medium/large/boss paid-hit capture 15%/10%/5%/2%; returns 1×/3×/8×/20× | Custom arcade capture model |
| Abyss Legends | Same capture model; chest medium, wheel boss | Presentation adds no extra award |
| Sunken Dynasty | Same capture model with dynasty species | Custom fish rules preserved |
| Polar Odyssey | Same capture model with polar species | Custom fish rules preserved |
| Corsair Cove | Same capture model with harbor species | Custom fish rules preserved |
| Cosmic Tides | Same capture model with cosmic species | Custom fish rules preserved |
| Coral Rush | Same capture model with coral species and tidal lanes | Original reference-inspired game, not provider/private mathematics |

Fish catches have independent chances, not accumulated health or a guaranteed number of hits. Expected gross return per valid hit is 15%/30%/40%/40% for the four tiers. Misses/expired or already-caught targets do not charge. Labeled AI crew have separate, non-credit combo points and never change player odds or add capture attempts. No universal casino fishing standard was established from the reviewed primary references.

Blackjack splits require identical rank, not merely two ten-valued cards. Split 21 is a regular win, not a natural; double after a non-ace split is allowed if that variant's total restriction permits it. Unattended accepted hands stand and settle after five minutes. The server keeps the shoe private and reserves additional split/double stakes. No blackjack rule was changed in V50.

Daily wheel is outside the 31-game catalog: nine approved equal-chance values (0, .05, .10, .15, .25, .75, 1.50, 3.00, 5.00), once per 24 hours with positive available credits. It remains a custom test feature, not a new jackpot.

## Scope and limitations

Review evidence consists of source/rules comparison, regression tests, isolated PostgreSQL tests, seeded simulation and browser checks. It does not establish provider equivalence, certified randomness, production mathematical approval, native-device performance or regulatory compliance. Changes to Blackjack variants, conventional unconditioned Keno, or a real paying jackpot would need their own concrete policy and approval; none were enabled here.
