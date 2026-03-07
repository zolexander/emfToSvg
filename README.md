# emfToSvg

Ein TypeScript/Node.js-Converter für alte Windows-Metafile-Formate:

- `EMF` → `SVG`
- `WMF` → `SVG`
- `EMZ` (gzip-komprimiertes EMF) → `SVG`
- `WMZ` (gzip-komprimiertes WMF) → `SVG`

Das Paket ist für serverseitige Nutzung in Node.js gedacht.

## Installation

### Empfohlen: direkt aus dem neuesten GitHub Release

```bash
npm i https://github.com/jzolme/emfToSvg/releases/latest/download/emftosvg.tgz
```

Damit musst du bei neuen Releases keine Versions-URL im Consumer-Projekt anpassen.

### Alternativ: spezifisches Release pinnen

```bash
npm i https://github.com/jzolme/emfToSvg/releases/download/v0.2.6/emftosvg-0.2.6.tgz
```

## Schnellstart

```ts
import { EMFConverter, WMFConverter } from 'emftosvg';

const logger = (message: string) => console.log(message);

const emfConverter = new EMFConverter(logger);
const wmfConverter = new WMFConverter(logger);

async function run() {
	const emfResult = await emfConverter.convertEmf('input/source.emf');
	if (emfResult.returnValue === 0) {
		console.log('EMF SVG length:', emfResult.svg.length);
	}

	const wmfResult = await wmfConverter.convertWMF('input/source.wmf');
	if (wmfResult.returnValue === 0) {
		console.log('WMF SVG length:', wmfResult.svg.length);
	}
}

run();
```

## Dateien direkt als SVG schreiben

```ts
import { EMFConverter, WMFConverter } from 'emftosvg';

const logger = (message: string) => console.log(message);

async function convertToFiles() {
	const emf = new EMFConverter(logger);
	const wmf = new WMFConverter(logger);

	await emf.convertEmfToFile('input/image.emf', 'output/image.emf.svg');
	await emf.convertEMZToFile('input/image.emz', 'output/image.emz.svg');

	await wmf.convertWMFToFile('input/image.wmf', 'output/image.wmf.svg');
	await wmf.convertWMZToFile('input/image.wmz', 'output/image.wmz.svg');
}

convertToFiles();
```

## API

### Exporte

```ts
import {
	EMFConverter,
	EMFConvertResult,
	WMFConverter,
	WMFConvertResult,
} from 'emftosvg';
```

### `EMFConverter`

Konstruktor:

```ts
new EMFConverter(logger: (message: string) => void)
```

Methoden:

- `convertEMFBuffer(buffer: Buffer, settings?) => EMFConvertResult`
- `convertEmf(inputFile: string, settings?) => Promise<EMFConvertResult>`
- `convertEmfToFile(inputFile: string, outFile: string, settings?) => Promise<EMFConvertResult>`
- `convertEMZ(inputFile: string, settings?) => Promise<EMFConvertResult>`
- `convertEMZToFile(inputFile: string, outFile: string, settings?) => Promise<EMFConvertResult>`

`EMFConvertResult`:

```ts
interface EMFConvertResult {
	svg: string;
	returnValue: number; // 0 = ok, -1 = Fehler
	height?: number;
	width?: number;
}
```

### `WMFConverter`

Konstruktor:

```ts
new WMFConverter(logger: (message: string, level?: string) => void)
```

Methoden:

- `convertWMF(inputFile: string) => Promise<WMFConvertResult>`
- `convertWMFToFile(inputFile: string, outFile: string) => Promise<WMFConvertResult>`
- `convertWMZ(inputFile: string) => Promise<WMFConvertResult>`
- `convertWMZToFile(inputFile: string, outFile: string) => Promise<WMFConvertResult>`

`WMFConvertResult`:

```ts
interface WMFConvertResult {
	svg: string;
	returnValue: number; // 0 = ok, -1 = Fehler
}
```

## Eigene Renderer-Settings (EMF)

Für EMF kannst du optional eigene Render-Settings mitgeben (z. B. feste Maße oder Skalierung). Wenn keine Settings gesetzt sind, werden sie aus dem EMF-Header abgeleitet.

Beispiel:

```ts
const result = await emfConverter.convertEmf('input.emf', {
	width: '1200px',
	height: '800px',
	wExt: 1200,
	hExt: 800,
	xExt: 1200,
	yExt: 800,
	mapMode: 8,
	endScale: 0.1,
});
```

## Entwicklung

```bash
npm install
npm run build
npm test
```

## Lizenz

MIT – siehe [LICENSE](LICENSE).

---

## English

TypeScript/Node.js converter for legacy Windows metafile formats:

- `EMF` → `SVG`
- `WMF` → `SVG`
- `EMZ` (gzip-compressed EMF) → `SVG`
- `WMZ` (gzip-compressed WMF) → `SVG`

### Install

Recommended (always latest GitHub Release asset):

```bash
npm i https://github.com/jzolme/emfToSvg/releases/latest/download/emftosvg.tgz
```

Pinned release example:

```bash
npm i https://github.com/jzolme/emfToSvg/releases/download/v0.2.6/emftosvg-0.2.6.tgz
```

### Quickstart

```ts
import { EMFConverter, WMFConverter } from 'emftosvg';

const logger = (message: string) => console.log(message);

const emf = new EMFConverter(logger);
const wmf = new WMFConverter(logger);

async function main() {
	const emfResult = await emf.convertEmf('input/source.emf');
	const wmfResult = await wmf.convertWMF('input/source.wmf');

	if (emfResult.returnValue === 0) console.log(emfResult.svg);
	if (wmfResult.returnValue === 0) console.log(wmfResult.svg);
}

main();
```

### API (summary)

Exports:

```ts
import {
	EMFConverter,
	EMFConvertResult,
	WMFConverter,
	WMFConvertResult,
} from 'emftosvg';
```

`EMFConverter`:

- `convertEMFBuffer(buffer: Buffer, settings?) => EMFConvertResult`
- `convertEmf(inputFile: string, settings?) => Promise<EMFConvertResult>`
- `convertEmfToFile(inputFile: string, outFile: string, settings?) => Promise<EMFConvertResult>`
- `convertEMZ(inputFile: string, settings?) => Promise<EMFConvertResult>`
- `convertEMZToFile(inputFile: string, outFile: string, settings?) => Promise<EMFConvertResult>`

`WMFConverter`:

- `convertWMF(inputFile: string) => Promise<WMFConvertResult>`
- `convertWMFToFile(inputFile: string, outFile: string) => Promise<WMFConvertResult>`
- `convertWMZ(inputFile: string) => Promise<WMFConvertResult>`
- `convertWMZToFile(inputFile: string, outFile: string) => Promise<WMFConvertResult>`