// Validación de lo leído de localStorage (puede estar corrupto o manipulado). Sin React para poder probarlo en Node.
import { datosCliente } from '../core/clientes.js';
import { CLIENTE_VACIO } from '../core/defaults.js';

const strings = (value, keys) => value && keys.every((key) => typeof value[key] === 'string');

const CAMPOS_CLIENTE = Object.keys(CLIENTE_VACIO);

export function validEmisor(value) {
  return strings(value, ['nombre', 'cedula', 'ciudad', 'direccion', 'telefono', 'correo', 'actividad']);
}

/** RC-09 / CA-18: clienteId es opcional; los borradores anteriores al módulo de clientes no lo tienen. */
export function validProforma(value) {
  return strings(value, ['numero', 'fechaEmision', 'validaHasta', 'condicion', 'actividad', 'comentario', 'incluye', 'noIncluye'])
    && typeof value.validaHastaManual === 'boolean'
    && (value.clienteId == null || typeof value.clienteId === 'string')
    && strings(value.cliente, CAMPOS_CLIENTE)
    && Array.isArray(value.lineas)
    && value.lineas.every((linea) => strings(linea, ['id', 'titulo', 'descripcion', 'cantidad', 'precio']));
}

export function validCounter(value) {
  return value && Number.isInteger(value.year) && Number.isInteger(value.seq) && value.seq >= 0;
}

export function validLogo(logo) {
  return logo
    && typeof logo.dataUrl === 'string'
    && logo.dataUrl.startsWith('data:image/png;base64,')
    && Number.isFinite(logo.width) && logo.width > 0
    && Number.isFinite(logo.height) && logo.height > 0;
}

export function validHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((record) => (
    record && typeof record.id === 'string' && typeof record.savedAt === 'string'
    && !Number.isNaN(Date.parse(record.savedAt))
    && validProforma(record.proforma) && validEmisor(record.emisor)
  )).slice(0, 50);
}

/** RC-15 / CA-17: descarta solo los registros inválidos, los id repetidos (se queda el primero) y las claves extrañas. */
export function validClientes(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c) => strings(c, ['id', 'actualizadoEn', ...CAMPOS_CLIENTE]) && c.nombre.trim())
    .filter((c, i, validos) => validos.findIndex((otro) => otro.id === c.id) === i)
    .map((c) => ({ id: c.id, actualizadoEn: c.actualizadoEn, ...datosCliente(c) }));
}
