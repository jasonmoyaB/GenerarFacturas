import Field from '../Field.jsx';

const fields = [
  ['nombre', 'Nombre'], ['cedula', 'Cédula'], ['ciudad', 'Ciudad'], ['direccion', 'Dirección'],
  ['telefono', 'Teléfono'], ['correo', 'Correo'], ['actividad', 'Actividad del emisor'],
];

export default function EmisorFields({ emisor, dispatch }) {
  return (
    <details className="form-card">
      <summary><span>Datos del emisor</span><small>Se guardan para próximas proformas</small></summary>
      <div className="field-grid two details-content">
        {fields.map(([name, label]) => (
          <Field
            key={name}
            id={`emisor-${name}`}
            label={label}
            value={emisor[name]}
            onChange={(event) => dispatch({ type: 'emisor/campo', name, value: event.target.value })}
          />
        ))}
      </div>
    </details>
  );
}
