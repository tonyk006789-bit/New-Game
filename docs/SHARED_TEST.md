# Five-person game test

The shared player connects to the existing isolated PostgreSQL staging environment. Each of `tester.one`, `tester.two`, `tester.three`, `tester.four` and `tester.five` received one manual 1,000.00-credit adjustment through authenticated Main Admin MFA. Their unique passwords and funding receipts are in ignored `.local/staging/human-testers.json`; give each person one account privately. The public login does not expose the local sample credentials. Credits have no purchase or redemption value.

The current URL and estimated expiry are in `.local/staging/share-link.json`. The proposed Pinggy connection is a free HTTPS tunnel with a roughly 60-minute session. Keep this computer awake, connected, and the local services running. A new session gives a new link; the database, balances and histories survive. This is not permanent hosting. Pinggy terminates HTTPS and can process login traffic; provider approval is pending before external authenticated verification.

After that approval, start or restart from this workspace:

```powershell
.\scripts\start-shared-test.ps1
```

For an expired session, this creates a new URL. For a live session, it reports the existing URL. Stop sharing with:

```powershell
.\scripts\stop-shared-test.ps1
```

This stops only verified tunnel/gateway processes and preserves accounts, credits, history and local previews. No startup command performs funding. `node scripts/prepare-human-testers.mjs` is the explicit setup command; rerunning replays the original funding receipts rather than replenishing balances.

The gateway binds only to `127.0.0.1:5185`, serves `apps/player/dist`, and forwards a fixed player API allowlist to staging on 3001. Only the five tester IDs may log in remotely. Admin routes, source files, adjustment/transfer APIs and credentials remain blocked. Sessions use HttpOnly, SameSite and Secure cookies on the public HTTPS origin. No privileged admin credentials leave localhost. Dedicated ignored SSH keys avoid using existing personal SSH identities.

Reef Party opens the Ocean Lounge, where players choose a table and one of four numbered seats. To play together, all four people select the same table. A fifth person must choose another table. Occupancy and names are real; empty seats stay open. The back arrow returns to this lounge and releases the seat. Slots and other games are independent per player. Play stakes range from 0.25 to 20.00; auto fire is serial and stops on stake changes, background/offline transitions and leaving the table. Interrupted rounds reconcile automatically; there is no manual Recover Round panel.

Validation: `node --test tests/db/share-gateway.test.mjs` checks the gateway boundary locally. After provider approval, `node scripts/verify-shared-test.mjs` checks five logins, 1,000-credit starting balances, five distinct seats, blocked admin/source routes and the actual browser renderer without spending tester credits. This pristine-balance check is intended before human play, not after it. Screenshots go to `reports/screenshots-v7` and results to `reports/SHARED_TEST_VERIFICATION.json`.

Provider reference: [Pinggy free tunnel duration and password/key setup](https://pinggy.io/help/), [HTTPS redirects](https://pinggy.io/docs/http_tunnels/). Native device testing remains outstanding; browser verification is not Android/iOS certification.
