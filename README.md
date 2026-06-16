# AX_LEADER_PROJECT_X

The original public dashboard source lives in [`option-playbook-live/`](./option-playbook-live).
The separate Codex 1 implementation lives in [`option-advisor-core-live/`](./option-advisor-core-live).

## Public Link

- [AX Leader Option Playbook](https://axleaderprojectxtaurus503.vercel.app/)

## Deployment Model

- GitHub repository: `taurus503/AX_LEADER_PROJECT_X`
- Vercel serves the public dashboard from `option-playbook-live/`
- The root `index.html` redirects to the dashboard folder
- The market snapshot API lives at `option-playbook-live/app/api/snapshot/route.ts`
- The Codex 1 advisor implementation is mirrored in `option-advisor-core-live/app/api/advisor/route.ts`

## Local Run

Run the original dashboard from `option-playbook-live/` with the usual vinext workflow:

```bash
cd option-playbook-live
npm install
npm run dev
```

If you are only checking the public redirect, open the repo root `index.html`.
