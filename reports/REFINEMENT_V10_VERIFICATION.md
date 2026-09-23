# Player refinement, daily wheel and reef variety — 23 September 2026

## Delivered behavior

- Compact emerald login: player ID, password, optional remembered ID, guest/login actions. No passwords are saved in browser preferences.
- The displayed balance stays at its pre-round value through the result animation and win count, then reveals the authoritative balance. Accounting still commits immediately. Next play is disabled during count-up; leaving a game or recovering an interrupted round clears the display hold.
- Main lobby daily wheel and platform-link QR with copy, native sharing when supported and QR download.
- Owner-approved `daily-wheel-v1`: nine equal-probability awards (0, 0.05, 0.10, 0.15, 0.25, 0.75, 1.50, 3.00, 5.00), one spin per rolling 24 hours, positive available balance required. Server randomness, wallet lock, CSRF and immutable idempotent receipt. Distinct balanced `DAILY_WHEEL` ledger postings; zero consumes the cooldown without a zero posting. Disabled outside explicitly configured test environments.
- Music and effects switches with saved preferences; original synthesized melody, button/cannon/impact/win sounds, gesture-based audio unlock and background suspension. Self-service password changes require the current password, minimum 12 characters, CSRF and rate limiting, revoke all existing sessions, and preserve credits.
- Eight new original transparent atlas creatures: sea dragon, mermaid, crown crab, star manta, seahorse, lobster, sardine and lemon fish. Sixteen total species, shared migration paths with much lower simultaneous density, radius range 9–62, mesh tail movement, net impacts and coin/catch celebrations for actual committed awards. No progressive jackpot pool or payout change.
- Shared `reef-ballistics-v2` uses the new paths and radii. Historical receipts remain replayable; an old client trajectory that does not match the updated server is rejected without charging.

## Verification

- `pnpm typecheck`: passed.
- `pnpm lint`: passed with zero warnings.
- `pnpm test:unit`: 73 passed across 11 files, including migration density/size and display-hold coverage.
- `pnpm build:server`: passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs`: 13 passed. Real PostgreSQL, isolated temporary schema. Covers wheel duplicate/distinct-key races, exact cooldown boundary, positive available balance, reservations, role/CSRF rejection, immutable receipts and ledger reconciliation; password validation, revocation of two sessions, old-password rejection, rate limiting and balance preservation; existing game/room accounting regression.
- `node --env-file=.local/staging/runtime.env --test tests/db/hosted.test.mjs`: 7 passed; five-user transport isolation and four-person rooms.
- `pnpm build:netlify`: passed; browser assets and single ESM server function built.
- `pnpm test:netlify`: 3 passed. `pnpm test:netlify-bundle`: 1 passed.
- `pnpm test:reference`: 50 passed; these remain reference/policy checks, not proof of production accounting.
- Windows sandbox initially prevented worker spawning for unit/database tests; authorized invocations passed. Initial wheel DB test caught the missing idempotency operation constraint; migration 010 resolved it, and the full DB test rerun passed.

## Browser evidence

Chrome extension used for UI checks. No external reference-provider wagers were operated.

- Local sample daily spin: 0.15 award, 24-hour countdown, further spin disabled. Balance 1,019.75 → 1,019.90. Reload/reopen kept the cooldown.
- QR rendered for `https://new-game-tonyk006789.netlify.app/`; Copy reported success. No account identifier, password or session token is encoded.
- Music switch changed to On; change-password form exposed all three fields. Password mutation was tested only in the disposable database fixture, not by changing a human tester password through the UI. Audible quality was not certified by automated checks.
- Real Neon round: sampled during count-up with Win 0.00 and balance still 1,019.65; at 904 ms, Win was 0.50 and balance became 1,019.90. Two local 0.25-credit slot tests had combined net change zero. Raw visible-DOM samples: `reports/screenshots-v10/win-before-balance.json`.
- Five accepted local fish shots at 0.25: one 0.75 return and four zero returns, final sample balance 1,019.40. An expired-table attempt was rejected without charge; firing is now blocked while a room error is present. These few rounds do not estimate a win rate. No account refill or history deletion occurred.
- Fish desktop: 1280×665 document and viewport; control deck bottom 662, four seat plaques, no scrolling required. The earlier 10px header gap was removed. New sprites and mesh rendering produced no renderer console errors during the initial scene check.
- Login phone: document and viewport both 390×844, no horizontal overflow. Desktop and phone screenshots reviewed.
- Fish phone: document and viewport both 390×844, four seat plaques and controls ending at 841px; screenshot reviewed and temporary viewport override reset. Final desktop capture also shows an actual Jewel seahorse catch banner and coins during the win count. Additional local play was visible during the final capture, so the earlier 1,019.40 is the end of the bounded acceptance sequence, not a frozen current balance.
- Some first Chrome screenshot attempts timed out. Subsequent supported viewport captures succeeded; no alternate browser automation was used.

Local screenshots are ignored because they can contain sample account state: `reports/screenshots-v10/`. They are browser evidence, not Android/iPhone performance certification.

## Deployment and migration

Pending final publish verification. Netlify uses its own `netlify.migrations` tracking for the installed 001–008 baseline. The generic local migration command was initially attempted against the hosted test DB; its transaction rolled back at the already-existing enum before any changes. The deployment now supplies the correct additive `netlify/database/migrations/0002_daily_wheel/migration.sql`, containing repository migrations 009–010. The original baseline is unchanged.

Rollback code by redeploying the prior version; keep added tables and all committed daily receipts/ledger postings. Never restore balances from screenshots or remove accepted rewards. Existing tester logins are unchanged.

## Artwork and implementation sources

Original atlas: `apps/player/public/art/reef-legends-v10.png` (1774×887), generated with the built-in ImageGen tool. Exact prompt: `reports/art-prompts-v10.json`; provenance/hash: `reports/asset-manifest.json`. Supplied reference screenshots are not shipped.

Audio uses the documented gesture/resume lifecycle in [MDN Web Audio best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices). QR generation uses the pinned library's [documented browser data-URL API](https://www.npmjs.com/package/qrcode). Pixi mesh deformation follows the installed PixiJS `MeshPlane` API documentation.

Production game mathematics remain undecided. No native build, physical-device acceptance or new jackpot payout system is claimed.
