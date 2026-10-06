# V22 — Premium collection and Royal Blackjack

Dates: 6–7 October 2026. Owner-approved private test release.

## Delivered implementation

- Seventeen playable catalog entries. Four fish games: Reef Party, Abyss Legends, Sunken Dynasty and Polar Odyssey. Three keno games: Orchard Numbers, Neon Numbers and Pearl Keno. New entries appear in the shelf, search, favorites, categories and paged Walk the Floor.
- Premium collection is open to every tester. Seven featured games; no purchase, entitlement or automatic credit grant. Jackpot spotlight cards describe existing 20× boss catches, and the wheels reveal the committed award.
- Original jade-palace and ice-cavern fish backgrounds, sixteen new creatures with distinct small/medium/large/boss sizes, eight cannons and separate four-seat lounges. Shared authoritative trajectories, per-hit stakes, multiplayer target arbitration and explicit solo bot assists remain. An older `!important` background rule and sprite-atlas crop bleed were found and corrected during visual review.
- Two visually different keno cabinets share the approved Orchard test model under version `stage-keno-cabinets-v1`.
- Royal Blackjack implements six freshly shuffled decks, all-17 dealer stand, natural 3:2, normal win 1:1, push, hit, stand, double, one split, one-card split aces, exact half-credit stake steps and saved-hand recovery. One server dealer; no fabricated human occupants. Private shoe/hole card stay on the server until settlement. Maximum exposure is 80.00 after splitting and doubling a 20.00 initial stake.
- Blackjack player stakes are reserved, protected from agent redemption and other spending, then posted once through the balanced ledger. Revision checks prevent conflicting moves. Idempotency persists exact replies. Expiry settles even a suspended player. An idle hand stands after five minutes; a player `me`/blackjack request or health request processes due settlements. If the service has no activity, posting waits for its next request; this is disclosed in rules rather than falsely claiming a continuously running Vercel worker.
- Refined felt, card shoe/chips, face cards, responsive split-hand layout and small-screen controls. Dealer hole-card reveal and additional cards are paced, followed by the verdict/return; the visible wallet updates afterward. Pausing/reduced motion cancels presentation delays without changing server outcomes.
- Fifteen additional original synthesized tracks: three for each new game. Fifty-four distinct tracks across eighteen scenes. Existing Music/Sound settings and lifecycle behavior are retained.

## Reference evidence and limits

[Bicycle's blackjack rules](https://bicyclecards.com/how-to-play/blackjack) informed card values, player actions and the distinction between a natural and an ordinary 21. The exact test variation was approved explicitly by the owner; provider odds were not inferred.

[JUWA's web lobby](https://w.juwa2.com/game/home) showed Home, Slots, VIP, Fish, Keno, Favorites and New/Popular/VIP sections, but the current session displayed LOG IN and loading placeholders. The owner said they would sign in. Prior authenticated observations are in `docs/JUWA_AUTHENTICATED_REFERENCE.md`; the owner's supplied images inform the four-cannon composition, mixed creature scale and jackpot presentation. This is not a claim to have cloned every JUWA title, undocumented bonus, exact timing, audio or payout. Prior fish/keno entries were app-only in the inspected browser. No provider source, artwork, music or credentials ship in this project.

The later screenshot is an HTTP 408 on `chatgpt.com/backend-api/codex/responses`, outside this game's domain. It reports a request-body read timeout. No repository change can repair that upstream service. The work resumed successfully; the exact cause cannot be established from the screenshot. [OpenAI's timeout guidance](https://developers.openai.com/api/docs/guides/error-codes) recommends retrying and checking connection stability for persistent timeouts. Its API guidance does not prove the specific cause of this Codex incident.

## Verification

Commands use the pinned workspace Node/pnpm runtime. Vite/child-process execution required the normal Windows execution permission; the initial sandbox `spawn EPERM` was resolved by rerunning with approval review.

- `pnpm lint` — passed.
- `pnpm typecheck` — passed after restricting TypeScript extension rewriting to server output.
- `pnpm test:reference` — 51 passed. These are reference checks, not proof of live accounting.
- `pnpm test:unit` — 135 passed, including deterministic blackjack rules, six-deck composition, hidden-card exclusion, same-seed keno equivalence, new fish collision geometry and all 54 music arrangements.
- `pnpm test:integration` — 20 passed. Catalog advertises 17 games with production stakes still gated.
- `pnpm build:server` — passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/blackjack.test.mjs tests/db/staging.test.mjs tests/db/hosted.test.mjs tests/db/operator.test.mjs tests/db/operator-hosted.test.mjs` — 64 passed before the additional hosted blackjack case. Expanded staging/hosted run subsequently passed 29 tests, including the added case and actual new-world solo/multiplayer capture transitions. Each suite uses a disposable schema; hosted human accounts are not used for plays.
- `pnpm build:vercel` and `node --test tests/deployment/vercel.test.mjs` — player bundle built; 4 emitted-function/routing checks passed.
- `pnpm build:vercel-operator` and `node --test tests/deployment/vercel-operator.test.mjs` — operator bundle built; 3 emitted-function/isolation checks passed.
- Browser evidence in `reports/screenshots/v22`: original fish world and responsive blackjack. 390×844 is browser emulation, not a physical-device certification. Additional release checks are recorded below.

## Migration and rollback

Migration `017_premium_games.sql` expands fish room identity, adds persisted blackjack hands with one-active-hand-per-player uniqueness and immutable settled history, adds the BLACKJACK idempotency operation, and permits the approved split/double total stakes in immutable round receipts. No account provisioning, credit refills or credential changes are part of this release.

Local staging migration passed. The hosted migration uses the existing approved Neon test database, verifies its site marker, and saves an AES-GCM encrypted consistent logical snapshot before applying changes. Credentials and backups remain in ignored local files. Hosted result and release IDs follow below.

Rollback must preserve migration 017 and all accepted hands/receipts. If reverting UI, retain a compatible server settlement endpoint until every active hand settles and reserved credits reach zero; never drop the table, overwrite wallets, or cancel accepted awards. Older player builds can omit new games while a compatible API continues settlement. Production approval, signing/store delivery and Android/iPhone hardware tests remain outstanding.

## Release verification

- Hosted migration 017 applied after an encrypted 21-table logical backup. All 15 wallet balances/reservations/versions and account identity/password hashes were identical before/after. No hosted game round or funding was performed.
- One local `stage.player` acceptance hand at 0.50 credits: started at 989.15, reserved 0.50 (988.65 available), survived browser reload with the same 3♠/5♦ hand and dealer 6♠, accepted a 7♦ hit without extra stake, stood at 15 against dealer bust 24, returned 1.00, ended at 989.65. No reservation remained. The local test logged out afterward. This was not a hosted human tester account.
- Phone browser preview at 390×844 had no horizontal overflow; blackjack controls were visible within the viewport. Desktop preview and Sunken Dynasty original background/cannons rendered without browser graphics errors. See local screenshot evidence above.
- Final publication URLs and identifiers are recorded after deployment confirmation.
