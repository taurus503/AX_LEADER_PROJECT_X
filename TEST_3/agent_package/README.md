# Codex3 Validation Lite Agent Package

This package explains how an orchestration agent should call and interpret the Codex3 Validation Lite Agent.

## Purpose

Codex3 does not recommend new option strategies.
It validates strategy candidates from Codex1 against the market view from Codex2 and returns a first-pass review label.

## Current Public App

- Public URL: https://vercel-codex3-validation-lite.vercel.app
- GitHub branch: `codex/validation-lite-agent`
- App source: `TEST_3/index.html`

## Included Development Source

- `source/index.html`: final standalone HTML app source
- `source/package.json`: Vercel deployment helper metadata
- `source/vercel.json`: Vercel static routing configuration

## Orchestration Position

1. Codex2 produces the market view.
2. Codex1 produces candidate strategies and recommendation or avoid reasons.
3. Codex3 validates each candidate as `Approve`, `Review`, or `Reject`.
4. The orchestration agent aggregates Codex3 output into strategy cards, committee notes, or report sections.

## Safety Rule

Codex3 output is not investment approval.
Do not convert `Approve` into "buy", "execute", "approved investment", or guaranteed profit language.
