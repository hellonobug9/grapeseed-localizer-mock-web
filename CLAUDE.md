# grapeseed-localizer-mock-web

Demo clone of `grapeseed-localizer-web`, deployed on Vercel for BA documentation. It has its own git history (public repo): pull upstream changes with `scripts/sync_upstream.sh` (README "Syncing with upstream"), never by adding upstream as a remote. Keep these rules:

- **No backend, no sign-in, no `fe_core`.** Never add `fe_core`, `@axa-fr/*` or a CodeArtifact URL back; everything installs from npmjs.org.
- **Every request goes through `src/data/mock_api.ts`.** A new `request({ method, path })` in `hooks/` needs a route there, returning the shape in `src/types/` and built from `src/data/` mock data. Writes change the mock arrays in place (session-only).
- The signed-in user is `CURRENT_USER` in `src/data/mock_data.ts`.

## Project structure (`src/`)

| Folder        | Contents                                                                                                                                                                                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages/`      | Route pages; a feature with several files gets its own subfolder (`users/`, `languages/`, `keys/`…). Only `*_page.tsx` files sit at the feature root; screen-only pieces go in `<feature>/components/`                                                                                        |
| `components/` | Shared app components (see `docs/ui_components.md`); `ui/` holds shadcn primitives, `layout/` the app shell                                                                                                                                                                                   |
| `hooks/`      | Shared hooks (`use_<name>.ts`), e.g. `use_locks`                                                                                                                                                                                                                                              |
| `state/`      | Global state via React Context — `<name>_context.ts` (`createContext` + value type) and `<name>_provider.tsx` (provider component), kept in separate files for Fast Refresh. Providers are mounted in `App.tsx`; components read them through a hook in `hooks/`, never `useContext` directly |
| `lib/`        | Pure helpers (`format`, `dates`, `lock`…) — no React                                                                                                                                                                                                                                          |
| `data/`       | Mock data and catalogs (no backend yet)                                                                                                                                                                                                                                                       |
| `constants/`  | Static enums / option lists                                                                                                                                                                                                                                                                   |
| `types/`      | Shared TypeScript types, one file per domain                                                                                                                                                                                                                                                  |
| `locales/`    | i18n setup (`i18n.ts`) and translation files (`en.json` is the source; other locales fall back to it). Supported UI locales live in `constants/language.ts`                                                                                                                                   |

## UI

Before writing or changing any UI, read [docs/ui_components.md](docs/ui_components.md) and reuse the components it lists instead of writing new markup.

## Done checklist

- [ ] No raw `<button>`, `<input>`, `<table>` in pages.
- [ ] No copied base classes from `Panel`, `Pill`, `PageHeader`, `SearchInput`… — only layout `className`.
- [ ] No hard-coded colors; tokens only.
- [ ] User-facing text goes through `t()` / `<Trans>` from `react-i18next`; new keys go in `src/locales/en.json`.
- [ ] Dates, numbers and plurals go through `@/lib/format` (locale-aware) or i18next plurals (`key_one` / `key_other`).
- [ ] Empty lists render an `EmptyState`.
- [ ] Icon-only buttons have `title` or `aria-label`.
