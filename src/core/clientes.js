// Catálogo de clientes (spec 002): validación, búsqueda y orden. Puro.
import { CLIENTE_VACIO } from './defaults.js';

/** @typedef {import('./proforma.js').Cliente & { id: string, actualizadoEn: string }} ClienteGuardado  RC-01 */

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "Café Ñandú" → "Cafe Nandu". */
export function sinTildes(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/** Clave de búsqueda: sin tildes, minúsculas y sin espacios en los extremos. */
function normalizar(texto) {
  return sinTildes(texto).toLowerCase().trim();
}

/** RC-03: "3-101-123456" y "3101123456" son la misma cédula. */
const claveCedula = (cedula) => cedula.replace(/[\s-]/g, '').toLowerCase();

/** Solo los 6 campos de `Cliente`; descarta id, actualizadoEn o claves extrañas. @returns {import('./proforma.js').Cliente} */
export function datosCliente(cliente) {
  return Object.fromEntries(Object.keys(CLIENTE_VACIO).map((campo) => [campo, cliente[campo]]));
}

/**
 * RC-02 a RC-04. `id` es el del cliente que se edita, para no compararlo consigo mismo.
 * @returns {import('./proforma.js').Validation} claves "nombre", "cedulaJuridica", "correo"
 */
export function validarCliente(cliente, clientes, id = null) {
  const errors = {};
  if (!cliente.nombre.trim()) errors.nombre = 'El nombre es obligatorio.';
  const cedula = claveCedula(cliente.cedulaJuridica);
  if (cedula && clientes.some((c) => c.id !== id && claveCedula(c.cedulaJuridica) === cedula)) {
    errors.cedulaJuridica = 'La cédula jurídica ya está registrada.';
  }
  const correo = cliente.correo.trim();
  if (correo && !CORREO.test(correo)) errors.correo = 'Escriba un correo válido, por ejemplo nombre@dominio.com.';
  return { ok: Object.keys(errors).length === 0, errors };
}

/** CA-07: busca por nombre, cédula o contacto sin distinguir mayúsculas ni tildes. */
export function buscarClientes(clientes, texto) {
  const buscado = normalizar(texto);
  if (!buscado) return clientes;
  return clientes.filter((c) => [c.nombre, c.cedulaJuridica, c.contacto].some((v) => normalizar(v).includes(buscado)));
}

/** RC-14: copia ordenada por nombre (A→Z, español). */
export function ordenarClientes(clientes) {
  return [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}
