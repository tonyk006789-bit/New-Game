# JUWA reference and original arcade cabinets — 22 September 2026

The owner explicitly requested more implemented games and a direction closer to illustrated casino machines instead of cinematic HD environments. This supersedes the quieter original design brief where the two differ. User screenshots remain private references; no JUWA game assets, names, code, credentials or math are included in the app.

## Research observations

- The supplied [JUWA landing page](https://m.juwa2.com/) was opened with both web research and the in-app browser. The rendered page exposes a **Play on Web** link as well as Download APP. The text-only web reader did not expose this link.
- Following that link opened [JUWA's public web lobby](https://w.juwa2.com/game/home). Its rendered layout showed a login control, category buttons, compact rows of illustrated posters, bold outlined titles, brightly colored gems/characters and sections for new/popular games. These are direct browser observations; no account was created, no app downloaded and no authenticated game outcome was inspected. The text-only research reader could not retrieve this dynamic lobby.
- The eight supplied screenshots give stronger guidance for the requested landscape app: category marquees, two rows of cards, cream reel windows, large outlined symbols, metallic frames, saturated colors, a large spin control, and dedicated keno/fish scenes.
- Search results contained numerous third-party JUWA download/marketing sites and similarly named store listings. Their publisher identity, claimed probabilities and promises were not accepted as authoritative evidence. None were dependencies or art sources.

The visual approach is feasible with the existing Vue/TypeScript and PixiJS stack. This implementation demonstrates it locally using original SVG symbols and scenery, CSS cabinet treatments, native Web Animations for staggered reel strips, and the existing Pixi fishing renderer. No engine switch is necessary for these additions. Physical-device performance remains unverified.

## Eight original games

| Game | Implemented free-practice mechanics |
|---|---|
| Neon Sevens — new | 3×3 grid, five lines: middle/top/bottom and two diagonals. Three identical symbols form a match. Seven, cherry, bell, BAR and gem symbols. |
| Jade Fortune — new | 5×3 grid, nine explicit line paths. Dragons are wild; the first non-wild symbol defines a left-origin run. Three or more count as a match. An all-dragon line counts once. |
| Coin Carnival — new | 3×3 grid. Middle-row coins lock the entire column. At most three respins redraw only unlocked columns; no counter resets. End at three locked reels or zero remaining respins. |
| Aurora Vault | Fifteen cells; three initial crystals; newly locked crystals reset three pulses. |
| Ember Relics | 6×5, edge-connected clusters of four or more, survivor gravity and at most six cascades. |
| Temple Lights | 5×3, horizontal matching runs from the left. |
| Orchard Numbers | Pick 4–10 of 80, reveal twenty unique numbers and count matches. |
| Reef Party | Shared four-seat branch-scoped practice table with single-capture authority and no synthetic players. |

For the three new games, each symbol in the game's practice list is sampled uniformly by the server's cryptographic RNG. This is only a clearly separated, nonpayable demonstration model: there is **no approved production probability target, paytable, stake, award, RTP or conversion**. No payout percentage was inferred from JUWA or Stake.

Every signed-in round is generated and persisted transactionally before presentation. The client only animates that stored sequence. Stop, faster animation, offline interruption and reduced motion cannot select a new result. Concurrent retries use the existing actor-scoped durable request key; request bodies cannot supply a grid, seed, award or lock state. Wallets are unchanged. Guest previews use reproducible local storyboards.

## Visual implementation

- Four tiles per row on desktop/landscape and two on narrow portrait screens; eight unique selectable games, search and favorites.
- Original cherries, red sevens, BAR plaques, bells, coins, wild dragon and illustrated fish; existing original celestial/gem symbols remain.
- Neon category signs, radial poster graphics, gold outlined titles, lacquered cabinets, marquee lamps and large green spin controls.
- Reel deceleration and staggered stops, highlighted line paths, persistent locked columns during subsequent respins, collection lamps, explicit remaining count, and a result-skip control.
- Existing slot, keno, crystal, cascade and fish backgrounds changed to arcade patterns/vector scenery. Earlier cinematic images are preserved as historical assets but no longer selected by these player screens.
- No fake progressive jackpots, fake occupancy, auto grants or fabricated payouts. The player interface remains explicit about practice.

## Remaining boundaries

This iteration does not complete native credential storage, TLS deployment, production game settlement, approved mathematics, physical-device testing, sound/music, provider integration or app-store distribution. Browser emulation and Capacitor asset sync are not native certification. No new dependency, paid service or remote deployment is introduced.
