Option Playbook Advisor ver 5.7

Contents
- worker.mjs: Cloudflare Worker source for live market/news recommendation mode
- worker-compact.mjs: shorter deployment variant for dashboard editors that choke on long source files
- app-html.mjs: shared HTML shell used by both deploy variants

Public deployment concept
1. Create a Cloudflare Worker service
2. Replace the default worker source with worker.mjs
3. Deploy
4. The root path serves the Advisor UI and /api/advisor refreshes every 15 minutes
5. The UI now compares 9 top strategies and 6 avoid-now strategies with playbook links on each card.

Important
- This worker is public-by-default.
- Share the workers.dev link only with people you want to view it.
