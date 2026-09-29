import { addDays } from '../core/dates.js';
import { lineaVacia, nuevaProforma } from '../core/proforma.js';
import { formatNumero, nextCounter } from '../core/numbering.js';
import { datosCliente } from '../core/clientes.js';

/** Errores sin los que cumplen `quitar(clave)`. */
const sinErrores = (errors, quitar) => Object.fromEntries(Object.entries(errors).filter(([key]) => !quitar(key)));

/** Reemplaza el cliente con el mismo id o lo agrega al final. */
const conCliente = (clientes, cliente) => (clientes.some((c) => c.id === cliente.id)
  ? clientes.map((c) => (c.id === cliente.id ? cliente : c))
  : [...clientes, cliente]);

export function reducer(state, action) {
  switch (action.type) {
    case 'proforma/campo': {
      const proforma = { ...state.proforma, [action.name]: action.value };
      if (action.name === 'fechaEmision' && !state.proforma.validaHastaManual) {
        proforma.validaHasta = addDays(action.value, 15);
      }
      return { ...state, proforma };
    }
    case 'proforma/validaHasta':
      return { ...state, proforma: { ...state.proforma, validaHasta: action.value, validaHastaManual: true } };
    case 'proforma/validaHastaManual':
      return { ...state, proforma: {
        ...state.proforma,
        validaHastaManual: action.value,
        validaHasta: action.value ? state.proforma.validaHasta : addDays(state.proforma.fechaEmision, 15),
      } };
    case 'emisor/campo':
      return { ...state, emisor: { ...state.emisor, [action.name]: action.value } };
    case 'cliente/campo':
      return { ...state, errors: sinErrores(state.errors, (key) => key === `cliente.${action.name}`), proforma: {
        ...state.proforma,
        cliente: { ...state.proforma.cliente, [action.name]: action.value },
      } };
    case 'linea/campo':
      return { ...state, errors: sinErrores(state.errors, (key) => key === `lineas.${action.id}.${action.name}`), proforma: {
        ...state.proforma,
        lineas: state.proforma.lineas.map((linea) => (
          linea.id === action.id ? { ...linea, [action.name]: action.value } : linea
        )),
      } };
    case 'linea/agregar':
      return { ...state, proforma: { ...state.proforma, lineas: [...state.proforma.lineas, lineaVacia()] } };
    case 'linea/eliminar':
      return { ...state, proforma: {
        ...state.proforma,
        lineas: state.proforma.lineas.filter((linea) => linea.id !== action.id),
      } };
    case 'logo/establecer':
      return { ...state, logo: action.logo, logoCustom: true };
    case 'logo/restaurar':
      return { ...state, logo: action.logo, logoCustom: false };
    case 'errores':
      return { ...state, errors: action.errors };
    case 'historial/guardar': {
      const previous = state.history.find((item) => item.proforma.numero === state.proforma.numero);
      const record = {
        id: previous?.id ?? action.id,
        savedAt: action.savedAt,
        proforma: state.proforma,
        emisor: state.emisor,
      };
      return {
        ...state,
        history: [record, ...state.history.filter((item) => item.id !== record.id)].slice(0, 50),
      };
    }
    case 'historial/restaurar': {
      // Registros anteriores al módulo de clientes no traen clienteId (RC-09).
      const { proforma } = action.record;
      return { ...state, proforma: { ...proforma, clienteId: proforma.clienteId ?? null }, emisor: action.record.emisor, errors: {} };
    }
    case 'historial/eliminar':
      return { ...state, history: state.history.filter((item) => item.id !== action.id) };
    case 'historial/limpiar':
      return { ...state, history: [] };
    // Catálogo (spec 002). id y actualizadoEn llegan en la acción (RC-16).
    case 'clientes/guardar': // RC-06: no toca la proforma.
      return { ...state, clientes: conCliente(state.clientes, action.cliente) };
    case 'clientes/eliminar': { // RC-11: desenlaza el borrador y conserva sus datos; el historial no cambia.
      const enlazado = state.proforma.clienteId === action.id;
      return {
        ...state,
        clientes: state.clientes.filter((c) => c.id !== action.id),
        proforma: enlazado ? { ...state.proforma, clienteId: null } : state.proforma,
      };
    }
    case 'proforma/usarCliente': // RC-05: copia, no referencia.
      return {
        ...state,
        errors: sinErrores(state.errors, (key) => key.startsWith('cliente.')),
        proforma: { ...state.proforma, cliente: datosCliente(action.cliente), clienteId: action.cliente.id },
      };
    case 'proforma/guardarCliente': { // RC-08: crea o actualiza según el id que decide la UI.
      const cliente = { ...datosCliente(state.proforma.cliente), id: action.id, actualizadoEn: action.actualizadoEn };
      return {
        ...state,
        clientes: conCliente(state.clientes, cliente),
        errors: sinErrores(state.errors, (key) => key.startsWith('cliente.')),
        proforma: { ...state.proforma, clienteId: action.id },
      };
    }
    case 'nueva': {
      const counter = nextCounter(state.counter, Number(action.hoy.slice(0, 4)));
      const numero = formatNumero(counter.year, counter.seq);
      return {
        ...state,
        counter,
        errors: {},
        proforma: nuevaProforma(state.proforma, { numero, hoy: action.hoy, emisor: state.emisor }),
      };
    }
    default:
      return state;
  }
}
