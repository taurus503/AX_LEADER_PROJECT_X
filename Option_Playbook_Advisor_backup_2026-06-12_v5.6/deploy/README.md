Option Playbook Advisor ver 5.6

Contents
- worker.mjs: Cloudflare Worker source for live market/news recommendation mode
- worker-compact.mjs: shorter deployment variant for dashboard editors that choke on long source files

Public deployment concept
1. Create a Cloudflare Worker service
2. Replace the default worker source with worker.mjs
3. Deploy
4. The root path serves the Advisor UI and /api/advisor refreshes every 15 minutes

Important
- This worker is public-by-default.
- Share the workers.dev link only with people you want to view it.