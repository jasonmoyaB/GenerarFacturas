import { useRef, useState } from 'react';
import { ordenarClientes, validarCliente } from '../../core/clientes.js';
import { nuevoId } from '../../core/proforma.js';
import Field from '../Field.jsx';

/** Campos del cliente; también los usa la vista Clientes. */
export const CAMPOS_CLIENTE = [
  ['nombre', 'Nombre o empresa'], ['cedulaJuridica', 'Cédula jurídica'], ['contacto', 'Contacto'],
  ['telefono', 'Teléfono'], ['correo', 'Correo'], ['direccion', 'Dirección'],
];

export default function ClienteFields({ cliente, clienteId, clientes, errors, dispatch }) {
  const section = useRef(null);
  const [aviso, setAviso] = useState('');
  // RC-12 / CA-22: un clienteId que ya no existe se muestra como "sin seleccionar".
  const enlazado = clientes.some((c) => c.id === clienteId);

  function elegir(event) {
    const elegido = clientes.find((c) => c.id === event.target.value);
    if (elegido) dispatch({ type: 'proforma/usarCliente', cliente: elegido });
    else dispatch({ type: 'proforma/campo', name: 'clienteId', value: null });
    setAviso('');
  }

  function guardarEnClientes() {
    const id = enlazado ? clienteId : nuevoId();
    const result = validarCliente(cliente, clientes, id);
    if (!result.ok) {
      dispatch({
        type: 'errores',
        errors: { ...errors, ...Object.fromEntries(Object.entries(result.errors).map(([campo, msg]) => [`cliente.${campo}`, msg])) },
      });
      setAviso('');
      requestAnimationFrame(() => section.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    dispatch({ type: 'proforma/guardarCliente', id, actualizadoEn: new Date().toISOString() });
    setAviso(enlazado ? 'Cliente actualizado en el catálogo.' : 'Cliente guardado en el catálogo.');
  }

  return (
    <section className="form-card" ref={section}>
      <h2>Cliente</h2>
      <div className="field-grid two">
        <Field as="select" id="cliente-elegir" label="Elegir cliente" value={enlazado ? clienteId : ''} onChange={elegir} className="span-2">
          <option value="">— Sin seleccionar —</option>
          {ordenarClientes(clientes).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Field>
        {CAMPOS_CLIENTE.map(([name, label]) => (
          <Field
            key={name}
            id={`cliente-${name}`}
            label={label}
            value={cliente[name]}
            error={errors[`cliente.${name}`]}
            onChange={(event) => { dispatch({ type: 'cliente/campo', name, value: event.target.value }); setAviso(''); }}
          />
        ))}
      </div>
      <div className="cliente-guardar">
        <button type="button" className="secondary" onClick={guardarEnClientes}>Guardar en clientes</button>
        <p role="status">{aviso}</p>
      </div>
    </section>
  );
}
