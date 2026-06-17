# Option Commander Agent v1

Planner-based Commander Agent demo.

## Goal

Accept a user question, choose the required tools, run a reflection loop when the strategy looks risky, and return a revised answer.

## Included Tools

1. Market Regime Agent
2. Option Playbook Agent
3. Reflection Agent
4. Validation Agent
5. Attribution Agent

## Tool Registry

`tool-registry.json` is the source of truth for the Commander routing flow.
The Reflection Agent reviews strategy recommendations and, when risk is high,
re-calls the Validation Agent before the final answer is produced.

## Files

- `index.html`
- `commander.js`
- `planner.js`
- `tool-registry.json`
- `README.md`

## Flow

1. User question
2. Planner chooses the tool sequence
3. Tools are called in order
4. Reflection Agent self-checks the strategy result
5. Validation Agent is re-called when needed
6. A revised answer and battle plan are generated

## Run

This is a static demo. Open the folder locally or deploy it to Vercel.

## Design

Dark navy, chat + dashboard, and premium glassmorphism styling.
