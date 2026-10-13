import {describe,it,expect} from 'vitest';
import {zipSync} from 'fflate';
import {openZip} from './archive';
import {parseMetamodel,CANONICAL_FILES} from './metamodel';
import {validateMetamodel} from './validation';
const enc = new TextEncoder();
function make(overrides: Record<string,string>={}) {
 const files:Record<string,Uint8Array>={};
 for (const name of CANONICAL_FILES) files[`example/canonical/${name}.yaml`]=enc.encode(overrides[name] ?? 'schema_version: 1\n');
 return validateMetamodel(parseMetamodel(openZip(zipSync(files))));
}
describe('DEV-004 diagnostik',()=>{
 it('rapporterar obligatoriska schemafält med fil och sökväg',()=>{
  const report=make();expect(report.valid).toBe(false);
  expect(report.diagnostics.some(x=>x.file==='metamodel' && x.code==='SCHEMA_REQUIRED' && x.path==='/elements')).toBe(true);
 });
 it('hittar dubbletter och olösta referenser',()=>{
  const report=make({metamodel:'schema_version: 1\nelements:\n - id: app\n   name: App\n   property_sets: [unknown]\n - id: app\n   name: Dubblett\n'});
  expect(report.diagnostics.map(x=>x.code)).toContain('DUPLICATE_ID');
  expect(report.diagnostics.map(x=>x.code)).toContain('UNRESOLVED_REFERENCE');
 });
 it('behåller separata antal för fel, varning och information',()=>{
  const report=make();expect(report.counts.error).toBeGreaterThan(0);expect(report.counts.info).toBe(0);
 });
});
