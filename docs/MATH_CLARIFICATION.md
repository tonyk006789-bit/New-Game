# Slot payout clarification | do not choose silently
Owner wording: "Slots target payout is around 30% in general with multiple attempts."

## Two distinct interpretations
**A - Paying-spin frequency:** P(gross payout > 0) about 0.30. Over many equal-stake spins this means roughly 30 paying spins per 100, not exactly three per ten. Gross payout can be below, equal to or greater than stake; track net wins separately.

**B - Expected credit return / RTP:** E(gross payout) / stake about 0.30 under the specified game and stake. This means about 30 credits returned per 100 staked in long-run expectation, not a 30% chance of winning. Expected net consumption would be about 70 credits per 100 staked. Short sessions can differ substantially.

**C - Another measure:** probability of a net-profitable round or of a session ending ahead. A session definition, stake policy and stopping rule would be needed. It is not established by the phrase 'multiple attempts.'

## Explicit examples, not production settings
| Illustrative model | Outcomes | Paying rounds | Net-winning rounds | Expected credit return |
|---|---|---|---|---|
| A | 70% at 0x; 22% at 2x; 6% at 4x; 2% at 14x | 30% | 30% | 96% |
| B | 90% at 0x; 10% at 3x | 10% | 10% | 30% |

The first is the old illustrative profile, now clearly unapproved. The second demonstrates that 30% RTP does not imply a 30% hit rate. Neither is selected for release. There are infinitely many possible distributions; these examples do not define the intended slot experience.

For model A: 0.22*2 + 0.06*4 + 0.02*14 = 0.96. For model B: 0.10*3 = 0.30. For independent p=0.30 paying rounds, 10 nonpaying rounds in a row have probability 0.70^10 = 0.0282475249. Random play cannot promise every individual a win within a fixed number of attempts. Do not force a 3-of-10 quota or manipulate a losing player's odds.

## Approval record before real-credit-staked slot play
Record chosen metric/target, complete paytable, probability construction, denominations, maximum award, bonus rules, exact math report, version/hash and owner approval reference. Inspect every reachable visible grid against the evaluator. The decision-gate reference helper only detects missing fields; authenticated approvals and exact integrated game verification remain implementation work.

Report hit rate (positive payout / completed paid rounds), net-win rate (payout > stake), and observed credit return (sum game payout / sum game stake) separately with sample size. Exclude manual admin additions/removals and existing-credit transfers. Allocate bonus payouts to their triggering paid round when reporting cycle-level return; document treatment rather than mixing incompatible denominators.

Keno and fish rules are separate decisions. No default 30% fish capture or 96% keno return is implied by the slot request. Exact keno references remain in the kit only to help develop later approved models.
