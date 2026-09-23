# Netlify deployment setup

The repository is prepared for a new Netlify **player** site. The current API is a long-running NestJS service backed by PostgreSQL. Deploying the static player does not create that service, copy the local database or create test accounts.

## Import the repository

1. In Netlify, choose **Add new project → Import an existing project → GitHub** and select `tonyk006789-bit/New-Game`.
2. Select the pushed branch. Leave the base directory at the repository root. The committed `netlify.toml` supplies build command `pnpm build:netlify`, publish directory `apps/player/dist` and functions directory `netlify/functions`.
3. Node is pinned to `24.19.0`; pnpm is pinned to `11.19.0` in `package.json`. The lockfile is used for installation. Do not set `NODE_ENV=production` during dependency installation, which needs development build tools.
4. Initially leave `GAME_API_ORIGIN` unset. Netlify will serve the guest preview and return a clear JSON service-unavailable message for online sign-in. No credentials are bundled and API paths cannot fall through to the HTML app shell.

Only the player output is published. The operator console, repository sources, reports and `.local` directory are outside the publish directory. Search indexing is disabled, but that is not access control: use Netlify access protection where available if the preview itself must be private.

## Connect online play later

`GAME_API_ORIGIN` is an optional **build-time** Netlify environment variable such as `https://your-player-api.example`. It must be the HTTPS origin of the hosted player service, without a path or credentials. A build generates a same-origin `/v1/*` proxy, so browser sessions keep the existing cookie/CSRF model. Changing this variable requires a rebuild. Never put a database password, connection string or admin credential in this variable or a `VITE_*` variable.

Before connecting it, the backend work still required is:

- Provision a dedicated PostgreSQL database and deploy the API/player gateway. The existing loopback listener, process startup and local-only fixture scripts need a hosted deployment path; the Netlify frontend build does not run them.
- Configure TLS, secure session cookies and `ALLOWED_ORIGINS` for the exact Netlify site origin. Keep player routing and the five-account test audience restrictions; do not expose admin routes through the player service. Preview branch domains need their own explicitly permitted origins and isolated data if used.
- Implement an explicit private hosted-test environment. `GAME_ENV=staging` currently deliberately requires the local staging database and rejects production mode. Do not bypass that check or mark the experimental math as approved production math to make a deployment start.
- Apply database migrations and provision accounts through the existing authenticated administrative workflow. Account creation starts at zero. An authorized, idempotent manual adjustment may fund the five test accounts once. No automatic refill is part of deployment.
- Verify five separate logins, four shared fish seats, automatic round reconciliation, immutable balances and idempotency against the hosted database before sharing a playable test link.

Keep `GAME_API_ORIGIN` unset until that backend exists. The local tester credentials and balances remain on the development computer; this setup does not upload them.

## Local validation and rollback

```sh
pnpm install --frozen-lockfile
pnpm test:netlify
pnpm build:netlify
```

No database migration is introduced by this hosting configuration. Remove `GAME_API_ORIGIN` and redeploy to disconnect the hosted API, or restore a previous Netlify deploy to roll back the player. Neither action rewinds committed rounds or balances.

Acceptance screenshots and recordings referenced by historical reports remain local because they may contain disposable passwords and account information. They are intentionally absent from the source repository.

References: [Netlify file configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/), [Vite setup](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/), [dependency management](https://docs.netlify.com/build/configure-builds/manage-dependencies/), [proxy rewrites](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).
