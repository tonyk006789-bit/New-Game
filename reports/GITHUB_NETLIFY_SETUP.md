# GitHub publication and Netlify preparation — 23 September 2026

Owner destination: `https://github.com/tonyk006789-bit/New-Game`. The remote was empty when inspected. Owner chose Netlify setup preparation and confirmed no site or hosted database exists yet.

## Changes

- `netlify.toml`, `scripts/netlify-setup.mjs` and `netlify/functions/api-unavailable.mjs` publish only the built player, with security/cache headers and API routing before the SPA fallback. An unset backend origin returns a JSON 503; a configured public HTTPS origin enables the same-origin API rewrite.
- `package.json` adds Netlify build/check commands. GitHub CI runs both alongside the existing application checks.
- `.gitignore` excludes local QA recordings/screenshots, runtime test reports, Netlify state and private-key files in addition to existing credential/database/build exclusions.
- `scripts/configure-sample-login.mjs` uses an explicit environment password, an existing privately saved password or a newly generated password. No known local credential is hardcoded. The sample-login acceptance check reads its ignored fixture instead of copying a password into source.
- README, the historical v6 access report and owner records remove the published password and link to `docs/NETLIFY.md` for deployment limitations and steps.

## Executed checks

- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `node --test tests/deployment/netlify.test.mjs`: 3 passed. An initial sandbox invocation could not spawn Node's test worker; the permitted rerun passed.
- `pnpm build:netlify`: passed; player assets, redirects and robots file generated. No hosted API configured.
- `pnpm test`: 50 reference, 65 unit and 16 HTTP integration checks passed. The reference examples are not production math/accounting evidence.
- Local publication scan: selected source files checked in memory against actual local credential strings, plus runtime-path, private-key/token-pattern and GitHub file-size checks. No findings. Password values are never printed by the scanner.

Netlify's cloud build has not been run; no site or database was provisioned. GitHub CI execution is separate from the local checks above. No UI/gameplay, wallet, math-profile or database schema changes are introduced. Native build/device limitations remain as recorded in the existing reports.

## Rollback

Remove the Netlify configuration or restore a prior frontend deploy. Remove `GAME_API_ORIGIN` and rebuild to disconnect a configured backend. Retain credential/runtime exclusions. No database migration or balance restoration is needed; existing local credentials and balances were not modified.
