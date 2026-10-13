import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { openZip, editYaml } from './archive';
import { changeVersion, diffFromImport, exportRelease, staleArtifacts } from './release';

const fixture = new Uint8Array(readFileSync('public/fixtures/application-architecture-metamodel-0.7.0.zip'));
describe('DEV-010 release protection', () => {
  it('returns unmodified ZIP byte-for-byte', () => {
    const w=openZip(fixture); expect(exportRelease(w,'exclude').bytes).toEqual(fixture);
    expect(diffFromImport(w)).toEqual([]); expect(staleArtifacts(w)).toEqual([]);
  });
  it('detects changed canonical files and stale generated artifacts', () => {
    const w=editYaml(openZip(fixture),'canonical/guidance.yaml',d => d.setIn(['dev010_test'],'changed'));
    expect(diffFromImport(w).some(d=>d.canonical)).toBe(true);
    const stale=staleArtifacts(w);expect(stale.some(s=>s.includes('generated/documentation/'))).toBe(true);
    const output=exportRelease(w,'exclude');
    expect(output.excluded).toHaveLength(stale.length);
    const exported=openZip(output.bytes);
    expect([...exported.entries.keys()].some(p=>p.includes('generated/'))).toBe(false);
    expect([...exported.entries.keys()].some(p=>p.endsWith('metamodel-studio-export-status.json'))).toBe(true);
  });
  it('requires acknowledgement before retaining stale files', () => {
    const w=editYaml(openZip(fixture),'canonical/guidance.yaml',d=>d.setIn(['dev010_test'],'changed'));
    expect(()=>exportRelease(w,'retain-with-warning')).toThrow('bekräfta');
    expect(exportRelease(w,'retain-with-warning',true).excluded).toEqual([]);
  });
  it('validates semver input', () => {
    expect(()=>changeVersion(openZip(fixture),'wrong','')).toThrow('semantisk');
  });
});
