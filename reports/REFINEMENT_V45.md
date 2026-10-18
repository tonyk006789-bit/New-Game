# V45 — created accounts missing from their creator's list

Date: 18 October 2026. Owner clarified: “From the list in the same account that created it.”

## Cause and change

The shared operator `create()` handler saved the account and then reused the current search, status, page and sort. A saved child could therefore be excluded by an earlier search, remain on another page, or sort out of view. The handler also awaited an unrelated `/me` refresh before loading accounts; failure there prevented the list request despite successful creation. Search reset the actual page but left the “Go to” field stale.

After a committed create, all three operator roles now clear search/status, select newest registration first, reset both page values to one, and request the account list directly. The success notice explains the new ordering. A failed list refresh explicitly says the account was saved and can be reloaded using Search. Authentication expiry still clears the private session. Creation failures retain the form and durable retry key. No server permission or account hierarchy changed.

Changed files:

- `apps/admin/src/App.vue`: post-create refresh and synchronized pagination.
- `tests/unit/operator-account-creation.test.ts`: actual component submit-handler regressions using mocked transport, without DOM or a live wallet.
- `vitest.config.ts`: existing Vue plugin enables component imports in those tests; no dependency added.
- `tests/db/operator.test.mjs`: each helper-created account must immediately appear in its parent's real PostgreSQL-backed list with zero available credits and management access.
- `docs/OWNER_UPDATES.md` and this report: scope and evidence.

## Verification

- Before the fix, six of seven new component checks failed: all three creator roles retained excluding filters/pages, the unrelated `/me` failure prevented refresh, creation retry retained the stale list query, and Go to remained on the prior page. The seventh (saved success on list failure) already passed. After the fix, all seven pass.
- `node node_modules/typescript/bin/tsc -p tsconfig.server.json` — passed.
- `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` — passed after removing an unsupported Vue-plugin test option.
- `node node_modules/eslint/bin/eslint.js apps packages tests netlify/functions --max-warnings 0` — passed.
- `node node_modules/vitest/vitest.mjs run tests/unit tests/integration` — 272 passed in 39 files.
- `node --env-file=.local/staging/runtime.env --test tests/db/operator.test.mjs` — 22 passed, real local PostgreSQL in an isolated schema, including creation visibility, branch denial, account access, credentials, idempotency and balanced credit operations.
- `node node_modules/vite/bin/vite.js build --config apps/admin/vite.config.ts` — passed; entry `index-VN7DJH2W.js`, stylesheet `index-Bx8nQw6i.css`.
- `node scripts/vercel-operator-build.mjs` — passed.
- `node --test tests/deployment/vercel-operator.test.mjs` — 3 passed, including role/routing/body restrictions.
- `./scripts/start-staging.ps1` and `node .local/check-v45-accounts.mjs` — created a separate zero-credit local Sub-contractor → Agent → Player fixture through authenticated APIs. Immediately verified the new child was the first result for each parent. Passwords are only in ignored local fixture storage.
- Browser: signed in to each existing local fixture after creation, confirmed its correct child list and zero balance; no console warnings/errors. Screenshots: `reports/screenshots/v45/main-admin.png`, `sub-contractor.png`, `agent.png` (ignored evidence). The automatic submit-to-refresh behavior is covered by the component tests; the browser list inspection and real API checks complement them.

## Publication and limits

Publish only to the already authorized https://new-game-operator.vercel.app/ project. Live deployment evidence will be recorded after publication. The player site remains V44. No hosted accounts, passwords, wallets or database records were changed for these tests. Physical-device testing remains deferred; the browser screenshots are desktop checks. No claim is made that the user's particular missing account was inspected in the hosted database.

No migration. Rollback is the preceding V43 operator deployment `dpl_2N8fE49XWxy7EXAxYsBPVxHqU9EZ`; retain the database and every accepted account/ledger event. Rolling back reintroduces the stale-list behavior but must not remove created accounts or restore old balances.
