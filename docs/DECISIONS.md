# Owner decisions | iteration 2
Implementation update: read [OWNER_UPDATES.md](OWNER_UPDATES.md). D01 stays undecided; D02 branch transfers of existing credits were approved in principle; D03 physical-device testing was deferred until devices are available for the MVP. The original decision prompts below are historical context.
## Confirmed
Main admin can manually add/remove credits. No automatic grants/refills. Android and iOS player support is required. The earlier closed-group/no-money scope remains. Slots, keno and fish tables remain. Codex implementation and a polished original interface remain.

## Three immediate clarifications
**D01 - What does 30% mean?** A: about 30 out of 100 spins have a positive payout (hit rate), with payout amounts/return chosen separately. B: about 30 credits are returned per 100 credits staked (RTP), regardless of how many spins pay. C: a different measure, such as net-profitable rounds or session winners. Do not select for the owner. No production slot profile before this decision, an agreed paytable and math hash.

**D02 - Who can move credits?** Can sub-distributors and agents transfer only existing assigned credits within their branch, or must every player add/remove be performed by main admin? Default: all lower-tier credit mutations disabled. No lower role may issue/remove supply. The proposed role chain treats 'main/admin distributor' as the root; a separate main-distributor role may be added only on confirmation.

**D03 - App distribution and build access.** Private installs/beta only, or Google Play/App Store release? Which countries and minimum phones are in the group? Are a Mac or macOS build runner and an Apple Developer account available? This determines signing, testing, OS support and release route. Do not ask for passwords or signing keys in chat.

## Other feature gates (not blockers for scaffolding)
| ID | Input | Safe state until decided | Gate |
|---|---|---|---|
| D04 | Keno draw count, selection counts and paytables | 80-number / 4-10 selections as observed interaction reference; 20-number draw is proposed; no released paytable | S3 |
| D05 | Fish lock-on capture vs free aim/damage; target award rules | Room/rendering simulation without credit-staked production rules | S4 |
| D06 | Brand, icon, languages and asset rights | Working names Temple Lights, Orchard Numbers, Reef Party; original placeholders | S0 / S5 |
| D07 | Concurrent player count, backend hosting region/budget and existing repository | Local setup; proposed 50-player beta / 100-user synthetic test; no paid deployment | S0 / S6 |
| D08 | Admin adjustment limits and reason categories | Main-admin-only; positive fixed-point amounts; available balance removal; privileged confirmation | S1 |

No ambiguity permits silent automatic grants, a selected 96% RTP, irreversible balance edits, or skipping Android/iOS. Foundation, authorization, credit controls, UI and device spikes can progress while mathematical choices remain pending.
