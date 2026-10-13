import { describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { inspectZip } from './inventory';
const root='demo/';
function archive(files:Record<string,string>) {return zipSync(Object.fromEntries(Object.entries(files).map(([k,v])=>[k,strToU8(v)])));}
describe('DEV-001 readonly inventory',()=>{
  it('finds canonical root and never mutates bytes',()=>{const bytes=archive({[`${root}canonical/metamodel.yaml`]:'id: demo',[`${root}canonical/guidance.yaml`]:'title: guide',[`${root}docs/keep.txt`]:'untouched'});const before=bytes.slice();const result=inspectZip(bytes,'demo.zip');expect(result.root).toBe(root);expect(result.entries).toHaveLength(3);expect(result.canonicalPresent).toContain('guidance.yaml');expect(bytes).toEqual(before);});
  it('rejects archives without canonical metamodel',()=>expect(()=>inspectZip(archive({'docs/file':'a'}),'bad.zip')).toThrow('canonical/metamodel.yaml'));
  it('reports missing canonical files without claiming validation',()=>{const x=inspectZip(archive({[`${root}canonical/metamodel.yaml`]:'hello'}),'a.zip');expect(x.canonicalMissing).toHaveLength(7);expect(x.warnings.join(' ')).toContain('Saknade kanoniska filer:');expect(x.warnings.join(' ')).toContain('properties.yaml');});
  it('rejects ambiguous project roots',()=>expect(()=>inspectZip(archive({'a/canonical/metamodel.yaml':'a','b/canonical/metamodel.yaml':'b'}),'bad.zip')).toThrow('exakt en'));
});
