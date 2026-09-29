# 02 · Arquitectura — Generador de Proformas (SDD)

Fuente de verdad funcional: `01-spec-funcionales.md`. Este documento define **cómo** se construye.
Tareas y flujo entre sesiones: `03-tareas.md`. Estado: **CERRADO** por `arquitecto` (2026‑09‑25).

## 1. Decisiones (ADR resumidos)

| # | Decisión | Por qué | Descartado |
|---|----------|---------|------------|
| A1 | React + Vite, **JavaScript ESM + JSDoc** (sin TS). `package.json` con `"type": "module"` | El núcleo y el generador .docx deben correr igual en Node (`scripts/*.mjs`) y en el navegador sin compilar. JSDoc da tipos en el editor. | TypeScript (obliga a compilar los scripts de verificación) |
| A2 | Librería `docx` **^9.7** (única dependencia de runtime además de React) | Misma API en Node y navegador: `Packer.toBlob` / `Packer.toBuffer`. Propiedades verificadas contra 9.7.2 (§6). | Plantillas XML a mano |
| A3 | **Un view‑model compartido** (`toViewModel`) alimenta la vista previa HTML y el .docx | Una sola fuente de textos/formatos (DRY); render desacoplado de reglas (SRP). | Que Preview y docx formateen cada uno por su cuenta |
| A4 | Estado con `useReducer` + un hook (`useProforma`) | Estado único, acciones explícitas, reducer testeable como función pura. | Redux/Zustand/Context múltiples (YAGNI) |
| A5 | Dinero en **céntimos enteros**; formato con `Intl.NumberFormat('de-DE', {minimumFractionDigits: 2})` | Spec lo exige; `de-DE` da `18.000,00` también con 4 dígitos (`es-ES` no agrupa `1000`). | Floats, librerías decimal, formateo manual |
| A6 | PWA manual: `public/manifest.webmanifest` + `public/sw.js`; SW solo se registra en `import.meta.env.PROD` | Dos archivos cubren instalable + offline; en dev el SW rompe el HMR. | `vite-plugin-pwa` |
| A7 | Persistencia `localStorage` detrás de `platform/storage.js` con try/catch (lectura y escritura, incl. cuota) | Un solo punto que toca el almacenamiento. | IndexedDB |
| A8 | Tests con `node --test` (stdlib) sobre `src/core` | Cero dependencias de test. El .docx lo verifica `scripts/test-docx.mjs`. | Vitest/Jest (añadir si crece la UI) |
| A9 | CSS plano con tokens en `:root` + `prefers-color-scheme` + `@media print` | Sin framework CSS. | Tailwind / CSS‑in‑JS |
| A10 | La spec dice "sin framework ni build obligatorio" pero el stack pide React + Vite: **gana el stack**. `npm run build` → `dist/` estático servible con `npx serve dist`. | Instrucción explícita del usuario en STACK. | App sin build |
| A11 | **Vencimiento** (tabla cliente) = **Válida hasta**, siempre, aun con Crédito. *(ex‑pregunta 1)* | La spec no define plazo de crédito; inventar uno es alcance nuevo. | Campo "días de crédito" (añadir si el usuario lo pide) |
| A12 | `js/logo-data.js` se queda **en la raíz** como dice la spec; se importa `../../js/logo-data.js` desde `src/` (Vite lo resuelve). *(ex‑pregunta 2)* | Respeta la spec; Vite y Node lo importan igual. | Moverlo a `src/` |
| A13 | **Cantidad admite decimales** (coma o punto, máx. 2). Monto = `Math.round(cant × precioCents)`. Se imprime sin ceros sobrantes: `1`, `1,5`. *(ex‑pregunta 3)* | Horas fraccionadas son normales en servicios. | Solo enteros |
| A14 | Sin `assets/logo.png`: `embed-logo` escribe `export default null` y avisa por consola; **no bloquea**. Con logo `null` la celda izquierda del encabezado queda vacía (docx y preview). *(ex‑pregunta 4)* | Nada de placeholder generado (necesitaría dibujar PNG a mano). El usuario pone su logo o lo sube desde la UI. | Placeholder PNG, bloquear build |
| A15 | Fechas en **hora local**: `todayISO()` arma `YYYY-MM-DD` con `getFullYear/getMonth/getDate`, nunca `toISOString()`; `addDays` opera con `Date.UTC`. | `toISOString()` en Costa Rica (UTC‑6) devuelve *mañana* después de las 18:00. | Librería de fechas |
| A16 | **Clientes** (spec `002-modulo-Clientes`): catálogo en `state.clientes` (mismo `useReducer`), persistido en `proforma:clientes`. La proforma **copia** los datos del cliente y guarda `clienteId: string\|null` (snapshot). Vista aparte con pestañas por `useState` en `App`, **sin router**; el área de proforma se oculta con `.vista-oculta` (solo `@media screen`) para que "Imprimir" funcione desde cualquier pestaña. Validadores de storage en `state/validacion.js` (sin React) para probarlos con `node --test`. | Editar el catálogo no debe reescribir proformas emitidas (RC-06); borradores viejos sin `clienteId` siguen siendo válidos (RC-09). | Referencia viva al catálogo; React Router; IndexedDB |

## 2. Regla de dependencias (capas)

```
ui/  ──▶ state/ ──▶ core/  ◀── docx/ ◀── scripts/ (Node)
 │                              ▲
 ├──────────────────────────────┘   (Toolbar: buildDocument; Preview: ANCHOS)
 └────▶ platform/ (navegador)
```

- `core/` es **puro**: sin React, sin DOM, sin `localStorage`. Solo datos → datos.
- `docx/` depende solo de `core/` y de la librería `docx`. Nunca de React ni del DOM (`atob` sí: es global en Node ≥16 y navegador).
- `platform/` encapsula APIs del navegador (storage, canvas, descarga). `window.print()` se llama directo desde `Toolbar` (una línea, no merece módulo).
- `ui/` no contiene reglas de negocio: despacha acciones y lee el view‑model. Puede importar `docx/` (generar y anchos).
- Prohibido: `core` importando de cualquier otra capa; `docx` importando `platform`, `state` o `ui`.

## 3. Estructura de archivos

```
index.html
package.json              "type":"module"; scripts: dev, build, preview, test, embed-logo, test-docx
vite.config.js
.gitignore                node_modules, dist, out
public/
  manifest.webmanifest
  sw.js                   cache runtime (network-first navegación, cache-first assets con hash)
  icon.svg
assets/
  logo.png                fuente del logo (la pone el usuario; opcional, ver A14)
js/
  logo-data.js            GENERADO por embed-logo: export default { dataUrl, width, height } | null
scripts/
  embed-logo.mjs          assets/logo.png → js/logo-data.js (lee ancho/alto del chunk IHDR del PNG)
  test-docx.mjs           EJEMPLO → out/ejemplo.docx; si hay soffice → out/ejemplo.pdf y exige 1 página
src/
  main.jsx                monta <App/> y registra el SW (solo PROD)
  App.jsx                 layout: Toolbar | Form | Preview
  core/                   ── PURO, corre en Node y navegador ──
    money.js              parseDecimal, toCents, formatAmount, formatTotal, formatCantidad
    dates.js              todayISO, addDays, formatDate
    numbering.js          formatNumero, nextCounter
    proforma.js           typedefs + createProforma, nuevaProforma, lineAmount, total, validate, fileName
    view-model.js         toViewModel, logoSize
    defaults.js           EMISOR_DEFAULT, COMENTARIO_DEFAULT, EJEMPLO
  docx/                   ── depende solo de core + lib docx ──
    styles.js             constantes (DXA, tamaños), DOCUMENT_STYLES, NUMBERING, SIN_BORDES, helpers celda()/par()
    build-document.js     buildDocument(vm, logo) → Document; solo orquesta los bloques
    blocks.js             header, cliente, detalle, notas, pie, cierre (una función por bloque)
  platform/
    storage.js            load(key, fallback) / save(key, value); prefijo "proforma:"
    logo-bw.js            fileToBlackWhite(file) → Promise<Logo>
    download.js           downloadBlob(blob, name)
  state/
    reducer.js            reducer puro + creadores de acciones
    useProforma.js        useReducer + hidratar desde storage + autosave debounce 400 ms
  ui/
    Toolbar.jsx           total + Descargar .docx + Imprimir/PDF + Nueva proforma
    Field.jsx             input/textarea/select etiquetado con aria-invalid + mensaje
    form/DocumentoFields.jsx
    form/EmisorFields.jsx (details/summary plegable)
    form/LogoField.jsx
    form/ClienteFields.jsx
    form/LineasEditor.jsx
    form/NotasFields.jsx  comentario, incluye, no incluye
    preview/Preview.jsx   hoja carta escalada al ancho (ResizeObserver + transform: scale)
  styles.css              tokens, dark mode, layout responsive, foco visible, @media print
tests/
  core.test.js            node --test
out/                      (gitignored) ejemplo.docx / ejemplo.pdf
```

`blocks.js` es un solo archivo con 6 funciones pequeñas; se divide solo si pasa de ~250 líneas.
Sin `index.js` de barril, sin carpetas por componente.

## 4. Contratos (definitivos)

Los typedefs viven en `src/core/proforma.js` (y `ViewModel` en `view-model.js`). Todos los textos son `string`.

```js
/** @typedef {{ nombre, cedula, ciudad, direccion, telefono, correo, actividad }} Emisor */
/** @typedef {{ nombre, cedulaJuridica, contacto, telefono, correo, direccion }} Cliente */
/** @typedef {{ id: string, titulo: string, descripcion: string, cantidad: string, precio: string }} Linea
 *  cantidad/precio = texto crudo del input ("1,5", "18000"); se convierten al calcular. id = crypto.randomUUID(). */
/** @typedef {{
 *   numero: string,              // "PROF-2026-001", editable
 *   fechaEmision: string,        // ISO "YYYY-MM-DD"
 *   validaHasta: string,         // ISO
 *   validaHastaManual: boolean,
 *   condicion: string,            // texto libre; "Contado" por defecto
 *   actividad: string,           // '' → se usa emisor.actividad
 *   cliente: Cliente, lineas: Linea[],
 *   clienteId: string|null,      // A16: cliente del catálogo del que se copiaron los datos; ausente en datos viejos = null
 *   comentario: string, incluye: string, noIncluye: string   // textareas, una viñeta por línea
 * }} Proforma */
/** @typedef {{ dataUrl: string, width: number, height: number }} Logo
 *  dataUrl SIEMPRE "data:image/png;base64,…" (canvas.toDataURL('image/png') o embed-logo). width/height en px. */
/** @typedef {{ year: number, seq: number }} Counter   // último consecutivo emitido */
/** @typedef {Cliente & { id: string, actualizadoEn: string }} ClienteGuardado   // A16, core/clientes.js */
/** @typedef {{ ok: boolean, errors: Record<string, string> }} Validation
 *  clave "lineas.<id>.titulo" | "lineas.<id>.cantidad" | "lineas.<id>.precio"; valor = mensaje en español.
 *  Además ok=false si no hay ninguna línea (clave "lineas"). */

/** @typedef {{
 *   emisor: Emisor,              // tal cual (texto)
 *   ciudadUpper: string,         // emisor.ciudad.toUpperCase()
 *   actividad: string,           // proforma.actividad.trim() || emisor.actividad
 *   numero: string, fecha: string, validaHasta: string,   // fechas "dd/mm/aaaa"
 *   moneda: '₡ Colón', condicion: string, emitidaPor: string,   // emitidaPor = emisor.nombre
 *   cliente: Cliente,            // cada campo vacío (trim) → "[____]"
 *   vencimiento: string,         // = validaHasta (A11)
 *   lineas: { codigo: string, titulo: string, descripcion: string, cantidad: string, precio: string, monto: string }[],
 *            // codigo "SRV-001" por posición; titulo en MAYÚSCULAS; precio/monto "18.000,00"; cantidad "1" | "1,5"
 *   total: string,               // "₡300.000,00"
 *   comentario: string, incluye: string[], noIncluye: string[],   // split /\r?\n/, trim, sin vacías
 * }} ViewModel */
```

Firmas de funciones (`core/`):

| Función | Contrato |
|---------|----------|
| `parseDecimal(str)` | `"1,5"`/`"1.5"` → `1.5`; vacío o inválido → `NaN`. Acepta un solo separador decimal; **sin** separador de miles en la entrada. |
| `toCents(str)` | `Math.round(parseDecimal(str) * 100)`; `NaN` si inválido |
| `formatAmount(c)` / `formatTotal(c)` | `1800000` → `"18.000,00"` / `"₡18.000,00"` |
| `formatCantidad(str)` | `"1.50"` → `"1,5"`; `"2"` → `"2"` |
| `todayISO()` / `addDays(iso, n)` / `formatDate(iso)` | ver A15; `formatDate("2026-09-25")` → `"25/09/2026"` |
| `formatNumero(year, seq)` | `"PROF-2026-001"` (seq con `padStart(3,'0')`, sin tope) |
| `nextCounter(counter, year)` | `year !== counter.year` → `{year, seq: 1}`; si no `{year, seq: seq+1}` |
| `lineAmount(linea)` | céntimos: `Math.round(parseDecimal(cantidad) * toCents(precio))`; `0` si algo es `NaN` |
| `total(lineas)` | suma de `lineAmount` |
| `validate(proforma)` | → `Validation` (reglas §5) |
| `fileName(proforma)` | `Proforma_<numero>_<cliente>.docx` (§5) |
| `createProforma({ numero, hoy, emisor })` | proforma en blanco: una línea vacía (cantidad `"1"`), comentario/incluye/noIncluye default |
| `nuevaProforma(prev, { numero, hoy, emisor })` | = `createProforma` pero conserva `comentario`, `incluye`, `noIncluye` de `prev` |
| `toViewModel(proforma, emisor)` | → `ViewModel`. Única función que formatea para imprimir. |
| `validarCliente(cliente, clientes, id?)` | → `Validation` con claves `nombre`, `cedulaJuridica`, `correo` (spec 002 RC-02..04); `id` excluye al propio cliente de la comparación de cédula |
| `buscarClientes(clientes, texto)` / `ordenarClientes(clientes)` | filtro por nombre/cédula/contacto sin tildes ni mayúsculas / copia A→Z con `localeCompare('es')` |
| `logoSize(logo)` | → `{ width, height }` px: ancho 140, alto proporcional; si alto > 90 → alto 90 y ancho proporcional. Usada por docx **y** Preview. |

Estado persistido (`localStorage`, prefijo `proforma:`): `emisor` (Emisor), `logo` (Logo | ausente → `js/logo-data.js`),
`counter` (Counter), `draft` (Proforma), `history`, `clientes` (ClienteGuardado[], A16). Toda lectura pasa por `load(key, fallback)`: JSON inválido → `fallback`.

## 5. Reglas de negocio clave

- **Válida hasta** = emisión + 15 días cuando `validaHastaManual === false`; el checkbox activa el modo manual
  sin cambiar la fecha existente. Al desactivarlo, descarta la fecha manual y recalcula emisión + 15 días.
  "Nueva proforma" restablece `validaHastaManual = false`.
- **Condición de venta**: texto libre; el valor predeterminado de una nueva proforma es `Contado`.
- **Actividad**: vacía → view‑model usa la del emisor. "Nueva proforma" la deja = `emisor.actividad`.
- **Consecutivo**: primera carga sin `draft` → `EJEMPLO` (PROF‑2026‑001, fecha = hoy) y `counter = {year: 2026, seq: 1}`.
  "Nueva proforma" → `counter = nextCounter(counter, añoActual)` y `numero = formatNumero(counter)`.
  Editar el número a mano **no** toca el counter (el número es libre; el counter solo avanza con "Nueva proforma").
- **Nueva proforma**: siguiente consecutivo, fechas nuevas, `condicion = 'Contado'`, limpia cliente y líneas (una línea vacía),
  conserva emisor, logo, comentario, incluye/no incluye.
- **Monto línea** y **total**: siempre derivados (`lineAmount`, `total`). Nunca se guardan.
- **Validación** (antes de descargar e imprimir): al menos una línea; título obligatorio (trim); cantidad numérica > 0;
  precio no vacío, numérico y ≥ 0. Errores → `aria-invalid="true"` + mensaje (`aria-describedby`) + foco al primer campo inválido.
  Si no es válida, no se descarga ni imprime.
- **Nombre de archivo**: `Proforma_<numero>_<cliente>.docx`; cliente: `normalize('NFD')`, quitar `\p{Diacritic}`,
  quitar todo lo que no sea `[A-Za-z0-9 ]`, colapsar espacios, trim, espacios → `_`; vacío → `Cliente`.
  Ej.: `"Café Ñandú S.A."` → `Proforma_PROF-2026-001_Cafe_Nandu_SA.docx`.
- **Vencimiento** = Válida hasta (A11).
- **Logo subido** (`logo-bw.js`): dibujar en canvas con fondo blanco, escalar a máx. 600 px de ancho, luminancia
  `0.299R+0.587G+0.114B`; `< 160` → negro puro, si no blanco (alfa < 128 cuenta como blanco); `toDataURL('image/png')`.
  Solo se aceptan `image/*`. Botón "Restaurar logo por defecto" borra la clave `logo`.
- **Seguridad**: la Preview es JSX (React escapa); prohibido `dangerouslySetInnerHTML`. El `src` del logo solo se usa
  si empieza por `data:image/png;base64,` (lo que venga de storage manipulado se ignora → logo por defecto).
- **Ejemplo** (`EJEMPLO`): 8 líneas de organización de Google Drive, cantidad 1, precios enteros que sumen **₡300.000,00**
  (p. ej. 45.000 + 40.000 + 40.000 + 35.000 + 35.000 + 40.000 + 35.000 + 30.000). Cliente de ejemplo completo.

## 6. Documento .docx (mapa bloque → función → propiedades `docx`)

Verificado contra `docx@9.7.2` (XML generado: `lineRule="auto"`, `tblLayout fixed`, `cantSplit`, `tblHeader`, `vAlign center`, `tab right`).

### 6.1 Constantes y estilos (`styles.js`)

```js
ANCHO_UTIL = 9360                 // 12240 − 2×1440
CELL_PAD = 108                    // margen izq/der por defecto de celda en Word; tabs dentro de celda = ancho − 216
PT8 = 16; PT75 = 15; PT11 = 22    // half-points
LINEA = { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 1 }   // ½ pt, "fino"
NADA  = { style: BorderStyle.NONE, size: 0, color: 'auto' }
SIN_BORDES = { top, bottom, left, right, insideHorizontal, insideVertical: NADA }   // para Table.borders
```

`new Document({ styles, numbering, sections })`:

- `styles.default.document = { run: { font: 'Arial', size: PT8, color: '000000' }, paragraph: { spacing: { before: 0, after: 0, line: 264, lineRule: LineRuleType.AUTO } } }`
- `sections[0].properties.page = { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 0, footer: 0 } }`
- `numbering.config = [{ reference: 'vinetas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 180 } } } }] }]`
  (el "•" vive en la definición de numbering, **nunca** en el texto del párrafo).

Reglas para **todas** las tablas (helper `tabla(anchos, rows)` y `celda(ancho, children, opts)` en `styles.js`):
`new Table({ layout: TableLayoutType.FIXED, width: { size: suma, type: WidthType.DXA }, columnWidths: anchos, borders: SIN_BORDES, rows })`
y cada `new TableCell({ width: { size: ancho, type: WidthType.DXA }, … })`. Celdas con `columnSpan` llevan la suma de sus anchos.
Separación entre bloques: `spacing.before: 200` en el primer párrafo de cada bloque (no párrafos vacíos).

### 6.2 Bloques (`blocks.js`)

| Bloque | Función | Propiedades exactas |
|--------|---------|---------------------|
| Encabezado | `header(vm, logo)` → `Table` | `tabla([2300, 3900, 3160])`, 1 fila. **Izq.**: `verticalAlign: VerticalAlign.CENTER`; si `logo`: `Paragraph({ children: [ImageRun({ type: 'png', data: bytes, transformation: logoSize(logo) })] })`, `bytes` = `Uint8Array.from(atob(b64), c => c.charCodeAt(0))`. Si `null` → `Paragraph` vacío. **Centro**: un `Paragraph` por línea: nombre `bold`; `Céd.: …`; `ciudadUpper` `bold`; `Tel.: …`; correo; dirección; `Actividad: …` `bold` (etiqueta y valor). **Der.**: `Paragraph({ alignment: RIGHT, children: [TextRun({ text: 'FACTURA PROFORMA', bold: true, size: PT11 })] })`; número `alignment: RIGHT, bold`; luego 5 pares `Paragraph({ tabStops: [{ type: TabStopType.RIGHT, position: 2944 }], children: [TextRun('Fecha:'), TextRun({ children: [new Tab(), vm.fecha] })] })` para Fecha, Válida hasta, Moneda, Condición, Emitida por. |
| Cliente | `cliente(vm)` → `[Paragraph, Table]` | `Paragraph({ spacing: { before: 200 }, border: { bottom: LINEA }, children: [TextRun({ text: 'Cliente:', bold: true })] })`. `tabla([1300, 3900, 1300, 2860])`, 4 filas, etiquetas `bold`: `Nombre:`/nombre · `E-mail:`/correo; `Céd. jurídica:`/cedulaJuridica · `Contacto:`/contacto; `Teléfono:`/telefono · `Vencimiento:`/vencimiento; `Dirección:`/direccion con `columnSpan: 3`, `width 8060`. |
| Detalle | `detalle(vm)` → `Table` | `tabla([1000, 5000, 700, 1330, 1330])`. Fila encabezado: `TableRow({ tableHeader: true, cantSplit: true })`, celdas con `borders: { top: LINEA, bottom: LINEA }`, textos `bold`: Código, Descripción, Cant., Precio U., Monto (los 3 numéricos `alignment: RIGHT`). Filas de datos: `cantSplit: true`, sin bordes. Descripción = `Paragraph(TextRun({ text: titulo, bold: true }))` + (si hay) `Paragraph(TextRun({ text: descripcion, size: PT75 }))`; saltos de línea de la descripción → `TextRun({ break: 1 })`. Cant/Precio/Monto `alignment: RIGHT`. La primera celda de datos lleva `spacing.before: 40` para aire entre filas. |
| Notas | `notas(vm)` → `Paragraph[]` | `Paragraph({ spacing: { before: 200 }, text: comentario })`. Si `incluye.length`: `Paragraph({ spacing: { before: 120 }, children: [TextRun({ text: 'Incluye:', bold: true })] })` + un `Paragraph({ text, numbering: { reference: 'vinetas', level: 0 } })` por ítem. Igual para `No incluye:`. Listas vacías → se omite el título. |
| Pie | `pie(vm)` → `[Table, Paragraph]` | `tabla([3800, 1800, 3760])`, **2 filas**, `cantSplit: true`. Fila 1: c1 = firma emisor, c2 vacía, c3 = total. Fila 2: c1 = firma cliente, c2 y c3 vacías. **Firma**: `Paragraph({ spacing: { before: 480 }, border: { top: LINEA }, alignment: CENTER, text })` con `vm.emisor.nombre` y `'Aprobado por el cliente'` (cada una en **su** celda: en la misma celda Word fusiona los bordes). **Total**: `Paragraph({ spacing: { before: 480 }, border: { top: LINEA }, tabStops: [{ type: RIGHT, position: 3544 }], children: [TextRun({ text: 'Total:', bold: true }), TextRun({ bold: true, children: [new Tab(), vm.total] })] })` (3544 = 3760 − 216). Después de la tabla: `Paragraph({ spacing: { before: 200 }, alignment: CENTER, children: [TextRun({ text: \`Documento de cotización. Precios válidos hasta el ${vm.validaHasta}.\`, italics: true })] })`. |
| Cierre | `cierre(vm)` → `Paragraph` | Un párrafo con dos tabs: `tabStops: [{ type: TabStopType.CENTER, position: 4680 }, { type: TabStopType.RIGHT, position: 9360 }]`, `spacing.before: 200`, children: `Tab`, `'Contacto: '`, `TextRun({ text: correo, bold: true })`, `Tab`, `vm.fecha`. |

`buildDocument(vm, logo)` = `new Document({ styles, numbering, sections: [{ properties, children: [header, ...cliente, detalle, ...notas, ...pie, cierre] }] })`.
Nada más: sin encabezado/pie de página de Word, sin IVA/subtotal, **una** fila de total, nada de Hacienda.

Uso: navegador `Packer.toBlob(doc)` → `downloadBlob(blob, fileName(p))`; Node `Packer.toBuffer(doc)` → `fs.writeFile`.

### 6.3 Vista previa (misma estructura, HTML)

`Preview.jsx` replica los 6 bloques con `<table style="table-layout:fixed">` y anchos en % derivados de las mismas
constantes: `styles.js` exporta `ANCHOS = { header, cliente, detalle, pie }` y Preview los importa (una sola fuente de columnas).
Hoja: 816 × 1056 px (carta a 96 dpi), padding 96 px, escalada con `transform: scale(ancho/816)`.

## 7. Calidad (Definition of Done global)

- `npm test` verde · `node scripts/embed-logo.mjs` · `node scripts/test-docx.mjs` → `out/ejemplo.docx`
- Con LibreOffice (`soffice` en PATH o `C:\Program Files\LibreOffice\program\soffice.exe`):
  `soffice --headless --convert-to pdf --outdir out out/ejemplo.docx` → contar `/Type /Page\b` (sin `s`) en el PDF == **1**.
  Si no hay LibreOffice, el script lo dice y sale 0.
- Funciones ≤ ~30 líneas, una responsabilidad, nombres en español del dominio.
- Sin lógica de negocio en componentes; sin formateo fuera de `core/` (Preview y docx solo leen el `ViewModel`).
- a11y: labels en todos los campos, foco visible (`:focus-visible`), `aria-invalid` + `aria-describedby`, contraste AA claro/oscuro.
- `@media print`: se oculta todo salvo la hoja; `@page { size: letter; margin: 0 }`; sin `transform` al imprimir.
- Sin dependencias nuevas sin ADR en §1.
- Mínimo en `tests/core.test.js`: `formatAmount(1800000)`, `formatTotal`, `toCents('1,5')`, `lineAmount` con decimales,
  `total(EJEMPLO.lineas) === 30000000`, `formatNumero`, `nextCounter` (mismo año / cambio de año), `addDays` fin de mes,
  `validate` (título vacío, cantidad 0, precio vacío/negativo), `fileName` con tildes/ñ/símbolos y vacío, `logoSize` (ancho y alto limitantes).

## 8. Preguntas abiertas

Ninguna. Las 4 anteriores quedaron resueltas como A11–A14.
