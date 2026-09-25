// Contratos del dominio (02 §4) y reglas de negocio puras (02 §5).
import { parseDecimal, toCents } from './money.js';
import { addDays } from './dates.js';
import { CLIENTE_VACIO, COMENTARIO_DEFAULT } from './defaults.js';

/** @typedef {{ nombre: string, cedula: string, ciudad: string, direccion: string, telefono: string, correo: string, actividad: string }} Emisor */
/** @typedef {{ nombre: string, cedulaJuridica: string, contacto: string, telefono: string, correo: string, direccion: string }} Cliente */
/** @typedef {{ id: string, titulo: string, descripcion: string, cantidad: string, precio: string }} Linea
 *  cantidad/precio = texto crudo del input ("1,5", "18000"); se convierten al calcular. */
/** @typedef {{
 *   numero: string, fechaEmision: string, validaHasta: string, validaHastaManual: boolean,
 *   condicion: 'Contado'|'Crédito', actividad: string,
 *   cliente: Cliente, lineas: Linea[],
 *   comentario: string, incluye: string, noIncluye: string
 * }} Proforma */
/** @typedef {{ dataUrl: string, width: number, height: number }} Logo  dataUrl siempre "data:image/png;base64,…" */
/** @typedef {{ year: number, seq: number }} Counter  último consecutivo emitido */
/** @typedef {{ ok: boolean, errors: Record<string, string> }} Validation  clave "lineas.<id>.<campo>" o "lineas" */

const DIAS_VALIDEZ = 15;
// A13: la cantidad admite hasta 2 decimales.
const MAX_2_DECIMALES = /^-?\d+(?:[.,]\d{1,2})?$/;

/** @returns {Linea} */
export function lineaVacia() {
  return { id: crypto.randomUUID(), titulo: '', descripcion: '', cantidad: '1', precio: '' };
}

/** Proforma en blanco con fechas de hoy. @returns {Proforma} */
export function createProforma({ numero, hoy, emisor }) {
  return {
    numero,
    fechaEmision: hoy,
    validaHasta: addDays(hoy, DIAS_VALIDEZ),
    validaHastaManual: false,
    condicion: 'Contado',
    actividad: emisor.actividad,
    cliente: { ...CLIENTE_VACIO },
    lineas: [lineaVacia()],
    comentario: COMENTARIO_DEFAULT,
    incluye: '',
    noIncluye: '',
  };
}

/** "Nueva proforma": en blanco, pero conserva los textos que se repiten entre proformas. */
export function nuevaProforma(prev, datos) {
  const { comentario, incluye, noIncluye } = prev;
  return { ...createProforma(datos), comentario, incluye, noIncluye };
}

/** Monto en céntimos; 0 mientras cantidad o precio no sean números. */
export function lineAmount(linea) {
  const monto = Math.round(parseDecimal(linea.cantidad) * toCents(linea.precio));
  return Number.isNaN(monto) ? 0 : monto;
}

/** El total siempre se deriva de las líneas; nunca se guarda. */
export function total(lineas) {
  return lineas.reduce((suma, l) => suma + lineAmount(l), 0);
}

/** Primer error de una línea por campo, o ninguno. */
function erroresLinea(linea) {
  const errores = {};
  const cantidad = parseDecimal(linea.cantidad);
  const precio = parseDecimal(linea.precio);
  if (!linea.titulo.trim()) errores.titulo = 'El título es obligatorio.';
  if (!(cantidad > 0)) errores.cantidad = 'La cantidad debe ser mayor que 0.';
  else if (!MAX_2_DECIMALES.test(linea.cantidad.trim())) errores.cantidad = 'Máximo 2 decimales.';
  if (!linea.precio.trim()) errores.precio = 'El precio es obligatorio.';
  else if (!(precio >= 0)) errores.precio = 'El precio debe ser un número mayor o igual a 0.';
  return errores;
}

/** Validación antes de descargar o imprimir. @returns {Validation} */
export function validate(proforma) {
  const errors = {};
  if (proforma.lineas.length === 0) errors.lineas = 'Agregue al menos una línea.';
  for (const linea of proforma.lineas) {
    for (const [campo, msg] of Object.entries(erroresLinea(linea))) errors[`lineas.${linea.id}.${campo}`] = msg;
  }
  return { ok: Object.keys(errors).length === 0, errors };
}

/** "Café Ñandú S.A." → "Cafe_Nandu_SA"; vacío → "Cliente". */
function nombreSeguro(texto) {
  const limpio = texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .replace(/ +/g, ' ')
    .trim();
  return limpio.replaceAll(' ', '_') || 'Cliente';
}

/** Nombre del .docx: Proforma_<numero>_<cliente>.docx */
export function fileName(proforma) {
  return `Proforma_${proforma.numero}_${nombreSeguro(proforma.cliente.nombre)}.docx`;
}
