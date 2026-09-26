import { useRef, useState } from 'react';
import { buscarClientes, ordenarClientes, validarCliente } from '../../core/clientes.js';
import { formatDate } from '../../core/dates.js';
import { CLIENTE_VACIO } from '../../core/defaults.js';
import { formatTotal } from '../../core/money.js';
import { nuevoId, total } from '../../core/proforma.js';
import Field from '../Field.jsx';
import { CAMPOS_CLIENTE } from '../form/ClienteFields.jsx';

/** Formulario de alta/edición. `cliente.id` vacío = cliente nuevo. */
function ClienteForm({ cliente, clientes, onGuardar, onCancelar }) {
  const form = useRef(null);
  const [datos, setDatos] = useState(cliente);
  const [errores, setErrores] = useState({});

  function guardar(event) {
    event.preventDefault();
    const result = validarCliente(datos, clientes, datos.id || null);
    setErrores(result.errors);
    if (!result.ok) {
      requestAnimationFrame(() => form.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    onGuardar({ ...datos, id: datos.id || nuevoId(), actualizadoEn: new Date().toISOString() });
  }

  function cambiar(name, value) {
    setDatos({ ...datos, [name]: value });
    setErrores(Object.fromEntries(Object.entries(errores).filter(([campo]) => campo !== name)));
  }

  return (
    <form className="form-card" ref={form} onSubmit={guardar} noValidate>
      <h2>{datos.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
      <div className="field-grid two">
        {CAMPOS_CLIENTE.map(([name, label]) => (
          <Field
            key={name}
            id={`catalogo-${name}`}
            label={label}
            value={datos[name]}
            error={errores[name]}
            onChange={(event) => cambiar(name, event.target.value)}
            autoFocus={name === 'nombre'}
          />
        ))}
      </div>
      <div className="form-actions">
        <button type="button" className="text-button" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="primary">Guardar cliente</button>
      </div>
    </form>
  );
}

/** RC-13: proformas del historial enlazadas a este cliente (el historial ya va del más reciente al más antiguo). */
function ProformasCliente({ cliente, history, onAbrir }) {
  const proformas = history.filter((record) => record.proforma.clienteId === cliente.id);
  if (proformas.length === 0) return <p className="history-empty">Aún no hay proformas descargadas o impresas para este cliente.</p>;
  return (
    <ul className="cliente-proformas">
      {proformas.map((record) => (
        <li key={record.id}>
          <strong>{record.proforma.numero || 'Sin número'}</strong>
          <small>{formatDate(record.proforma.fechaEmision)}</small>
          <b>{formatTotal(total(record.proforma.lineas))}</b>
          <button type="button" className="secondary" onClick={() => onAbrir(record)}>Abrir</button>
        </li>
      ))}
    </ul>
  );
}

export default function Clientes({ clientes, history, dispatch, onAbrir }) {
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const nuevoBoton = useRef(null);
  const visibles = ordenarClientes(buscarClientes(clientes, busqueda));

  // El formulario reemplaza al botón "+ Nuevo cliente"; al cerrarlo el foco vuelve ahí y no cae en <body>.
  function cerrarFormulario() {
    setEditando(null);
    requestAnimationFrame(() => nuevoBoton.current?.focus());
  }

  function guardar(cliente) {
    dispatch({ type: 'clientes/guardar', cliente });
    cerrarFormulario();
  }

  function eliminar(cliente) {
    if (!window.confirm(`¿Eliminar a ${cliente.nombre} del catálogo? Sus proformas del historial se conservan.`)) return;
    dispatch({ type: 'clientes/eliminar', id: cliente.id });
    if (editando?.id === cliente.id) cerrarFormulario();
  }

  return (
    <main className="clientes-view">
      {editando ? (
        <ClienteForm
          key={editando.id || 'nuevo'}
          cliente={editando}
          clientes={clientes}
          onGuardar={guardar}
          onCancelar={cerrarFormulario}
        />
      ) : (
        <button type="button" className="primary" ref={nuevoBoton} onClick={() => setEditando({ ...CLIENTE_VACIO, id: '' })}>+ Nuevo cliente</button>
      )}
      <section className="form-card">
        <div className="section-heading">
          <h2>Clientes</h2>
          <small>{clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}</small>
        </div>
        <Field
          id="clientes-buscar"
          type="search"
          label="Buscar por nombre, cédula o contacto"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />
        <div className="history-content">
          {clientes.length === 0 && <p className="history-empty">Todavía no hay clientes. Cree uno aquí o use “Guardar en clientes” en la proforma.</p>}
          {clientes.length > 0 && visibles.length === 0 && <p className="history-empty">Ningún cliente coincide con la búsqueda.</p>}
          {visibles.map((cliente) => (
            <article className="history-item cliente-item" key={cliente.id}>
              <div>
                <strong>{cliente.nombre}</strong>
                <span>{[cliente.cedulaJuridica, cliente.contacto].filter(Boolean).join(' · ') || 'Sin cédula ni contacto'}</span>
              </div>
              <div className="history-actions">
                <button
                  type="button"
                  className="text-button"
                  aria-expanded={detalle === cliente.id}
                  onClick={() => setDetalle(detalle === cliente.id ? null : cliente.id)}
                >Proformas</button>
                <button type="button" className="secondary" onClick={() => setEditando(cliente)} aria-label={`Editar ${cliente.nombre}`}>Editar</button>
                <button type="button" className="text-button danger" onClick={() => eliminar(cliente)} aria-label={`Eliminar ${cliente.nombre}`}>Eliminar</button>
              </div>
              {detalle === cliente.id && <ProformasCliente cliente={cliente} history={history} onAbrir={onAbrir} />}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
