# Reference-informed cabinet refinement — 23 September 2026

## Changes

- `apps/player/src/CabinetGame.vue`, `ReelStage.vue`, `arcade-v9.css`: larger five-reel playfield, narrower side meters, metallic button deck, themed lighting, mobile-accessible line map, reel take-up/linear travel/braking/recoil/landing illumination.
- `WinMeter.vue`, `BetControls.vue` and their four callers: exact integer-unit count-up after a newly revealed accepted return; immediate settlement for restored values, pause and reduced motion; existing 0.25–20.00 stake controls retained.
- `AquaticSprite.vue`, `FishingLobby.vue`: clipped original atlas sprites, moving water/creatures, four cannon variants and four actual selectable seats. No fabricated occupants, jackpots or provider assets.
- `main.ts`: load the new presentation stylesheet. Feature boards use wider layouts and omit the redundant right explanation panel.
- Research and owner-steering documents distinguish observed browser UI, supplied app screenshots and unobserved gameplay timing.

## Commands and results

Commands ran from the repository root with the bundled Node 24 runtime on PATH and bundled pnpm.

| Command | Result |
| --- | --- |
| `pnpm typecheck` | Passed after final component changes. |
| `pnpm lint` | Passed, zero warnings. |
| `pnpm test:unit` | 70 tests passed across 9 files. These are regression tests, not proof of new visual quality or production accounting. |
| `pnpm build:player` | Passed during refinement. |
| `pnpm build:netlify` | Passed after final changes; 870 modules, player assets and single ESM server-function entry built. |
| `pnpm test:netlify-bundle` | 1 passed; packaged function callable and closed without hosted configuration. |
| `pnpm test:netlify` | 3 passed. First sandboxed invocation could not spawn its worker (`EPERM`); the authorized invocation outside that process restriction passed. |
| `git diff --check` | Passed. |
| `scripts/start-staging.ps1` | Existing isolated local services ready; no setup/funding scripts run. |
| `node --env-file=.local/staging/runtime.env .cache/verify-v9-local.mjs` | Read-only comparison passed: the most recent persisted round's final grid, exact return and final balance equal the displayed browser values. |

## Browser acceptance

Chrome extension browser controls were used for the actual UI interactions and DOM/screenshot evidence. The existing automated end-to-end suite was not rerun; these are explicit browser smoke checks plus the listed regression commands.

- Guest Neon Sevens: five reels, 15 settled cells, visible reel translation; Stop reveals the final grid and re-enables controls. No guest credits change.
- Guest Coin Carnival: fast sequence completed all three respins, reported 4/5 held reels, showed four locked columns, retained exactly 15 settled cells and returned to ready.
- Local staging: MAX selects 20.00 and disables further increment; reset to 0.25 before playing. Six Neon rounds at 0.25 each all settled with zero returns. They are preserved in history. Local sample balance changed from **1,021.00 to 1,019.50**. This small sample does not estimate a win rate. No hosted tester balance was used or adjusted.
- Captured final visible grid and meters in `.cache/v9-displayed-round.json`; read-only PostgreSQL comparison and six-round timestamps in `.cache/v9-round-acceptance.json`.
- Positive-return fixture: the real `WinMeter` component displayed an intermediate **0.02**, then exactly **2.50**; pausing while counting settled to 2.50 with no running counter; reduced motion revealed 2.50 immediately. This was an isolated component fixture with no API/game/wallet operation. The temporary served HTML was removed; its source remains privately in `.cache/v9-meter-fixture.html`.
- Phone stake layout at 390×844: document width 390, reel frame bottom 503.5px, control deck starts 519.5px; no horizontal overflow or board/control overlap.
- Ocean Lounge: corrected atlas leakage found during screenshot review; six individual sprites now remain clipped to their cells, without neighboring sprites or black edge blocks. Four seat buttons remain selectable. Guest entry reached the working four-cannon fish scene with auto/lock/fast controls.
- Phone lounge: four seats and table action visible within the narrow layout.
- Aurora at 1024×461: document exactly 1024×461; board bottom 355px, control deck starts 365px. No overlap. A first screenshot timed out; the subsequent capture and geometry check succeeded.

Ignored local screenshots in `reports/screenshots-v9/`: `neon-desktop.png`, `neon-staging-desktop.png`, `neon-phone.png`, `fishing-lounge-desktop.png`, `fishing-lounge-phone.png`, `aurora-landscape.png`. Screenshot evidence is not physical-device certification.

## Deployment

Prepared for the existing authorized five-person Netlify test site. Live deployment verification will be recorded after publishing.

## Remaining limits and rollback

Actual external spin/win/bonus animations and audio await the owner's manual operation. JUWA fish and keno scenes were not browser-accessible. No claim is made to have scraped every game or to reproduce proprietary mechanics. See `../docs/JUWA_AUTHENTICATED_REFERENCE.md` for the coverage record.

Production mathematics remain unapproved. No native build, physical Android/iPhone performance or store acceptance is claimed by this presentation ticket. Sound and additional original symbol/animation families remain further work.

No database/schema, game math, authorization, ledger or funding changes. Rollback by redeploying the preceding player revision; preserve all accepted game history and ledger postings, including the six explicit local test rounds. No wallet reset or migration is required.
