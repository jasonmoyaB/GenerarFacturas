import { useState } from 'react';
import { fileToBlackWhite } from '../../platform/logo-bw.js';

export default function LogoField({ logo, logoDefault, dispatch }) {
  const [error, setError] = useState('');
  async function change(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      dispatch({ type: 'logo/establecer', logo: await fileToBlackWhite(file) });
      setError('');
    } catch (reason) {
      setError(reason.message);
    }
    event.target.value = '';
  }
  return (
    <section className="form-card logo-field">
      <div><h2>Logo</h2><p>Se convierte automáticamente a blanco y negro.</p></div>
      {logo ? <img src={logo.dataUrl} alt="Logo actual" /> : <span className="logo-empty">Sin logo</span>}
      <label className="secondary file-button">Elegir imagen<input type="file" accept="image/*" aria-describedby={error ? 'logo-error' : undefined} onChange={change} /></label>
      <button type="button" className="text-button" onClick={() => dispatch({ type: 'logo/restaurar', logo: logoDefault })}>Restaurar predeterminado</button>
      {error && <small id="logo-error" className="field-error" role="alert">{error}</small>}
    </section>
  );
}
