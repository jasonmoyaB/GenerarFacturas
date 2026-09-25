import { useEffect, useReducer } from 'react';
import logoDefault from '../../js/logo-data.js';
import { addDays, todayISO } from '../core/dates.js';
import { EJEMPLO, EMISOR_DEFAULT } from '../core/defaults.js';
import { load, remove, save } from '../platform/storage.js';
import { reducer } from './reducer.js';

const COUNTER_INICIAL = { year: 2026, seq: 1 };

const strings = (value, keys) => value && keys.every((key) => typeof value[key] === 'string');

function validEmisor(value) {
  return strings(value, ['nombre', 'cedula', 'ciudad', 'direccion', 'telefono', 'correo', 'actividad']);
}

function validProforma(value) {
  return strings(value, ['numero', 'fechaEmision', 'validaHasta', 'condicion', 'actividad', 'comentario', 'incluye', 'noIncluye'])
    && typeof value.validaHastaManual === 'boolean'
    && strings(value.cliente, ['nombre', 'cedulaJuridica', 'contacto', 'telefono', 'correo', 'direccion'])
    && Array.isArray(value.lineas)
    && value.lineas.every((linea) => strings(linea, ['id', 'titulo', 'descripcion', 'cantidad', 'precio']));
}

function validCounter(value) {
  return value && Number.isInteger(value.year) && Number.isInteger(value.seq) && value.seq >= 0;
}

function validLogo(logo) {
  return logo
    && typeof logo.dataUrl === 'string'
    && logo.dataUrl.startsWith('data:image/png;base64,')
    && Number.isFinite(logo.width) && logo.width > 0
    && Number.isFinite(logo.height) && logo.height > 0;
}

function validHistory(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((record) => (
    record && typeof record.id === 'string' && typeof record.savedAt === 'string'
    && !Number.isNaN(Date.parse(record.savedAt))
    && validProforma(record.proforma) && validEmisor(record.emisor)
  )).slice(0, 50);
}

function initialState() {
  const hoy = todayISO();
  const draft = load('draft', null);
  const storedEmisor = load('emisor', null);
  const storedCounter = load('counter', null);
  const storedLogo = load('logo', null);
  const example = { ...EJEMPLO, fechaEmision: hoy, validaHasta: addDays(hoy, 15) };
  return {
    proforma: validProforma(draft) ? draft : example,
    emisor: validEmisor(storedEmisor) ? storedEmisor : EMISOR_DEFAULT,
    counter: validCounter(storedCounter) ? storedCounter : COUNTER_INICIAL,
    logo: validLogo(storedLogo) ? storedLogo : logoDefault,
    logoCustom: validLogo(storedLogo),
    history: validHistory(load('history', [])),
    errors: {},
  };
}

export function useProforma() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    const timer = setTimeout(() => {
      save('draft', state.proforma);
      save('emisor', state.emisor);
      save('counter', state.counter);
      save('history', state.history);
      if (state.logoCustom) save('logo', state.logo);
      else remove('logo');
    }, 400);
    return () => clearTimeout(timer);
  }, [state.proforma, state.emisor, state.counter, state.logo, state.logoCustom, state.history]);

  return { state, dispatch, logoDefault };
}
