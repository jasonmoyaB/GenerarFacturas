import { useEffect, useReducer, useState } from 'react';
import logoDefault from '../../js/logo-data.js';
import { addDays, todayISO } from '../core/dates.js';
import { EJEMPLO, EMISOR_DEFAULT } from '../core/defaults.js';
import { load, remove, save } from '../platform/storage.js';
import { reducer } from './reducer.js';
import { validClientes, validCounter, validEmisor, validHistory, validLogo, validProforma } from './validacion.js';

const COUNTER_INICIAL = { year: 2026, seq: 1 };

function initialState() {
  const hoy = todayISO();
  const draft = load('draft', null);
  const storedEmisor = load('emisor', null);
  const storedCounter = load('counter', null);
  const storedLogo = load('logo', null);
  const example = { ...EJEMPLO, fechaEmision: hoy, validaHasta: addDays(hoy, 15) };
  return {
    // Un borrador anterior al módulo de clientes no trae clienteId (RC-09).
    proforma: validProforma(draft) ? { ...draft, clienteId: draft.clienteId ?? null } : example,
    emisor: validEmisor(storedEmisor) ? storedEmisor : EMISOR_DEFAULT,
    counter: validCounter(storedCounter) ? storedCounter : COUNTER_INICIAL,
    logo: validLogo(storedLogo) ? storedLogo : logoDefault,
    logoCustom: validLogo(storedLogo),
    history: validHistory(load('history', [])),
    clientes: validClientes(load('clientes', [])),
    errors: {},
  };
}

export function useProforma() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  // Fuera del reducer: es el resultado de un efecto, no del estado de la proforma (RC-15).
  const [guardadoOk, setGuardadoOk] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const resultados = [
        save('draft', state.proforma),
        save('emisor', state.emisor),
        save('counter', state.counter),
        save('history', state.history),
        save('clientes', state.clientes),
        state.logoCustom ? save('logo', state.logo) : remove('logo'),
      ];
      setGuardadoOk(resultados.every(Boolean));
    }, 400);
    return () => clearTimeout(timer);
  }, [state.proforma, state.emisor, state.counter, state.logo, state.logoCustom, state.history, state.clientes]);

  return { state, dispatch, logoDefault, guardadoOk };
}
