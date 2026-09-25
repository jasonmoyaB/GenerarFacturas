import {
  AlignmentType,
  BorderStyle,
  LevelFormat,
  LineRuleType,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TextRun,
  WidthType,
} from 'docx';

export const ANCHO_UTIL = 9360;
export const CELL_PAD = 108;
export const PT8 = 16;
export const PT75 = 15;
export const PT11 = 22;

export const ANCHOS = {
  header: [2300, 3900, 3160],
  cliente: [1300, 3900, 1300, 2860],
  detalle: [1000, 5000, 700, 1330, 1330],
  pie: [3800, 1800, 3760],
};

export const LINEA = { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 1 };
export const NADA = { style: BorderStyle.NONE, size: 0, color: 'auto' };
export const SIN_BORDES = {
  top: NADA,
  bottom: NADA,
  left: NADA,
  right: NADA,
  insideHorizontal: NADA,
  insideVertical: NADA,
};

export const DOCUMENT_STYLES = {
  default: {
    document: {
      run: { font: 'Arial', size: PT8, color: '000000' },
      paragraph: { spacing: { before: 0, after: 0, line: 264, lineRule: LineRuleType.AUTO } },
    },
  },
};

export const NUMBERING = {
  config: [{
    reference: 'vinetas',
    levels: [{
      level: 0,
      format: LevelFormat.BULLET,
      text: '\u2022',
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 360, hanging: 180 } } },
    }],
  }],
};

export const PAGE_PROPERTIES = {
  page: {
    size: { width: 12240, height: 15840 },
    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 0, footer: 0 },
  },
};

export function tabla(columnWidths, rows) {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: columnWidths.reduce((sum, width) => sum + width, 0), type: WidthType.DXA },
    columnWidths,
    borders: SIN_BORDES,
    rows,
  });
}

export function celda(width, children, options = {}) {
  return new TableCell({ width: { size: width, type: WidthType.DXA }, children, ...options });
}

export function par(text, options = {}) {
  return new Paragraph({ children: [new TextRun({ text })], ...options });
}
