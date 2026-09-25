import { useEffect, useRef, useState } from 'react';
import { logoSize } from '../../core/view-model.js';
import { ANCHOS } from '../../docx/styles.js';

const widths = (values) => values.map((value) => `${value / 93.6}%`);

function Cols({ values }) {
  return <colgroup>{widths(values).map((width, i) => <col key={i} style={{ width }} />)}</colgroup>;
}

export default function Preview({ vm, logo }) {
  const host = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 816)));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const size = logo ? logoSize(logo) : null;
  return (
    <aside className="preview-panel" aria-label="Vista previa del documento">
      <div className="preview-label"><span>Vista previa</span><small>Carta · 1 página</small></div>
      <div className="preview-host" ref={host} style={{ height: 1056 * scale }}>
        <div className="sheet" style={{ transform: `scale(${scale})` }}>
          <table className="doc-header"><Cols values={ANCHOS.header} /><tbody><tr>
            <td className="doc-logo">{logo && <img src={logo.dataUrl} width={size.width} height={size.height} alt="" />}</td>
            <td><strong>{vm.emisor.nombre}</strong><br />Céd.: {vm.emisor.cedula}<br /><strong>{vm.ciudadUpper}</strong><br />Tel.: {vm.emisor.telefono}<br />{vm.emisor.correo}<br />{vm.emisor.direccion}<br /><strong>Actividad: {vm.actividad}</strong></td>
            <td className="doc-meta"><b className="doc-title">FACTURA PROFORMA</b><b>{vm.numero}</b>{[['Fecha', vm.fecha], ['Válida hasta', vm.validaHasta], ['Moneda', vm.moneda], ['Condición', vm.condicion], ['Emitida por', vm.emitidaPor]].map(([key, value]) => <span key={key}><i>{key}:</i>{value}</span>)}</td>
          </tr></tbody></table>
          <h3 className="client-title">Cliente:</h3>
          <table><Cols values={ANCHOS.cliente} /><tbody>
            <tr><th>Nombre:</th><td>{vm.cliente.nombre}</td><th>E-mail:</th><td>{vm.cliente.correo}</td></tr>
            <tr><th>Céd. jurídica:</th><td>{vm.cliente.cedulaJuridica}</td><th>Contacto:</th><td>{vm.cliente.contacto}</td></tr>
            <tr><th>Teléfono:</th><td>{vm.cliente.telefono}</td><th>Vencimiento:</th><td>{vm.vencimiento}</td></tr>
            <tr><th>Dirección:</th><td colSpan="3">{vm.cliente.direccion}</td></tr>
          </tbody></table>
          <table className="detail-table"><Cols values={ANCHOS.detalle} /><thead><tr>{['Código', 'Descripción', 'Cant.', 'Precio U.', 'Monto'].map((text) => <th key={text}>{text}</th>)}</tr></thead><tbody>
            {vm.lineas.map((linea) => <tr key={linea.codigo}><td>{linea.codigo}</td><td><b>{linea.titulo}</b>{linea.descripcion && <small>{linea.descripcion}</small>}</td><td>{linea.cantidad}</td><td>{linea.precio}</td><td>{linea.monto}</td></tr>)}
          </tbody></table>
          <div className="doc-notes"><p>{vm.comentario}</p>{vm.incluye.length > 0 && <><b>Incluye:</b><ul>{vm.incluye.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}</ul></>}{vm.noIncluye.length > 0 && <><b>No incluye:</b><ul>{vm.noIncluye.map((item, i) => <li key={`${i}-${item}`}>{item}</li>)}</ul></>}</div>
          <table className="doc-footer"><Cols values={ANCHOS.pie} /><tbody><tr><td className="signature">{vm.emisor.nombre}</td><td /><td className="doc-total"><b>Total:</b><b>{vm.total}</b></td></tr><tr><td className="signature">Aprobado por el cliente</td><td /><td /></tr></tbody></table>
          <p className="validity"><i>Documento de cotización. Precios válidos hasta el {vm.validaHasta}.</i></p>
          <p className="doc-contact"><span>Contacto: <b>{vm.emisor.correo}</b></span><span>{vm.fecha}</span></p>
        </div>
      </div>
    </aside>
  );
}
