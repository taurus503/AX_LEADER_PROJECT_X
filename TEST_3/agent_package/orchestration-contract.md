# Orchestration Contract

## Upstream Dependencies

Codex3 expects two upstream inputs:

- Codex1: strategy candidate, score, classification, and recommendation or avoid reason
- Codex2: market regime, volatility, event risk, confidence, and direction

## Downstream Use

The orchestration agent may use Codex3 output for:

- strategy validation badges
- committee review notes
- risk flag summaries
- sorting candidate strategies by validation status
- report-ready first-pass review comments

## Suggested Sort Order

1. `Approve`
2. `Review`
3. `Reject`

Within the same status, sort higher risk items lower.

## Status Mapping

| validationStatus | Korean Label | Meaning |
|---|---|---|
| Approve | 검토 가능 | usable as a first-pass review candidate |
| Review | 재검토 | needs additional review before report inclusion |
| Reject | 제외 권고 | should be excluded or deprioritized in the current condition |

## Integration Notes

- `riskFlags` should be displayed near the strategy card.
- `beginnerNote` should be hidden by default or placed in an expandable area.
- `committeeNote` should be visible in report or committee views.
- Do not merge Codex3 output into trade execution instructions.

