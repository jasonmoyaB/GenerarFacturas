import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDecimal, toCents, formatAmount, formatTotal, formatCantidad } from '../src/core/money.js';
import { todayISO, addDays, formatDate } from '../src/core/dates.js';
import { formatNumero, nextCounter } from '../src/core/numbering.js';
import { createProforma, nuevaProforma, lineAmount, total, validate, fileName } from '../src/core/proforma.js';
import { toViewModel, logoSize } from '../src/core/view-model.js';
import { EMISOR_DEFAULT, EJEMPLO } from '../src/core/defaults.js';
import { reducer } from '../src/state/reducer.js';
import { validarCliente, buscarClientes, ordenarClientes } from '../src/core/clientes.js';
import { validProforma, validHistory, validClientes } from '../src/state/validacion.js';

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
  assert.equal(nueva.proforma.clienteId, null);
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

const cli = (o) => ({ ...EJEMPLO.cliente, id: 'c1', actualizadoEn: '2026-09-25T10:00:00.000Z', ...o });

test('validarCliente: nombre, cédula única y correo', () => {
  assert.equal(validarCliente(cli({ nombre: '   ' }), []).errors.nombre, 'El nombre es obligatorio.');
  const existentes = [cli({ cedulaJuridica: '3-101-123456' })];
  const duplicado = validarCliente(cli({ id: 'c2', cedulaJuridica: '3101123456' }), existentes, 'c2');
  assert.match(duplicado.errors.cedulaJuridica, /La cédula jurídica ya está registrada/);
  assert.equal(validarCliente(cli({ cedulaJuridica: ' 3 101 123456 ' }), existentes).ok, false);
  assert.equal(validarCliente(existentes[0], existentes, 'c1').ok, true, 'editar sin cambiar la cédula');
  assert.equal(validarCliente(cli({ cedulaJuridica: '' }), [cli({ cedulaJuridica: '' })]).ok, true, 'cédula vacía no se compara');
  assert.ok(validarCliente(cli({ correo: 'maria@' }), []).errors.correo);
  assert.equal(validarCliente(cli({ correo: '' }), []).ok, true);
});

test('buscarClientes y ordenarClientes', () => {
  const clientes = [
    cli({ id: 'a', nombre: 'Los Andes', cedulaJuridica: '3-101-123456', contacto: 'María Fernández' }),
    cli({ id: 'b', nombre: 'Café Ñandú', cedulaJuridica: '3-102-999999', contacto: 'Pedro' }),
    cli({ id: 'c', nombre: 'Álvaro Mora', cedulaJuridica: '', contacto: '' }),
  ];
  assert.deepEqual(buscarClientes(clientes, 'cafe nandu').map((c) => c.id), ['b']);
  assert.deepEqual(buscarClientes(clientes, '3-101').map((c) => c.id), ['a']);
  assert.deepEqual(buscarClientes(clientes, 'maria').map((c) => c.id), ['a']);
  assert.equal(buscarClientes(clientes, '  ').length, 3);
  assert.deepEqual(ordenarClientes(clientes).map((c) => c.id), ['c', 'b', 'a']);
  assert.equal(clientes[0].id, 'a', 'no muta la lista original');
});

test('validacion: borradores sin clienteId y clientes corruptos (CA-17, CA-18)', () => {
  const { clienteId, ...viejo } = EJEMPLO;
  assert.equal(clienteId, null);
  assert.ok(validProforma(viejo), 'borrador anterior al módulo, sin clienteId');
  assert.ok(validProforma({ ...viejo, clienteId: null }));
  assert.ok(validProforma({ ...viejo, clienteId: 'c1' }));
  assert.ok(!validProforma({ ...viejo, clienteId: 5 }));
  const record = { id: 'h1', savedAt: '2026-09-25T10:00:00Z', proforma: viejo, emisor: EMISOR_DEFAULT };
  assert.equal(validHistory([record]).length, 1);
  assert.deepEqual(validClientes('{roto'), []);
  const cargados = validClientes([cli(), null, cli({ id: undefined }), cli({ id: 'x', nombre: '  ' }), { ...cli({ id: 'y' }), extra: '<b>' }, cli({ nombre: 'Repetido' })]);
  assert.deepEqual(cargados.map((c) => c.id), ['c1', 'y']);
  assert.equal('extra' in cargados[1], false);
});

test('reducer: catálogo de clientes y vínculo con la proforma', () => {
  const base = {
    proforma: { ...EJEMPLO, clienteId: null },
    emisor: EMISOR_DEFAULT,
    counter: { year: 2026, seq: 1 },
    logo: null,
    logoCustom: false,
    history: [],
    clientes: [],
    errors: { 'cliente.nombre': 'x', 'lineas.1.titulo': 'y' },
  };
  const conCliente = reducer(base, { type: 'clientes/guardar', cliente: cli({ nombre: 'Café Ñandú', telefono: '1111' }) });
  assert.equal(conCliente.clientes.length, 1);
  assert.equal(conCliente.proforma, base.proforma, 'guardar en el catálogo no toca la proforma');

  const usado = reducer(conCliente, { type: 'proforma/usarCliente', cliente: conCliente.clientes[0] });
  assert.equal(usado.proforma.clienteId, 'c1');
  assert.equal(usado.proforma.cliente.nombre, 'Café Ñandú');
  assert.equal('id' in usado.proforma.cliente, false, 'solo se copian los 6 campos');
  assert.deepEqual(usado.errors, { 'lineas.1.titulo': 'y' });

  const editado = reducer(usado, { type: 'clientes/guardar', cliente: cli({ nombre: 'Café Ñandú', telefono: '2222' }) });
  assert.equal(editado.clientes.length, 1);
  assert.equal(editado.proforma.cliente.telefono, '1111', 'RC-06: el borrador conserva la copia');

  const guardadoHist = reducer(usado, { type: 'historial/guardar', id: 'h1', savedAt: '2026-09-25T10:00:00Z' });
  assert.equal(guardadoHist.history[0].proforma.clienteId, 'c1');
  const eliminado = reducer(guardadoHist, { type: 'clientes/eliminar', id: 'c1' });
  assert.equal(eliminado.clientes.length, 0);
  assert.equal(eliminado.proforma.clienteId, null);
  assert.equal(eliminado.proforma.cliente.nombre, 'Café Ñandú');
  assert.equal(eliminado.history, guardadoHist.history, 'RC-11: el historial no cambia');

  const creado = reducer(base, { type: 'proforma/guardarCliente', id: 'n1', actualizadoEn: '2026-09-25T11:00:00.000Z' });
  assert.equal(creado.proforma.clienteId, 'n1');
  assert.equal(creado.clientes[0].nombre, EJEMPLO.cliente.nombre);
  const cambiado = reducer(creado, { type: 'cliente/campo', name: 'telefono', value: '7777' });
  assert.equal(cambiado.clientes[0].telefono, EJEMPLO.cliente.telefono, 'RC-07: editar la proforma no cambia el catálogo');
  const actualizado = reducer(cambiado, { type: 'proforma/guardarCliente', id: 'n1', actualizadoEn: '2026-09-25T12:00:00.000Z' });
  assert.equal(actualizado.clientes.length, 1);
  assert.equal(actualizado.clientes[0].telefono, '7777');
  assert.equal(actualizado.clientes[0].actualizadoEn, '2026-09-25T12:00:00.000Z');

  const { clienteId, ...viejo } = EJEMPLO;
  const restaurado = reducer(base, { type: 'historial/restaurar', record: { proforma: viejo, emisor: EMISOR_DEFAULT } });
  assert.equal(restaurado.proforma.clienteId, null);
});
