# New Game | local playable build

**Latest: automatic round recovery and a dedicated four-seat fishing lobby.** Choose Reef Party, then a table and numbered seat in the Ocean Lounge. Four people can share one table. The manual recovery and game-information panels are removed; saved play remains in History. On the configured development machine, [open the local build](http://127.0.0.1:5183/) → **USE LOGIN** → **SIGN IN**. Local sample credentials are stored only in ignored `.local/staging/PLAYER_LOGIN.txt`. Five-reel machines, 0.25–20.00 stakes and fish auto/lock/fast controls remain available. [Current verification](reports/RECOVERY_AND_FISH_LOBBY_V8.md).

**Netlify setup:** import this repository using the root `netlify.toml`; it builds and publishes only the player. See [deployment instructions](docs/NETLIFY.md). With no hosted API/database configured, the deployment supports guest previews; online accounts and shared credit play require the separate hosted backend. Local databases, passwords and acceptance recordings are excluded from Git.

**Five-person testing:** five separate accounts each received a one-time 1,000-credit manual adjustment. Credentials are in ignored `.local/staging/human-testers.json`. [Sharing, expiration and restart instructions](docs/SHARED_TEST.md).

**Isolated staging with credit-staked test play:** the sample player's original funding and subsequent play remain intact. Eight experimental game models target **30% paying rounds** and expose actual hit/return statistics. The reef has eight painted species and an original detailed seabed. See [staging access and rules](docs/STAGING.md). Production rules remain undecided.

**Working browser accounts, persistent credit controls and free-practice games are available.** On this Windows machine run `./scripts/start-local.ps1`. Player: `http://127.0.0.1:5173`; admin: `http://127.0.0.1:5174`. Local credentials are in the ignored `.local` directory.

Implemented: eight original games with login, PostgreSQL sessions, Main Admin MFA, account creation/access management, balanced manual credit adjustments and branch transfers, immutable history, server-run slots/keno practice, and shared four-seat fishing practice. Neon Sevens, Jade Fortune and Coin Carnival add classic paylines, wild substitutions and locked-reel respins. The player UI now uses compact arcade tiles, original illustrated symbols and bright machine cabinets. Credit-staked math is still undecided. Native compilation, device authentication and production release work remain unfinished.

See [running the playable build and remaining work](docs/LOCAL_MVP.md), [current owner decisions](docs/OWNER_UPDATES.md), [account and ledger verification](reports/MVP_IMPLEMENTATION_VERIFICATION.md), and [latest arcade verification](reports/ARCADE_CABINETS_VERIFICATION.md). Earlier reports remain historical evidence.

---

## Original handoff record (historical)

**Version 2.0 | 17 September 2026 | Supersedes the v1 planning kit**

An independent, invitation-only social arcade with Android and iOS player apps, a responsive operator console, and original slots, keno and four-seat fish tables. No actual money, purchases, cash-outs, valuable prizes, crypto or live JUWA integration.

## Confirmed changes
- Main admin can manually add and remove play credits through the backend.
- New player accounts start at zero. No welcome credits, daily rewards, automatic refills, scheduled grants, promotional grants or grant-claim endpoints.
- Game stakes and legitimate game winnings still settle automatically under approved game rules; those are not discretionary credit grants.
- Android and iOS are first-release deliverables, not a later packaging task.
- The phrase "30% payout over multiple attempts" is unresolved between paying-spin frequency and credit return. There is **no approved production math profile**. The v1 96% example is not an approved requirement.

## Start
Read `AGENTS.md`, `docs/CHANGELOG_V2.md`, `docs/BUILD_SPEC.md`, `docs/DECISIONS.md` and `docs/SPRINT_PLAN.md`. Open the extracted folder in Codex and use `prompts/00_START_HERE.md` for Sprint 0 only. Inspect an existing repository before scaffolding or replacing files. Do not merge the old and new instructions blindly.

Run the dependency-free reference tests:
```
node --test math-reference/game-math.test.mjs policy-reference/product-policy.test.mjs
node math-reference/report.mjs
```

## Contents
- `docs/`: revised product, credit controls, mobile delivery, math clarification, design, security, sprint plan and primary-source research.
- `docs/backlog.json` and `docs/backlog.md`: implementation tickets, dependencies and evidence requirements; no application tickets are completed by this handoff.
- `config/product-decisions.json`: machine-readable confirmed constraints and unresolved gates. This is not a production configuration or a permission system.
- `contracts/README.md`: proposed first-party API and event contracts, not JUWA documentation.
- `prompts/`: seven scoped Codex assignments.
- `math-reference/`: original educational profiles, no implicit defaults; exact slot and keno reference checks.
- `policy-reference/`: pure validation/planning helpers with tests, not an authenticated service or durable ledger.
- `reports/`: actual reference-test results and package verification.
- `references/private/`: supplied gameplay screenshots for visual/behavioral study only; excluded from source control and release assets.

**Delivery status:** this is a specification plus executable reference code. No Android APK, iOS archive, actual game client, database-backed service, deployed environment, remote repository or running Codex task has been created. No third-party code or font files are bundled. App-store approval is not guaranteed.
