# Manual credit control | administrator workflow
## Vocabulary
ADD creates manually authorized playable supply; REMOVE retires available credits. TRANSFER moves existing units and is disabled for lower tiers until approved. GAME_STAKE and GAME_PAYOUT are rule-governed round events. ADJUSTMENT_REVERSAL is a new linked correction. No event type called DAILY_GRANT, WELCOME_GRANT, REFILL or PROMOTIONAL_GRANT belongs in production.

## Main-admin journey
Search the target; display identity and branch. Choose Add Credits or Remove Credits. Enter positive amount and a specific reason. Show settled, reserved and available credits plus the predicted result and wallet version. Verify recent privileged authentication and show confirmation. Submit a unique idempotency key. The server rechecks identity, scope, version and availability, then commits entries and audit together. Return a durable receipt. The player sees the new balance revision and an attributable history item.

Example, invented: settled 100.00; reserved 20.00; available 80.00. REMOVE 90.00 is rejected. REMOVE 30.00 leaves settled 70.00, reserved 20.00, available 50.00. The accepted round owning the reserve remains recoverable and its valid payout still settles.

## Permission baseline
MAIN_ADMIN: add/remove to eligible wallets, review audit, manage staff/session scopes. SUB_DISTRIBUTOR/AGENT: no supply issuance/removal and no credit transfer by default; branch-scoped management only. PLAYER: no admin adjustment, self-credit or transfer endpoint. SYSTEM_ROUND_SETTLER: narrowly scoped stake/payout authority bound to actual game events, never a general root credential.

## Atomicity and audit acceptance
ADD/REMOVE cannot succeed without both postings and audit. Repeated requests are exactly-once in business effect via durable idempotency, not a promise of exactly-once network delivery. Concurrent spin/remove, remove/remove and transfer/remove cannot overspend. Different request content under an existing key returns a conflict. Actor permissions are rechecked on retry. Approval tokens, if used, are short-lived and bound to target/amount/direction, not reusable unlimited authorization.

Do not persist writable balance overrides. Do not implement an absolute 'set balance' or background recovery queue that later deducts an amount rejected for insufficient availability. For a requested correction, record a fresh action with explicit approval. Whole-account reset/bulk subtraction is out of initial scope.

## No automatic credits
Account creation, invite redemption, login, elapsed time, loss streak, zero-balance state, device change and daily tasks must never increase a balance. Game settlements are the explicit exception and must refer to real accepted rounds. No zero-balance self-service claim API exists. Local demo data should use isolated fixtures and clearly logged manual test adjustments, not production startup grants.

## Migration from an existing implementation
Inventory grant workers and revoke their scheduling/access before enabling v2. Disable related endpoints and update frontend empty states. Preserve historical ledger rows; do not relabel old grants as game winnings. Reconcile projected balances before/after migration. Remove permissive demo-role inheritance. Test these migrations in an isolated environment and obtain approval before touching live data.
