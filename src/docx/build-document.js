import { Document } from 'docx';
import { cierre, cliente, detalle, header, notas, pie } from './blocks.js';
import { DOCUMENT_STYLES, NUMBERING, PAGE_PROPERTIES } from './styles.js';

/** Construye el documento sin leer estado ni usar APIs del navegador. */
export function buildDocument(vm, logo) {
  return new Document({
    styles: DOCUMENT_STYLES,
    numbering: NUMBERING,
    sections: [{
      properties: PAGE_PROPERTIES,
      children: [
        header(vm, logo),
        ...cliente(vm),
        detalle(vm),
        ...notas(vm),
        ...pie(vm),
        cierre(vm),
      ],
    }],
  });
}
