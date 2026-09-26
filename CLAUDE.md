# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Read `AGENTS.md` first — it is the binding rulebook** (layer rules, money/date/numbering domain rules, DOCX format contract, git restrictions, Definition of Done). This file only adds what AGENTS.md doesn't say. Specs live in `docs/specs/01-spec-funcionales.md` → `02-arquitectura.md` → `03-tareas.md` (priority in that order); feature extensions get their own folder `docs/specs/00N-<modulo>/` (spec + `plan.md`) linked from `01` § AMPLIACIONES and an ADR in `02` (e.g. `002-modulo-Clientes/`, ADR A16); past reviews in `docs/specs/reviews/`, known bugs in `docs/errores-conocidos/`.

## Commands

```bash
npm run dev                                   # Vite dev server (SW not registered in dev)
npm test                                      # node --test "tests/*.test.js"
node --test tests/core.test.js                # one file
node --test --test-name-pattern="PROF" "tests/*.test.js" # by test name
npm run build && npm run preview             # production build (only place the SW runs)
npm run embed-logo                            # assets/logo.png -> js/logo-data.js
npm run test-docx                             # writes out/ejemplo.docx; if LibreOffice exists, asserts 1-page PDF
```

Done = `npm test && npm run build && npm run embed-logo && npm run test-docx && git diff --check`. There is no linter.

## Architecture (big picture)

Single data flow, shared by screen and Word output:

```
useProforma (state/) ──► toViewModel(proforma, emisor) (core/view-model.js) ──┬─► ui/preview/Preview.jsx
  useReducer + localStorage                                                    └─► buildDocument(vm, logo) (docx/) ─► platform/download.js
```

- `src/state/useProforma.js` owns the single reducer (proforma, emisor, counter, logo, history, `clientes`), loads everything from storage and persists with a 400 ms debounce via `src/platform/storage.js`; it exposes `guardadoOk` (false → Toolbar shows a `role="alert"`). Storage validators (`validEmisor`, `validProforma`, `validCounter`, `validLogo`, `validHistory`, `validClientes`) live in `src/state/validacion.js` without React so `node --test` covers them. The reducer (`reducer.js`) is pure — time, IDs (`nuevoId` from `core/proforma.js`) and dates are passed in action payloads.
- Clients module (spec `002`): catalog in `state.clientes` (`proforma:clientes`), pure rules in `src/core/clientes.js`, view `src/ui/clientes/Clientes.jsx`. A proforma **copies** client data and keeps `clienteId: string|null` (snapshot) — editing/deleting a catalog client never rewrites drafts or history.
- `src/core/view-model.js` is the only place that formats money/dates for display; Preview and DOCX must both consume it. Any visual change to the document usually means touching both `ui/preview/` and `docx/blocks.js` / `docx/styles.js` from the same VM fields.
- `scripts/test-docx.mjs` runs the real `core/` + `docx/` code in Node with `core/defaults.js` `EJEMPLO` data — this is why `core/` and `docx/` must stay browser-free.
- `js/logo-data.js` is a generated module (from `embed-logo`), imported by both the app and `test-docx`.

## Gotchas

- `src/main.tsx` is **not** a TypeScript migration — it's a deliberate recovery shim for clients whose stale PWA HTML still requests it (see `docs/errores-conocidos/01-cache-pwa-rutas-antiguas.md`). Real entry is `src/main.jsx`. Don't delete it.
- `public/sw.js` is hand-written; bump the cache name when changing precached assets or strategy.
- `dist/`, `out/`, `.claude/` must not be committed.
- New fields on persisted shapes (`Proforma`, history records) must be optional in `validacion.js`; otherwise old drafts fail validation and get replaced by `EJEMPLO` (silent data loss). See `clienteId == null` in `validProforma`.
- Tabs (Proforma/Clientes) are `useState` in `App.jsx`, no router. The proforma area is hidden with `.vista-oculta` (screen only), not unmounted, so "Imprimir" works from any tab.
- Client fields have one source: `Object.keys(CLIENTE_VACIO)` (`core/defaults.js`). Don't hand-list them again.
- `embed-logo` can leave `js/logo-data.js` modified only by line endings; don't commit it unless its content changed.

## Worktrees

Multiple role-based git worktrees exist as siblings (`GenFacturas-dev`, `-arq`, `-prf`, `-review`). The main folder stays on `main`: do not checkout/stash here — do feature work in the corresponding worktree. Review flow per phase: arquitecto → SeniorDev → cleanCode → pr-review → merge (reviews written to `docs/specs/reviews/fN.md`).
