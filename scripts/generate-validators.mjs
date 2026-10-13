import Ajv2020 from 'ajv/dist/2020.js';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const dir = new URL('../src/lib/schemas/', import.meta.url);
const names = ['version','metamodel','properties','constraints','viewpoints','notation','provenance','guidance'];
async function schema(name) {
  return JSON.parse(await readFile(new URL(name + '.schema.json', dir), 'utf8'));
}
const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false, code: { source: true, esm: true } });
ajv.addSchema(await schema('common-definitions'));
const ids = {};
for (const name of names) {
  const definition = await schema(name);
  ajv.addSchema(definition);
  ids[name] = definition.$id;
}
// Ajv emits CommonJS runtime helpers even with esm: true. Convert those static
// require() calls to ESM imports so Vite can bundle them for browser execution.
const raw = standaloneCode(ajv, ids);
const runtimeModules = new Map();
const outputBody = raw.replace(/require\\(["'](ajv\\/dist\\/runtime\\/[^"']+)["']\\)/g, (_match, modulePath) => {
  if (!runtimeModules.has(modulePath)) runtimeModules.set(modulePath, `__ajvRuntime${runtimeModules.size}`);
  return runtimeModules.get(modulePath);
});
if (/\\brequire\\s*\\(/.test(outputBody)) throw new Error('Unconverted CommonJS require in generated validators');
const imports = [...runtimeModules].map(([path, variable]) =>
  `import * as ${variable} from '${path}.js';`
).join('\n');
const output = imports + '\n' + outputBody;
const target = new URL('../src/lib/generated/', import.meta.url);
await mkdir(target, { recursive: true });
await writeFile(new URL('validators.js', target), output);
console.log('Generated standalone JSON Schema validators:', names.join(', '));
