import {
  AlignmentType,
  ImageRun,
  Paragraph,
  TableRow,
  Tab,
  TabStopType,
  TextRun,
  VerticalAlign,
} from 'docx';
import { logoSize } from '../core/view-model.js';
import { ANCHOS, CELL_PAD, LINEA, PT11, PT75, celda, par, tabla } from './styles.js';

const derecha = { alignment: AlignmentType.RIGHT };
const negrita = (text, options = {}) => new TextRun({ text, bold: true, ...options });

function logoParagraph(logo) {
  if (!logo) return new Paragraph({});
  const base64 = logo.dataUrl.slice(logo.dataUrl.indexOf(',') + 1);
  const data = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return new Paragraph({
    children: [new ImageRun({ type: 'png', data, transformation: logoSize(logo) })],
  });
}

function datosEmisor(vm) {
  return [
    new Paragraph({ children: [negrita(vm.emisor.nombre)] }),
    par(`Céd.: ${vm.emisor.cedula}`),
    new Paragraph({ children: [negrita(vm.ciudadUpper)] }),
    par(`Tel.: ${vm.emisor.telefono}`),
    par(vm.emisor.correo),
    par(vm.emisor.direccion),
    new Paragraph({ children: [negrita(`Actividad: ${vm.actividad}`)] }),
  ];
}

function parDato(etiqueta, valor) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: ANCHOS.header[2] - 2 * CELL_PAD }],
    children: [new TextRun({ text: `${etiqueta}:` }), new TextRun({ children: [new Tab(), valor] })],
  });
}

function datosDocumento(vm) {
  return [
    new Paragraph({ ...derecha, children: [negrita('FACTURA PROFORMA', { size: PT11 })] }),
    new Paragraph({ ...derecha, children: [negrita(vm.numero)] }),
    parDato('Fecha', vm.fecha),
    parDato('Válida hasta', vm.validaHasta),
    parDato('Moneda', vm.moneda),
    parDato('Condición', vm.condicion),
    parDato('Emitida por', vm.emitidaPor),
  ];
}

export function header(vm, logo) {
  return tabla(ANCHOS.header, [new TableRow({ children: [
    celda(ANCHOS.header[0], [logoParagraph(logo)], { verticalAlign: VerticalAlign.CENTER }),
    celda(ANCHOS.header[1], datosEmisor(vm)),
    celda(ANCHOS.header[2], datosDocumento(vm)),
  ] })]);
}

function filaCliente(etiqueta1, valor1, etiqueta2, valor2) {
  return new TableRow({ children: [
    celda(ANCHOS.cliente[0], [new Paragraph({ children: [negrita(etiqueta1)] })]),
    celda(ANCHOS.cliente[1], [par(valor1)]),
    celda(ANCHOS.cliente[2], [new Paragraph({ children: [negrita(etiqueta2)] })]),
    celda(ANCHOS.cliente[3], [par(valor2)]),
  ] });
}

export function cliente(vm) {
  const titulo = new Paragraph({
    spacing: { before: 200 },
    border: { bottom: LINEA },
    children: [negrita('Cliente:')],
  });
  const rows = [
    filaCliente('Nombre:', vm.cliente.nombre, 'E-mail:', vm.cliente.correo),
    filaCliente('Céd. jurídica:', vm.cliente.cedulaJuridica, 'Contacto:', vm.cliente.contacto),
    filaCliente('Teléfono:', vm.cliente.telefono, 'Vencimiento:', vm.vencimiento),
    new TableRow({ children: [
      celda(ANCHOS.cliente[0], [new Paragraph({ children: [negrita('Dirección:')] })]),
      celda(ANCHOS.cliente.slice(1).reduce((a, b) => a + b), [par(vm.cliente.direccion)], { columnSpan: 3 }),
    ] }),
  ];
  return [titulo, tabla(ANCHOS.cliente, rows)];
}

function celdaEncabezado(text, width, alignment) {
  return celda(width, [new Paragraph({ alignment, children: [negrita(text)] })], {
    borders: { top: LINEA, bottom: LINEA },
  });
}

function descripcionLinea(linea) {
  const paragraphs = [new Paragraph({ children: [negrita(linea.titulo)] })];
  if (!linea.descripcion) return paragraphs;
  const runs = linea.descripcion.split(/\r?\n/).map((text, index) => (
    new TextRun({ text, size: PT75, break: index ? 1 : undefined })
  ));
  return [...paragraphs, new Paragraph({ children: runs })];
}

function filaDetalle(linea) {
  return new TableRow({ cantSplit: true, children: [
    celda(ANCHOS.detalle[0], [par(linea.codigo, { spacing: { before: 40 } })]),
    celda(ANCHOS.detalle[1], descripcionLinea(linea)),
    celda(ANCHOS.detalle[2], [par(linea.cantidad, derecha)]),
    celda(ANCHOS.detalle[3], [par(linea.precio, derecha)]),
    celda(ANCHOS.detalle[4], [par(linea.monto, derecha)]),
  ] });
}

export function detalle(vm) {
  const headers = ['Código', 'Descripción', 'Cant.', 'Precio U.', 'Monto'];
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((text, i) => celdaEncabezado(
      text,
      ANCHOS.detalle[i],
      i >= 2 ? AlignmentType.RIGHT : AlignmentType.LEFT,
    )),
  });
  return tabla(ANCHOS.detalle, [headerRow, ...vm.lineas.map(filaDetalle)]);
}

function lista(titulo, items) {
  if (!items.length) return [];
  return [
    new Paragraph({ spacing: { before: 120 }, children: [negrita(`${titulo}:`)] }),
    ...items.map((text) => new Paragraph({ text, numbering: { reference: 'vinetas', level: 0 } })),
  ];
}

export function notas(vm) {
  return [
    new Paragraph({ spacing: { before: 200 }, text: vm.comentario }),
    ...lista('Incluye', vm.incluye),
    ...lista('No incluye', vm.noIncluye),
  ];
}

function firma(text) {
  return new Paragraph({
    spacing: { before: 480 },
    border: { top: LINEA },
    alignment: AlignmentType.CENTER,
    text,
  });
}

function totalParagraph(total) {
  return new Paragraph({
    spacing: { before: 480 },
    border: { top: LINEA },
    tabStops: [{ type: TabStopType.RIGHT, position: ANCHOS.pie[2] - 2 * CELL_PAD }],
    children: [negrita('Total:'), new TextRun({ bold: true, children: [new Tab(), total] })],
  });
}

export function pie(vm) {
  const rows = [
    new TableRow({ cantSplit: true, children: [
      celda(ANCHOS.pie[0], [firma(vm.emisor.nombre)]),
      celda(ANCHOS.pie[1], [new Paragraph({})]),
      celda(ANCHOS.pie[2], [totalParagraph(vm.total)]),
    ] }),
    new TableRow({ cantSplit: true, children: [
      celda(ANCHOS.pie[0], [firma('Aprobado por el cliente')]),
      celda(ANCHOS.pie[1], [new Paragraph({})]),
      celda(ANCHOS.pie[2], [new Paragraph({})]),
    ] }),
  ];
  const vigencia = new Paragraph({
    spacing: { before: 200 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({
      text: `Documento de cotización. Precios válidos hasta el ${vm.validaHasta}.`,
      italics: true,
    })],
  });
  return [tabla(ANCHOS.pie, rows), vigencia];
}

export function cierre(vm) {
  return new Paragraph({
    spacing: { before: 200 },
    tabStops: [
      { type: TabStopType.CENTER, position: 4680 },
      { type: TabStopType.RIGHT, position: 9360 },
    ],
    children: [
      new TextRun({ children: [new Tab(), 'Contacto: '] }),
      negrita(vm.emisor.correo),
      new TextRun({ children: [new Tab(), vm.fecha] }),
    ],
  });
}
