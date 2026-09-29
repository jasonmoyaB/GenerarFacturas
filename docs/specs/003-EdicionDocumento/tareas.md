# 003 · Tareas — Edición del apartado Documento

Spec: `spec.md` · Plan: `plan.md` · Fase: **F8 Edición de Documento** · Rama: `main`.

Usar `[x]` únicamente cuando la tarea y su verificación estén completas.

- [x] **F8-01 — Crear pruebas TDD:** agregar pruebas para activar y desactivar la edición manual de **Válida hasta**, conservar la fecha manual, recalcular emisión + 15 días, aceptar una condición personalizada y restablecer los valores con **Nueva proforma**. Ejecutar `npm test` y comprobar primero el fallo esperado.

- [x] **F8-02 — Implementar las reglas de estado:** agregar la acción `proforma/validaHastaManual` al reducer; al activarla debe conservar la fecha y al desactivarla debe recalcular emisión + 15 días. Mantener el reducer puro y ejecutar las pruebas hasta obtener verde.

- [x] **F8-03 — Implementar la interfaz:** agregar el checkbox accesible, habilitar o deshabilitar el campo **Válida hasta** según su estado y convertir **Condición de venta** en un campo de texto libre. Aplicar únicamente los estilos mínimos necesarios.

- [ ] **F8-04 — Actualizar contratos y documentación:** cambiar `Proforma.condicion` a `string` en JSDoc, actualizar `01-spec-funcionales.md` y `02-arquitectura.md`, y registrar F8 en `03-tareas.md` sin modificar el formato del DOCX.

- [ ] **F8-05 — Verificar y cerrar:** comprobar en navegador fechas, condición personalizada, persistencia, Nueva proforma, accesibilidad, móvil y temas; verificar vista previa y DOCX sin cambios de formato; ejecutar `npm test`, `npm run build`, `npm run embed-logo`, `npm run test-docx` y `git diff --check`; registrar los resultados reales en `docs/specs/reviews/f8.md`.
