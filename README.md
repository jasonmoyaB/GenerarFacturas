# GenFacturas

Aplicación web para crear facturas proforma desde un formulario, previsualizarlas en tiempo real y descargarlas como documentos Word. Está diseñada para que clientes, servicios, cantidades, precios y notas puedan modificarse sin editar código o plantillas manualmente.

## Funciones principales

- Formulario completo para documento, emisor, cliente y servicios.
- Líneas dinámicas que se pueden agregar, modificar y eliminar.
- Cálculo automático de montos y total en colones.
- Previsualización en vivo del documento final.
- Descarga en formato `.docx` e impresión o guardado como PDF.
- Consecutivos automáticos con formato `PROF-AAAA-NNN`.
- Carga de logo con conversión automática a blanco y negro.
- Guardado automático del borrador en el navegador.
- Historial local de hasta 50 proformas, con restauración y eliminación.
- Catálogo de clientes: crear, editar, eliminar y buscar; elegir un cliente al hacer una proforma y ver sus proformas.
- Diseño responsive, tema claro y oscuro y funcionamiento como PWA.

## Requisitos

- Node.js `22.12` o posterior.
- npm.
- Un navegador moderno.
- LibreOffice opcional para verificar automáticamente que el documento ocupe una página.

## Instalación

```bash
git clone <URL_DEL_REPOSITORIO>
cd GenFacturas
npm ci
npm run dev
```

Abrir `http://localhost:5173` en el navegador.

## Uso

1. Completar o modificar los datos del documento y del emisor.
2. Elegir un cliente guardado en **Elegir cliente** o escribir sus datos (y guardarlo con **Guardar en clientes**). Los clientes se administran en la pestaña **Clientes**.
3. Agregar, editar o eliminar servicios y precios.
4. Revisar el resultado en la vista previa.
5. Descargar el archivo `.docx` o usar **Imprimir / PDF**.
6. Recuperar documentos anteriores desde la sección **Historial** o desde el detalle de cada cliente.

Al elegir un cliente, sus datos se copian a la proforma. Editar o eliminar después ese cliente no cambia las proformas ya hechas.

Los datos se guardan localmente en el navegador. La aplicación no utiliza servidor, cuenta de usuario ni base de datos externa.

## Logo predeterminado

El logo fuente es opcional y debe ubicarse en `assets/logo.png`. Para convertirlo en un módulo utilizable por la aplicación:

```bash
npm run embed-logo
```

Si el archivo no existe, la aplicación funciona sin logo. También se puede cargar uno desde el formulario.

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia Vite en modo desarrollo |
| `npm test` | Ejecuta las pruebas con `node:test` |
| `npm run build` | Genera la aplicación de producción en `dist/` |
| `npm run preview` | Sirve localmente el build de producción |
| `npm run embed-logo` | Convierte `assets/logo.png` en `js/logo-data.js` |
| `npm run test-docx` | Genera `out/ejemplo.docx` y verifica el PDF si existe LibreOffice |

## Verificación

Antes de entregar cambios ejecutar:

```bash
npm test
npm run build
npm run embed-logo
npm run test-docx
git diff --check
```

## Estructura

```text
src/
├── core/       Reglas de negocio, dinero, fechas, clientes y view-model
├── docx/       Construcción exacta del documento Word
├── platform/   Storage, descarga y procesamiento del logo
├── state/      Reducer, validación de storage y persistencia
├── ui/         Formulario, vista Clientes, barra de acciones y vista previa
├── App.jsx
└── main.jsx
public/         Manifest, icono y service worker
scripts/        Embebido del logo y verificación DOCX
tests/          Pruebas del núcleo y del reducer
docs/           Constitución, especificaciones, revisiones y errores conocidos
```

La dirección de dependencias es:

```text
ui/ -> state/ -> core/ <- docx/ <- scripts/
  \-> platform/
```

## Documentación

- [`docs/constitution.md`](docs/constitution.md): visión y principios innegociables.
- [`docs/specs/01-spec-funcionales.md`](docs/specs/01-spec-funcionales.md): comportamiento funcional.
- [`docs/specs/02-arquitectura.md`](docs/specs/02-arquitectura.md): arquitectura y contrato DOCX.
- [`docs/specs/03-tareas.md`](docs/specs/03-tareas.md): fases y estado del desarrollo.
- [`docs/specs/002-modulo-Clientes/`](docs/specs/002-modulo-Clientes/): spec y plan del módulo de clientes.
- [`AGENTS.md`](AGENTS.md): reglas para agentes y colaboradores.
- [`docs/errores-conocidos/`](docs/errores-conocidos/): diagnóstico y solución de problemas conocidos.

## Alcance

GenFacturas genera documentos de cotización o factura proforma. No es un sistema de factura electrónica y no incluye IVA, Hacienda, CABYS, claves fiscales, QR ni integraciones tributarias.

## Datos y privacidad

La información permanece en `localStorage` dentro del navegador. Limpiar los datos del sitio elimina el borrador, la configuración, el historial y el catálogo de clientes. No se envían datos a servicios externos.
