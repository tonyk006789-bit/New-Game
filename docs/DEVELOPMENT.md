# Development guide

**Current build (18 September):** see [Local playable build](LOCAL_MVP.md) for account credentials, real PostgreSQL accounting, free-practice games, startup and current limitations. The sections below record the earlier S0 foundation and are historical where they describe disconnected services.

The repository now contains a local player prototype, separate operator prototype, NestJS API boundary scaffold, Colyseus room scaffold, shared TypeScript contracts, and generated Capacitor Android/iOS source projects. They are not an authenticated MVP or a release build.

## Start locally

Use Node **24.19.0** and pnpm **11.19.0** (declared in `.node-version` and `package.json`). From the project root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Player: http://127.0.0.1:5173. Operator: http://127.0.0.1:5174. Both bind to loopback only. Stop with Ctrl+C. On this Windows machine, `scripts/start-preview.ps1` can use the bundled Codex runtime without changing system settings. Run it with PowerShell from the project folder.

The player can browse/filter/search the three games, save favorites, explore fixed reel animation and keno sample reveals, interact with a PixiJS fish scene at 20/40/80/120 fish, view zero-credit/history states, and reduce motion. Only favorites and presentation settings use localStorage. There is no login, token, account balance or authoritative outcome in local storage.

The operator preview uses fictional, zero-balance accounts. Add/Remove previews validate precise amounts, reasons, and availability. Confirm is deliberately unavailable. No preview pretends to create a durable receipt.

## Actual commands

| Command | Purpose |
|---|---|
| `pnpm lint` | TypeScript/Vue lint |
| `pnpm typecheck` | All Vue/TypeScript packages |
| `pnpm test` | Supplied references + domain validation + local HTTP integration |
| `pnpm test:e2e` | Chromium desktop and phone-viewport interaction tests; screenshots in `reports/screenshots` |
| `pnpm build` | Player, admin, API and rooms compilation |
| `pnpm start:api` | Compiled local API, port 3000 |
| `pnpm start:rooms` | Compiled Colyseus scaffold, port 2567; joins rejected |
| `pnpm mobile:sync` | Rebuild player and synchronize both native projects |
| `pnpm build:android` | Gradle `assembleDebug`; needs Java + Android SDK |
| `pnpm build:ios` | Unsigned iOS simulator build; needs macOS + Xcode |
| `pnpm db:migrate` | Transactional, hash-checked migrations |
| `pnpm db:seed` | Explicit isolated fixtures; no balances granted |
| `pnpm test:db` | Actual PostgreSQL schema/fixture/constraint tests |
| `pnpm math:report` | Educational reference metrics, no selected live math |
| `pnpm assets:manifest` | SHA-256 manifest of original SVG art |

Browser tests use installed Chrome on this Windows host. On a fresh host, run `pnpm exec playwright install chromium` first. Browser phone emulation and software WebGL are not native performance evidence. The workflow in `.github/workflows/checks.yml` is prepared, but no remote repository, CI run or deployment has been created.

## Native toolchains

Pinned runtime: Capacitor **8.5.2**, App plugin **8.1.1**. Generated Android project: Gradle **8.14.3**, Android Gradle Plugin **8.13.0**, Java source/target **21**, compile/target SDK **36**, template minimum SDK **24**. Generated iOS SPM project: Capacitor Swift package exactly **8.5.2**, template minimum iOS **15**. These template minimums are not an owner-approved supported-device list.

Capacitor 8 specifies Node 22+, Xcode 26+, and Android Studio 2025.2.1+. Use the compatible Java bundled with Android Studio and install the project's SDK target. The chosen Node 24 satisfies this floor. See the [official environment requirements](https://capacitorjs.com/docs/getting-started/environment-setup) and [workflow](https://capacitorjs.com/docs/basics/workflow).

Run `pnpm mobile:sync` after installs or player changes, particularly on a Mac checkout, to regenerate platform-local dependency paths. Xcode project: `apps/mobile/ios/App/App.xcodeproj`. Android project: `apps/mobile/android`. Android backup and cleartext networking are disabled. No remote server URL or credential storage plugin is enabled. Long-lived token storage must be designed and reviewed before actual authentication.

The app ID `com.newgame.arcade`, launch icons, platform splash images, and OS floors are development placeholders. No signing secrets, store accounts or provisioning profiles are present. Native project generation succeeded locally; native compilation/signing/device performance has not been certified.

## Database lifecycle

Start the optional local database with `docker compose up -d postgres` on a host with Docker. Set `DATABASE_URL` from `.env.example` in the process environment (scripts do not automatically load `.env`). Then run `pnpm db:migrate`. Fixtures require `ALLOW_LOCAL_FIXTURES=true` and a local database named `new_game_dev` or `new_game_test`. The accounts are inactive and have no login credentials.

Migrations execute under a transaction and advisory lock. Applied SQL hashes cannot change silently. Fixtures can be rerun without resetting balances. Test commands are intentionally blocked without PostgreSQL; pure JavaScript tests cannot certify the database.

This is a domain schema foundation, **not a ledger implementation**. The branch query test is not endpoint authorization. Account hierarchy mutation, ledger postings, reserves, durable receipts, authenticated session idempotency, reversal logic and concurrency tests belong to the next accounting milestone.

## Migration and rollback

No pre-existing application or live database was changed. The ZIP was imported into the initially empty workspace; private screenshots remain excluded from source control and bundles. There is no destructive down migration. A failed migration rolls back its transaction. Once history exists, use forward corrective migrations and append-only corrections; never reset player balances or rewrite audit rows. For a disposable local environment only, keep or explicitly replace its data volume as a separate operator action.

## Design and sources

Original game SVGs are under `apps/player/public/art`. `reports/asset-manifest.json` records file hashes. Fish and slot shapes are code-authored. No screenshot from `references/private` is imported. Native starter assets originate from the installed Capacitor template and should be replaced for release.

The implementation follows the [PixiJS Application API](https://pixijs.com/8.x/guides/components/application), [NestJS bootstrap guide](https://docs.nestjs.com/first-steps), and [Colyseus server documentation](https://docs.colyseus.io/server). `pnpm-workspace.yaml` explicitly allows needed build scripts and disables the optional `msgpackr-extract` addon; its JavaScript fallback remains available.
