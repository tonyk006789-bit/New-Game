# First-party API/message proposal | v2.0
Not JUWA documentation. Convert to reviewed schemas during S0; this file does not implement endpoints. Amounts are integer-unit decimal strings. Identity comes from the authenticated server principal. All mutations use actor+operation-scoped `Idempotency-Key` and a canonical request hash. Use bounded cursor pagination and scope-safe errors.

## Core REST surface
| Method / path | Purpose | Permission |
|---|---|---|
| POST /v1/auth/invites/redeem | Create/activate zero-credit account | Valid invite |
| POST /v1/auth/sessions | Authenticate device/session | Login policy |
| POST /v1/auth/step-up | Recent privileged verification | Authorized staff |
| DELETE /v1/auth/sessions/current | Revoke session | Self |
| GET /v1/me | Identity, capabilities, balance/revision | Self |
| POST /v1/orgs/{id}/children | Create allowed descendant tier | Scoped staff |
| GET /v1/players | Search only permitted branch | Scoped staff |
| POST /v1/admin/credit-adjustments | Manual ADD or REMOVE | MAIN_ADMIN + fresh privileged verification |
| POST /v1/admin/credit-adjustments/{id}/reversals | New linked correction; no history rewrite | MAIN_ADMIN; current availability check |
| GET /v1/credit-transactions | Ledger-derived history | Self/scoped staff |
| POST /v1/credit-transfers | Move existing units only | Disabled until D02 approval |
| GET /v1/games | Catalog, rule/profile status | Player |
| POST /v1/games/{id}/rounds | Accept/settle approved slot or keno round | Player; approved immutable math |
| GET /v1/rounds/{id} | Recover original committed result | Owner/scoped staff |
| GET /v1/fish/rooms | Actual room occupancy | Player |
| POST /v1/fish/join-tickets | Scoped short-lived join ticket | Player |
| GET /v1/audit/events | Immutable audit events | Authorized scoped staff |

No grant, refill, daily-claim or credit-purchase endpoints. No generic public set-balance route.

Adjustment request fields: `targetWalletId`, `direction` (ADD/REMOVE), `amountUnits` (>0), `reason`, `expectedWalletVersion`, and privileged proof handled by the server session. Response: transaction ID, actor/target identity, signed change, before/after settled balance, reserved and available units, revision, committed time and request ID. Do not echo credentials. Requesting more than available returns an error without partial deduction. A retry with identical content returns the original receipt; a changed body conflicts.

Round request: game ID/version, costUnits, clientRequestId and game-specific selections. No client payout or RNG. Response: persisted round ID, math hash, cost/payout, balance revision, committed timestamp and public result/presentation events. If math is not approved, return a typed `GAME_MATH_NOT_APPROVED` error without charging.

## Mobile sync and fish messages
Common events: `wallet.updated`, `session.revoked`, `round.settled`. Use monotonically increasing revisions plus snapshot recovery; delivery may be repeated or missed, so clients deduplicate/fetch current state. No event is proof of uncommitted credit change.

Fish protocol: join, roomSnapshot, aim, attemptCapture, attemptRejected, attemptSettled, targetSpawned, targetCaptured, resume, roomClosed. Include protocol version, room ID/epoch, command ID and sequence. Server validates target, computes charge/award, serializes capture claims and commits through the shared ledger. Recheck session authority on messages. Backgrounded/offline clients stop submitting new commands; already accepted actions settle. Reconnection fetches the committed snapshot/history instead of replaying a touch queue.
