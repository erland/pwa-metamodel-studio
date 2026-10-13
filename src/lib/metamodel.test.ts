import { describe, expect, it } from 'vitest';
import { zipSync } from 'fflate';
import { openZip } from './archive';
import { CANONICAL_FILES, parseMetamodel, UnsupportedSchemaVersion } from './metamodel';
const enc = new TextEncoder();
function fixture(change?: {name: string; text: string}) {
  const entries: Record<string, Uint8Array> = {};
  for (const name of CANONICAL_FILES) entries[`sample/canonical/${name}.yaml`] = enc.encode(change?.name === name ? change.text : 'schema_version: 1\n');
  return openZip(zipSync(entries));
}
describe('DEV-003 versionerad metamodell', () => {
  it('läser alla åtta kanoniska dokument', () => { const result = parseMetamodel(fixture()); expect(Object.keys(result.documents)).toHaveLength(8); });
  it('avvisar okända schemaversioner', () => expect(() => parseMetamodel(fixture({name:'guidance',text:'schema_version: 2\n'}))).toThrow(UnsupportedSchemaVersion));
  it('skapar riktade kanter och redovisar olösta referenser utan att ändra data', () => {
    const m = parseMetamodel(fixture({name:'metamodel',text:'schema_version: 1\nelements:\n  - id: app\n    property_sets: [missing]\n'}));
    expect(m.graph.nodes.some(n=>n.key==='element:app')).toBe(true);
    expect(m.graph.unresolved).toEqual(expect.arrayContaining([expect.objectContaining({to:'propertySet:missing'})]));
  });
  it('avvisar saknad obligatorisk fil', () => {const w = fixture(); w.entries.delete('sample/canonical/guidance.yaml'); expect(()=>parseMetamodel(w)).toThrow('saknas');});
});
