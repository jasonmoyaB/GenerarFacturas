import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Packer } from 'docx';
import logo from '../js/logo-data.js';
import { addDays, todayISO } from '../src/core/dates.js';
import { EJEMPLO, EMISOR_DEFAULT } from '../src/core/defaults.js';
import { toViewModel } from '../src/core/view-model.js';
import { buildDocument } from '../src/docx/build-document.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = resolve(root, 'out');
const docxPath = resolve(outDir, 'ejemplo.docx');
const pdfPath = resolve(outDir, 'ejemplo.pdf');

function findSoffice() {
  const candidates = process.platform === 'win32'
    ? ['C:\\Program Files\\LibreOffice\\program\\soffice.exe', 'soffice']
    : ['soffice'];
  return candidates.find((candidate) => (
    existsSync(candidate) || spawnSync(candidate, ['--version'], { stdio: 'ignore' }).status === 0
  ));
}

async function verifyPdf() {
  const soffice = findSoffice();
  if (!soffice) {
    console.log('LibreOffice no está instalado; se omite la comprobación de PDF.');
    return;
  }
  await rm(pdfPath, { force: true });
  const result = spawnSync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', outDir, docxPath], {
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'LibreOffice falló');
  const pdf = await readFile(pdfPath, 'latin1');
  const pages = pdf.match(/\/Type\s*\/Page\b/g)?.length ?? 0;
  if (pages !== 1) throw new Error(`El PDF generado tiene ${pages} páginas; se esperaba 1.`);
  console.log('PDF verificado: 1 página.');
}

const hoy = todayISO();
const proforma = { ...EJEMPLO, fechaEmision: hoy, validaHasta: addDays(hoy, 15) };
const vm = toViewModel(proforma, EMISOR_DEFAULT);
await mkdir(outDir, { recursive: true });
await writeFile(docxPath, await Packer.toBuffer(buildDocument(vm, logo)));
console.log(`DOCX generado: ${docxPath}`);
await verifyPdf();
