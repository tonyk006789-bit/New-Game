# Sprint plan | iteration 2, 15-week planning baseline
This estimate assumes two hands-on developers using Codex, part-time original-art/UI support and part-time testing/review. It is not a delivery promise. An owner-only workflow should expect longer. Re-estimate after S0 device proof and the S2 complete slot. Reserve review/integration capacity; story count is not effort equivalence. Signing accounts, macOS access and third-party review time are external dependencies.

| Sprint | Window | Objective | Exit gate |
|---|---|---|---|
| S0 | Weeks 1-2 | Foundations + native proof | Reproducible workspace, original UI baseline, Android/iPhone lifecycle and fish-density smoke; unresolved math stays disabled |
| S1 | Weeks 3-4 | Main-admin credits + hierarchy | Zero-start accounts; audited ADD/REMOVE; branch permissions; no grant paths; concurrency/retry tests |
| S2 | Weeks 5-7 | Mobile lobby + first slot | Approved slot math before staked play; one complete admin-to-player flow on both platforms; durable recovery |
| S3 | Weeks 8-9 | Keno + accurate reporting | Approved per-selection rules/paytables; recoverable draws; admin changes excluded from game return |
| S4 | Weeks 10-11 | Four-seat fish tables | Independently approved capture model; atomic single-target awards; reconnect and room-failure tests |
| S5 | Weeks 12-13 | Polish + hardening | Original assets/audio; real-device performance; security/load/restore results; release candidates |
| S6 | Weeks 14-15 | Closed beta + release preparation | Signed distributions with owner accounts; review evidence; rollback, operations and handover |

## First complete product milestone
End of S2: main admin creates a zero-credit player, manually adds credits, the player plays an approved original slot on Android and iOS, main admin removes an available amount, and reconnect/history show the same committed rounds and ledger-derived balance. There is no welcome grant and no forced transfer chain before root can add to a player.

## S0 assignment sequence
Inspect existing code and record contradictory v1 assumptions. Agree the contracts and pending gates. Scaffold supported versions and reproducible local/CI setup. Create Android/iOS source projects and acquire real-device/macOS access. Prototype the mobile and administrator states; prove dense fish rendering and lifecycle handling. Seed isolated organizational branches with zero balances. Convert contract sketches to reviewed schemas. Run the reference tests and report what they do not prove. Stop for the S0 review gate.

## Scope and evidence
49 tickets in backlog.md/json; L-sized tickets must be split before implementation. One coherent change at a time with a reviewer, tests and migration notes. Native support is in scope now; extra game catalogs, progressive jackpots, monetary rewards, automatic grants, player trading and undisclosed odds controls are not. No app may accept slot stakes until its math approval is recorded. Art and nonstake UI work may continue while approval is pending.

Completion means real executed evidence, not generated code alone: database race tests for the ledger, original grid evaluation for slot payouts, physical Android/iPhone tests for native quality, and actual signed/submitted artifacts for distribution. App review acceptance must not be marked complete based on successful compilation.
