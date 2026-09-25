import Field from '../Field.jsx';

export default function LineasEditor({ lineas, errors, total, dispatch }) {
  const change = (id, event) => dispatch({
    type: 'linea/campo', id, name: event.target.name, value: event.target.value,
  });
  return (
    <section className="form-card lines-card">
      <div className="section-heading">
        <div><h2>Servicios</h2><p>Títulos, cantidades y precios de la propuesta.</p></div>
        <strong className="form-total">{total}</strong>
      </div>
      {errors.lineas && <p className="field-error">{errors.lineas}</p>}
      <div className="lines-list">
        {lineas.map((linea, index) => {
          const key = (name) => `lineas.${linea.id}.${name}`;
          return (
            <article className="line-item" key={linea.id}>
              <header><span>SRV-{String(index + 1).padStart(3, '0')}</span><button type="button" className="text-button danger" onClick={() => dispatch({ type: 'linea/eliminar', id: linea.id })}>Eliminar</button></header>
              <div className="field-grid line-grid">
                <Field id={`${linea.id}-titulo`} name="titulo" label="Título" value={linea.titulo} error={errors[key('titulo')]} onChange={(event) => change(linea.id, event)} className="line-title" />
                <Field id={`${linea.id}-cantidad`} name="cantidad" inputMode="decimal" label="Cantidad" value={linea.cantidad} error={errors[key('cantidad')]} onChange={(event) => change(linea.id, event)} />
                <Field id={`${linea.id}-precio`} name="precio" inputMode="decimal" label="Precio unitario (₡)" value={linea.precio} error={errors[key('precio')]} onChange={(event) => change(linea.id, event)} />
                <Field id={`${linea.id}-descripcion`} name="descripcion" as="textarea" rows="2" label="Descripción" value={linea.descripcion} onChange={(event) => change(linea.id, event)} className="line-description" />
              </div>
            </article>
          );
        })}
      </div>
      <button type="button" className="secondary full" onClick={() => dispatch({ type: 'linea/agregar' })}>+ Agregar servicio</button>
    </section>
  );
}
