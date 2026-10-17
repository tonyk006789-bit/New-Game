# V43 — minimum-six credentials across every account tier

## Request and change

The owner prioritized usernames and passwords accepting six or more characters, including numbers only. The previous shared validator required both a letter and a number, so numeric-only credentials failed even though the length minimum was already six.

- `packages/contracts/src/index.ts`: remove composition requirements from both browser attributes and server validation. Accept six-digit, letters-only, mixed-case and optionally punctuated strings; retain the existing 256-character cap, case-insensitive username normalization, control-character exclusion for usernames and unchanged legacy login handling. Leading zeroes remain strings.
- `apps/admin/src/App.vue`: label the existing length indicator Password requirements. Create, reset and change-password forms already consume the same shared policy; player settings and both API deployments also consume it.
- `tests/unit/credentials-assists.test.ts`: cover numeric-only/letters-only credentials, leading zeroes, minimum/maximum boundaries and browser/server agreement.
- `tests/db/operator.test.mjs`: exercise numeric-only creation at every parent tier, parent resets, self-service changes for all four roles, sign-in after each change, session revocation, rejection of five-character values and unchanged wallet snapshots.
- `AGENTS.md` and `docs/OWNER_UPDATES.md`: record the new direct owner correction over the earlier letter-and-number requirement.

Nickname stays optional. Main Admin creates Sub-contractors, Sub-contractors create Agents, and Agents create Players. No existing credentials, IDs, balances, permissions, game outcomes or payout policies are changed. No database migration.

## Acceptance evidence

Exact workspace commands, all successful:

- `node node_modules/typescript/bin/tsc -p tsconfig.server.json`
- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json`
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0`
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 261 tests / 37 files passed.
- `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs` — 22 tests passed against an isolated disposable schema in local PostgreSQL. No hosted test accounts/passwords were changed.
- `node node_modules/vite/bin/vite.js build --config apps/admin/vite.config.ts` — operator entry `index-CeVeRnBD.js`.
- `node node_modules/vite/bin/vite.js build --config apps/player/vite.config.ts` — player entry `index-gTucGE3f.js`. Existing optional dealer chunk-size advisory remains.
- `node scripts/vercel-operator-build.mjs` and `node scripts/vercel-build.mjs`.
- `node --test tests/deployment/vercel.test.mjs tests/deployment/vercel-operator.test.mjs` — 7 tests passed.
- From `apps/mobile`: `node node_modules/@capacitor/cli/bin/capacitor copy` — Android/iOS/web asset copies succeeded. Native compilation and physical-phone testing are not claimed.
- `git diff --check` — no whitespace errors.

## Publication and rollback

Publish both existing Vercel projects using their existing encrypted configuration, with no hosted account or wallet mutations. Live verification and deployment identities are recorded below after publication.

No schema rollback is needed. Reverting the shared validator and rebuilding restores the former requirements for newly set credentials; previously created numeric-only accounts would still sign in because login validation is unchanged. Preserve all accounts, credential hashes, balances and audit records.
