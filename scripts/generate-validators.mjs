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
const output = standaloneCode(ajv, ids);
const target = new URL('../src/lib/generated/', import.meta.url);
await mkdir(target, { recursive: true });
await writeFile(new URL('validators.js', target), output);
console.log('Generated standalone JSON Schema validators:', names.join(', '));
