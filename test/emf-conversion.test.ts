import fs from 'fs';
import path from 'path';
import { Renderer as EMFRenderer, parse as emfParse } from '../src/emfjs/Renderer';
import { Renderer as WMFRenderer, parse as wmfParse } from '../src/wmfjs/Renderer';

interface Settings {
  width: string;
  height: string;
  wExt: number;
  hExt: number;
  xExt: number;
  yExt: number;
  endScale: number;
  mapMode: number;
}

const DEFAULT_SETTINGS: Settings = {
  width: '0',
  height: '0',
  wExt: 0,
  hExt: 0,
  xExt: 0,
  yExt: 0,
  endScale: 1,
  mapMode: 1,
};

// helper to iterate over test directories
function collectCases(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(dir, d.name));
}

describe('EMF -> SVG', () => {
  const base = path.join(__dirname, 'emf-test-files');
  const cases = collectCases(base);

  cases.forEach((caseDir) => {
    const name = path.basename(caseDir);
    it(`converts ${name} and matches snapshot`, () => {
      const emfPath = path.join(caseDir, 'source.emf');
      const buffer = fs.readFileSync(emfPath);
      const renderer = new EMFRenderer(buffer.buffer);
      const svg = renderer.render(DEFAULT_SETTINGS);
      expect(svg).toMatchSnapshot();
    });
  });
});

describe('WMF -> SVG', () => {
  const base = path.join(__dirname, 'wmf-test-files');
  const cases = collectCases(base);

  cases.forEach((caseDir) => {
    const name = path.basename(caseDir);
    it(`converts ${name} and matches snapshot`, () => {
      const wmfPath = path.join(caseDir, 'source.wmf');
      const buffer = fs.readFileSync(wmfPath);
      const renderer = new WMFRenderer(buffer.buffer);
      const svg = renderer.render({
        width: '0',
        height: '0',
        xExt: 0,
        yExt: 0,
        mapMode: 1,
      } as any);
      expect(svg).toMatchSnapshot();
    });
  });
});
