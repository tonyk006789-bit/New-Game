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

## Hosting status

Vercel signed in as the owner's Hobby account. Actual project/database creation and publication are pending the account's security-setup prompt. Automatic approval review rejected initiating GitHub OAuth until the owner approved that specific sign-in; the owner then approved it and the browser was signed in. Automatic approval review also rejected dismissing the two-factor setup prompt; the owner was asked to handle it directly. No workaround was used.

Official CLI 59.25.4 is available in ignored `.cache/vercel-tools`; its version command succeeded. pnpm reported an ignored esbuild install script for this separate CLI tool folder; application build tooling is unaffected. No Vercel tokens, private database secrets or test credentials are in source/build output.

No Vercel live URL is claimed yet. The existing Netlify service stays on its previous deployed version. See `../docs/VERCEL.md` for the prepared deployment/provisioning steps.

No new database migration is needed for the fish change. Fresh Vercel provisioning uses existing migrations 001–010. Roll back code without erasing accepted outcomes or overwriting wallets. Physical Android/iPhone testing remains deferred.
