import { describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { editYaml, exportZip, openZip, preflightZip } from './archive';
const sample = () => zipSync({
  'demo/canonical/metamodel.yaml': strToU8('# Kommentar\nname: Original\n'),
  'demo/other.bin': Uint8Array.from([0, 255, 2, 8]),
});
describe('DEV-002 ZIP security and round trip', () => {
  it('preserves unchanged compressed archive bytes', () => {
    const original = sample();
    expect(exportZip(openZip(original))).toEqual(original);
  });
  it('preserves unknown binary entry after editing YAML and retains comments', () => {
    const workspace = openZip(sample());
    const updated = editYaml(workspace, 'canonical/metamodel.yaml', doc => doc.set('name', 'Ny'));
    const reopened = openZip(exportZip(updated));
    expect(reopened.entries.get('demo/other.bin')).toEqual(workspace.entries.get('demo/other.bin'));
    expect(new TextDecoder().decode(reopened.entries.get('demo/canonical/metamodel.yaml'))).toContain('# Kommentar');
    expect(new TextDecoder().decode(reopened.entries.get('demo/canonical/metamodel.yaml'))).toContain('Ny');
  });
  it('rejects traversal', () => {
    expect(() => preflightZip(zipSync({'../demo/canonical/metamodel.yaml': strToU8('a')}))).toThrow(/Osäker/);
  });
  it('rejects oversized archives', () => {
    expect(() => preflightZip(new Uint8Array(32 * 1024 * 1024 + 1))).toThrow(/storleksgränsen/);
  });
  it('rejects missing model root', () => {
    expect(() => openZip(zipSync({'readme.txt': strToU8('a')}))).toThrow(/projektrot/);
  });
});
