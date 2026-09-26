import { useState } from 'react';
import { Packer } from 'docx';
import { todayISO } from '../core/dates.js';
import { fileName, nuevoId, validate } from '../core/proforma.js';
import { toViewModel } from '../core/view-model.js';
import { buildDocument } from '../docx/build-document.js';
import { downloadBlob } from '../platform/download.js';

const VISTAS = [['proforma', 'Proforma'], ['clientes', 'Clientes']];

export default function Toolbar({ state, dispatch, vista, onVista, guardadoOk }) {
  const [busy, setBusy] = useState(false);
  function valid() {
    const result = validate(state.proforma);
    dispatch({ type: 'errores', errors: result.errors });
    if (!result.ok) {
      onVista('proforma'); // el campo inválido debe estar visible para recibir el foco
      requestAnimationFrame(() => document.querySelector('[aria-invalid="true"]')?.focus());
    }
    return result.ok;
  }
  function saveToHistory() {
    dispatch({
      type: 'historial/guardar',
      id: nuevoId(),
      savedAt: new Date().toISOString(),
    });
  }
  async function download() {
    if (!valid()) return;
    setBusy(true);
    try {
      const vm = toViewModel(state.proforma, state.emisor);
      const blob = await Packer.toBlob(buildDocument(vm, state.logo));
      downloadBlob(blob, fileName(state.proforma));
      saveToHistory();
    } finally {
      setBusy(false);
    }
  }
  function print() {
    if (valid()) {
      saveToHistory();
      window.print();
    }
  }
  return (
    <header className="toolbar">
      <div className="brand"><span>JM</span><div><strong>Proforma</strong><small>{state.proforma.numero}</small></div></div>
      <div className="toolbar-total"><small>Total</small><strong>{toViewModel(state.proforma, state.emisor).total}</strong></div>
      <div className="toolbar-actions">
        <button type="button" className="text-button" onClick={() => dispatch({ type: 'nueva', hoy: todayISO() })}>Nueva</button>
        <button type="button" className="secondary" onClick={print}>Imprimir / PDF</button>
        <button type="button" className="primary" disabled={busy} onClick={download}>{busy ? 'Generando…' : 'Descargar .docx'}</button>
      </div>
      <nav className="tabs" aria-label="Secciones">
        {VISTAS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={vista === id} onClick={() => onVista(id)}>{label}</button>
        ))}
      </nav>
      {!guardadoOk && <p className="save-warning" role="alert">No se pudo guardar en este navegador. Los cambios se conservan mientras la página siga abierta.</p>}
    </header>
  );
}
