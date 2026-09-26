# 002 · Módulo de Clientes

Estado: **propuesta** · Fecha: 2026-09-25 · Depende de: `01-spec-funcionales.md`, `02-arquitectura.md`

## 1. Objetivo

Tener un catálogo local de clientes (CRUD) para reutilizarlos al crear proformas. Así no hay que volver a escribir los datos del cliente y las proformas quedan agrupadas por cliente.

## 2. Historia de usuario

> Yo, como usuario, quiero un CRUD de clientes para generarles las facturas y tener todo más ordenado.

Historias derivadas:

- HU-1: Quiero registrar, consultar, editar y eliminar clientes.
- HU-2: Quiero buscar un cliente por nombre, cédula o contacto.
- HU-3: Quiero elegir un cliente guardado al crear una proforma para no volver a escribir sus datos.
- HU-4: Quiero guardar en el catálogo el cliente que escribí en una proforma.
- HU-5: Quiero ver las proformas que le generé a un cliente.

## 3. Alcance

1. **Vista "Clientes"** separada de la vista "Proforma", con pestañas en la barra superior. Sin router ni dependencias nuevas.
2. **CRUD**:
   - Crear cliente.
   - Listar clientes ordenados por nombre.
   - Editar cliente.
   - Eliminar cliente con confirmación.
3. **Búsqueda** en la lista por nombre, cédula jurídica o contacto. No distingue mayúsculas ni tildes.
4. **Elegir cliente en la proforma**: la sección "Cliente" del formulario tiene un selector "Elegir cliente". Al elegir uno, sus datos se copian a la proforma y se guarda su `clienteId`.
5. **Guardar en clientes** desde la proforma: botón en la sección "Cliente". Crea el cliente si la proforma no tiene vínculo; lo actualiza si ya lo tiene.
6. **Proformas del cliente**: el detalle del cliente lista las proformas del historial con su `clienteId` (número, fecha y total) y permite abrirlas.
7. **Persistencia** en `localStorage`, con validación al cargar.

## 4. Fuera de alcance

- Backend, sincronización entre dispositivos, IndexedDB o cuentas de usuario.
- Importar o exportar clientes (CSV, Excel, JSON).
- Campos nuevos del cliente. Se usan los 6 actuales, así que el DOCX y la vista previa no cambian.
- Validar la cédula según el tipo costarricense (física, jurídica, DIMEX) o consultar Hacienda.
- Paginación, papelera o deshacer una eliminación.
- Cambiar proformas ya emitidas o el historial cuando se edita un cliente.
- IVA, factura electrónica, CABYS, consecutivos fiscales (ver `AGENTS.md` §1).
- Estado de cuenta, saldos, pagos o reportes por cliente.

## 5. Reglas de negocio

| ID | Regla |
|----|-------|
| RC-01 | Un cliente tiene los mismos campos que `Cliente` (`nombre`, `cedulaJuridica`, `contacto`, `telefono`, `correo`, `direccion`), más `id` y `actualizadoEn` (ISO). |
| RC-02 | `nombre` es obligatorio. Un nombre con solo espacios cuenta como vacío. |
| RC-03 | La `cedulaJuridica` es opcional. Si se escribe, debe ser única en el catálogo. Para compararlas se quitan espacios y guiones y se pasan a minúsculas (`3-101-123456` = `3101123456`). Al editar un cliente no se compara consigo mismo. |
| RC-04 | El `correo` es opcional. Si se escribe, debe tener el formato básico `algo@dominio.ext`. |
| RC-05 | Elegir un cliente en la proforma **copia** sus datos a `proforma.cliente` y guarda `proforma.clienteId`. La proforma no lee los datos del catálogo después. |
| RC-06 | Editar un cliente en el catálogo no cambia el borrador actual, las proformas emitidas ni el historial. |
| RC-07 | Editar los datos del cliente dentro de la proforma no cambia el catálogo. El catálogo solo cambia con "Guardar en clientes". |
| RC-08 | "Guardar en clientes": si `clienteId` apunta a un cliente que existe, lo actualiza. Si no, crea uno nuevo y enlaza la proforma. En ambos casos aplica RC-02 a RC-04. |
| RC-09 | `proforma.clienteId` es opcional: `string` o `null`. Un borrador o registro de historial antiguo sin `clienteId` es válido y se trata como `null`. |
| RC-10 | "Nueva proforma" limpia el cliente (regla actual) y además pone `clienteId = null`. |
| RC-11 | Eliminar un cliente no borra proformas del historial. Si el borrador actual lo tenía enlazado, queda con `clienteId = null` y conserva los datos copiados. |
| RC-12 | Si un `clienteId` apunta a un cliente que no existe, se trata como proforma sin vínculo y no genera errores. |
| RC-13 | "Proformas del cliente" = registros del historial con `proforma.clienteId === cliente.id`, del más reciente al más antiguo. Abrir uno usa la acción actual `historial/restaurar`. |
| RC-14 | La lista se ordena por nombre, ascendente, con `localeCompare` en español. |
| RC-15 | Al cargar, los registros inválidos o corruptos se descartan y no rompen la aplicación. Si falla el guardado (cuota o acceso denegado), se avisa al usuario y se conservan los datos en memoria. |
| RC-16 | Solo se muestra texto. Nunca se inserta HTML escrito por el usuario. El reducer es puro: `id` y `actualizadoEn` llegan en la acción. |

## 6. Criterios de aceptación

| ID | Dado | Cuando | Entonces |
|----|------|--------|----------|
| CA-01 | Vista Clientes vacía | Creo "Comercial Los Andes S.A." con cédula `3-101-123456` | Aparece en la lista y sigue ahí al recargar. |
| CA-02 | Formulario de cliente | Guardo con nombre vacío o solo espacios | No se guarda; el campo tiene `aria-invalid="true"`, el mensaje está enlazado con `aria-describedby` y recibe el foco. |
| CA-03 | Existe un cliente con cédula `3-101-123456` | Creo otro con `3101123456` | No se guarda; aparece el error "La cédula jurídica ya está registrada". |
| CA-04 | Existe un cliente | Lo edito y guardo sin cambiar su cédula | Se guarda sin error de duplicado y se actualiza `actualizadoEn`. |
| CA-05 | Correo `maria@` | Guardo | Error de formato en el campo correo. Con correo vacío sí se guarda. |
| CA-06 | Existe un cliente | Pulso Eliminar | Se pide confirmación. Si cancelo, no pasa nada. Si acepto, desaparece de la lista. |
| CA-07 | Clientes "Café Ñandú" y "Los Andes" | Busco `cafe nandu` | Solo aparece "Café Ñandú". También encuentra por cédula y por contacto. |
| CA-08 | Lista con varios clientes | Abro la vista | Salen ordenados por nombre (A→Z). |
| CA-09 | Vista Proforma | Elijo un cliente en "Elegir cliente" | Sus 6 campos se copian al formulario y la vista previa se actualiza. |
| CA-10 | Proforma con cliente elegido | Edito ese cliente en el catálogo | El borrador y el historial conservan los datos anteriores. |
| CA-11 | Proforma con cliente escrito a mano, sin vínculo | Pulso "Guardar en clientes" | Se crea el cliente y la proforma queda enlazada. |
| CA-12 | Proforma enlazada a un cliente | Cambio el teléfono en la proforma y pulso "Guardar en clientes" | Se actualiza ese cliente y no se crea un duplicado. |
| CA-13 | Proforma con cliente sin nombre | Pulso "Guardar en clientes" | No se guarda y se muestra el error de nombre (CA-02). |
| CA-14 | Descargué o imprimí proformas de un cliente | Abro su detalle | Veo sus proformas (número, fecha y total). "Abrir" carga la proforma en la vista Proforma. |
| CA-15 | Proforma enlazada | Pulso "Nueva proforma" | Cliente vacío y `clienteId = null`. Emisor, logo y textos se conservan como hoy. |
| CA-16 | Borrador enlazado al cliente X | Elimino X | El borrador conserva los datos del cliente con `clienteId = null`. El historial no cambia. |
| CA-17 | `proforma:clientes` con JSON inválido o registros sin `id` o `nombre` | Cargo la app | La app funciona y se descartan solo los registros inválidos. |
| CA-18 | Borrador o historial guardado antes de este módulo (sin `clienteId`) | Cargo la app | Se carga normal y no se reemplaza por el ejemplo. |
| CA-19 | Nombre con `<b>x</b>` | Guardo y veo lista y vista previa | Se muestra como texto literal. |
| CA-20 | Cualquier cliente | Genero el DOCX | El documento es idéntico al actual: el `clienteId` no aparece y se sigue cumpliendo `02-arquitectura.md` §6. |
| CA-21 | Móvil (≤ 600 px), tema claro y oscuro | Uso la vista Clientes | No hay scroll horizontal, el contraste es visible, todo se puede hacer con teclado y el `:focus-visible` se ve. |
| CA-22 | Registro del historial o borrador con un `clienteId` que ya no existe | Abro la app, el detalle de clientes y el selector | No hay errores; la proforma se comporta como si no tuviera vínculo. |
| CA-23 | `localStorage` lleno o bloqueado | Guardo un cliente | Aparece un aviso visible y el cliente sigue en la lista durante la sesión. |

## 7. Notas técnicas

Respetan la regla de capas (`AGENTS.md` §5) y reutilizan lo que ya existe:

- **Contrato**: `Proforma` suma `clienteId: string|null`. `ClienteGuardado = Cliente & { id: string, actualizadoEn: string }`.
- **`src/core/clientes.js`** (puro): `validarCliente(cliente, clientes)` → `Validation`, `buscarClientes(clientes, texto)` y `ordenarClientes(clientes)`. Reutiliza la normalización NFD de `nombreSeguro`. Pruebas con `node:test`.
- **IDs**: exportar `nuevoId()` de `core/proforma.js`; no duplicarlo.
- **`src/state/reducer.js`** (mismo `useReducer`): nuevas acciones `clientes/guardar` (crea o actualiza por `id`), `clientes/eliminar` (además desenlaza el borrador, RC-11) y `proforma/usarCliente`. `nueva` pone `clienteId: null`.
- **`src/state/useProforma.js`**: `validClientes()` sigue el patrón de `validHistory()`; `validProforma()` acepta `clienteId` ausente, `null` o `string`. Persiste `clientes` en el mismo debounce de 400 ms con la clave `proforma:clientes` (a través de `platform/storage.js`).
- **UI**: `src/ui/clientes/Clientes.jsx` (lista, búsqueda, formulario y detalle, usando `Field.jsx`). Pestañas con `useState` local en `App.jsx`/`Toolbar.jsx`. En `ClienteFields.jsx`, un `<select>` y el botón "Guardar en clientes".
- **Sin cambios** en `src/docx/`, `view-model.js` ni el service worker (no hay recursos nuevos para precachear).
- **Al implementar, documentar**: ADR en `02-arquitectura.md` (contrato `clienteId` y clave de storage), referencia en `01-spec-funcionales.md` y la fase en `03-tareas.md`.
