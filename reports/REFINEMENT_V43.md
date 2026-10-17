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

Source commit `21eb271` was pushed to the existing GitHub main branch. Both existing Vercel projects completed READY using their existing encrypted configuration, with no hosted account/password/wallet mutations:

- Operator: `dpl_2N8fE49XWxy7EXAxYsBPVxHqU9EZ`, https://new-game-operator.vercel.app/; immutable URL https://new-game-operator-ec378lvmg-tonyk006789-7532.vercel.app/.
- Player: `dpl_2Jf9tnCoqh7YWaoVBXJT1HZMYBqv`, https://new-game-test-topaz.vercel.app/; immutable URL https://new-game-test-1se3c2atu-tonyk006789-7532.vercel.app/.
- Operator command, from `.local/vercel-operator`: `node --import ../vercel-web-gateway.mjs ../../.cache/vercel-tools/node_modules/vercel/dist/vc.js deploy --prebuilt --prod --yes --global-config "C:/Users/kcdre/OneDrive/Documents/ChatGPT/New Game/.local/vercel-cli" --scope tonyk006789-7532 --no-color`.
- Player command, from root: `node --import ./.local/vercel-web-gateway.mjs .cache/vercel-tools/node_modules/vercel/dist/vc.js deploy --prebuilt --prod --yes --global-config "C:/Users/kcdre/OneDrive/Documents/ChatGPT/New Game/.local/vercel-cli" --scope tonyk006789-7532 --no-color`.
- An initial operator CLI invocation used a Windows absolute path for `--import`, which Node rejected before deployment. The relative module path above succeeded.
- `node .local/verify-v43-live.mjs` — 8 live checks passed: both exact new entry hashes, uncached HTML, six-character policy text in both bundles, health endpoints and authentication protection of create/reset/change routes. Results: `reports/screenshots/v43/live-checks.json`. Unauthenticated requests are rejected before schema validation, so those route checks prove protection, not credential acceptance; actual credential acceptance is established by the isolated PostgreSQL tests.

Browser verification inspected the local Main Admin Create account dialog without submitting credentials. Account, Password and Confirm password all have `minlength="6"`, `maxlength="256"`, `pattern=".{6,256}"`; Nickname is optional. The same component serves every operator role. Screenshot: `reports/screenshots/v43/create-account.png`. No browser console errors were captured in the local form or live login page. The saved hosted sample login was rejected, so no authenticated hosted account workflow is claimed or retried; live bundles and protected routes were checked directly. Screenshot and live-check JSON are ignored local evidence artifacts.

Refresh an already open backend/player tab once to load the new entry. No physical-device certification is claimed.

No schema rollback is needed. Reverting the shared validator and rebuilding restores the former requirements for newly set credentials; previously created numeric-only accounts would still sign in because login validation is unchanged. Preserve all accounts, credential hashes, balances and audit records.
