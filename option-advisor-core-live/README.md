# Option Advisor Core Live

This folder contains the separate Codex 1 implementation for the KOSPI200
option advisor.

## What lives here

- `app/page.tsx`: the Codex 1 dashboard UI
- `app/api/snapshot/route.ts`: low-level KOSPI200 market snapshot endpoint
- `app/api/advisor/route.ts`: Codex 1 advisor endpoint
- `lib/market.ts`: market data extraction and regime scoring
- `lib/oae.ts`: Option Advisor Core ranking and output contract

## Local run

Use the standard vinext workflow from this folder:

```bash
npm install
npm run dev
```

Open the app at `http://localhost:3000/option-advisor-core-live`.
The root `/` path is not the app entry for this folder anymore.

## Output shape

The dashboard keeps the same high-density layout as the backup
`Option_Playbook_Advisor_backup_2026-06-12_v5.6` page:

- hero and current market state
- regime map
- headline/report theme views
- top recommended 9 strategies
- avoid-now 6 strategies
- validation notes and ops notes
