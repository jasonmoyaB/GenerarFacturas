import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'assets/logo.png');
const target = resolve(root, 'js/logo-data.js');
const PNG_SIGNATURE = '89504e470d0a1a0a';

function readDimensions(png) {
  if (png.subarray(0, 8).toString('hex') !== PNG_SIGNATURE || png.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('assets/logo.png no es un PNG válido');
  }
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  if (!width || !height) throw new Error('assets/logo.png tiene dimensiones inválidas');
  return { width, height };
}

async function logoModule() {
  try {
    const png = await readFile(source);
    const { width, height } = readDimensions(png);
    const dataUrl = `data:image/png;base64,${png.toString('base64')}`;
    console.log(`Logo embebido: ${width}x${height}px`);
    return `export default ${JSON.stringify({ dataUrl, width, height })};\n`;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    console.warn('assets/logo.png no existe; se usará logo = null.');
    return 'export default null;\n';
  }
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, await logoModule(), 'utf8');
