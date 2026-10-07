# Owner steering — 17 September 2026

## 23 September 2026 sparse fish tiers and separate Vercel test

- Owner requested fewer fish, slower spawns, clearly different sizes, smaller rewards for small fish and larger/harder catches for large creatures.
- Explicitly approved `reef-tiers-v1`: small 1× shot stake / 30% capture per valid hit; medium 3× / 20%; large 8× / 10%; boss 20× / 4%. Independent server draws imply averages of 3.33, 5, 10 and 25 hits; no guaranteed kill count, hidden accumulated health or progressive jackpot is introduced. Expected gross return per accepted hit is respectively 30%, 60%, 80%, 80%. This supersedes the earlier uniform fish 30% / 3× test, only for new fish rounds. Other games and null production approvals remain unchanged.
- `reef-ballistics-v3`: scheduled arrivals six seconds apart, at most nine active targets and one boss; sizes span radii 8–100. Captured target IDs never respawn. Uncaught targets can return after the 480-second migration cycle.
- Owner selected **a separate Vercel test environment**, not a migration of the existing Netlify wallets. The five-player test setup uses its own database identity, accounts and one-time authenticated manual funding. Existing Netlify balances/history are preserved. No paid infrastructure or public admin console is authorized.
- Owner explicitly approved GitHub sign-in to Vercel. Provider prompts that require human security/legal choices remain human steps.
- Owner subsequently approved accepting the Vercel Marketplace addendum and Neon terms, including account ID, email and usage-data sharing, to create a separate free PostgreSQL database. The Vercel test is now live at `https://new-game-test-topaz.vercel.app/`, with its own five accounts and one-time manual 1,000-credit funding. Netlify data and deployment were not replaced.

## 23 September 2026 daily wheel, account controls and aquatic refinement

- Owner clarified that the balance changes too early: display the committed win first, then release the displayed balance. Server accounting must still commit immediately.
- Owner explicitly approved a daily spin with equally likely rewards of **0, 0.05, 0.10, 0.15, 0.25, 0.75, 1.50, 3.00 and 5.00 play credits**, **one spin per rolling 24 hours**, only while the player has a **positive available balance**. This is a narrow, explicit exception to the earlier blanket ban on daily rewards, enabled in the existing local/hosted test environments. Account creation remains zero-start; no background claims, refills or welcome grants are approved. Production game profiles remain null.
- Daily rewards have a distinct immutable `DAILY_WHEEL` ledger category and issuance counterposting; they are not relabeled game wins and are excluded from game return statistics. Zero rewards consume the cooldown without a fake zero-value ledger posting. Requests are authenticated, CSRF-protected, serialized against the wallet and durably replayable.
- Owner approved **catch celebrations using existing awards**, not a progressive jackpot pool or new fish payouts. Original dragon, mermaid, crab, manta, seahorse, lobster and small-fish art supplements existing species. Less crowded migration lanes and smaller target radii are shared by client/server under `reef-ballistics-v2`; the capture probability and return multiplier are unchanged.
- Owner requested a compact login, main-lobby daily wheel and share QR, music/sound settings, and self-service password change. Remember ID stores only the username. Password changes verify the current secret and revoke all sessions; existing tester passwords are not changed by setup or deployment.
- Supplied screenshots are visual references. No Fire Kirin/JUWA branding, executable code, sprites, music or provider dependencies are shipped.

The direct request is to start implementing this project, with routine work approved. Documents supply the project requirements; their copied prompts are not additional user messages.

## Repository and hosting request — 23 September 2026

- Owner explicitly authorized pushing this project to `https://github.com/tonyk006789-bit/New-Game` and selected Netlify for deployment.
- Owner confirmed that neither a Netlify site nor a hosted PostgreSQL database exists yet, and requested preparing the setup. No paid infrastructure has been selected or provisioned.
- The Netlify configuration publishes the player only. Shared login/credits remain dependent on a hosted player API and PostgreSQL; the current local-only staging guard and undecided production math are preserved. See `NETLIFY.md`.
- Source publication excludes local credentials, databases, test-session files and browser recordings. Existing tester passwords and balances are unchanged.

## Hosted test deployment follow-up — 23 September 2026

- After the source push and explanation of the remaining backend requirements, the owner instructed **“Do it yourself.”** Together with the earlier five-person shareable-test request, this authorizes completing the Netlify player/API/database deployment on the free plan. No paid service, production mathematics or admin-console publication is authorized.
- Created `new-game-tonyk006789` on Netlify and its dedicated managed PostgreSQL database. The separate `hosted-test` mode reuses `stage-paying30-v2` and preserves the original local-staging restriction and null production profile.
- Hosted setup must create zero-start accounts and use the authenticated MFA/manual ADD workflow to fund the five testers once. It must not copy local balances, silently refill wallets or expose credentials in public source or responses.
- After the setup-access request and delivery of the local tester logins, the owner explicitly instructed **“Activate it on Netlify as well.”** Completed CLI authorization, temporary database setup access, and public access to the player login page for this five-person test. Disabled database token-write access again after provisioning.
- All five existing IDs/passwords now work on Netlify with 1,000 initial credits each. Live acceptance exercised all eight games, round replay/recovery and four-player fish tables. The exact net effect of automated test rounds was offset through an authenticated manual adjustment while preserving all round/ledger history. See `../reports/NETLIFY_HOSTED_TEST.md`.

- D01: owner chose **keep undecided while building previews**. All credit-staked game play remains disabled. No sample math becomes a production default.
- D02: owner approved **branch transfers of existing credits** by sub-distributors/agents. No lower role may issue or retire supply. Implementation remains unavailable until authenticated branch authorization, availability checks, transactional ledger postings and idempotency are implemented and tested. Cross-branch transfers remain forbidden. The direction/recipient matrix will be documented before enabling this feature.
- D03: owner has no Android/iPhone devices at present and will test once the MVP is available. Physical-device acceptance is deferred by the owner, not passed. No macOS/Xcode/signing access or distribution route has been supplied.
- D06: the working product name is New Game; supplied game names retained. All preview art is original repository-authored vector art. No private references are shipped.

This record supersedes pending-transfer wording in the original handoff. Runtime gating still defaults closed until actual server enforcement exists. Local implementation may continue beyond the device test dependency; a native performance claim cannot.

## 18 September 2026 implementation steering

- Owner supplied eight screenshots and requested a much richer player interface and a player login page. They then clarified: **full game implementation, not only artwork**. This authorizes the account, accounting and game-system work alongside the UI.
- Original neon arcade, temple, orchard and reef artwork now supplements the code-authored symbols. Supplied screenshots remain references and are not distributed assets.
- PostgreSQL-backed browser authentication, Main Admin MFA/step-up, zero-start account creation, manual adjustments, linked reversals, branch transfers, session revocation, audit records and practice outcomes are now implemented locally. See `LOCAL_MVP.md` and `../reports/MVP_IMPLEMENTATION_VERIFICATION.md` for exact coverage and limits.
- The conservative transfer matrix is own wallet → active, strictly lower role inside the actor's subtree. It does not authorize collecting credits from descendants, moving between peers/branches, or issuing supply. Player transfers are denied.
- The existing instruction to keep math undecided remains in effect. A clarification about preparing concrete rule proposals was asked; no answer was received during this implementation. Practice has no stake, credit award, monetary value or conversion. No production math profile was selected.

## 18 September 2026 catalog and motion request

- Owner explicitly asked to inspect stake.us for game information, add more games, and improve generic UI/motion. Public pages inform presentation; they do not authorize provider integration, account creation or adoption of their math.
- Added two distinct original games, Aurora Vault and Ember Relics, as persisted free practice. Added reel, cascade, crystal, keno and fishing motion. The catalog now has five games. See `STAKE_REFERENCE_AND_GAME_EXPANSION.md` for exact mechanics and source boundaries.
- The earlier decision to keep production payout math undecided still applies to every game. Physical-device acceptance remains deferred, not passed.

## 22 September 2026 arcade direction

- Owner requested more games and graphics closer to illustrated casino machines/JUWA, instead of full-HD scenic presentation. This supersedes the quieter original visual direction.
- Added Neon Sevens, Jade Fortune and Coin Carnival: three distinct original practice rule sets, real server persistence and interactive reel/lock presentation. Eight games now appear in a compact arcade catalog.
- Public JUWA landing and web lobby were inspected. No provider account, download, credential integration, copied art or borrowed payout model is involved. See `JUWA_ARCADE_RESEARCH.md`.
- Production mathematics remains undecided; credit-staked play remains closed. The owner has not changed the physical-device testing deferral.

## 22 September 2026 local staging experiment

- Owner approved **local isolated staging** with a separate player funded with **1,000 play credits**, and selectable stakes of **0.25, 0.50 and 0.75 credits**. These are credits, not monetary cents.
- Owner clarified the staging target: **roughly 30% of rounds returning any credits**. This is positive-return frequency, not 30% RTP or a fixed three wins every ten rounds.
- This supersedes preview-only work for the local experiment. Production targets, profiles and approvals remain null. Each experimental game publishes its own rules under `stage-paying30-v1`; fish uses a separately stated uniform 30% capture / 3× return experiment. No production fish or keno model is approved by this implementation.
- Funding must still use the authenticated Main Admin manual ADD workflow. The explicit setup command persists its original request and repeats its receipt, never automatically replenishing the wallet.
- Owner requested richer aquatic objects, species and casino presentation, informed by the supplied references and additional public research. Original seabed art and eight code-authored fish species are used; no provider content or credentials are imported.
- See `STAGING.md` for access, rules, accounting, experiments and remaining native/device gates.

## 23 September 2026 refinement request

- Owner explicitly requested replacing the flat fish with high-quality creatures, adding mechanical cannons and credible projectile impacts, heavily refining the other games, and providing a visible sample login/password.
- Owner requested a clean play screen without the local-staging banner or win-rate/rules information across the top. Stakes and returns now sit in the play deck; paytables and actual statistics remain available in Game Information and History.
- Eight original painted creature textures, four original cannon textures and sixteen original reel/jewel symbols are integrated into the running games. Supplied screenshots and public Stake/JUWA pages inform composition; their artwork is not shipped.
- Staged fishing now validates a constant-speed projectile against moving targets with swept collision detection. It charges only an accepted valid impact. Misses and rejected/expired trajectories are free; capture odds and returns are unchanged. Accepted historical requests replay their saved receipts before the new proof requirement.
- The existing `stage.player` receives an explicitly visible, local-only sample password through authenticated Main Admin password reset. Its balance is preserved; there is no new issuance or refill.
- This request does not approve production mathematics, remote publication or native-device acceptance. See `../reports/REFINEMENT_V6_VERIFICATION.md` for evidence and limitations.

## 23 September 2026 expanded controls and human testing

- Owner explicitly selected **0.25-credit increments through 20.00**, including cannons, and requested fish auto/lock/fast controls, at least four slot columns and a walking-character lobby. Neon and Coin now have five reels, with a new `stage-paying30-v2` experimental profile. Accepted v1 results remain immutable.
- Owner then explicitly requested **a shareable test link for five human beings**, five distinct player IDs/passwords and **1,000 play credits per account**. This authorizes a remote test of the staging player, superseding earlier local-only publication scope for this test. It does not approve production mathematics or deployment of the admin console.
- Five accounts (`tester.one` through `tester.five`) were created and each funded once through Main Admin MFA and the ordinary authenticated manual ADD endpoint. Idempotent receipt replay prevents startup or setup retries from refilling their balances.
- A restricted sharing gateway serves only built player assets and approved player API routes for these five accounts. The admin, database, development sources and local credential files are not exposed.
- Automatic approval review requires explicit confirmation before these disposable test credentials pass through the proposed Pinggy intermediary. That provider-specific request is pending; it is distinct from the owner's already explicit authorization to share the game.

## 23 September 2026 recovery and four-seat fishing lobby

- Owner reported the Recover Round glitch, requested four-player fish tables with their own secondary lobby, and asked to remove the in-game information section.
- Removed the manual recovery panel/button and the game-information/paytable/statistics interface. Saved play and credit history remain. Reconciliation runs automatically after an interrupted response while online and foregrounded, without placing a new stake.
- Recovery uses the original actor/request lock: it returns an accepted receipt unchanged, or records an unplayed request as cancelled so a delayed original request cannot subsequently charge. No financial history is erased or overwritten.
- Added a dedicated Ocean Lounge with four selectable seats per table, actual player names/occupancy, join/open/return controls and immediate seat release on exit. Four real authenticated clients were verified at one table; a fifth cannot take a full seat. Empty places remain open; no bots or invented occupants were added.
- Existing math, credit balances and tester credentials are preserved. See `../reports/RECOVERY_AND_FISH_LOBBY_V8.md` for evidence.

## 23 September 2026 authenticated reference study

- Owner signed into JUWA and explicitly requested studying its games, UI/UX, animations and gameplay to refine this platform. This authorizes reference research; the original/licensed-art and no-provider-dependency boundaries remain.
- Browser-accessible lobby shelves and two loaded slot cabinets were inspected. Fish and keno posters are marked app-only in that browser. The owner agreed to operate external prize-based plays and tell us when to observe; actual spin/bonus timing remains pending.
- The resulting player refinement enlarges the five-reel cabinets, reduces surrounding prose, adds metallic controls and a committed-return count-up, adjusts reel take-up/braking/landing, expands feature-board space, and replaces simple fish-lounge symbols with original painted creatures and four cannon stations.
- This is a presentation change. It does not change the experimental profile, stake increments, hosted tester credentials, manual funding rules or production approval status. Six explicit local sample-account test rounds used 0.25 credits each; hosted tester accounts were not used for round testing in this iteration.
- Research coverage and limits: `JUWA_AUTHENTICATED_REFERENCE.md`. Acceptance: `../reports/REFINEMENT_V9_VERIFICATION.md`.

## 25 September 2026 responsive cannons and game rules

- Owner requested cannon firing that follows click speed, more creatures, and rules in every game. This explicitly supersedes the earlier removal of the game-information section for rules; the statistics panel and manual recovery button remain removed.
- Manual clicks launch independent overlapping projectiles, without waiting for another hit, network receipt or catch animation. Normal/fast auto cadence is 250/125 ms. Each paid impact keeps its own durable request ID and stake snapshot; interrupted impacts reconcile individually without starting a new stake.
- Arrivals are three seconds apart, with at most fourteen active targets and one boss. The sixteen species and 8–100 radius range are retained. Shared client/server trajectories use `reef-ballistics-v4`; approved `reef-tiers-v1` capture chances and returns are unchanged.
- Each of the eight games has an on-demand Rules dialog with its controls, feature mechanics and current return rules; line games also show payline diagrams. No win-rate banner was restored.
- Updates continue on the authorized Vercel five-person test environment. No account provisioning, refills, password resets, paid services or Netlify deployment is part of this change. See `../reports/REEF_V12_RAPID_FIRE.md`.


## 29 September 2026 agent console and approved redemption

- Owner requested a working agent backend using their authenticated JUWA agent portal and screenshots as workflow references: dashboard, player creation/edit/reset, recharge/redeem, records and settings. The reference portal was inspected read-only after owner sign-in. No external players, passwords or credits were changed; no provider code, private customer export or provider credentials were imported.
- Owner explicitly approved: **“Yes—allow transfers back to the agent.”** A dedicated REDEEM operation moves only available play credits from an assigned player into that same agent's wallet. Agents do not gain issuance/removal or arbitrary upward transfer authority.
- Agent player creation is restricted to the actor's own branch and the PLAYER role; new wallets start at zero. Edits, password reset and suspend/reactivate are restricted to assigned players. Main Admin retains its existing hierarchy and manual adjustment authority. Sub-distributor powers are unchanged.
- Password reset and status changes revoke player sessions, preserve credits and retain accepted game history. Sensitive agent management and redemption require verification within five minutes; Main Admin still requires TOTP.
- Console includes scoped dashboard metrics, database pagination/search/sort, recharge/redeem/daily-wheel/game/adjustment records, scoped printable receipts and own-account settings/password change. All counts, records and receipts use branch authorization. Display-name edits do not move accounts between branches.
- Separate local demo accounts are in `.local/operator-demo/LOGINS.md`. The demo agent was funded once with 100.00 credits using the authenticated Main Admin ADD workflow. Browser acceptance recharged 10.00 and redeemed 2.00, leaving the demo agent at 92.00 and demo player at 8.00. Existing human tester accounts were unchanged.
- Remote publication of the privileged console and admitting agent-created players to the hosted test game were requested separately for owner approval. Until that approval, the existing hosted five-player gateway remains unchanged.


## 29 September 2026 sub-contractors and separate Vercel operator site

- Owner explicitly requested password-only operator login, removal of the private-credit disclaimer from the console, full sub-contractor management, and a separate Vercel backend link with a sample login. Password verification within five minutes, rate limits, secure cookies, CSRF and branch authorization remain. Stored legacy TOTP material is not used for login or verification.
- Owner confirmed: **“Yes, use that hierarchy and archive removal.”** The existing SUB_DISTRIBUTOR role is presented as **Sub-contractor**, not a new authority tier. Main Admin manages sub-contractors; sub-contractors create/manage their own direct agents; agents create/manage their own players. Main Admin retains scoped hierarchy management and sole manual issuance/removal authority.
- Parent redemption is now explicitly supported for the direct hierarchy pairs Main Admin ← Sub-contractor, Sub-contractor ← Agent, and Agent ← Player. It transfers only existing available credits back to the actor. Sibling, unrelated, self, and skipped-level redemption remain denied. New wallets still start at zero.
- “Remove account” archives it without deleting the wallet or history. Staff suspension/archive blocks descendants and revokes branch sessions. Restore preserves separately suspended child states. An access-change lock is acquired before account/session/wallet locks, so accepted transactions finish before suspension commits.
- The separate operator Vercel project is `new-game-operator`. Its transport admits staff only; the player transport never exposes operator routes. Managed-player admission is an explicit Vercel feature flag so agent-created players can use the existing game link. Netlify's existing five-account restriction remains its default.
- Deployment publication is explicitly authorized by this request. Automatic approval review separately requested explicit approval for storing the existing database connection string as an encrypted server-only secret in this new project. No secret is shipped in the static bundle or committed to Git.


## 30 September 2026 reference-aligned operator console and publication

- Owner requested matching the authenticated JUWA 2 backend options, removing invented interface sections, and publishing a separate Vercel link. The visible reference account is STORE; higher JUWA permission tiers were not observable. The previously approved Main Admin → Sub-contractor → Agent → Player hierarchy remains authoritative.
- Owner explicitly approved storing the existing test DATABASE_URL in the new operator project, resolving the earlier automatic approval rejection. This approval is specific to the existing dedicated test database and `new-game-operator` Vercel project.
- Owner explicitly selected **“Match the pages; keep bonuses disabled.”** Agent Rewards (Rewards / Records / Rules) and Wager Bonus FAQ are present but inactive. No agent rebates, deposit-match awards, fabricated rates, collection endpoint, expiry timer or wagering restriction was added. The separately approved player daily wheel remains unchanged.
- Replaced the invented dashboard/nav with the reference's Admin Management, Game User and Setting groups, compact white tables, blue controls, gray sidebar and player editor menu. Removed standalone Audit log, Organization and Adjustments screens; immutable accounting/auditing stays on the server. Main Admin's requested add/remove authority remains in account actions.
- Added numeric presentation IDs, real login metadata, Total Account aggregates, one-row-per-round Game Records, Login Device review, and original API Download settings/documentation. Historic IPs that were not recorded display a dash. API keys are scoped read-only credentials; writes continue through the operator console. No JUWA code, key, private customer export, API package or runtime dependency was imported.
- Operator site: **https://new-game-operator.vercel.app/**. Player site: **https://new-game-test-topaz.vercel.app/**. Password-only staff login and operator-created player admission were verified on these public URLs. Netlify was not redeployed.
- Migrations 011–013 were applied after encrypted logical backups. The eight existing wallet balances/reservations/versions were unchanged. One extra sample player, `operator.sample`, was created through the authenticated agent API with zero credits to verify managed admission; no grants, spins or human tester balance/password changes were performed.
- See `VERCEL_OPERATOR.md`, `AGENT_CONSOLE.md` and `../reports/OPERATOR_REFERENCE_V14.md` for access, coverage, verification and rollback details. Credentials remain in ignored local files and are supplied directly to the owner, never in the repository or browser assets.

## 30 September 2026 Cash Frenzy study and original cabinet expansion

- Owner signed into Cash Frenzy and requested extensive gameplay/UI study, refinement and additional games. The owner will operate its external prize-based plays and tell us when to observe. No such live-play observation has occurred in this iteration.
- Owner explicitly selected **“New cabinets using existing test payout rules.”** Ruby Rush reuses Neon Sevens, Sapphire Crown reuses Jade Fortune, and Solar Fortune reuses Coin Carnival. This is approval for themed versions of those test games, not new payout mechanics or production approval.
- New cabinets use `stage-cabinets-v1`, which records the base `stage-paying30-v2` profile and aliases. The original profile remains unchanged. Stakes, probabilities, outcome evaluation, committed settlement and replay use the existing authoritative path. All eleven games remain unavailable for production credit-staked play.
- Added original painted cabinet/symbol art, an eight-card paged shelf with favorite hearts and truthful NEW ribbons, expanded walking-floor pagination, reel sounds, rotating winning-line review, committed-award celebrations and illustrated rules.
- Cash Frenzy lobby composition was partially visible; its canvas capture then failed. Full catalog, game rules, bonus triggers and live timing could not be verified. No provider source, account data, art or runtime dependency was imported. Coverage and acceptance are recorded in `../reports/REFINEMENT_V15.md`.
- Publication continues on the already authorized Vercel player test site. No provisioning, grants, refills, hosted tester play or operator funding changes are part of this iteration.

## 30 September 2026 varied reels and portrait cabinets

- Owner requested varied slot formats, including three columns and portrait-only games. This supersedes the earlier requirement that every slot have at least four columns.
- Owner explicitly approved **“Use those three-reel test rules”** for Neon Sevens and Ruby Rush: a 3 × 3 grid, five paylines, triple rewards of cherry 1×, bell/BAR 2×, gem 3× and seven 5×, retaining the roughly 30% positive-return-round test target. This is not an RTP target or production approval.
- New rounds for those two games use `stage-classic3-v1`. Existing profile definitions and accepted five-reel receipts stay unchanged; old receipts still replay and evaluate using their original geometry. New requests with obsolete profiles must refresh before playing.
- Sapphire Crown is an upright five-reel cabinet; Aurora Vault presents its existing fifteen independent cells in three columns and five rows. On phone-sized landscape viewports these games require portrait orientation before accepting a new play. An already accepted result still completes.
- Solar Fortune presents only its existing scoring row as five individual reel windows. Its persisted sequence and hold/respin award remain unchanged. Other cabinets retain wide five-reel and six-column cascade formats.
- Publication continues on the existing authorized Vercel player test link. No migration, new account, funding, hosted play, operator deployment or production-math approval is included. Evidence and rollback guidance: `../reports/REFINEMENT_V16.md`.


## 1 October 2026 music, full walking floor and second fish world

- Owner requested energetic, distinct game music, all new cabinets on Walk the Floor, more creatures, treasure boxes and jackpot spins for four simultaneous players, plus another fish game.
- Owner explicitly approved **“Use existing fish rewards and reveal effects.”** Abyss Legends reuses `reef-tiers-v1`: small 1×/30%, medium 3×/20%, large 8×/10%, boss 20×/4% capture per valid hit. Treasure and jackpot presentations reveal the committed catch award without additional RNG, credit grants or a progressive pool. Production play remains blocked.
- Two fish variants now have separate branch-scoped four-seat rooms; real peers share recent committed impact effects. Spawn timing and eight new characters use `reef-ballistics-v5`; old clients must refresh for new shots while accepted receipts still recover unchanged.
- Twelve catalog entries appear in the shelf and walking-floor directory. Original per-game synthesized arrangements respect Music/Sound and background/reduced-motion preferences. Original ImageGen art only; prompts and provenance are recorded.
- Additive migration 014 adds fish variant identity and impact lookup indexes. Applied to local and hosted test databases; encrypted hosted backup made and all nine wallets/reservations/versions unchanged. Vercel publication continues under existing owner authorization. See `../reports/REFINEMENT_V17.md`.


## 1 October 2026 direct-parent hierarchy correction and distinct Abyss table

- Owner reported that Main Admin could operate individual testing clients and explicitly corrected the hierarchy: Main Admin manages sub-contractors, sub-contractors create/manage agents, and only agents host players. Enforced for creation, editing, password reset, access/archive actions, credit issuance/removal, transfers, listings, individual history and receipts. Higher-level totals group only the operator's direct staff children.
- Main Admin retains manual issuance/removal for its own wallet or direct sub-contractors. Lower add/remove means supply-neutral TRANSFER down or REDEEM back from a direct child; lower roles never issue/retire credits. All changes still require a recent password verification and balanced, versioned, idempotent ledger entries. Existing balances and historical entries are preserved.
- Owner asked for original Abyss Legends background and cannons instead of reusing Reef Party, plus a jackpot wheel. Added an original volcanic caldera and four distinct transparent cannon sprites. The persistent wheel automatically animates confirmed boss catch awards from the existing 20× tier; it does not sample a second outcome or create another prize pool. Presentation completes before the existing 900 ms wallet reveal.
- Publish both corrected operator and player test applications to their existing Vercel links under ongoing owner authorization. No database migration, new hosted account or funding is needed. Original art prompts: `../reports/art-prompts-v18.json`; acceptance and rollback: `../reports/REFINEMENT_V18.md`.
# 3 October 2026 — game animation refinement

Owner requested enhanced motion, specifically slower slot result stops, and research into other games. V19 changes presentation timing only: progressive reel braking, survivor-preserving cascades, crystal docking, paced keno reveals and smoother cannon/effect motion. Existing approved test outcomes, payouts, server settlement and win-before-balance presentation remain authoritative. Evidence: `reports/REFINEMENT_V19.md`.

## 3 October 2026 — more music and no operator Reason section

- Owner requested more frontend music and removal of the Reason section throughout Main Admin, Sub-contractor and Agent workflows, explicitly saying to leave it empty. This supersedes earlier mandatory operator-reason guidance. New operator actions omit the field and normalize to an empty string; no fabricated note is inserted. Existing ledger/audit notes and durable pending requests are preserved. Reviews and receipts no longer display the section.
- Migration 015 permits empty ledger reasons while preserving the existing bounds on nonempty notes. Password verification, hierarchy, wallet versions, balanced entries, reserved credits and request idempotency remain enforced.
- Added two original synthesized compositions per game/lobby, giving three tracks for each of thirteen scenes. Playlists rotate automatically and have next-track controls; Music/Sound and background suspension remain independent. No licensed provider music or game-math changes.
- Publish both existing Vercel test sites under the ongoing owner authorization. Verification, migration and rollback evidence: `../reports/REFINEMENT_V20.md`.

## 3 October 2026 — six-character credentials and solo fish bot teammates

- Owner clarified that the requested policy concerns **username and password**, not numeric account IDs: at least six characters with letters and numbers, without the previous extra restrictions. New/reset credentials require one letter and one digit; usernames accept either case and optional punctuation, normalize for case-insensitive sign-in and retain a technical 256-character cap. Existing credentials, IDs, balances and historical records are preserved.
- Owner requested bots so solo fish players receive capture assistance, and explicitly approved **“Yes, use three free assists per paid hit.”** With exactly one active human, the normal capture attempt is followed on failure by up to three independent free bot attempts, stopping at the first catch. All four attempts use the existing size-tier chance; only one tier award can be returned for the paid hit. Three visibly labeled bot teammates occupy no database seat or wallet and stop assisting when a second human joins.
- `reef-assist-v1` applies equally to both test fish games. Single-attempt chances remain small 30%, medium 20%, large 10%, boss 4%; total solo capture probabilities are 75.99%, 59.04%, 34.39% and 15.065344%. Returns stay 1×/3×/8×/20×. This is a test profile, not a production approval, automatic grant or separate progressive jackpot. Old accepted rounds retain their original outcomes and replay without another debit.
- Continue publishing both requested updates to the existing Vercel player/operator test links. Migration 016 relaxes username storage syntax without rewriting existing rows. Evidence: `../reports/REFINEMENT_V21.md`.

## 6–7 October 2026 — premium collection, four fishing worlds and blackjack

- Owner requested further JUWA UI research, jackpot offers, richer fish scenes, four fish games, more keno games and premium blackjack. Explicitly selected **“Featured collection for all testers”** and **“Use existing awards.”** Premium is a catalog feature, not an entitlement, purchase or new credit campaign. Boss spotlight cards and wheels reveal committed catch awards only.
- Owner approved **“Reuse the existing approved rules”** for Sunken Dynasty and Polar Odyssey (existing size tiers and solo three-assist profile) and Neon Numbers and Pearl Keno (Orchard's existing test draw/paytable). Each fish world has its own branch-scoped four-seat rooms. The two new worlds add sixteen original creatures, eight cannons and distinct jade-palace/ice-cavern backgrounds. No extra creatures are silently counted as human players.
- Owner explicitly approved blackjack: six decks shuffled each round, dealer stands on all 17s, ordinary profit 1:1, natural 3:2, ties return the stake, hit/stand/double first two cards, one same-rank split into two hands, split aces one card, no insurance/surrender; initial 0.50–20.00 stakes in 0.50 steps. Double after split is supported, up to 80.00 total exposure. Idle hands stand after five minutes; settlement is processed on subsequent server activity if no request occurs at the deadline. Version `stage-blackjack-v1` is independent of the slot test target.
- Blackjack reserves committed stakes on the server, hides the dealer hole card and shoe, saves every action with revision/idempotency protection and settles through balanced immutable ledger entries. Suspension cannot cancel an accepted award. A dealer controlled by the server is sufficient; no additional blackjack player bots were introduced.
- Owner reported a screenshot containing HTTP 408 from `chatgpt.com/backend-api/codex/responses` and requested further blackjack refinement. This is a Codex request timeout, outside the game repository, not evidence of a game failure. No fix to OpenAI's service is claimed. Blackjack now stages the dealer reveal, verdict and balance presentation and keeps controls usable on small screens.
- Current JUWA browser inspection was unauthenticated (LOG IN; loading catalog). The owner said they would sign in. The previous authenticated observations and supplied images are documented references; a complete clone or measured live timing is not claimed. Provider art, code, audio, credentials and unpublished odds are not imported.
- Publish on the existing authorized Vercel test sites. Migration 017 adds blackjack reservations/history and two fish variants without funding or modifying existing user wallets. Production math remains unapproved. See `../reports/REFINEMENT_V22.md` for evidence and limitations.

## 7 October 2026 — catalog, music and cosmetic bot targeting (V23)
The owner requested twenty total games, replacement music throughout, and Royal Blackjack as the only Premium game. Added three original themed cabinets using the previously approved existing-test-rules option: Disco Diamonds → Neon Sevens three-reel profile, Midnight Express → Jade Fortune, Pirate Gold → Coin Carnival. `stage-cabinets-v23` is a new identity for these aliases; prior profile hashes are preserved.
For bots shooting different creatures, the owner explicitly answered “Independent shots; keep rewards unchanged.” Implement autonomous labeled visual shots avoiding the player's target and other bots' active targets in all four fish worlds. These shots cannot remove creatures, invoke game-credit APIs or pay awards. The approved paid-hit solo assistance remains unchanged. Replacement music consists of original scores and synthesized sample instruments, with no external recording dependency. Vercel test-site publication continues the existing requested workflow; no hosted credits are reset. See `reports/REFINEMENT_V23.md` for checks and release evidence.

## 7 October 2026 — faster bots, lobby refinement and no Guest login (V24)
The owner requested faster fish bots, further JUWA-inspired UI/UX, Minor/Major/Jackpot displays including generated examples, and removal of Guest login. All four fish worlds use faster independent visual shots under the existing unchanged-rewards approval. Generated lobby celebrations are explicitly marked DEMO and cannot award credits or impersonate real winners. Actual win labels classify existing committed returns only; no progressive pool, new payout rule or grant was introduced. Guest entry is removed, with player sign-in required. New-world boss reveal and durable fish-shot recovery validation were also corrected. Continue the previously authorized Vercel player test-site publication without altering hosted wallets or redeploying the unchanged operator. Current JUWA private screens were unavailable; no complete clone is claimed. Evidence and rollback: `../reports/REFINEMENT_V24.md`.

## 7 October 2026 — remove generated examples, dimensional UI and more creatures (V25)
The owner requested removal of generated examples, 3D fluid presentation, wager-related tier meters and more fish/characters. Generated examples are removed entirely. Pending clarification of meter semantics, the stated implementation assumption is the signed-in player's actual settled award totals by the existing presentation tiers, alongside total wagered; no shared pool, synthetic winners or extra award is introduced. Eight original creatures, increased bounded density and CSS/Pixi depth effects are added. A separate question proposes removing the previously approved three free solo capture attempts to make catches harder; no answer has arrived, so payout rules remain unchanged. Continue the existing authorized Vercel player publication workflow without changing operator accounts or hosted balances. Evidence: `../reports/REFINEMENT_V25.md`.

## 7 October 2026 — unique win effects, shootable wheel and AI scores (V26)

The owner requested more sparks/coins and unique win animations in every game, a fish-like high-reward jackpot target, and bots that score and behave naturally. All twenty games now have original themed finite win effects. A moving jackpot wheel joins each fish world's existing boss roster and uses the already approved boss reward/chance (20×/4% per attempt, existing solo assists unchanged). Its brief large wheel presentation follows a committed catch, with no second spin, pool or credit grant. Client/server trajectories advance together to `reef-ballistics-v7`; prior accepted receipts remain replayable.

The owner was asked whether independent AI scores should remain separate or award additional human credits. No response had arrived when this implementation was finalized. The stated assumption, consistent with the earlier explicit “Independent shots; keep rewards unchanged” answer, is separate AI hit-combo points only. Computer crews gain points after actual simulated impacts, with more hits required for larger targets, and vary their aim and firing bursts. They have no wallet, cannot remove shared targets, and cannot independently add human credits. Their names are natural but visibly identified as AI CREW; they are not represented as other humans or counted as human occupancy. The three approved paid-hit capture assists remain unchanged. Continue existing player test-site publication; evidence and limitations: `../reports/REFINEMENT_V26.md`.

## 7 October 2026 — remove round banners and replace green chrome (V27)

The owner supplied screenshots and clarified that the extra Minor/Major result banners beneath spins were unwanted. Removed the shared round-award banner from every slot/keno renderer, and replaced ordinary fish Minor/Major labels with CAUGHT. Existing WIN meters, amount reveals, win particles and specific jackpot/treasure catch presentations remain. The lobby's cumulative award meters remain in the lobby, as distinct from the per-round banner the owner identified.

Replaced the platform's green chrome with an original neon Vegas palette: dark indigo, violet, magenta and cyan. Covers lobby/header/categories, meter panels, shelf, walking-floor trim, login, settings, dialogs, fish lounge and shared game controls. Individual game illustration themes retain their identity. No probability, payout, account or ledger rule changed. Continue the existing authorized player Vercel publication workflow. Acceptance and rollback: `../reports/REFINEMENT_V27.md`.

## 7 October 2026 — thirty games, two more fish worlds and blackjack variants (V28)

The owner requested thirty total games with distinct characters/gameplay, more fish tables and two different blackjack games. Added Corsair Cove, Cosmic Tides, Clockwork Vault, Phoenix Falls, Outlaw Sevens, Celestial Wilds, Meteor Keno, Bamboo Keno, Double Deck Blackjack and European Blackjack. Shelf, New, Premium and Walk the Floor share the complete catalog. Slots/keno/fish reuse previously approved test profiles through a new immutable expansion identity, with original characters, symbols, music and scene motion. Six fish worlds retain four human seats and visibly labeled AI crew; no fake human occupancy or independent bot credit grants are introduced.

A question proposing two-deck H17/restricted doubles and European no-hole-card rules is pending. No approval is inferred. Both new blackjack variants have functional free previews, clearly labeled as such, and credit-staked DEAL is blocked by the server. Royal Blackjack keeps its existing approved rules. Thus thirty catalog games comprise 28 credit-enabled tests and two free previews until an owner answer and corresponding verification.

Additive migration 018 extends fish room identities and blackjack constraints without rewriting balances or history. Local and encrypted-backed-up hosted migrations passed; all 15 hosted wallets and account identities remain unchanged. Continue the existing authorized player Vercel publication workflow; no operator redeployment or funding. Evidence and rollback: `../reports/REFINEMENT_V28.md`.
