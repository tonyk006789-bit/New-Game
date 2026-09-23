# Sparse fish tiers and Vercel packaging — 23 September 2026

## Implemented

- Scheduled arrivals every six seconds, at most nine active creatures and one boss. Species radii range from 8 to 100, with clearly distinct small, medium, large and boss silhouettes. Uncaught creatures may return after 480 seconds; caught IDs do not respawn. Client and server share `reef-ballistics-v3` and exclude inactive targets from collision checks.
- Owner-approved `reef-tiers-v1`: small 1×/30%, medium 3×/20%, large 8×/10%, boss 20×/4% per accepted hit. Size determines both award and capture difficulty. There is no guaranteed kill count or accumulating-health display. At 0.25 stake, capture returns are 0.25/0.75/2.00/5.00 play credits. The Species panel shows size and return multiplier.
- Server derives the species from the validated target ID, then draws and commits the result. Client-supplied payouts/tier overrides are rejected by strict schemas. Old receipts stay replayable; fresh old-profile requests fail before charging. Slots and production approval gates are unchanged.
- Vercel Build Output v3 package with bundled Node 24 player function, same-origin API routing, security headers and separate project/database checks. Separate provisioning writes under `.local/vercel`; Netlify credentials and balances are not changed. Share QR follows the actual deployment origin.

## Verification

- `pnpm typecheck`: passed. `pnpm lint`: passed, zero warnings.
- `pnpm build:server`: passed.
- `pnpm test:unit`: 76 passed across 11 files. Includes 960 seconds of spawn-window checks, at-most-one-boss checks, collision rejection for inactive targets, and exhaustive 10,000 tickets for each approved tier.
- `node --env-file=.local/staging/runtime.env --test tests/db/staging.test.mjs`: 14 passed. Real disposable PostgreSQL schema. Each tier exercised both a resisted hit and a capture, exact stake/award postings and unchanged replay balances. Random tickets were controlled only inside that disposable accounting test; runtime uses Node crypto. Existing authentication, ledger and daily-wheel tests passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/hosted.test.mjs`: 8 passed, including the Vercel HTTP adapter, secure sessions, five-user isolation, four-seat rooms, rejected admin routes, exact project binding and wrong-database rejection.
- `pnpm build:vercel`: passed in full. The first function bundle identified unused optional Nest dependencies; they are now external only on those unused code paths. Final browser assets include `index-Co-rDxRj.js`, `FishScene-C8pYIeMq.js` and `index-B4zkq4HQ.css`.
- `pnpm test:vercel` / `node --test tests/deployment/vercel.test.mjs`: 3 passed against the emitted function and routing output.
- Publication audit: 322 source paths checked against 10 private hosted values, zero findings. `git diff --check` passed.
- Local staging API was restarted with the verified server. Chrome review showed six visible creatures, a prominent dragon, medium turtle and substantially smaller tang/seahorse. Four cannon seats and controls were intact. Evidence: ignored `reports/screenshots-v11/sparse-reef.png`. No browser test shot, credit refill or password mutation was performed in this pass. The existing local balance displayed 1,012.15 at review.

## Hosting status — deployed

Live player: **https://new-game-test-topaz.vercel.app/**. Vercel project `new-game-test` (`prj_cl2AHG9luoYgk8KaVGWDz66LT0xT`) is on Hobby. Its separate Neon database is on the Free plan in Washington, D.C. The owner resolved the account-security step and explicitly approved Marketplace/Neon terms and data sharing. Existing Vercel deployment protection remains unchanged.

Deployed code commit: `53f111f` (includes the V11 source at `9935753`). Verified deployment: `dpl_A1y5o2MkVCrS84jqBJgyPPJQbd5U`, immutable URL `https://new-game-test-mlov26wwz-tonyk006789-7532.vercel.app`. Publication used official Vercel CLI 59.25.4 and `vercel deploy --prebuilt --prod --yes`; the stable production alias is reachable without a Vercel login. Git auto-deployment is not connected.

The first deployment exposed a real-platform routing difference: Vercel retains `/v1/...` while adding `__route`. Fixed the Node adapter to accept matching original/rewrite paths without accepting a different path, duplicate route parameter, or unexpected query fields. `pnpm build:vercel` and `pnpm test:vercel` passed again (4 tests), with a regression covering the actual URL shape. `pnpm typecheck`, `pnpm lint` and `git diff --check` passed after this fix.

Provisioning/acceptance commands and results:

- Verified the new database endpoint differs from Netlify and contains zero public tables before migration. TLS certificate validation was preserved.
- `node --env-file=.local/vercel/runtime.env scripts/database.mjs migrate`: migrations 001–010 applied successfully to the new database.
- `node --env-file=.local/vercel/runtime.env scripts/provision-hosted-test.mjs`: five new player accounts, each funded once with 100,000 integer units / 1,000 play credits through the authenticated MFA/manual ADD workflow. A separate root/database marker was created. No Netlify balances or passwords were changed.
- `node .local/vercel/verify-live.mjs`: live API health 200; five successful ordinary logins with Secure/HttpOnly sessions and no-store responses; each balance 1,000.00; daily wheel eligibility available without claiming it; four real accounts at one table; fifth account rejected from an occupied seat; invalid origin/CSRF, cross-account query and admin-route access rejected. Temporary test seats and sessions were released. No stake, wheel claim, extra funding or balance correction was performed. The private evidence is `.local/vercel/live-verification.json`.
- Chrome verification on the stable Vercel URL: ordinary login reached the eight-game lobby; the Ocean Lounge exposed four seats; the live reef rendered four cannons, a large shark, medium jellyfish and much smaller fish with sparse spacing. Stake choices reached 20.00 in 0.25 steps and auto/lock/fast controls were present. Balance remained 1,000.00. Screenshot: ignored `reports/screenshots-v11/vercel-reef.png`.
- Final publication audit: 368 tracked/output paths checked against 11 private Vercel/database/account values, zero findings.

Secrets and credentials remain in ignored local files and Vercel runtime configuration, outside source and static assets. The existing Netlify service stays on its previous deployed version. See `../docs/VERCEL.md` for update and provisioning instructions.

No new database migration is needed for the fish change. Fresh Vercel provisioning uses existing migrations 001–010. Roll back code without erasing accepted outcomes or overwriting wallets. Physical Android/iPhone testing remains deferred.
