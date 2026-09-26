---
name: pr-reviwer-factura
description: Orquestador multiagente para GenFacturas. Lanza 4 agentes EN PARALELO sobre una rama o PR, cada uno con una sola tarea. (1) auditor de spec, (2) refactor SOLID del código, (3) tests TDD, (4) documentación y specs nuevas. Después consolida en un solo reporte. Usar cuando el usuario diga "pr-reviwer-factura", "/pr-reviwer-factura", "revisa y refactoriza la factura" o pida ajustar el código existente para que sea SOLID, escalable y mantenible.
---

# pr-reviwer-factura — orquestador de 4 agentes

**Objetivo:** ajustar y refactorizar el código **que ya existe** para que cumpla la spec y sea SOLID, escalable y mantenible, **sin agregar funcionalidad nueva**. Tú (la sesión que invoca) eres el orquestador. No escribes código: preparas el terreno, lanzas los agentes, verificas y consolidas.

Fuentes de verdad, en este orden:
1. `docs/specs/01-spec-funcionales.md`: qué debe hacer la app.
2. `docs/specs/02-arquitectura.md`: cómo está construida (ADR, capas en §2, contratos en §4 y DoD en §7).
3. `docs/specs/03-tareas.md`: fases y estado.

## Argumentos

`/pr-reviwer-factura [objetivo]`
- Sin argumento: el PR es `git diff main...HEAD` de la rama actual.
- `<rama>`: `git diff main...<rama>`.
- `todo`: todo `src/`, `scripts/` y `tests/` (auditoría completa, sin diff).

## Paso 0 — Preparación (orquestador, secuencial)

1. `git status --porcelain` debe estar vacío. Si hay cambios, **para** y pregunta al usuario: no mezcles trabajo ajeno.
2. Crea la rama de trabajo desde el objetivo: `git switch -c refactor/pr-factura-<rama-objetivo>`.
3. Guarda la línea base y anota los números:
   `npm test` · `node scripts/test-docx.mjs` · `npm run build`.
4. Guarda la lista de archivos del PR (`git diff --name-only main...HEAD`) para pasársela a los agentes.

## Paso 1 — Lanzar los 4 agentes EN PARALELO

**Un solo mensaje con 4 llamadas a la herramienta `Agent`.** Cada agente tiene su spec (deber, contexto y salida) en `.claude/agents/`. Corren en el mismo working tree, así que **cada uno escribe solo en su área exclusiva**. Esta regla es obligatoria:

| # | `subagent_type` | Spec | Puede escribir |
|---|-----------------|------|----------------|
| 1 | `factura-auditor-spec` | `.claude/agents/factura-auditor-spec.md` | nada (solo lectura) |
| 2 | `factura-refactor` | `.claude/agents/factura-refactor.md` | `src/`, `scripts/`, `js/`, `public/`, `index.html`, `vite.config.js` |
| 3 | `factura-tests` | `.claude/agents/factura-tests.md` | `tests/` |
| 4 | `factura-docs` | `.claude/agents/factura-docs.md` | `docs/` |

Ningún agente hace `git commit`, `git switch` ni instala dependencias. El único que commitea es el orquestador.

El prompt de cada uno solo lleva los datos de la corrida (el deber ya está en su spec):

```
Rama objetivo: <rama> · Rama de trabajo: refactor/pr-factura-<rama>
Archivos del PR: <ARCHIVOS>
Línea base: <LINEA_BASE>
Corres en paralelo con los otros 3 agentes de pr-reviwer-factura. Escribe solo en tu área.
```

## Paso 2 — Consolidar (orquestador, secuencial)

1. Espera los 4 resultados. No inventes el resultado de ningún agente.
2. Corre `npm test`, `node scripts/test-docx.mjs` y `npm run build`.
3. **Ronda TDD (máx. 2 iteraciones):** si quedan tests rojos que el Auditor o Tests atribuyen a la spec,
   continúa el agente de Refactor con `SendMessage` (a su agentId) y pásale la lista de tests rojos con la regla y el
   archivo:línea. Debe ponerlos en verde sin tocar `tests/`. Si un test está mal escrito (contradice
   la spec), continúa al agente de Tests para corregirlo. Tras 2 rondas, lo que siga rojo se reporta; no se fuerza.
4. Revisa el diff completo (`git diff`) buscando conflictos entre agentes, cambios de comportamiento
   y dependencias nuevas. Revierte lo que salga del área de cada agente.
5. Completa el reporte `docs/specs/reviews/pr-factura-<rama>.md`: tabla de auditoría, cambios de refactor,
   tests (antes/después), "requiere ADR" y veredicto **APPROVE** / **REQUEST CHANGES**.
6. Commits separados por agente en la rama `refactor/pr-factura-*`:
   `refactor: …` (agente 2), `test: …` (agente 3), `docs: …` (agente 4).
   No hagas merge: eso lo decide el usuario o el flujo normal de PR (cleanCode → pr-review).

## Salida al usuario

Máximo 10 líneas: veredicto, tests antes → después, número de refactors, specs nuevas creadas,
pendientes que requieren ADR y la ruta del reporte.

## Cuándo NO usarla

- Con otra sesión (por ejemplo SeniorDev) trabajando en la misma rama: el working tree se comparte.
  Espera a que termine o usa otra rama.
- Para funcionalidad nueva: eso va por el flujo de fases de `03-tareas.md`.
