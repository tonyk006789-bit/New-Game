# Iteration 2 | change and migration record
17 September 2026. The user's latest requirements take precedence over v1 assumptions.

| Area | v1 assumption | Iteration 2 |
|---|---|---|
| Privileged role | Separate owner and main distributor | Main admin holds root credit powers; extra owner tier no longer mandatory |
| Credit supply | Owner budgets with optional free grants/refills | Manual admin ADD/REMOVE only; zero initial balance; no automatic grants/refills |
| Existing-credit transfers | Down-tree allocation as a default | Lower-tier transfer permission pending; deny by default |
| Removing credits | Return/approved workflow | Explicit main-admin removal of available credits, with mandatory audit and safe concurrency |
| Gameplay awards | Server settlement | Retained: legitimate wins credit the wallet automatically as round settlement |
| Platforms | Web/PWA first; native out of initial scope | Android and iOS installable player apps in the first release; native proof in S0 |
| Slot mathematics | Assumed 30% paying spins + proposed 96% return | Metric unresolved; no production target/profile until approval; examples explicitly educational |
| Other game mathematics | Provisional slot-like fish rate | No inherited slot rate; separate fish/keno approval |
| Timeline | 13-week staffed estimate | 15-week staffed estimate for mobile build/release work; re-estimate after S0/S2 |
| Release evidence | Browser-focused | Native build, signing, real-device lifecycle/performance and store/distribution gates |

## Applying this kit to an existing Codex repository
Create a local change branch and review the diff. Replace contradictory instructions, not application code wholesale. Inspect for grant jobs, default player credits, claim endpoints, inherited credit powers, implicit sample math, PWA-only release assumptions and 'native later' backlog exclusions. Remove or migrate those features with tests. Disable any automatic credit workers immediately in a nonproduction branch; obtain approval before changing a live environment. Do not rewrite historical ledger entries.

The old mathematical examples are renamed and require explicit parameters, so a developer cannot accidentally invoke a 96% default. Reports distinguish illustrations from a selected live profile. The package excludes the v1 PDF and prompts to reduce instruction conflicts.
