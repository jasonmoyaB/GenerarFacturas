import Field from '../Field.jsx';

const fields = [
  ['nombre', 'Nombre o empresa'], ['cedulaJuridica', 'Cédula jurídica'], ['contacto', 'Contacto'],
  ['telefono', 'Teléfono'], ['correo', 'Correo'], ['direccion', 'Dirección'],
];

export default function ClienteFields({ cliente, dispatch }) {
  return (
    <section className="form-card">
      <h2>Cliente</h2>
      <div className="field-grid two">
        {fields.map(([name, label]) => (
          <Field
            key={name}
            id={`cliente-${name}`}
            label={label}
            value={cliente[name]}
            onChange={(event) => dispatch({ type: 'cliente/campo', name, value: event.target.value })}
          />
        ))}
      </div>
    </section>
  );
}
