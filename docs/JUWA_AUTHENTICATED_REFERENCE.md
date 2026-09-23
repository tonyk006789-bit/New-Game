# Authenticated JUWA reference study — 23 September 2026

The owner signed into JUWA in Chrome and requested a detailed study of its games, UI, UX and motion to refine New Game. This document records observations, their limits and the original implementation they informed. It does not contain the owner's account details, session data, provider code or downloaded game assets.

## What was accessible

| Reference | Evidence and limits |
| --- | --- |
| [Authenticated web lobby](https://w.juwa2.com/game/home) | Inspected rendered Home, Slots, Fish and Keno categories; recent, new, popular and VIP shelves; poster styling and navigation. This is the web lobby, which differs from the landscape app screenshots supplied earlier. |
| [Lightning Shot Respin](https://w.juwa2.com/game/383_1) | Cabinet loaded. Inspected idle reel layout, symbols, cabinet trim, scrolling feature marquee, meters and physical-style controls. No Spin/Auto action was initiated. |
| [Amazing Diamonds Hold 'N' Link](https://w.juwa2.com/game/367_2) | Cabinet loaded. Inspected reel layout, fruit/BAR symbols, meter bar, button deck and the separate paid bonus control. Left open for the owner to operate. No Spin/Auto/bonus action was initiated. |
| [Fortune Tiger](https://w.juwa2.com/game/116_1) | Entry and branded loading presentation observed. It did not reach a usable cabinet before returning to the lobby. No gameplay claims are made for it. |
| Fish collection | Six posters carry an APP/download badge. The browser did not provide their in-game scenes. The owner's existing fish/table screenshots remain the in-game visual reference. |
| Keno collection | Five posters carry the same APP badge. Selecting Buffalo Keno did not navigate into a playable browser cabinet. The owner's supplied Farm Life and Buffalo Keno images remain the board references. |

This is a catalog and presentation study of accessible screens, not a complete extraction of every title, its assets, audio, mathematical model or bonus sequence. Live spin/capture actions on the external prize-based platform require the owner to operate the controls. The owner agreed to do so and tell us when to observe; that observation is still pending. Entry loading effects and the idle marquee were observable. Exact spin durations, win count-up timing, sound and bonus transitions have not been measured.

## Catalog observed

These names identify references only; they are not games supplied or licensed by New Game. Some poster filenames differ slightly from their visible typesetting. Lazy-loading placeholders were excluded, so this is not an assertion that the entire provider catalog was enumerated.

- **Classic/reel and feature posters:** United 7s, Simple Dollar, Simple Dollar 2, Simple Triple, Big Cash Wheel, Fortune Tiger, Burning Gold Diamond Frenzy, Jungle Wild, Invaders from the Planet Moolah, Wheel of Fortune, Wolf Run, Powerbucks Wheel of Fortune, Wild Fever, Oh My Girls, Buffalo Rush, Silver Lux Big Win Spinner, Diamond 7 5th Reel, Super Cash Drop, Lock Breakers Goblin Bros, Lightning Shot Respin, Red White Blue, Golden Horn, Cash Eruption Hoggin Cash, Cash or Nothing, Money Roll, Carnival in Rio, Fire Buffalo, Captain Lobster, The Big Lap Rapid Link, Huge Dollar, Flaming Mustang, Santa's Gift/Santa Bonanza poster, Cherry Valentine, Fruit Mary, Hexo Gems, Moolah Bingo, Jackpot Inferno, Fortune Lion, President 45, Loteria Don Clemente La Sirena, Lucky Dama Muerta, Rubber Duck Hold 'N' Link, Amazing Diamonds Hold 'N' Link, Cash Eruption.
- **Fish:** Cash Cow, Dragon Treasure, Deep Sea Behemoth, Happy Fishing, King Kong's Rampage, Deep Sea Predator.
- **Keno:** Superball Keno, Hexa Keno, Megaball Keno, Buffalo Keno, Farm Life.

Names/illustrations alone do not establish a game's mechanic, reel count, hit rate, RTP, paytable or feature probabilities. Similar themes can use different mechanics.

## Direct visual observations

### Lobby

The browser lobby has a fixed narrow purple brand/balance bar, black surrounding space, and an approximately 800px central content column at the inspected desktop size. There are seven small portrait posters per row. Artwork occupies most of each card; a saturated color block carries the title at its foot. Category controls use a bright active fill. Small favorite stars stay in a consistent corner. New/Popular/VIP are separate shelves, with arrows on some shelves. The recent shelf reflected actual opened titles.

The earlier supplied app screenshots instead use landscape poster grids, themed building marquees and large next/previous arrows. The supplied fish secondary-lobby screenshot uses a furnished room, angled tables, characters, chairs and seat markers. These are separate presentation surfaces; neither proves the web page has a walking character or that depicted seats are actual online players.

### Slot cabinets

Both loaded examples have three broad reels with three visible rows, oversized symbols, little space between columns, dark saturated reel beds and thin contrasting separators. New Game retains the owner's requested five-column layout. The useful lesson is symbol scale and screen allocation, not the reference's column count.

Lightning uses electric blue/cyan trim, magenta separators, large BAR plaques and a red multiplier wild. Amazing Diamonds uses a red/gold cabinet, purple/blue reel beds and oversized double-fruit symbols. Peripheral machine-room imagery frames the active cabinet. A compact horizontal meter strip directly under the reels separates bet, win and balance. The next row is a physical button deck: contrasting raised surfaces, minus/plus bet controls, a dominant spin button and smaller secondary controls. Game titles are integrated into the cabinet art.

Some reference displays show multiple named jackpots and a priced bonus entry. These are not decorative features we can safely imitate without corresponding approved mechanics. No fictional jackpots, paid bonus purchases or advertised multipliers were added to our games.

### Motion and gameplay evidence

The reference uses a branded loading interstitial, including a reel-shaped loading bar. Lightning's feature text moves across its top display. Static screenshots show symbol gloss, line markers and prior result meters, but do not reveal how the outcome was generated or how it animated into place.

The existing user-supplied fish screenshots show creatures of markedly different size and silhouette, repeated small-fish formations, large central targets, peripheral coral/rocks/treasure, four edge cannon positions, projectile/net effects, and auto/lock controls. These are visual observations from still images. Projectile velocity, capture odds, targeting arbitration and animation frame rates cannot be measured from them.

## Original refinement implemented in this ticket

1. **Neon Sevens, Jade Fortune, Coin Carnival:** expanded five-reel playfields; narrow illuminated side counters replace large prose panels; distinct blue, jade and red/gold treatments; a compact metallic control deck; line-map access now remains available on a narrow screen.
2. **Shared reels, including Temple Lights:** short mechanical take-up, sustained rolling travel, staggered braking, a small landing recoil and stop illumination. Fast and Stop only affect presentation. The final grid still comes from the already accepted result.
3. **Credit returns across games:** a compact, integer-unit win meter counts up only after a newly completed round. Restored values and reduced-motion/background states settle immediately. The accessible label contains the exact amount; the visual counter never writes credit balances.
4. **Aurora Vault and Ember Relics:** more screen space for the actual board and a compact progress counter; removed the redundant right-side explanation panel.
5. **Ocean Lounge:** animated water and six original painted aquatic silhouettes, four distinct original cannon stations, metallic table edging and a room backdrop. Four selectable seats and occupancy remain driven by the existing server data. Empty seats are not populated with bots.

All images come from the existing original project art. No external asset URLs, source code, account credentials, content bundles or runtime dependency on JUWA were added. Mechanics, odds, stake limits, backend authorization, ledger settlement and five hosted tester balances are unchanged by the code change.

## Next evidence needed

- Owner-operated examples of spin → stop → line highlight → return → next-ready, and a triggered bonus, before claiming exact reference timing or sound coverage.
- App recordings for fish movement, cannon recoil, target locking and fish-wave transitions. The browser-only session cannot establish app behavior.
- Original per-theme sound/animation assets and more distinct symbol families remain further refinement work; this ticket reuses existing original art.
- Android/iPhone lifecycle and performance checks still require physical devices. Browser layout checks are not native acceptance.

No database migration is needed. Rollback can redeploy the preceding player build without changing any accepted results, accounts or ledger history. See `../reports/REFINEMENT_V9_VERIFICATION.md` for acceptance evidence.
