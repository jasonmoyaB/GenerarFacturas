# 003 · Plan de implementación — Edición del apartado Documento

Spec: `spec.md` · Fase propuesta: **F8 Edición de Documento** · Rama sugerida: `feat/f8-edicion-documento`.

Este plan describe la implementación. No incluye cambios de código.

## Alcance

- Agregar un checkbox para activar o desactivar la edición manual de **Válida hasta**.
- Mantener el cálculo automático de **Válida hasta** como fecha de emisión más 15 días cuando la edición manual esté desactivada.
- Convertir **Condición de venta** de una lista cerrada a un campo de texto libre.
- Conservar sin cambios la estructura y el formato de la vista previa y del DOCX.

## Decisiones de implementación

- Reutilizar `proforma.validaHastaManual`; no agregar un segundo indicador al estado.
- El checkbox estará marcado cuando `validaHastaManual === true`.
- Con el checkbox desmarcado, el campo de fecha estará deshabilitado y seguirá el cálculo automático existente.
- Al marcar el checkbox, se habilitará el campo sin cambiar la fecha calculada que ya contiene.
- Al desmarcar el checkbox, se recalculará inmediatamente **Válida hasta** con `addDays(fechaEmision, 15)`.
- **Condición de venta** continuará siendo un `string`; solo cambiará el control de UI y el contrato dejará de limitarlo a `Contado | Crédito`.
- Una **Nueva proforma** conservará el comportamiento actual: `condicion = 'Contado'` y `validaHastaManual = false`.
- No se agregarán dependencias, componentes genéricos ni abstracciones nuevas.

## Componentes existentes que se reutilizan

- `addDays` de `src/core/dates.js` para el cálculo de 15 días.
- `validaHastaManual` del contrato `Proforma`.
- La acción `proforma/validaHasta` para guardar una fecha escrita manualmente.
- La acción `proforma/campo` para guardar texto en `condicion`.
- `toViewModel`, `Preview` y los bloques DOCX, que ya reciben y muestran `condicion` y `validaHasta`.
- El autosave de `useProforma`, que ya persiste el objeto `proforma` completo.

## Archivos previstos

| Archivo | Cambio previsto |
|---|---|
| `tests/core.test.js` | Escribir primero las pruebas del checkbox, el recálculo automático y la condición personalizada. |
| `src/state/reducer.js` | Agregar una acción para activar o desactivar `validaHastaManual`; recalcular la fecha al desactivarla. |
| `src/ui/form/DocumentoFields.jsx` | Agregar el checkbox, deshabilitar la fecha en modo automático y cambiar `condicion` de `select` a `input`. |
| `src/styles.css` | Añadir únicamente el estilo mínimo del checkbox si el layout actual no lo presenta correctamente en escritorio, móvil o tema oscuro. |
| `src/core/proforma.js` | Cambiar el contrato JSDoc de `condicion` de la unión cerrada a `string`. No cambiar valores predeterminados. |
| `docs/specs/01-spec-funcionales.md` | Sustituir la condición cerrada por texto editable y documentar el checkbox de edición manual. |
| `docs/specs/02-arquitectura.md` | Actualizar el contrato de `condicion` y la regla de `validaHastaManual`. |
| `docs/specs/03-tareas.md` | Registrar F8 solamente cuando la implementación y la verificación estén completas. |
| `docs/specs/reviews/f8.md` | Registrar los resultados reales de revisión y verificación. |

## Archivos que no deben cambiar

- `src/core/view-model.js`.
- `src/ui/preview/Preview.jsx`.
- `src/docx/blocks.js`.
- `src/docx/styles.js`.
- Cualquier ancho, margen, tabla, tipografía o distribución del DOCX.
- El módulo de clientes, historial, líneas, emisor, logo, PWA e impresión.

Si durante la implementación una prueba exige modificar alguno de estos archivos, se debe detener el trabajo y revisar el alcance antes de continuar.

## Contrato de estado y acciones

El estado existente se conserva:

```text
Proforma.validaHasta       : string
Proforma.validaHastaManual : boolean
Proforma.condicion         : string
```

Acción propuesta:

```text
type:  'proforma/validaHastaManual'
value: boolean
```

Comportamiento del reducer:

| Acción | Resultado |
|---|---|
| `value: true` | Establece `validaHastaManual = true` y conserva `validaHasta`. |
| `value: false` | Establece `validaHastaManual = false` y reemplaza `validaHasta` por emisión + 15 días. |
| Cambio de `fechaEmision` en modo automático | Recalcula `validaHasta` con la regla actual. |
| Cambio de `fechaEmision` en modo manual | Conserva la fecha manual. |
| `proforma/validaHasta` | Actualiza la fecha seleccionada mientras la UI está en modo manual. |
| `proforma/campo` con `name: 'condicion'` | Guarda cualquier texto ingresado por el usuario. |

## Plan TDD

### 1. Escribir pruebas en rojo

Agregar casos unitarios antes de modificar la implementación:

- Activar la edición manual cambia `validaHastaManual` a `true` y conserva la fecha calculada.
- Cambiar **Válida hasta** en modo manual conserva la fecha ingresada.
- Cambiar la fecha de emisión en modo manual no sobrescribe **Válida hasta**.
- Desactivar la edición manual cambia `validaHastaManual` a `false` y recalcula emisión + 15 días.
- Cambiar la fecha de emisión en modo automático sigue recalculando emisión + 15 días.
- Una condición personalizada se conserva en el reducer y llega sin cambios a `toViewModel`.
- **Nueva proforma** restablece `validaHastaManual` a `false` y `condicion` a `Contado`.

Ejecutar `npm test` y confirmar que los casos de la nueva acción fallen por la ausencia de implementación.

### 2. Implementar la lógica mínima

- Agregar al reducer la acción `proforma/validaHastaManual`.
- Usar `addDays(state.proforma.fechaEmision, 15)` únicamente al desactivar el modo manual.
- Mantener el reducer puro: no leer reloj, DOM ni storage.
- No cambiar el cálculo de fechas existente ni crear un helper adicional si no se reutiliza.

### 3. Implementar la UI

- Renderizar un checkbox con una etiqueta visible, por ejemplo **Editar Válida hasta**.
- Enviar su estado `checked` como booleano en la acción propuesta.
- Aplicar `disabled={!proforma.validaHastaManual}` al campo de fecha.
- Mantener el `label` de **Válida hasta** y la navegación por teclado.
- El estado deshabilitado debe ser visualmente reconocible en temas claro y oscuro.
- Reemplazar el `select` de **Condición de venta** por el `input` predeterminado de `Field`.
- Mantener `id`, `name`, `label`, `value` y `onChange` para conservar accesibilidad y persistencia.

### 4. Actualizar contratos y documentación

- Cambiar `condicion: 'Contado'|'Crédito'` por `condicion: string` en JSDoc y arquitectura.
- Documentar que el valor predeterminado sigue siendo `Contado`, aunque el usuario puede reemplazarlo.
- Documentar que desmarcar el checkbox descarta la fecha manual y restaura el cálculo automático.
- No marcar F8 como completa hasta finalizar todas las verificaciones.

## Matriz de trazabilidad

| Criterio | Implementación prevista | Verificación |
|---|---|---|
| CA-01 | Checkbox + `disabled` en `DocumentoFields` | Activar con mouse y teclado; editar fecha. |
| CA-02 | Regla existente de `proforma/campo` | Cambiar emisión con checkbox desmarcado. |
| CA-03 | Nueva acción del reducer | Editar fecha, desmarcar y comprobar emisión + 15 días. |
| CA-04 | `Field` de texto para `condicion` | Escribir un valor fuera de Contado/Crédito y recargar. |
| CA-05 | Flujo existente `toViewModel` → Preview/DOCX | Comparar vista previa y DOCX con el texto personalizado. |
| CA-06 | Integración de ambos controles | Completar el flujo combinado sin afectar otros campos. |

## Orden de implementación

1. Crear la rama de trabajo autorizada y confirmar un árbol limpio o identificar cambios ajenos.
2. Agregar las pruebas del reducer y del view-model; ejecutarlas en rojo.
3. Implementar la acción de activación/desactivación en el reducer; ejecutar pruebas en verde.
4. Agregar el checkbox y convertir **Condición de venta** en campo de texto.
5. Aplicar solo el CSS indispensable para accesibilidad y responsive.
6. Actualizar contratos y documentos fuente de verdad.
7. Ejecutar la verificación completa y registrar resultados reales en `reviews/f8.md`.
8. Entregar para revisión `cleanCode` y posteriormente `pr-review`.

## Verificación funcional en navegador

Ejecutar `npm run dev` y comprobar:

- Estado inicial: checkbox desmarcado, fecha deshabilitada y calculada a 15 días.
- El cambio de emisión actualiza **Válida hasta** cuando el checkbox está desmarcado.
- Marcar el checkbox habilita la fecha y conserva el valor actual.
- La fecha manual persiste tras el autosave y una recarga.
- Desmarcar el checkbox restaura inmediatamente emisión + 15 días y ese estado persiste.
- **Nueva proforma** deja el checkbox desmarcado y condición `Contado`.
- **Condición de venta** acepta texto libre, espacios y caracteres en español.
- El texto personalizado aparece igual en vista previa y DOCX.
- Navegación y activación mediante teclado, foco visible y etiqueta accesible.
- Presentación correcta en ancho móvil y en temas claro y oscuro.
- Los demás campos del formulario, clientes, historial, impresión y descarga continúan funcionando.

## Verificación técnica

Al finalizar la implementación ejecutar:

```bash
npm test
npm run build
npm run embed-logo
npm run test-docx
git diff --check
```

- Comparar el DOCX con el formato anterior: solo deben cambiar los valores que el usuario editó, no su estructura o presentación.
- Si LibreOffice está instalado, convertir `out/ejemplo.docx` a PDF y confirmar una página.
- Si LibreOffice no está disponible, registrarlo sin afirmar una validación visual no realizada.
- Documentar comandos, resultados y cualquier limitación en `docs/specs/reviews/f8.md`.

## Riesgos y controles

- **Pérdida inesperada de la fecha manual:** desmarcar el checkbox recalcula la fecha por definición; la etiqueta y el estado visual deben hacer clara esta acción.
- **Regresión en fechas:** cubrir los dos modos y su transición con pruebas puras del reducer.
- **Borradores existentes:** `validaHastaManual` y `condicion` ya existen y mantienen sus tipos, por lo que no se requiere migración de storage.
- **Texto largo en condición:** verificarlo en vista previa y DOCX sin modificar anchos ni estilos; no introducir truncado o rediseño fuera de alcance.
- **Cambio accidental del documento:** excluir `src/docx/*` y comparar la salida generada durante la verificación.
