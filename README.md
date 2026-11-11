# grapeseed-localizer-mock-web

Demo build of the GrapeSEED Localizer web app (`grapeseed-localizer-web`) for BA documentation, deployed on Vercel.

It is the same UI with three differences:

- **No backend.** Every API call is served in memory by `src/data/mock_api.ts`, built from the mock data in `src/data/`. Changes made in the UI (new project, language, lock…) last until the page is reloaded.
- **No sign-in.** No OIDC, no `fe_core`. The signed-in user is `CURRENT_USER` in `src/data/mock_data.ts`.
- **Public npm registry only**, so it installs and builds anywhere (Vercel included) without an AWS CodeArtifact token.

## Getting started

Requires **Node 24 (LTS)**

```sh
npm install
npm run dev
```

## Scripts

| Script            | Description                                |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Start the Vite dev server with HMR         |
| `npm run build`   | Type-check (`tsc -b`) and build to `dist/` |
| `npm run lint`    | Lint with Oxlint                           |
| `npm run preview` | Serve the production build locally         |

## Deploy to Vercel

`vercel.json` sets the Vite build and rewrites every path to `index.html`, so deep links such as `/projects/3` work.

- **From Git:** push this repo, then on Vercel choose _Add New → Project_, import it and deploy. No environment variables are needed.
- **From the CLI:** `npx vercel` for a preview, `npx vercel --prod` for production.

## What differs from upstream

| File                                   | Change                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/data/mock_api.ts`                 | New: in-memory handlers for every endpoint the query hooks call                                                |
| `src/hooks/use_localizer_api.ts`       | Calls `mockRequest` (with a short fake latency) instead of fe_core `fetch`                                     |
| `src/App.tsx`                          | No `CoreConfigProvider` / `OidcProvider` / `OidcSecure`, no sign-in routes                                     |
| `src/components/layout/app_layout.tsx` | No session monitor                                                                                             |
| `src/components/layout/app_topbar.tsx` | Shows `CURRENT_USER`; Profile and Sign out show a "not in this demo" toast                                     |
| `src/state/lock_provider.tsx`          | Writes locks to the mock API and refetches lists, so locking shows everywhere                                  |
| `src/locales/en.json`                  | `topbar.notInDemo`                                                                                             |
| `package.json`, `package-lock.json`    | No `fe_core` / `@axa-fr/react-oidc`; lockfile resolves from npmjs.org                                          |
| `.npmrc`, `vercel.json`                | Public registry; Vercel config                                                                                 |
| Removed                                | `src/lib/auth.ts`, `src/pages/auth/`, `auth_splash.tsx`, `src/types/env.d.ts`, `.env*`, `refresh-npm-token.sh` |

## Syncing with upstream

This repo has its own git history, so upstream changes come over as a patch. `.upstream-commit` holds the last upstream commit synced. With an upstream checkout on the branch to demo:

```sh
scripts/sync_upstream.sh ../grapeseed-localizer-web   # optional 2nd arg: upstream ref, default HEAD
```

The script applies the upstream diff since `.upstream-commit` (skipping the lockfile and the removed auth files) and moves `.upstream-commit` forward. Then:

1. **Rejected hunks:** fix each `*.rej` next to its file, keeping this repo's side for the files in the table above, then delete the `.rej` files.
2. **Private packages:** `grep -rn "fe_core\|@axa-fr" src package.json` must be empty. If a dependency came back: `npm pkg delete dependencies.fe_core "dependencies.@axa-fr/react-oidc"`.
3. **New endpoints:** for each new `request({ method, path })` in `src/hooks/`, add a route in `src/data/mock_api.ts`; an unmocked call fails with a 404 toast naming the method and path.
4. `npm install && npm run build`, then commit (including `.upstream-commit`) and push.

Your local npm cache may hold tarballs fetched through CodeArtifact, which hides lockfile problems that Vercel will hit. Before pushing a lockfile change, run `node scripts/fix_lock_integrity.mjs package-lock.json`: it must report `integrity changed 0`. If not, run it again with `--write`.

See [CLAUDE.md](CLAUDE.md) for the project structure and UI conventions.
