# TAREA
Crea en este repositorio una app web estática PWA (sin framework ni build obligatorio) que
funcione como generador de facturas proforma: ingreso datos del cliente y líneas de
servicio, y la app genera un .docx descargable con el formato exacto de abajo.
Antes de escribir código, muéstrame un plan corto (estructura de archivos y funciones)
y espera mi aprobación.
# STACK DE DESARROLLO
react + vite 
# ESPECIFICACIONES FUNCIONALES
1. Formulario:
   a) Documento: número PROF-AAAA-NNN autogenerado (consecutivo en localStorage,
      editable), fecha de emisión (hoy por defecto) y "Válida hasta" (+15 días).
      Un checkbox activa su edición manual; al desactivarlo se restaura de inmediato
      emisión + 15 días. Condición de venta: texto libre (Contado por defecto).
      Actividad (lo que se hará): campo por proforma; si queda vacío usa la
      actividad del emisor. "Nueva proforma" lo reinicia a la del emisor.
   b) Emisor (guardado en localStorage, sección plegable): nombre, cédula, ciudad,
      dirección, teléfono, correo, actividad. Defaults: Jason Moya Brenes |
      Paraíso, Cartago, Costa Rica | jason.moyabrenes@gmail.com |
      Desarrollo y organización de software.
   c) Logo: por defecto el de js/logo-data.js; opción de subir otro, convertirlo con
      canvas a negro puro (umbral de luminancia, fondo blanco, máx. 600 px) y guardarlo.
   d) Cliente: nombre/empresa, cédula jurídica, contacto, teléfono, correo, dirección.
      Vacíos se imprimen como "[____]".
   e) Líneas dinámicas: agregar/eliminar; título, descripción, cantidad (1 por
      defecto), precio unitario; monto = cant × precio; código SRV-001… renumerado.
   f) Textareas "Incluye" y "No incluye" (una viñeta por línea).
   g) Comentario (default: "Gracias por la confianza. El servicio contempla lo siguiente:").
2. Vista previa en vivo a la derecha (debajo en móvil), hoja carta escalada al ancho.
3. Total visible en la barra superior y en el formulario.
4. "Descargar .docx" → Proforma_PROF-AAAA-NNN_[Cliente].docx (cliente sin tildes ni
   caracteres especiales, espacios → _). Descarga con Blob + <a download>.
5. "Imprimir / PDF" con window.print() y CSS de impresión que muestre solo la hoja.
6. "Nueva proforma": siguiente consecutivo, limpia cliente y líneas, conserva emisor,
   logo, comentario e incluye/no incluye.
7. Guardar borrador automáticamente (debounce 400 ms) para no perder datos al recargar.
8. Historial local: registrar al descargar o imprimir una proforma válida, actualizar por
   número de documento, conservar las 50 más recientes y permitir restaurar o eliminar.

# ESPECIFICACIONES DEL DOCUMENTO (exacto)
- Carta 12240 × 15840 DXA, márgenes 1440, Arial, base 8 pt, solo blanco y negro.
- Estilo por defecto de párrafo: spacing after 0, line 264, lineRule "auto"
  (explícito: sin lineRule, LibreOffice recorta la imagen del logo).
- Encabezado: tabla sin bordes 2300 | 3900 | 3160.
  · Izq.: logo ~140 px de ancho (alto proporcional, máx. 90), centrado vertical.
  · Centro: nombre (negrita), "Céd.: …", CIUDAD en mayúsculas y negrita, "Tel.: …",
    correo, dirección, "Actividad: …" en negrita.
  · Der.: "FACTURA PROFORMA" (negrita 11 pt, derecha), número en negrita, y pares con
    tabulador derecho: Fecha, Válida hasta, Moneda (₡ Colón), Condición, Emitida por.
- Cliente: "Cliente:" negrita con borde inferior fino; tabla 1300|3900|1300|2860:
  Nombre/E-mail · Céd. jurídica/Contacto · Teléfono/Vencimiento · Dirección (colspan 3).
- Detalle: Código 1000 | Descripción 5000 | Cant. 700 | Precio U. 1330 | Monto 1330.
  Solo el encabezado lleva línea arriba y abajo; título en MAYÚSCULAS negrita y
  descripción en 7,5 pt; números a la derecha; cantSplit en filas y tableHeader.
- Comentario + "Incluye:" / "No incluye:" con viñetas de numbering de docx
  (nunca el carácter "•" escrito en el texto).
- Pie: tabla sin bordes 3800|1800|3760 con 2 filas. Cada firma va en su propia celda
  (si van en la misma, Word fusiona los bordes de párrafo y se pierde la segunda
  línea): "[nombre del emisor]" y "Aprobado por el cliente". A la derecha, en la
  primera fila: línea superior + "Total:" y monto en negrita con tabulador derecho.
  Debajo, cursiva centrada: "Documento de cotización. Precios válidos hasta el [fecha]."
- Cierre: "Contacto: [correo]" centrado (correo en negrita) y fecha a la derecha.
- Montos: 18.000,00 en tabla y ₡300.000,00 en total. Calcular en céntimos (enteros).
- UNA sola fila de total. Sin subtotal, IVA ni impuestos. Nada de factura electrónica
  de Hacienda (QR, Clave, Consecutivo, Cabys, resoluciones MH-DGT).

# CRITERIOS DE CALIDAD
- Total siempre calculado desde las líneas; validar antes de descargar/imprimir:
  título obligatorio, cantidad > 0, precio ≥ 0 y no vacío; marcar con aria-invalid.
- Anchos en DXA en columnWidths y en cada celda, tablas con layout fijo.
- Con 8 líneas el documento debe caber en una página.
- UI en español, responsive, tema claro/oscuro con prefers-color-scheme, foco visible.
- Código comentado y funciones pequeñas: una por bloque del documento.
- Verificación obligatoria al terminar:
  1) node scripts/embed-logo.mjs
  2) node scripts/test-docx.mjs → out/ejemplo.docx
  3) Si LibreOffice está instalado: convertir a PDF y confirmar 1 página.

# FORMATO DE RESPUESTA
Precarga la proforma de ejemplo PROF-2026-001 con 8 servicios de organización de
Google Drive que sumen ₡300.000,00. Al final dame: árbol de archivos, comandos para
correrlo (npx serve . o similar) y resultado de la verificación.

# AMPLIACIONES

- Módulo de Clientes (CRUD, búsqueda, elegir y guardar cliente desde la proforma, proformas por cliente): `002-modulo-Clientes/Modulo-Clientes.md`.
