# Local staging

Player: **http://127.0.0.1:5183**. Admin: **http://127.0.0.1:5184**. API: **http://127.0.0.1:3001/v1**.

Sign in as `stage.player`, using the password in the ignored local file `.local/staging/player-credentials.json`. This player receives one explicit **1,000.00-credit** manual adjustment. Verification uses different QA accounts. Staging credits cannot be purchased, redeemed, cashed out or converted into prizes.

Walk through the interactive lobby and choose a game. Select **0.25–20.00 credits in 0.25 steps**, using minus/plus, the amount selector or MAX. Spin, Draw, start its feature, or target a fish. Reef Party opens its own Ocean Lounge: choose an existing table/seat or open a new four-seat table. Fish cannons offer auto fire, target lock and a faster firing cadence. Auto fire stops on stake changes, background/offline transitions and leaving the table.

The manual Recover Round button and statistics panel remain removed. On 25 September the owner requested game rules again: each game now has a Rules dialog with controls, mechanics, return rules and applicable payline diagrams. Play History retains saved results. Interrupted responses reconcile automatically on reconnection: an accepted round restores its saved result; an unaccepted request is closed without placing a stake. Normal spins do not show a recovery banner. While reconciliation is unresolved, new stakes stay disabled and a small connection status replaces the old panel. The experimental paytables remain documented below and account-scoped statistics remain available on the backend.

For the five-person shared test, see [SHARED_TEST.md](SHARED_TEST.md). Those five separate accounts each received an explicitly authorized, one-time 1,000-credit manual adjustment. Startup does not refill them.

## Experimental rules

Version: `stage-paying30-v2`. Neon and Coin now have five reels; accepted v1 receipts retain their original grids and awards and replay unchanged. The profile definition has a SHA-256 hash stored with every accepted result. Production `game_profiles` stays empty; `config/product-decisions.json` retains null production mathematics. `/games/:id/rounds` remains closed.

Each non-fish round independently selects paying with probability 0.30 using server cryptographic randomness, then conditionally samples a complete valid grid/sequence/draw that evaluates to a positive award, or to zero for a nonpaying round. Consequently the symbols and keno draws are **conditioned**, not an unconditioned uniform-draw casino model. No player history, operator budget or loss recovery affects selection. Retries return persisted results. Sampler exhaustion rolls back the entire request without a charge.

These are **provisional engineering paytables for the authorized local experiment**; the owner has not selected a production credit-return target. Multipliers below mean total credits returned relative to the entire round stake, not additional profit.

| Game | Experimental evaluation |
| --- | --- |
| Neon Sevens | Five reels, five lines. Three left-origin matches: cherry 1×, bell/BAR 2×, gem 3×, seven 5×. Four matches double and five quadruple that award; add matching lines. |
| Jade Fortune | Nine left-origin lines; dragon wild; 3/4/5 matches pay 2×/4×/8×; add matching lines. |
| Coin Carnival | Five center coins held after at most three respins pay 5×; fewer pay zero. |
| Temple Lights | Three horizontal lines; 3/4/5 matches pay 2×/3×/5×; add matching lines. |
| Aurora Vault | At least eight locked crystals: `(collected − 7)×`; fewer pay zero. |
| Ember Relics | At least twelve cleared relics: `floor(cleared / 12)×`; maximum six cascades. |
| Orchard Numbers | Pick 4–10, draw 20/80. For 4–6 picks: `(hits − 1)×`, minimum zero. For 7–10: `(hits − 2)×`, minimum zero. |
| Reef Party | Separate `reef-tiers-v1`: small 1×/30%, medium 3×/20%, large 8×/10%, boss 20×/4% per valid hit. Sixteen species share four size tiers. Invalid/expired/already captured targets are rejected without charging. Multiple cannon shots may travel and settle independently. |

The v2 offline run of 10,000 rounds per game returned paying frequencies of **29.35–30.96%**. Observed credit returns ranged **40.56–167.24%** across these provisional paytables. A 30% hit target alone does not specify an RTP. Several experimental games can grow balances on average; this is not a tuned or approved production economy. See `reports/staging-math-v2.json` for each result. Keno simulation uses six picks; actual statistics reflect the player's selections.

## Isolation and settlement

- Dedicated PostgreSQL database `new_game_staging`, login role `new_game_stage` (not superuser), private `.local/staging/runtime.env`, distinct session cookie `ng_staging_session` and loopback ports. Startup rejects staging mode against another database/role, a remote database or production mode. Staging origins are only the two local staging clients.
- Wallets start at zero. `fund-staging.mjs` logs in with Main Admin MFA and invokes the ordinary manual ADD endpoint with a persisted request key/body. It is an explicit one-time setup action, never part of application startup. Re-running it returns the original funding receipt, even after play.
- Actor-scoped durable ROUND idempotency and a wallet row lock protect settlement. The server commits the result, balanced GAME_STAKE and optional linked GAME_PAYOUT transactions, wallet versions and receipt atomically. Awards have no operator-budget condition. Available balance excludes reservations; it cannot be overdrawn.
- Immutable staging results are separate from nonpayable practice. Deferred SQL checks require their stakes and awards to match the ledger. Migration 006 reconciles the final wallet projection when a stake and award update it within one transaction.
- Fish seats remain real, branch-scoped participants. There are no fake players. Shared target locks allow one capture. The server checks room membership, target position in a common 1200×600 world, bounded observation time and capture state before settlement. Reduced motion uses discrete positions with corresponding observation timestamps.
- The browser persists only the pending request body/account ID in localStorage, never credentials. It blocks new client stake requests offline/backgrounded. An accepted transaction completes on the server. Closing before the response is recovered does not cancel its result.

## Run locally

Prerequisites: existing local PostgreSQL on 55432, Node 24 and installed pinned workspace dependencies. In the workspace:

```powershell
pnpm build:server
node --env-file=.local/runtime.env scripts/setup-staging.mjs
.\scripts\start-staging.ps1
node scripts/fund-staging.mjs
```

On later sessions, start the existing local PostgreSQL if needed, then run **only** `start-staging.ps1`. Setup is repeatable; it does not overwrite credentials. Funding is never performed automatically. Private files and credentials remain ignored by Git.

Verification commands:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:ledger
node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs
pnpm exec playwright test --config playwright.staging.config.ts
node scripts/staging-math-report.mjs
node --env-file=.local/staging/runtime.env scripts/reconcile.mjs
pnpm build
pnpm mobile:sync
```

## Presentation research and assets

The owner references emphasize an illustrated arcade machine: dense reel faces, strong symbol outlines, visible line/lock indicators, bright buttons and an underwater playfield framed by objects. Public [JUWA lobby](https://w.juwa2.com/game/home) inspection informed compact category navigation. [JDB Shade Dragons Fishing](https://www.jdbgaming.com/en/games/fish-shooting/shade-dragons-fishing) informed differentiated aquatic targets and layered underwater set dressing. [Playson's classic catalog](https://playson.com/games?slug=classic) and [3 Supercharged Diamonds](https://playson.com/article/sparkling-features-add-glamour-to-bonus-play-in-playsons-3-supercharged-diamonds-hold-and-win) informed persistent feature indicators and clear machine framing. These are presentation references, not licensed game integrations or imported mathematics.

The original seabed includes coral branches, anemones, tube sponges, clams, sea stars, rocks, sea grass, a wooden wreck, anchor and treasure chest. The v6 renderer uses eight original painted species: clownfish, blue tang, golden koi, reef shark, sea turtle, manta ray, moon jelly and golden dragon. It integrates the generated creature/cannon atlases through cached GPU-matted textures and validates cannon trajectories on the server. The selected seabed remains `apps/player/public/art/reef-seabed-v5.png`. See `reports/art-prompts-v6.json` and `reports/REFINEMENT_V6_VERIFICATION.md` for the actual integrated assets, physics and verification.

## Limits and rollback

This is browser staging, not a signed native release. Native account credentials/TLS and real Android/iPhone performance still require completion and physical testing. The owner's device testing deferral remains in effect. Fish synchronization uses polling rather than production Colyseus rooms; a fresh table starts when every target is captured or the 15-minute room expires. The capture model and other paytables are experimental. Music and sound effects are available through Settings.

Migrations 005 and 006 are additive/forward fixes; 007 accepts 25–2000 integer units in multiples of 25 while retaining the original restrictions on v1 records. Do not edit applied migrations, erase history or overwrite balances. To disable sharing, run `scripts/stop-shared-test.ps1`; to disable the experiment, stop its exact staging processes and retain its database and ignored credential files. The existing development environment stays on 3000/5173/5174 with no approved production games. To reverse presentation changes, restore documented source files from a reviewable copy; this repository currently has no committed baseline. Do not use a broad git reset.
