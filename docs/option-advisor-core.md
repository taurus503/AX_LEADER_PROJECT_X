# Codex 1 - Option Advisor Core

## Goal

Codex 1 is the strategy-selection core for KOSPI200 option playbooks.
It consumes the market view produced by Codex 2 and turns it into a
ranked strategy shortlist, an avoid list, and a short committee brief.

This core is designed to stay compatible with the existing
`Option_Playbook_Advisor_backup_2026-06-12_v5.6` UI shape.

## Relevant Inputs

### Primary input from Codex 2

- `regimeKey`
- `regimeSubtitle`
- `volScore`
- `skewScore`
- `confidence`
- optional `eventRisk`
- optional `codex2Brief`

### Supporting references

- `Option Advisor Engine (OAE) Integration.txt`
- `Regime Detection Engine.txt`
- `Option Playbook Quantitative Repository Agent.txt`
- `Strategy Validation Engine (SVE).txt`
- `Performance Attribution Engine.txt`
- `Dynamic Portfolio Optimizer (DPO) System Prompt.txt`
- `Trade Orchestration Engine (TOE).txt`
- `MLOps & DevOps Hub Engine for AI Trading.txt`

The extra agent txt files are useful even if Codex 1 does not implement
their logic directly. They define the handoff contract for later stages.

## Core Responsibilities

1. Rank strategies against the current regime.
2. Emit a `Top 9` view for the dashboard.
3. Emit an `Avoid 6` guardrail list.
4. Explain why each strategy was promoted or excluded.
5. Keep output strings stable so Codex 3 and Codex 4 can reuse them.

## Output Contract

Codex 1 should return a JSON payload with:

- `source`
- `generatedAt`
- `selectedDate`
- `actualDate`
- `market`
- `state`
- `headlineThemes`
- `reportThemes`
- `topRecommended`
- `watchlist`
- `avoidNow`
- `displayTopNine`
- `rationale`
- `validationNotes`
- `opsNotes`
- `committeeBrief`
- `playbookBasePath`

## UI Shape

The rendered page should keep the same structure as the existing
Option Playbook dashboard:

- hero and status summary
- market metrics
- regime cards
- headline theme view
- report theme view
- ranked strategy cards
- avoid-now cards
- validation and ops notes

## Validation

Recommended checks for Codex 1:

- contract test for `/api/advisor`
- known-input smoke checks for the 4 regimes
- high-confidence and low-confidence fallback checks
- page render check against the backup-style dashboard layout

## Notes

- The implementation currently uses a representative strategy catalog and
  can be extended toward the full 48-strategy repository later.
- The dashboard can accept future Codex 2 values via `/api/advisor`
  query parameters without changing the UI contract.
- The current Codex 1 source snapshot is kept separate from the original
  public dashboard in `option-advisor-core-live/`.
