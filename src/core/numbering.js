/** @typedef {import('./proforma.js').Counter} Counter */

/** (2026, 1) → "PROF-2026-001"; sin tope de dígitos. */
export function formatNumero(year, seq) {
  return `PROF-${year}-${String(seq).padStart(3, '0')}`;
}

/** Siguiente consecutivo; reinicia en 1 al cambiar de año. @returns {Counter} */
export function nextCounter(counter, year) {
  return year === counter.year ? { year, seq: counter.seq + 1 } : { year, seq: 1 };
}
