# Codex3 Test Scenarios

## User Perspective Tests

| Case | User Type | Strategy | Expected Focus |
|---|---|---|---|
| U1 | option beginner | Covered Call | easy explanation and risk reason |
| U2 | strategy analyst | Iron Condor | market fit and regime alignment |
| U3 | finance review lead | Long Call | unsupported strategy handling if not in the current app profile |
| U4 | committee report owner | Cash Secured Put | committee-ready risk note |
| U5 | risk manager | Long Straddle | event risk and volatility crush |
| U6 | Codex1 owner | Call Backspread | validation of recommended high-complexity strategy |
| U7 | Codex2 owner | Iron Condor | low confidence effect |

## Golden Set Rules

| Rule | Expected Behavior |
|---|---|
| Low confidence | do not return Approve |
| No backtest and max loss undefined | return Reject |
| Max loss undefined | do not return Approve |
| Avoid Now strategy | apply conservative penalty |
| High event risk with complex strategy | prefer Review over Approve |

## Current Findings

- The core Codex3 validation function works under the current strategy data.
- `Long Call` is not present in the current app profile, so it should be treated as unsupported unless added upstream.
- `Covered Call` and `Iron Condor` are classified as `Avoid Now` in the current app data, so they are intentionally conservative.
- Korean display text is valid UTF-8 in the HTML file; terminal mojibake is a console display issue, not an app issue.

