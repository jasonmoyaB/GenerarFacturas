import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDecimal, toCents, formatAmount, formatTotal, formatCantidad } from '../src/core/money.js';
import { todayISO, addDays, formatDate } from '../src/core/dates.js';
import { formatNumero, nextCounter } from '../src/core/numbering.js';
import { createProforma, nuevaProforma, lineAmount, total, validate, fileName } from '../src/core/proforma.js';
import { toViewModel, logoSize } from '../src/core/view-model.js';
import { EMISOR_DEFAULT, EJEMPLO } from '../src/core/defaults.js';
import { reducer } from '../src/state/reducer.js';

const linea = (o) => ({ id: 'x', titulo: 'Algo', descripcion: '', cantidad: '1', precio: '100', ...o });

test('money: parseo y formatos', () => {
  assert.equal(parseDecimal('1,5'), 1.5);
  assert.equal(parseDecimal('1.5'), 1.5);
  assert.ok(Number.isNaN(parseDecimal('')));
  assert.ok(Number.isNaN(parseDecimal('1.000,5')));
  assert.equal(toCents('1,5'), 150);
  assert.equal(toCents('18000'), 1800000);
  assert.equal(formatAmount(1800000), '18.000,00');
  assert.equal(formatAmount(100000), '1.000,00');
  assert.equal(formatTotal(30000000), '₡300.000,00');
  assert.equal(formatCantidad('1.50'), '1,5');
  assert.equal(formatCantidad('2'), '2');
});

test('dates: hoy local, sumar días, formato', () => {
  assert.equal(todayISO(new Date(2026, 8, 25, 23, 30)), '2026-09-25');
  assert.equal(addDays('2026-09-25', 15), '2026-10-10');
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-12-20', 15), '2027-01-04');
  assert.equal(addDays('', 15), '');
  assert.equal(formatDate('2026-09-25'), '25/09/2026');
});

test('numbering: número y consecutivo', () => {
  assert.equal(formatNumero(2026, 1), 'PROF-2026-001');
  assert.equal(formatNumero(2026, 1234), 'PROF-2026-1234');
  assert.deepEqual(nextCounter({ year: 2026, seq: 7 }, 2026), { year: 2026, seq: 8 });
  assert.deepEqual(nextCounter({ year: 2026, seq: 7 }, 2027), { year: 2027, seq: 1 });
});

test('proforma: montos y total del ejemplo', () => {
  assert.equal(lineAmount(linea({ cantidad: '1,5', precio: '18000' })), 2700000);
  assert.equal(lineAmount(linea({ cantidad: '', precio: '18000' })), 0);
  assert.equal(total(EJEMPLO.lineas), 30000000);
  assert.equal(EJEMPLO.lineas.length, 8);
});

test('proforma: crear y nueva', () => {
  const p = createProforma({ numero: 'PROF-2026-002', hoy: '2026-09-25', emisor: EMISOR_DEFAULT });
  assert.equal(p.validaHasta, '2026-10-10');
  assert.equal(p.actividad, EMISOR_DEFAULT.actividad);
  assert.equal(p.lineas.length, 1);
  assert.equal(p.lineas[0].cantidad, '1');
  const prev = { ...EJEMPLO, comentario: 'c', incluye: 'a', noIncluye: 'b', condicion: 'Crédito' };
  const n = nuevaProforma(prev, { numero: 'PROF-2026-003', hoy: '2026-09-25', emisor: EMISOR_DEFAULT });
  assert.deepEqual([n.comentario, n.incluye, n.noIncluye, n.condicion], ['c', 'a', 'b', 'Contado']);
  assert.equal(n.cliente.nombre, '');
  assert.equal(n.lineas.length, 1);
});

test('validate: reglas de líneas', () => {
  const con = (l) => validate({ ...EJEMPLO, lineas: [linea(l)] });
  assert.equal(validate(EJEMPLO).ok, true);
  assert.ok(con({ titulo: '  ' }).errors['lineas.x.titulo']);
  assert.ok(con({ cantidad: '0' }).errors['lineas.x.cantidad']);
  assert.ok(con({ cantidad: '1,555' }).errors['lineas.x.cantidad']);
  assert.ok(con({ precio: '' }).errors['lineas.x.precio']);
  assert.ok(con({ precio: '-1' }).errors['lineas.x.precio']);
  assert.ok(con({ precio: '18.000' }).errors['lineas.x.precio']);
  assert.ok(con({ precio: '1,999' }).errors['lineas.x.precio']);
  assert.equal(con({ precio: '0' }).ok, true);
  assert.ok(validate({ ...EJEMPLO, lineas: [] }).errors.lineas);
});

test('fileName: limpia cliente', () => {
  const p = (nombre) => ({ ...EJEMPLO, numero: 'PROF-2026-001', cliente: { ...EJEMPLO.cliente, nombre } });
  assert.equal(fileName(p('Café Ñandú S.A.')), 'Proforma_PROF-2026-001_Cafe_Nandu_SA.docx');
  assert.equal(fileName(p('  Luz   & Sol ')), 'Proforma_PROF-2026-001_Luz_Sol.docx');
  assert.equal(fileName(p('')), 'Proforma_PROF-2026-001_Cliente.docx');
});

test('logoSize: ancho y alto limitantes', () => {
  assert.deepEqual(logoSize({ width: 600, height: 300 }), { width: 140, height: 70 });
  assert.deepEqual(logoSize({ width: 300, height: 600 }), { width: 45, height: 90 });
});

test('toViewModel: textos listos para imprimir', () => {
  const vm = toViewModel(
    { ...EJEMPLO, actividad: ' ', fechaEmision: '2026-09-25', validaHasta: '2026-10-10', incluye: 'a\n\n b \r\nc' },
    EMISOR_DEFAULT,
  );
  assert.equal(vm.actividad, EMISOR_DEFAULT.actividad);
  assert.equal(vm.fecha, '25/09/2026');
  assert.equal(vm.vencimiento, '10/10/2026');
  assert.equal(vm.total, '₡300.000,00');
  assert.equal(vm.lineas[0].codigo, 'SRV-001');
  assert.equal(vm.lineas[7].codigo, 'SRV-008');
  assert.equal(vm.lineas[0].titulo, EJEMPLO.lineas[0].titulo.toUpperCase());
  assert.deepEqual(vm.incluye, ['a', 'b', 'c']);
  const vacio = toViewModel({ ...EJEMPLO, cliente: { ...EJEMPLO.cliente, contacto: ' ' } }, EMISOR_DEFAULT);
  assert.equal(vacio.cliente.contacto, '[____]');
});

test('reducer: fechas, edición y nueva proforma', () => {
  const base = {
    proforma: { ...EJEMPLO, fechaEmision: '2026-09-25', validaHasta: '2026-10-10' },
    emisor: EMISOR_DEFAULT,
    counter: { year: 2026, seq: 1 },
    logo: null,
    logoCustom: false,
    history: [],
    errors: { viejo: 'error' },
  };
  const fecha = reducer(base, { type: 'proforma/campo', name: 'fechaEmision', value: '2026-10-01' });
  assert.equal(fecha.proforma.validaHasta, '2026-10-16');
  const manual = reducer(fecha, { type: 'proforma/validaHasta', value: '2026-12-01' });
  const sinCambio = reducer(manual, { type: 'proforma/campo', name: 'fechaEmision', value: '2026-11-01' });
  assert.equal(sinCambio.proforma.validaHasta, '2026-12-01');
  const nueva = reducer(sinCambio, { type: 'nueva', hoy: '2026-11-02' });
  assert.equal(nueva.proforma.numero, 'PROF-2026-002');
  assert.equal(nueva.proforma.validaHastaManual, false);
  assert.equal(nueva.proforma.cliente.nombre, '');
  assert.deepEqual(nueva.errors, {});
});

test('reducer: historial guarda, actualiza, restaura y elimina', () => {
  const base = {
    proforma: EJEMPLO,
    emisor: EMISOR_DEFAULT,
    counter: { year: 2026, seq: 1 },
    logo: null,
    logoCustom: false,
    history: [],
    errors: {},
  };
  const saved = reducer(base, { type: 'historial/guardar', id: 'h1', savedAt: '2026-09-25T10:00:00Z' });
  assert.equal(saved.history.length, 1);
  assert.equal(saved.history[0].proforma.numero, 'PROF-2026-001');
  const changed = { ...saved, proforma: { ...EJEMPLO, cliente: { ...EJEMPLO.cliente, nombre: 'Nuevo cliente' } } };
  const updated = reducer(changed, { type: 'historial/guardar', id: 'h2', savedAt: '2026-09-25T11:00:00Z' });
  assert.equal(updated.history.length, 1);
  assert.equal(updated.history[0].id, 'h1');
  assert.equal(updated.history[0].proforma.cliente.nombre, 'Nuevo cliente');
  const restored = reducer({ ...updated, proforma: { ...EJEMPLO, numero: 'OTRA' } }, { type: 'historial/restaurar', record: updated.history[0] });
  assert.equal(restored.proforma.numero, 'PROF-2026-001');
  assert.equal(reducer(restored, { type: 'historial/eliminar', id: 'h1' }).history.length, 0);
});
