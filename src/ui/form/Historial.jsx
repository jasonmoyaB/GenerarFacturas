import { formatTotal } from '../../core/money.js';
import { total } from '../../core/proforma.js';

function fechaGuardado(iso) {
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

export default function Historial({ history, dispatch }) {
  function clear() {
    if (window.confirm('¿Eliminar todo el historial de proformas?')) dispatch({ type: 'historial/limpiar' });
  }
  return (
    <details className="form-card history-card">
      <summary>
        <span>Historial</span>
        <small>{history.length} {history.length === 1 ? 'proforma' : 'proformas'}</small>
      </summary>
      <div className="history-content">
        {history.length === 0 && <p className="history-empty">Las proformas aparecerán aquí después de descargarlas o imprimirlas.</p>}
        {history.map((record) => (
          <article className="history-item" key={record.id}>
            <div>
              <strong>{record.proforma.numero || 'Sin número'}</strong>
              <span>{record.proforma.cliente.nombre || 'Cliente sin nombre'}</span>
              <small>{fechaGuardado(record.savedAt)}</small>
            </div>
            <b>{formatTotal(total(record.proforma.lineas))}</b>
            <div className="history-actions">
              <button type="button" className="secondary" onClick={() => dispatch({ type: 'historial/restaurar', record })}>Abrir</button>
              <button type="button" className="text-button danger" aria-label={`Eliminar ${record.proforma.numero}`} onClick={() => dispatch({ type: 'historial/eliminar', id: record.id })}>Eliminar</button>
            </div>
          </article>
        ))}
        {history.length > 0 && <button type="button" className="text-button danger clear-history" onClick={clear}>Borrar todo el historial</button>}
      </div>
    </details>
  );
}
