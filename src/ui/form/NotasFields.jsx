import Field from '../Field.jsx';

export default function NotasFields({ proforma, dispatch }) {
  const change = (event) => dispatch({ type: 'proforma/campo', name: event.target.name, value: event.target.value });
  return (
    <section className="form-card">
      <h2>Notas</h2>
      <div className="field-grid two">
        <Field id="comentario" name="comentario" as="textarea" rows="3" label="Comentario" value={proforma.comentario} onChange={change} className="span-2" />
        <Field id="incluye" name="incluye" as="textarea" rows="4" label="Incluye (una viñeta por línea)" value={proforma.incluye} onChange={change} />
        <Field id="noIncluye" name="noIncluye" as="textarea" rows="4" label="No incluye (una viñeta por línea)" value={proforma.noIncluye} onChange={change} />
      </div>
    </section>
  );
}
