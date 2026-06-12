# Option Playbook Advisor

Public deployment:
- [Vercel Public Deployment](https://axleaderprojectx.vercel.app/)
- [Direct Advisor Page](https://axleaderprojectx.vercel.app/Option_Playbook_Advisor_backup_2026-06-12_v5.6/Option_Playbook_Advisor_ver5.6.html)

What this deploy folder does:
- `worker.mjs`: full live market/news recommendation worker
- `worker-compact.mjs`: compact worker for dashboards or editors with source-length limits
- `app-html.mjs`: shared HTML shell used by both deploy variants

Runtime behavior:
- The root path serves the Advisor UI.
- `/api/advisor` refreshes the snapshot data.
- The `데이터 업데이트` button pulls the latest snapshot from `/api/advisor`.
- Market date and percentage changes are based on the previous business day close.
- The UI compares 9 top strategies and 6 avoid-now strategies, each with an `Option Playbook` link.

Local build notes:
- Use the generated `build/` output for static deployment.
- Keep `vercel.json` aligned with the build path if the folder layout changes.
