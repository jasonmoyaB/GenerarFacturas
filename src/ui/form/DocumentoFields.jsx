import Field from '../Field.jsx';

export default function DocumentoFields({ proforma, dispatch }) {
  const change = (event) => dispatch({ type: 'proforma/campo', name: event.target.name, value: event.target.value });
  return (
    <section className="form-card">
      <h2>Documento</h2>
      <div className="field-grid three">
        <Field id="numero" name="numero" label="Número" value={proforma.numero} onChange={change} />
        <Field id="fechaEmision" name="fechaEmision" type="date" label="Fecha de emisión" value={proforma.fechaEmision} onChange={change} />
        <Field
          id="validaHasta"
          name="validaHasta"
          type="date"
          label="Válida hasta"
          value={proforma.validaHasta}
          onChange={(event) => dispatch({ type: 'proforma/validaHasta', value: event.target.value })}
        />
        <Field id="condicion" name="condicion" as="select" label="Condición de venta" value={proforma.condicion} onChange={change}>
          <option>Contado</option>
          <option>Crédito</option>
        </Field>
        <Field id="actividad" name="actividad" label="Actividad" value={proforma.actividad} onChange={change} className="span-2" />
      </div>
    </section>
  );
}
