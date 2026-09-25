import { addDays } from '../core/dates.js';
import { lineaVacia, nuevaProforma } from '../core/proforma.js';
import { formatNumero, nextCounter } from '../core/numbering.js';

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
    case 'emisor/campo':
      return { ...state, emisor: { ...state.emisor, [action.name]: action.value } };
    case 'cliente/campo':
      return { ...state, proforma: {
        ...state.proforma,
        cliente: { ...state.proforma.cliente, [action.name]: action.value },
      } };
    case 'linea/campo':
      return { ...state, errors: Object.fromEntries(Object.entries(state.errors).filter(([key]) => key !== `lineas.${action.id}.${action.name}`)), proforma: {
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
    case 'historial/restaurar':
      return { ...state, proforma: action.record.proforma, emisor: action.record.emisor, errors: {} };
    case 'historial/eliminar':
      return { ...state, history: state.history.filter((item) => item.id !== action.id) };
    case 'historial/limpiar':
      return { ...state, history: [] };
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
