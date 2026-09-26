import { useState } from 'react';
import { total } from './core/proforma.js';
import { formatTotal } from './core/money.js';
import { toViewModel } from './core/view-model.js';
import { useProforma } from './state/useProforma.js';
import Toolbar from './ui/Toolbar.jsx';
import ClienteFields from './ui/form/ClienteFields.jsx';
import DocumentoFields from './ui/form/DocumentoFields.jsx';
import EmisorFields from './ui/form/EmisorFields.jsx';
import LineasEditor from './ui/form/LineasEditor.jsx';
import LogoField from './ui/form/LogoField.jsx';
import NotasFields from './ui/form/NotasFields.jsx';
import Historial from './ui/form/Historial.jsx';
import Preview from './ui/preview/Preview.jsx';
import Clientes from './ui/clientes/Clientes.jsx';
import './styles.css';

export default function App() {
  const { state, dispatch, logoDefault, guardadoOk } = useProforma();
  // Pestañas sin router (spec 002 §3.1).
  const [vista, setVista] = useState('proforma');
  const vm = toViewModel(state.proforma, state.emisor);
  function abrirProforma(record) {
    dispatch({ type: 'historial/restaurar', record });
    setVista('proforma');
  }
  return (
    <div className="app">
      <Toolbar state={state} dispatch={dispatch} vista={vista} onVista={setVista} guardadoOk={guardadoOk} />
      {vista === 'clientes' && <Clientes clientes={state.clientes} history={state.history} dispatch={dispatch} onAbrir={abrirProforma} />}
      {/* Se oculta en vez de desmontarse: "Imprimir" usa la vista previa desde cualquier pestaña. */}
      <main className={`workspace${vista === 'proforma' ? '' : ' vista-oculta'}`}>
        <form className="editor" onSubmit={(event) => event.preventDefault()}>
          <Historial history={state.history} dispatch={dispatch} />
          <DocumentoFields proforma={state.proforma} dispatch={dispatch} />
          <EmisorFields emisor={state.emisor} dispatch={dispatch} />
          <LogoField logo={state.logo} logoDefault={logoDefault} dispatch={dispatch} />
          <ClienteFields cliente={state.proforma.cliente} clienteId={state.proforma.clienteId} clientes={state.clientes} errors={state.errors} dispatch={dispatch} />
          <LineasEditor lineas={state.proforma.lineas} errors={state.errors} total={formatTotal(total(state.proforma.lineas))} dispatch={dispatch} />
          <NotasFields proforma={state.proforma} dispatch={dispatch} />
        </form>
        <Preview vm={vm} logo={state.logo} />
      </main>
    </div>
  );
}
