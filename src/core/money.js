// Dinero en céntimos enteros (A5): nunca se opera con colones en float.

// de-DE agrupa con punto también números de 4 dígitos (es-ES no: "1000,00").
const MONTO = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CANTIDAD = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

/** "1,5" | "1.5" → 1.5. Un solo separador decimal, sin miles; inválido → NaN. */
export function parseDecimal(str) {
  const s = String(str ?? '').trim();
  return /^-?\d+(?:[.,]\d+)?$/.test(s) ? Number(s.replace(',', '.')) : NaN;
}

/** Texto del input → céntimos enteros; NaN si inválido. */
export function toCents(str) {
  return Math.round(parseDecimal(str) * 100);
}

/** 1800000 → "18.000,00" */
export function formatAmount(cents) {
  return MONTO.format(cents / 100);
}

/** 30000000 → "₡300.000,00" */
export function formatTotal(cents) {
  return `₡${formatAmount(cents)}`;
}

/** "1.50" → "1,5"; texto inválido se devuelve tal cual (vista previa mientras se escribe). */
export function formatCantidad(str) {
  const n = parseDecimal(str);
  return Number.isNaN(n) ? String(str ?? '').trim() : CANTIDAD.format(n);
}
