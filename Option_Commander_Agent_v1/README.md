# Option Commander Agent v1

Operational minimum version of the Option Commander Agent.

## What it does

- Chat UI sends every question to `POST /api/commander`
- Server runs:
  - Planner
  - Regime Agent
  - Playbook Agent
  - Validation Agent
  - Reflection Agent
  - Memory Agent
  - Final answer synthesis
- If `BIZROUTER_API_KEY` exists, the final answer uses BizRouter's OpenAI-compatible Chat Completions API
- If the LLM call fails, the server falls back to a mock answer
- If `KOSPI200_AGENT_JSON_URL` exists, Commander fetches the KOSPI200 snapshot JSON first and uses it as the primary upstream source
- The UI shows an execution trace with:
  - question
  - intent
  - selected agents
  - tool results
  - validation label
  - memory usage
  - retry count
  - fallback usage
  - failed tools
  - final answer

## Files

- `index.html`
- `commander.js`
- `lib/commander-core.js`
- `api/commander.js`
- `tool-registry.json`
- `package.json`
- `.env.example`

## Environment

Copy `.env.example` to `.env` locally and set:

- `BIZROUTER_API_KEY`
- `BIZROUTER_BASE_URL`
- `BIZROUTER_MODEL`
- `KOSPI200_AGENT_JSON_URL`

Do not commit `.env`.

## Notes

- Memory is stored in browser localStorage for now.
- Previous loss records make Reflection more conservative.
- Recommendations are review candidates, not investment instructions.

## Deploy

This folder is deployed as a Vercel project with a static front end plus serverless API route.
