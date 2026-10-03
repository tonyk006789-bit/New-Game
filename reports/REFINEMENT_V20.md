# 3 October 2026 — additional music and blank operator reasons

## Delivered changes

- `apps/player/src/music-score.ts` adds 26 original synthesized compositions: two additional tracks for each of the twelve games and the lobby. Each scene now has a three-track playlist, for 39 total. Distinct melodies, bass progressions, tempos and house/swing/breakbeat arrangements include an opening, main phrase, breakdown and final lift. No provider recordings were copied.
- `audio.ts` rotates after each 256-step arrangement, remembers the current track per scene during the session, and retains one scheduler with independent Music/Sound preferences and background suspension. `MusicControls.vue`, `SettingsPanel.vue`, `App.vue`, `main.ts` and `arcade-v20.css` expose lobby/game music toggles, a next-track button, and the settings playlist selector.
- `apps/admin/src/App.vue` removes Reason fields from all shared Main Admin, Sub-contractor and Agent credit/account-management dialogs, reviews and receipts. New requests omit the field. Previously saved pending requests retain their exact original payload for retry.
- `packages/contracts/src/index.ts`, `apps/api/src/ledger.ts` and `accounts.ts` accept omitted or whitespace-only reasons as an empty string. Nonempty historical notes remain valid. Actor, target, action, password verification, branch scope, idempotency and wallet version checks remain enforced. No automatic substitute reason is generated.
- Migration `015_optional_operator_reason.sql` permits empty ledger reasons without changing any existing ledger rows. The policy reference helper, its tests, `AGENTS.md`, `docs/CREDIT_CONTROL.md` and `docs/OWNER_UPDATES.md` record the explicit owner amendment.

## Acceptance

Pinned Node 24 / pnpm on Windows:

| Command | Result |
| --- | --- |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm test:unit` | 113 passed |
| `pnpm test:integration` | 20 passed |
| `pnpm test:reference` | 51 passed; reference checks only |
| `pnpm build:server` | Passed |
| `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs tests/db/operator-hosted.test.mjs tests/db/hosted.test.mjs` | 35 passed against isolated local PostgreSQL schemas |
| `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs` | 19 passed after extending blank-reason coverage to archive/restoration and password reset |
| `node --env-file=.local/runtime.env --test tests/db/backend.test.mjs` | 16 passed against an isolated local PostgreSQL schema |
| `pnpm build:vercel` | Passed |
| `pnpm build:vercel-operator` | Passed |
| `pnpm test:vercel` | 4 passed |
| `node --test tests/deployment/vercel-operator.test.mjs` | 3 passed |

Database tests cover all three operator tiers, empty-reason ADD/REMOVE/TRANSFER/REDEEM/reversal, concurrent replay with omitted/empty/whitespace reasons, profile changes, suspension/restoration, archive/restoration and password reset. Every tested transaction has balanced postings; older ledger reasons remain unchanged; management does not alter wallet balances; agents remain unable to issue supply. Audio tests cover unique names and compositions, bounded notes/levels, arrangement variation, playlist wrap, manual selection, one scheduler, pause/mute and scene transitions.

The first player build encountered transient Windows dependency file locks (`os error 32`). The unchanged build passed on retry. The existing PostgreSQL tests emitted a concurrent-query deprecation warning; no test failed.

Browser checks: guest lobby music enabled and skipped to Velvet Roulette; Settings offered all three lobby tracks and accepted After Hours; Ruby Rush switched to its own playlist and advanced to Ruby Boulevard. Muting removed the next-track control. Agent recharge showed only the amount field and proceeded to a valid review without a reason; the review was dismissed without transferring credits. Screenshots are retained locally in ignored `reports/screenshots-v20/`. No paid play, claims, hosted account edits or funding operations were performed for visual checks.

## Migration and rollback

Applied `015_optional_operator_reason.sql` to local staging and the existing shared Vercel test database. Before the hosted migration, a consistent read-only logical backup of all 21 public tables was encrypted locally under ignored `.local/vercel/reason-backup-015-*`. All 15 hosted wallets retained identical settled amounts, reservations and versions. The migration changes only the reason check constraint; historical reasons are not rewritten.

For rollback, redeploy the previous application bundles while retaining migration 015: the relaxed constraint remains compatible with the previous required-note client/API. Do not restore the old constraint after empty notes exist, and do not rewrite or erase accepted ledger/audit entries to force a schema rollback. Music can be rolled back independently by restoring the prior player bundle.

No game outcomes, payout profiles, stake settings or permission hierarchy changed. Physical Android/iPhone testing remains unavailable; desktop browser and automated results are not native-device certification.

## Publication

Deployment identifiers and live verification will be recorded after publication.
