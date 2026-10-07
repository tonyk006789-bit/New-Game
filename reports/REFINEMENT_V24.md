# V24 — faster fish bots and casino lobby refinement

The owner requested a higher fish-bot firing rate, further JUWA-inspired UI/UX refinement, Minor/Major/Jackpot displays (including generated examples), removal of Guest login, and verification. This iteration changes presentation, navigation and recovery only. Existing approved test payouts, paid-hit solo assists, server outcomes and wallet accounting remain unchanged.

## Changes

- All four fishing worlds share a 220–299 ms independent bot firing cadence, with at most four projectiles per bot. Bots can keep firing at their own target while avoiding player-locked/in-flight/recent targets and other bots' targets. Smaller impact rings keep this higher rate readable. Reduced motion uses a slower cadence. These labeled visual bots never submit paid shots, remove fish or award credits; the previously approved server-side paid-hit assists are unchanged.
- Emerald/gold lobby treatment, compact category navigation, New Arrivals, direct Daily Spin/Share access, clearer search with a clear button, consistent game-card frames, and a fixed mobile-safe bottom navigation. All twenty games remain available; Royal Blackjack is still the only Premium game.
- Three interactive Minor/Major/Jackpot demo displays, each explicitly labeled DEMO. The header states that these are generated examples and award no credits. Clicking one previews a celebration without a game request or wallet change. Rotation can be paused and stops while backgrounded, offline, covered by a modal, or under reduced-motion preferences. No invented player identities, recent-winner claims or progressive pool are shown.
- Committed slot/keno returns now use Minor, Major (at least 5× stake) and Jackpot (at least 20× stake) presentation badges after the existing result animation. These labels classify the existing returned award; they do not calculate a new payout. Fish catches use existing tier celebrations. Blackjack retains its hand-result presentation.
- Guest login and its entry handler were removed. Opening a game requires a signed-in player; the login form has one full-width Login action. Unsupported native authentication now directs users to the hosted site instead of advertising a removed Guest option.
- Fixed boss reveal validation that excluded Sunken Dynasty/Polar Odyssey boss species. Fixed pending-shot recovery validation that only recognized the first two fishing worlds. All four variants now restore account-scoped accepted requests without another charge.

Main files: `apps/player/src/App.vue`, `LoginScreen.vue`, `api.ts`, `FishScene.vue`, `bot-targeting.ts`, `boss-reveal.ts`, `staging-state.ts`, `WinShowcase.vue`, `WinAward.vue`, `win-presentation.ts`, `arcade-v24.css`, `main.ts`, `CabinetGame.vue`, `FeatureGame.vue`, `GamePreview.vue`, `FishRewardReveal.vue`, `GameRules.vue`; unit coverage in `tests/unit/win-presentation.test.ts` and `fish-requests.test.ts`. Original native UI asset provenance is recorded by `scripts/asset-manifest.mjs` in `reports/asset-manifest.json`.

## Research and scope

- Inspected the current public [JUWA lobby](https://w.juwa2.com/game/home): category navigation, search and New/Popular/VIP sections were visible, with LOG IN and a loading catalog. The authenticated session was unavailable this iteration; the owner was invited to sign in while independent work continued. Earlier supplied screenshots informed the green/gold panels and compact cabinet selection. No claim of private-screen parity, complete cloning, provider source access or live-play timing is made.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) informed visible focus states, practical target sizes and a pause control for rotating information. [W3C reduced-motion technique](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) informed motion preferences. [web.dev animation performance guidance](https://web.dev/articles/animations-and-performance/) informed transform/opacity transitions. This is implementation guidance, not a complete accessibility conformance audit.

## Acceptance

Windows, bundled Node/pnpm:

- `pnpm lint` — passed.
- `pnpm typecheck` — passed.
- `pnpm exec vitest run tests/unit --maxWorkers=2` — 151 tests passed across 24 files. Includes exact bigint badge thresholds, every fish-world boss reveal, four-world durable recovery and existing bot exclusion/collision and payout tests.
- `pnpm build:vercel` — passed; production player and restricted Node API emitted. Player entry `index-DwVYxIgl.js`.
- `node --test tests/deployment/vercel.test.mjs` — 4 passed against the emitted API/routing output.
- `node scripts/asset-manifest.mjs` — 67 assets recorded.
- `git diff --check` — passed.

An initial unrestricted-worker unit run timed out in two timing-sensitive tests amid machine contention; the final bounded-worker run passed all assertions. An initial lint attempt encountered a transient Windows dependency file lock; the final lint passed. No database/production accounting certification is inferred from these frontend checks. The older Playwright end-to-end suite contains obsolete Guest selectors/port assumptions and was not used as acceptance evidence.

Browser checks used the actual local UI through the in-app browser:

- Reef Party: three labeled bots emitted 1,044 visual shots over 97.516 seconds, averaging 10.7 combined shots/second (about 3–4 per bot). Player shot count remained zero and credits remained 989.65. Bots avoided the player-locked target. Evidence: local `reports/screenshots/v24/bot-rate.json` and `fish-fast-bots.png`.
- Demo celebration left the same 989.65 balance unchanged. Pause/Resume, New Arrivals (three games), Premium (Blackjack only), All (twenty), and search/clear were verified in the rendered UI.
- At a 390×844 browser viewport the document had no horizontal overflow; tested quick actions and favorites had usable 36 px or larger targets. Desktop lobby appearance was visually inspected. This does not certify actual Android/iPhone rendering or frame rate.

## Data, rollback and remaining limits

No migration, account creation, balance adjustment, hosted game play, payout-profile change, new service or operator deployment is required. Existing API and operator release remain in place. Rollback is a player-UI redeploy of V23 with its compatible API; preserve accepted requests, ledger rows and wallet balances. Guest would return on that UI rollback.

Android/iPhone device testing and native authentication remain previously documented unfinished work. Full authenticated JUWA inspection and live external-game animation observation were not available. Public release verification follows below.

## Published release

- Source commit `c32b777` pushed to GitHub `tonyk006789-bit/New-Game` main.
- Player deployment `dpl_8Y656CP4jcdaewHwTGZzptLXtaSM` is READY and aliased to https://new-game-test-topaz.vercel.app/. Public entry is the expected `index-DwVYxIgl.js`.
- Initial deployment attempts failed because `api.vercel.com` timed out, including the CLI's routine token refresh. A process-local fetch adapter used Vercel's reachable official `https://vercel.com/api` gateway; TLS verification remained enabled and credentials were never logged. The ordinary prebuilt deployment then completed. No permanent network configuration was changed.
- `node .local/verify-v24-live.mjs` — twelve public route/asset checks passed: both sites' health, test environment, twenty-game catalog, unauthenticated blackjack rejection, privileged-route exclusion from the player site, original art/audio and both HTML entries. Operator entry remains `index-CT1MaUjW.js`; operator was not redeployed. JSON evidence: ignored local `reports/screenshots/v24/live-route-checks.json`.
- Public login visibly contains Player ID, Password and Login, with no Guest option. Existing hosted Sample Player successfully signed in. The generated Jackpot celebration left its 2,000.00 balance unchanged. No paid round, daily wheel, account provisioning or balance adjustment was performed. The test session was signed out after verification.
- Live screenshot evidence: `live-login.png`, `live-lobby.png`, `live-lobby-full.png`, `live-demo-win.png`; local `local-lobby.png` and `fish-fast-bots.png`, all under ignored `reports/screenshots/v24/`. The current narrow browser viewport also has no horizontal page overflow. All twenty games appear in the walking-floor directory.
