# 002 · Plan de implementación — Módulo de Clientes

Spec: `Modulo-Clientes.md` · Fase: **F7 Clientes** · Rama: `feat/f7-clientes` (desde `main`, en el worktree `GenFacturas-dev`; revisar `git status` antes de empezar).
Flujo: SeniorDev → cleanCode → pr-review (`docs/specs/reviews/f7.md`) → merge.

## Principios

- No se agregan dependencias. Sin router y sin IndexedDB.
- Reutilizar:
  - `Cliente`, `CLIENTE_VACIO` y `nuevoId` (`core/proforma.js`, `core/defaults.js`).
  - `load` / `save` (`platform/storage.js`).
  - El patrón `strings()` / `validHistory()` (`state/useProforma.js`).
  - `Field.jsx` (label y atributos aria).
  - El foco en el primer campo inválido, como en `Toolbar.valid()`.
  - Los estilos `.history-item`, `formatTotal` y `total`.
- DOCX, `view-model.js` y `sw.js` **no cambian** (CA-20).

## Archivos

| Archivo | Cambio |
|---|---|
| `src/core/proforma.js` | Exportar `nuevoId`. Typedefs `Proforma.clienteId: string\|null` y `ClienteGuardado`. `createProforma` devuelve `clienteId: null`, lo que cubre RC-10 a través de `nuevaProforma`. |
| `src/core/defaults.js` | `EJEMPLO.clienteId = null`. |
| `src/core/clientes.js` **(nuevo)** | `validarCliente`, `buscarClientes`, `ordenarClientes`, `normalizar`. |
| `src/state/reducer.js` | Acciones nuevas (ver abajo). |
| `src/state/useProforma.js` | `validClientes`; `validProforma` acepta `clienteId`; carga y guarda `clientes`; aviso si falla el guardado. |
| `src/ui/clientes/Clientes.jsx` **(nuevo)** | Vista con búsqueda, lista, formulario y detalle con proformas. |
| `src/ui/form/ClienteFields.jsx` | `<select>` "Elegir cliente", botón "Guardar en clientes" y errores. |
| `src/ui/Toolbar.jsx` | Pestañas Proforma / Clientes; usar `nuevoId` en vez del id inline; mostrar el aviso de guardado. |
| `src/App.jsx` | `useState('proforma')` para la vista activa y render condicional. |
| `src/styles.css` | Pestañas y lista de clientes, reutilizando tokens y `.history-item`. |
| `tests/core.test.js` | Casos de `clientes.js` y del reducer. |
| `docs/specs/02-arquitectura.md`, `01-spec-funcionales.md`, `03-tareas.md` | ADR y contrato, referencia a la spec, fila F7. |

## Contratos

```text
Proforma.clienteId : string | null                                     // RC-05, RC-09
ClienteGuardado    = Cliente & { id: string, actualizadoEn: string }   // RC-01
storage            : "proforma:clientes" → ClienteGuardado[]
state.clientes     : ClienteGuardado[]
```

## Core — `src/core/clientes.js` (puro)

- `normalizar(texto)`: NFD, quita tildes, pasa a minúsculas y aplica `trim`. Reutilizar la lógica de `nombreSeguro`; si queda duplicada, extraerla.
- `validarCliente(cliente, clientes, id?)` devuelve un `Validation` con las claves `nombre`, `cedulaJuridica` y `correo`:
  - RC-02: nombre obligatorio (tras `trim`).
  - RC-03: cédula única. Se compara sin espacios ni guiones y en minúsculas, excluyendo el `id` recibido. Mensaje: "La cédula jurídica ya está registrada".
  - RC-04: correo vacío o que cumpla `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`.
- `buscarClientes(clientes, texto)`: filtra por nombre, cédula y contacto usando `normalizar` (CA-07).
- `ordenarClientes(clientes)`: devuelve una copia ordenada con `localeCompare(b, 'es')` (RC-14).

## Estado — `src/state/reducer.js`

El reducer sigue puro: `id` y la fecha llegan en la acción (RC-16).

| Acción | Payload | Efecto |
|---|---|---|
| `clientes/guardar` | `{ cliente: ClienteGuardado }` | Reemplaza el cliente con ese `id` o lo agrega. No toca `proforma` (RC-06). |
| `clientes/eliminar` | `{ id }` | Lo quita. Si `proforma.clienteId === id`, lo pone en `null` (RC-11). No toca el historial. |
| `proforma/usarCliente` | `{ cliente: ClienteGuardado }` | Copia los 6 campos a `proforma.cliente` y pone `clienteId = cliente.id` (RC-05). |
| `proforma/guardarCliente` | `{ id, actualizadoEn }` | Crea o actualiza en el catálogo a partir de `proforma.cliente` y pone `clienteId = id` (RC-08). La UI pasa como `id` el `clienteId` existente o `nuevoId()`. |
| `nueva` | (existente) | Queda `clienteId: null` porque usa `createProforma`. |
| `cliente/campo` | (existente) | Sin cambios; no toca el catálogo (RC-07). |

`historial/guardar` ya guarda `state.proforma` completo, así que el `clienteId` llega al historial sin cambios (RC-13).

## Persistencia — `src/state/useProforma.js`

- `validProforma`: aceptar `clienteId` ausente, `null` o `string` (RC-09, CA-18). No mutar lo cargado; al leer, tratar `undefined` como `null`.
- `validClientes(value)`: si es un array, conservar solo los registros que pasan `strings(c, [id, actualizadoEn, …los 6 campos])` y tienen `nombre.trim()` no vacío (RC-15, CA-17).
- Estado inicial: `clientes: validClientes(load('clientes', []))`. En el mismo debounce de 400 ms: `save('clientes', state.clientes)`.
- Aviso de guardado (RC-15, CA-23):
  - El efecto calcula `const ok = [save(...), …].every(Boolean)`.
  - El resultado va en un `useState` local del hook (no en el reducer) y el hook lo expone.
  - Toolbar muestra "No se pudo guardar en este navegador" con `role="alert"`.

## UI

### Pestañas (`Toolbar` + `App`)

- Dos `<button aria-pressed>`: "Proforma" y "Clientes".
- La vista Clientes oculta el formulario y la vista previa. La Toolbar sigue visible.

### `Clientes.jsx`

Estado local: `{ busqueda, editando: ClienteGuardado|null, errores, seleccionado }`.

- **Búsqueda**: `<input type="search">` con label.
- **Lista**: `ordenarClientes(buscarClientes(...))`. Cada ítem tiene Editar, Eliminar (con `window.confirm`, CA-06) y Ver proformas.
- **Formulario**:
  - Usa los mismos `fields` que `ClienteFields`: exportar el array, no duplicarlo.
  - Cada campo usa `Field` con su `error`.
  - Al guardar se llama a `validarCliente`. Si falla, foco en el primer `[aria-invalid="true"]` (CA-02). Si pasa, se despacha `clientes/guardar` con `id` (`nuevoId()` o el existente) y `actualizadoEn: new Date().toISOString()`.
- **Detalle**:
  - `history.filter(r => r.proforma.clienteId === id)`; ya viene ordenado del más reciente al más antiguo.
  - Muestra número, fecha y `formatTotal(total(...))`.
  - "Abrir" despacha `historial/restaurar` y cambia a la vista Proforma (CA-14).
- **Lista vacía**: texto de ayuda.
- Todo se muestra como texto JSX, nunca como HTML (CA-19).

### `ClienteFields.jsx`

- **Selector "Elegir cliente"**:
  - `<select>` con label, la opción "— Sin seleccionar —" y los clientes ordenados.
  - Su `value` es `clienteId` si ese cliente existe en el catálogo; si no, `''` (RC-12, CA-22).
- **Botón "Guardar en clientes"**:
  - Llama a `validarCliente(proforma.cliente, clientes, clienteId)`.
  - Si hay errores: `dispatch({ type: 'errores', errors: { 'cliente.nombre': … } })` y foco en el primer campo inválido.
  - Si no hay errores: despacha `proforma/guardarCliente`.
- **Errores en los campos**:
  - Cada `Field` lee `errors['cliente.<campo>']`.
  - `cliente/campo` limpia el error de su campo, igual que hace hoy `linea/campo`.

## Orden de trabajo

Commits pequeños, solo cuando haya autorización.

1. **Core y tests**: `clientes.js`, `nuevoId` exportado y `clienteId` en los contratos. `npm test` en verde.
2. **Estado**: acciones del reducer con sus tests; `useProforma` (validación, persistencia y aviso).
3. **Vista Clientes**: pestañas, `Clientes.jsx` y CSS.
4. **Integración con la proforma**: selector, "Guardar en clientes" y errores.
5. **Docs**:
   - ADR en `02-arquitectura.md`: contrato `clienteId`, clave `proforma:clientes` y vista sin router.
   - Referencia a la spec en `01-spec-funcionales.md`.
   - Fila F7 en `03-tareas.md`.
6. **Verificación** y entrega a cleanCode.

## Tests mínimos

Con `node:test`, en `tests/core.test.js`.

- `validarCliente`:
  - Nombre vacío o solo espacios da error.
  - `3-101-123456` y `3101123456` se detectan como duplicadas.
  - Editar un cliente sin cambiar su cédula pasa.
  - `maria@` da error; correo vacío pasa.
- `buscarClientes('cafe nandu')` encuentra "Café Ñandú"; también busca por cédula y por contacto.
- `ordenarClientes` ordena de A a Z respetando tildes.
- Reducer:
  - `usarCliente` copia los datos y el id.
  - Editar el catálogo no cambia `proforma.cliente`.
  - `eliminar` desenlaza el borrador y deja el historial igual.
  - `guardarCliente` crea y después actualiza sin duplicar.
  - `nueva` deja `clienteId` en `null`.

## Verificación (DoD, AGENTS §12)

```bash
npm test && npm run build && npm run embed-logo && npm run test-docx && git diff --check
```

- **DOCX**: `out/ejemplo.docx` con el mismo contenido que antes (CA-20). Si LibreOffice está instalado, convertir a PDF y exigir 1 página; si no, decirlo.
- **Navegador** (`npm run dev`):
  - Recorrer CA-01 a CA-16 y recargar para comprobar la persistencia.
  - `proforma:clientes` corrupto y un borrador viejo sin `clienteId` (CA-17, CA-18).
  - Un cliente con nombre `<b>x</b>` (CA-19).
  - Ancho móvil, tema claro y oscuro, y uso solo con teclado (CA-21).
  - Simular cuota llena haciendo que `localStorage.setItem` lance un error (CA-23).
- Registrar el resultado en `docs/specs/reviews/f7.md`.

## Riesgos

- Si `validProforma` no acepta `clienteId`, los borradores viejos se reemplazan por el ejemplo y el usuario pierde datos. Lo cubren CA-18 y un test.
- Duplicar los `fields` del cliente o el generador de ids. Hay que exportarlos y reutilizarlos.
