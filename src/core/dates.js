// Fechas como ISO "YYYY-MM-DD" en hora local (A15).

const pad = (n) => String(n).padStart(2, '0');

/** Hoy en hora local; toISOString() daría mañana en Costa Rica después de las 18:00. */
export function todayISO(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Suma días en UTC para que no afecten horarios de verano ni la zona local. */
export function addDays(iso, n) {
  if (!iso) return ''; // un input date vaciado entrega ""
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** "2026-09-25" → "25/09/2026"; vacío → "". */
export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
