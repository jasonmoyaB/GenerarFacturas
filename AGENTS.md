# AGENTS.md

Guía obligatoria para agentes que trabajen en **GenFacturas**. Aplica a todo el repositorio.

## 1. Objetivo del proyecto

GenFacturas es una aplicación web React + Vite para crear facturas proforma, previsualizarlas, imprimirlas y descargarlas como `.docx`. Debe funcionar como PWA, persistir datos localmente y generar un documento de una página con formato exacto.

No convertir este proyecto en un sistema de factura electrónica. No agregar IVA, Hacienda, CABYS, QR, claves, consecutivos fiscales ni integraciones externas salvo petición expresa del usuario.

## 2. Fuentes de verdad

Leer antes de implementar:

1. `docs/specs/01-spec-funcionales.md`: comportamiento solicitado.
2. `docs/specs/02-arquitectura.md`: decisiones técnicas, contratos y formato DOCX.
3. `docs/specs/03-tareas.md`: fases, estado y flujo de revisión.
4. `docs/specs/reviews/`: hallazgos y verificaciones anteriores.
5. `docs/errores-conocidos/`: problemas conocidos y soluciones.

Si hay contradicción, prevalece la petición actual del usuario. Después prevalece `01-spec-funcionales.md` y luego `02-arquitectura.md`. No cambiar una decisión arquitectónica silenciosamente: documentar la modificación y su motivo.

## 3. Stack y entorno

- React 19 + Vite 8.
- JavaScript ESM + JSX + JSDoc. No migrar a TypeScript.
- Node `>=22.12`.
- `docx@^9.7` para generar documentos.
- CSS plano. No agregar frameworks CSS.
- Tests con `node:test`. No agregar Jest o Vitest sin necesidad aprobada.
- Persistencia en `localStorage`. No introducir backend, base de datos o IndexedDB sin petición expresa.
- PWA manual mediante `public/manifest.webmanifest` y `public/sw.js`.

Comandos principales:

```bash
npm ci
npm run dev
npm test
npm run build
npm run embed-logo
npm run test-docx
npm run preview
```

## 4. Antes de modificar código

Siempre:

1. Ejecutar `git status --short --branch`.
2. Leer la especificación y los archivos relacionados.
3. Buscar si la función, componente, helper o acción ya existe.
4. Revisar llamadas y dependencias antes de cambiar contratos.
5. Identificar pruebas existentes que cubran el comportamiento.
6. Elegir el cambio correcto más pequeño.

No crear archivos o abstracciones duplicadas. Si algo existente cubre la mayor parte de la necesidad, extenderlo.

## 5. Regla de capas

Respetar esta dirección:

```text
ui/ -> state/ -> core/ <- docx/ <- scripts/
  \-> platform/
```

### `src/core/`

- Debe ser puro.
- No importar React, DOM, `window`, `document`, canvas ni `localStorage`.
- Contiene reglas de negocio, fechas, dinero, numeración, validación y view-model.
- Debe funcionar igual en Node y navegador.

### `src/docx/`

- Solo depende de `core/` y `docx`.
- No lee storage ni estado global.
- No importa React, UI o APIs del navegador.
- `buildDocument(vm, logo)` recibe todo por parámetros.

### `src/platform/`

- Encapsula APIs del navegador: storage, descarga y canvas.
- Toda lectura y escritura de `localStorage` pasa por `storage.js`.
- Capturar errores de JSON, cuota y acceso denegado.

### `src/state/`

- Un único `useReducer` para el estado de la proforma.
- El reducer debe ser puro: no usar reloj, storage, DOM ni generar efectos.
- Fechas, IDs y datos externos entran en las acciones.
- Persistencia con debounce de 400 ms.

### `src/ui/`

- Componentes presentan datos y despachan acciones.
- No duplicar reglas de negocio ni formatos.
- Preview y DOCX consumen el mismo `toViewModel`.
- Nunca usar `dangerouslySetInnerHTML`.

## 6. Reglas de dominio que no se deben romper

### Dinero

- Calcular siempre en céntimos enteros.
- Nunca guardar montos derivados ni totales en el estado.
- El total se calcula desde las líneas.
- Entrada decimal acepta coma o punto, sin separadores de miles y con máximo dos decimales.
- Formato de tabla: `18.000,00`.
- Formato de total: `₡300.000,00`.

### Fechas

- Usar hora local con `todayISO()`; no usar `toISOString()` para obtener “hoy”.
- `Válida hasta` es emisión + 15 días.
- Recalcular al cambiar emisión, excepto si el usuario editó el vencimiento manualmente.
- Una fecha vacía no debe lanzar errores.

### Consecutivo

- Formato `PROF-AAAA-NNN`.
- El contador avanza con “Nueva proforma”.
- Editar el número manualmente no modifica el contador.
- El contador reinicia en `001` cuando cambia el año.

### Líneas

- Código derivado por posición: `SRV-001`, `SRV-002`, etc.
- Renumerar al agregar o eliminar.
- Título obligatorio, cantidad mayor que cero y precio no vacío mayor o igual a cero.
- Cantidad y precio admiten máximo dos decimales.

### Nueva proforma

- Limpia cliente y servicios.
- Crea una línea vacía con cantidad `1`.
- Conserva emisor, logo, comentario, “Incluye” y “No incluye”.
- Restablece condición a `Contado` y vencimiento manual a `false`.

### Historial

- Registrar una proforma válida al descargar o imprimir.
- Actualizar la entrada si se reutiliza el mismo número.
- Conservar máximo 50 registros.
- Permitir restaurar y eliminar.
- Validar los registros cargados; storage manipulado o corrupto no debe romper la aplicación.
- No duplicar imágenes grandes en cada registro si puede agotar `localStorage`.

## 7. Documento DOCX

El formato definido en `docs/specs/02-arquitectura.md` §6 es contractual.

Obligatorio:

- Carta: `12240 x 15840` DXA.
- Márgenes: `1440` DXA.
- Arial, base 8 pt, blanco y negro.
- `lineRule="auto"` explícito.
- Tablas con layout fijo, `columnWidths` y ancho en cada celda.
- Encabezados de tabla con `tableHeader`.
- Filas con `cantSplit`.
- Viñetas mediante numbering de DOCX, no escribir el carácter `•` en el texto.
- Una sola fila de total.
- Cada firma en su propia celda.
- Ocho líneas del ejemplo deben caber en una página.
- Debe funcionar con logo y con `logo = null`.

No cambiar anchos, tabuladores, bordes, márgenes o separación “para que se vea mejor” sin comprobar Word/LibreOffice y actualizar la especificación.

## 8. Logo y seguridad

- Aceptar únicamente archivos `image/*`.
- Convertir mediante canvas a PNG blanco y negro.
- Fondo transparente cuenta como blanco.
- Reducir dimensiones antes de guardar.
- Solo usar logos cuyo `dataUrl` empiece por `data:image/png;base64,`.
- Validar ancho y alto positivos y finitos.
- Un logo corrupto en storage se ignora y se usa el predeterminado.
- No insertar HTML proveniente de entradas del usuario.

## 9. UI y accesibilidad

- Interfaz en español.
- Responsive en escritorio y móvil.
- Vista previa debajo del formulario en pantallas pequeñas.
- Tema claro y oscuro mediante `prefers-color-scheme`.
- Mantener contraste visible en ambos temas.
- Todo campo debe tener `label`.
- Errores con `aria-invalid` y `aria-describedby`.
- En una validación fallida, enfocar el primer campo inválido.
- Mantener `:focus-visible` reconocible.
- Botones destructivos deben ser claros y pedir confirmación cuando eliminan múltiples datos.

## 10. PWA, caché y desarrollo

- No agregar `vite-plugin-pwa`; la PWA es manual.
- Registrar el service worker únicamente en producción.
- En desarrollo no debe controlar la página ni interferir con HMR.
- Mantener el mecanismo de recuperación documentado en `docs/errores-conocidos/01-cache-pwa-rutas-antiguas.md` mientras haya clientes con caché antigua.
- Incrementar el nombre de caché al cambiar la estrategia o los recursos precargados.
- No borrar `localStorage` al limpiar cachés: contiene borradores e historial.
- La aplicación debe funcionar offline después de la primera carga de producción.

## 11. Estilo de código

Hacer:

- Funciones pequeñas y con una responsabilidad.
- Nombres claros; español para conceptos del dominio.
- Inmutabilidad en el reducer.
- JSDoc para contratos compartidos o datos no evidentes.
- Comentarios breves que expliquen decisiones o restricciones.
- Reutilizar constantes de anchos, formatos y view-model.
- Añadir o actualizar pruebas al cambiar reglas puras.

No hacer:

- No duplicar lógica entre Preview y DOCX.
- No formatear dinero o fechas directamente en componentes.
- No usar floats como representación persistida de dinero.
- No mutar estado, líneas, cliente, emisor o historial.
- No añadir dependencias sin justificar y documentar la decisión.
- No crear factories, interfaces o capas de una sola implementación.
- No dejar `console.log`, código muerto, TODO ambiguos o secretos.
- No silenciar errores con `catch {}` salvo que exista un fallback seguro y deliberado.
- No cambiar JavaScript a TypeScript.

## 12. Pruebas y Definition of Done

Antes de declarar una tarea terminada ejecutar:

```bash
npm test
npm run build
npm run embed-logo
npm run test-docx
git diff --check
```

Además:

- TDD obligatorio: toda lógica nueva o corregida lleva su prueba unitaria (`node:test` en `tests/`) escrita primero y vista en rojo antes de implementar; al cerrar la implementación, cada prueba nueva debe pasar en verde. Sin prueba = tarea no terminada.
- Probar el flujo modificado en navegador cuando afecte UI, storage, descarga, impresión o service worker.
- Verificar tema claro, oscuro y ancho móvil si se cambia CSS.
- Verificar `aria-invalid`, foco y navegación por teclado si se cambian formularios.
- Si LibreOffice está instalado, convertir `out/ejemplo.docx` a PDF y exigir una página.
- Si no está instalado, indicarlo explícitamente; no afirmar que la página fue validada visualmente.
- Documentar la verificación final en `docs/specs/reviews/verificacion.md` cuando corresponda.

Una compilación exitosa no sustituye pruebas funcionales.

## 13. Git y trabajo concurrente

- `main` debe mantenerse estable.
- Usar ramas `feat/fN-<nombre>` para fases o una rama descriptiva para cambios aislados.
- Hacer commits pequeños solo cuando el usuario u orquestador lo solicite.
- No hacer commit, merge, amend, rebase, push ni crear PR sin autorización explícita.
- No usar `git reset --hard`, `git checkout --`, `git clean` ni force-push.
- No revertir cambios ajenos.
- Antes de cambiar de rama revisar `git status`.
- Si aparecen modificaciones inesperadas durante el trabajo, no forzar: detenerse y confirmar con el usuario.
- No incluir `.claude/`, secretos, `node_modules`, `dist` u `out` accidentalmente.
- Antes de un commit revisar `git status`, `git diff` y los commits recientes.

Flujo de revisión por fase:

```text
arquitecto -> SeniorDev -> cleanCode -> pr-review -> merge a main
```

Los reviews viven en `docs/specs/reviews/fN.md` y deben incluir veredicto, hallazgos con `archivo:línea` y comandos ejecutados.

## 14. Documentación

- Actualizar `01-spec-funcionales.md` cuando cambie el comportamiento solicitado.
- Actualizar `02-arquitectura.md` cuando cambien contratos, dependencias o decisiones técnicas.
- Actualizar `03-tareas.md` únicamente con trabajo realmente completado y verificado.
- Documentar errores reproducibles en `docs/errores-conocidos/` con síntomas, causa, solución y verificación.
- No marcar APPROVE, merge o una comprobación visual que no se haya realizado.

## 15. Criterio final

Priorizar, en este orden:

1. Integridad de datos del usuario.
2. Exactitud de la proforma y del DOCX.
3. Cumplimiento de especificaciones.
4. Seguridad y accesibilidad.
5. Simplicidad y mantenibilidad.
6. Apariencia visual.

Cuando haya dudas que cambien comportamiento persistido o alcance funcional, preguntar antes de asumir. Para errores claros o cambios internos compatibles, investigar, implementar, verificar y documentar de extremo a extremo.
