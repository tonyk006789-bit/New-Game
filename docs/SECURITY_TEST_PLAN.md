# Planned verification | do not confuse references with integration tests
## Authorization and admin credits
Test root main-admin rights and negative cases for every lower role; cover forged roles, arbitrary target IDs, cross-branch search/exports and WebSocket commands. MFA/recent privileged verification cannot be supplied by a client boolean. Same-key retries recheck authorization. Disabled/revoked sessions cannot start new actions; already accepted rounds settle.

Every new player balance is zero after create, invite redemption, login, date rollover, losses, reinstall and device switch. No grants/refill workers or claim routes exist. System payout authority is bound to real rounds and cannot be used to mint arbitrary credits. Root add/remove is immutable, balanced, attributable and shown in player history.

Test ADD/REMOVE with exact integer limits, malformed values, mandatory reasons, stale previews, insufficient available credits, reserved funds, reversal safety and duplicate keys with changed bodies. Race remove vs spin, remove vs remove, pending bonus vs remove and optional transfer vs remove. Rebuild balances from entries and reconcile. A pure in-memory helper passing tests is not database race-proofing.

## Mathematics
Block production slot enablement while the metric/profile approval is absent. Do not select 96% implicitly. Enumerate the approved slot result set and re-evaluate every visible grid; account for full bonus cycles. Validate exact keno probabilities/paytables per selection count. Verify the separately approved fish model and competing capture claims. Report hit rate, net-win rate and payout/stake return separately; exclude manual credits. No session quotas or player-specific controls.

## Resilience
Kill processes before commit and after commit/before response. Preserve the original accepted result across retries. Test dropped responses, reordered messages, stale room epochs, conflicting room owners and resumption from either OS. Restore a backup into a fresh environment and reconcile. Test accepted awards when the admin removed available credits or suspended new play.

## Mobile and authentication
Test Android/iOS native containers on physical devices, not just browser viewport simulation. Exercise lock/background/kill/resume, Android back, navigation gestures, orientation, poor network, version mismatch, audio interruption, secure-token refresh/revocation, screenshot-safe secret handling and account-session takeover. No offline-generated stakes or client-owned payouts. Mobile credentials are not stored in plaintext web preferences.

## Performance and release
Provisional beta capacity 50 concurrent; synthetic workload 100 with documented fish/slot/keno mix. Capture device models, OS, build SHA, asset/profile hashes, network and server hardware before publishing latency/fps results. Sustained fish scenes, memory growth and native crashes are release gates. Revalidate budgets after S0 proof.

Required release evidence: exact compatible dependency locks/notices, source/asset inventory, CI results, database concurrency tests, math approvals/reports, real Android/iPhone recordings, signed-build provenance, privacy/age-rating disclosures, working reviewer access with manually assigned test credits, restore/rollback rehearsal, resolved critical issues and owner approval. Store review/signing steps not performed must be marked pending. Do not claim a signed app from the supplied reference tests.
