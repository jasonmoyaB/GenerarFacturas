# Verificación final

Fecha: 2026-09-25

## Resultado

| Comando | Resultado |
|---------|-----------|
| `npm test` | 10/10 pruebas pasan |
| `npm run build` | Build de producción correcto; Vite advierte que el bundle con `docx` supera 500 kB |
| `node scripts/embed-logo.mjs` | Correcto; no existe `assets/logo.png`, por lo que genera `logo = null` según A14 |
| `node scripts/test-docx.mjs` | Genera `out/ejemplo.docx` correctamente |
| Validación del OOXML | Correcto: tamaño carta, tablas fijas, `lineRule="auto"`, `cantSplit`, `tblHeader`, tabs, numbering y una fila de total |
| Prueba con logo PNG en memoria | Correcto; el paquete contiene una imagen en `word/media` |
| Conversión PDF con LibreOffice | Omitida: LibreOffice no está instalado en este equipo |

La comprobación visual de una página en Word o LibreOffice queda pendiente por la ausencia de esas aplicaciones. El script la ejecutará y exigirá exactamente una página cuando encuentre `soffice`.

## Árbol relevante

```text
GenFacturas/
├── index.html
├── package.json
├── public/
│   ├── icon.svg
│   ├── manifest.webmanifest
│   └── sw.js
├── js/
│   └── logo-data.js
├── scripts/
│   ├── embed-logo.mjs
│   └── test-docx.mjs
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── core/
│   ├── docx/
│   │   ├── blocks.js
│   │   ├── build-document.js
│   │   └── styles.js
│   ├── platform/
│   │   ├── download.js
│   │   ├── logo-bw.js
│   │   └── storage.js
│   ├── state/
│   │   ├── reducer.js
│   │   └── useProforma.js
│   └── ui/
│       ├── Field.jsx
│       ├── Toolbar.jsx
│       ├── form/
│       └── preview/
└── tests/
    └── core.test.js
```

## Ejecución

```bash
npm ci
npm run dev
npm test
npm run build
npx serve dist
npm run embed-logo
npm run test-docx
```
