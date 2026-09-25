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
import './styles.css';

export default function App() {
  const { state, dispatch, logoDefault } = useProforma();
  const vm = toViewModel(state.proforma, state.emisor);
  return (
    <div className="app">
      <Toolbar state={state} dispatch={dispatch} />
      <main className="workspace">
        <form className="editor" onSubmit={(event) => event.preventDefault()}>
          <Historial history={state.history} dispatch={dispatch} />
          <DocumentoFields proforma={state.proforma} dispatch={dispatch} />
          <EmisorFields emisor={state.emisor} dispatch={dispatch} />
          <LogoField logo={state.logo} logoDefault={logoDefault} dispatch={dispatch} />
          <ClienteFields cliente={state.proforma.cliente} dispatch={dispatch} />
          <LineasEditor lineas={state.proforma.lineas} errors={state.errors} total={formatTotal(total(state.proforma.lineas))} dispatch={dispatch} />
          <NotasFields proforma={state.proforma} dispatch={dispatch} />
        </form>
        <Preview vm={vm} logo={state.logo} />
      </main>
    </div>
  );
}
