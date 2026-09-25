export default function Field({ label, error, as = 'input', children, className = '', ...props }) {
  const Control = as;
  const errorId = error ? `${props.id}-error` : undefined;
  return (
    <label className={`field ${className}`} htmlFor={props.id}>
      <span>{label}</span>
      <Control {...props} aria-invalid={error ? 'true' : undefined} aria-describedby={errorId}>
        {children}
      </Control>
      {error && <small id={errorId} className="field-error">{error}</small>}
    </label>
  );
}
