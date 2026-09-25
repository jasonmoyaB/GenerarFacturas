# 03 · Tareas y flujo entre sesiones

Arquitectura: `02-arquitectura.md` · Spec: `01-spec-funcionales.md`
Orquestador: sesión **planner**. Cada sesión marca sus casillas aquí y avisa a la siguiente con `SendMessage`.

## Flujo (simulando PR por fase)

```
arquitecto ──(02 cerrado)──▶ SeniorDev ──(rama feat/fN lista)──▶ cleanCode ──(ajustes hechos)──▶ pr-review
                                  ▲                                                               │
                                  └──────── REQUEST CHANGES (docs/specs/reviews/fN.md) ◀──────────┤
                                  SeniorDev hace merge a main ◀──────────── APPROVE ──────────────┘
```

- Git: `main` estable; una rama por fase `feat/fN-<nombre>`; commits pequeños.
- El "PR" = `git diff main...feat/fN-<nombre>`.
- Reviews escritas en `docs/specs/reviews/fN.md` (veredicto: APPROVE / REQUEST CHANGES + hallazgos con `archivo:línea`).
- Cada handoff avisa también a `planner` en una línea.

---

## Sesión `arquitecto` — diseño paso a paso

- [x] A1. Revisar `02-arquitectura.md` contra la spec; corregir lo que falte o sobre (editar el mismo archivo).
- [x] A2. Responder las **Preguntas abiertas** (§8) y moverlas a la tabla de ADR.
- [x] A3. Fijar contratos definitivos (§4): Proforma, Emisor, Cliente, Linea, Logo, ViewModel, Validation.
- [x] A4. Detallar por bloque del .docx las propiedades exactas de la lib `docx` (tabs, bordes, numbering, ImageRun, tableHeader/cantSplit).
- [x] A5. Validar el orden de fases de abajo y la DoD de cada una.
- [x] A6. Handoff → `SeniorDev` ("02 cerrado, arranca F0").

## Sesión `SeniorDev` — desarrollo

Orden por riesgo: el .docx (F2) va temprano porque es lo más difícil de dejar exacto.

- [x] **F0 Scaffold** — `git init`, Vite React (JS), dep `docx@^9.7`, `"type": "module"`, scripts npm, `.gitignore` (node_modules, dist, out). DoD: `npm run dev` levanta; `npm test` corre (aunque sin tests).
- [ ] **F1 Core** — `src/core/*` + `tests/core.test.js`. DoD: `npm test` verde con los casos mínimos de 02 §7; ejemplo suma ₡300.000,00; `core/` sin imports de otras capas.
- [ ] **F2 Documento** — `src/docx/*`, `scripts/embed-logo.mjs`, `scripts/test-docx.mjs`, `js/logo-data.js`. DoD: `out/ejemplo.docx` abre en Word/LibreOffice; PDF = 1 página; funciona con logo y con `logo = null` (A14); propiedades de 02 §6 presentes.
- [ ] **F3 Estado** — `state/reducer.js`, `state/useProforma.js`, `platform/storage.js`. DoD: recargar no pierde datos; Nueva proforma cumple spec §6 y 02 §5 (counter, validaHastaManual); storage corrupto no rompe la app.
- [ ] **F4 UI** — form, `LineasEditor`, `LogoField` + `platform/logo-bw.js`, `Preview`, `Toolbar`, validación con `aria-invalid`, descarga. DoD: vista previa en vivo = .docx; nombre de archivo correcto; logo subido queda en blanco y negro y persiste.
- [ ] **F5 PWA + impresión + tema** — manifest, sw, `@media print` solo hoja, dark mode, foco visible, móvil. DoD: instalable, offline tras primera carga, imprime 1 hoja.
- [ ] **F6 Verificación final** — correr los 3 pasos de la spec y dejar el resultado en `docs/specs/reviews/verificacion.md` (árbol, comandos, salida).

Tras cada fase: commit en `feat/fN-*` → aviso a `cleanCode`.

## Sesión `cleanCode` — calidad de código (por fase, antes del PR)

Checklist a aplicar sobre la rama de la fase:
- [ ] Regla de capas (§2) respetada: `core` puro, `docx` sin DOM/React, `ui` sin reglas de negocio.
- [ ] SRP: una función = una cosa; funciones ≤ ~30 líneas; un bloque del .docx = una función.
- [ ] DRY: formatos solo en `core/`; Preview y docx consumen el mismo view‑model.
- [ ] OCP/DIP donde aporte (p. ej. `buildDocument` recibe `vm` y `logo`, no lee storage).
- [ ] Nada de sobre‑ingeniería: sin interfaces de una implementación, sin factories, sin config para constantes.
- [ ] Nombres claros en español del dominio; comentarios que explican el *por qué*.
- [ ] Sin código muerto, `console.log`, ni dependencias no aprobadas.

Ajustes pequeños los commitea en la misma rama (`refactor: …`); cambios de diseño los devuelve a `SeniorDev`.
Handoff → `pr-review` ("feat/fN lista para PR").

## Sesión `pr-review` — code review como PR

- [ ] Revisar `git diff main...feat/fN-*` con el agente/criterio pr-reviewer: seguridad (XSS en preview, datos de logo subidos, localStorage), bugs, SOLID, escalabilidad, mantenibilidad, legibilidad, cumplimiento de spec.
- [ ] Verificar la DoD de la fase ejecutando los comandos (no confiar en el aviso).
- [ ] Escribir `docs/specs/reviews/fN.md` con veredicto.
- [ ] APPROVE → avisar a `SeniorDev` para merge. REQUEST CHANGES → avisar a `SeniorDev` con la lista.

## Estado

| Fase | Dev | CleanCode | PR | Merge |
|------|-----|-----------|----|-------|
| Arquitectura | — | — | — | [x] |
| F0 | [x] | [x] | [x] | [x] |
| F1 | [ ] | [ ] | [ ] | [ ] |
| F2 | [ ] | [ ] | [ ] | [ ] |
| F3 | [ ] | [ ] | [ ] | [ ] |
| F4 | [ ] | [ ] | [ ] | [ ] |
| F5 | [ ] | [ ] | [ ] | [ ] |
| F6 | [ ] | [ ] | [ ] | [ ] |
