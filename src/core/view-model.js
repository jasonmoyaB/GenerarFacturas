// Única función que formatea para imprimir (A3): la consumen Preview y el .docx.
import { formatAmount, formatCantidad, formatTotal, toCents } from './money.js';
import { formatDate } from './dates.js';
import { lineAmount, total } from './proforma.js';

/** @typedef {import('./proforma.js').Proforma} Proforma */
/** @typedef {import('./proforma.js').Emisor} Emisor */
/** @typedef {import('./proforma.js').Cliente} Cliente */
/** @typedef {{ codigo: string, titulo: string, descripcion: string, cantidad: string, precio: string, monto: string }} LineaVM */
/** @typedef {{
 *   emisor: Emisor, ciudadUpper: string, actividad: string,
 *   numero: string, fecha: string, validaHasta: string,
 *   moneda: '₡ Colón', condicion: string, emitidaPor: string,
 *   cliente: Cliente, vencimiento: string, lineas: LineaVM[], total: string,
 *   comentario: string, incluye: string[], noIncluye: string[]
 * }} ViewModel */

const VACIO = '[____]';
const LOGO_ANCHO = 140;
const LOGO_ALTO_MAX = 90;

const oVacio = (texto) => texto.trim() || VACIO;

/** Una viñeta por línea no vacía. */
const vinetas = (texto) => texto.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

/** Precio "18.000,00"; vacío mientras el input no sea un número. */
function precioVM(texto) {
  const cents = toCents(texto);
  return Number.isNaN(cents) ? '' : formatAmount(cents);
}

/** @returns {LineaVM} */
function lineaVM(linea, i) {
  return {
    codigo: `SRV-${String(i + 1).padStart(3, '0')}`,
    titulo: linea.titulo.toUpperCase(),
    descripcion: linea.descripcion,
    cantidad: formatCantidad(linea.cantidad),
    precio: precioVM(linea.precio),
    monto: formatAmount(lineAmount(linea)),
  };
}

/** @returns {Cliente} cada campo vacío → "[____]" */
function clienteVM(cliente) {
  return Object.fromEntries(Object.entries(cliente).map(([k, v]) => [k, oVacio(v)]));
}

/** @param {Proforma} p @param {Emisor} emisor @returns {ViewModel} */
export function toViewModel(p, emisor) {
  const validaHasta = formatDate(p.validaHasta);
  return {
    emisor,
    ciudadUpper: emisor.ciudad.toUpperCase(),
    actividad: p.actividad.trim() || emisor.actividad,
    numero: p.numero,
    fecha: formatDate(p.fechaEmision),
    validaHasta,
    moneda: '₡ Colón',
    condicion: p.condicion,
    emitidaPor: emisor.nombre,
    cliente: clienteVM(p.cliente),
    vencimiento: validaHasta, // A11
    lineas: p.lineas.map(lineaVM),
    total: formatTotal(total(p.lineas)),
    comentario: p.comentario,
    incluye: vinetas(p.incluye),
    noIncluye: vinetas(p.noIncluye),
  };
}

/** Tamaño en px del logo: 140 de ancho, alto proporcional con máximo 90. Lo usan docx y Preview. */
export function logoSize({ width, height }) {
  const alto = Math.round((LOGO_ANCHO * height) / width);
  if (alto <= LOGO_ALTO_MAX) return { width: LOGO_ANCHO, height: alto };
  return { width: Math.round((LOGO_ALTO_MAX * width) / height), height: LOGO_ALTO_MAX };
}
