import { openZip } from './archive';

export const CANONICAL_FILES = [
  'metamodel.yaml', 'properties.yaml', 'constraints.yaml', 'viewpoints.yaml',
  'notation.yaml', 'provenance.yaml', 'version.yaml', 'guidance.yaml',
] as const;

export interface ArchiveEntry { path: string; size: number; canonical: boolean }
export interface ArchiveInventory { archiveName: string; root: string; entries: ArchiveEntry[]; canonicalPresent: string[]; canonicalMissing: string[]; warnings: string[] }

/** DEV-002: archive preflight must pass before inventory extraction. */
export function inspectZip(bytes: Uint8Array, archiveName: string): ArchiveInventory {
  const names = [...openZip(bytes).entries];
  if (names.length === 0) throw new Error('ZIP-arkivet innehåller inga filer.');
  const paths = names.map(([name]) => name);
  const candidates = paths.filter(path => path.endsWith('/canonical/metamodel.yaml'));
  if (candidates.length !== 1) throw new Error('ZIP behöver exakt en projektrot med canonical/metamodel.yaml.');
  const root = candidates[0].slice(0, -'canonical/metamodel.yaml'.length);
  const present = CANONICAL_FILES.filter(f => paths.includes(`${root}canonical/${f}`));
  const missing = CANONICAL_FILES.filter(f => !present.includes(f));
  return {
    archiveName, root, entries: names.map(([path, value]) => ({path, size:value.byteLength,canonical:path.startsWith(`${root}canonical/`)})).sort((a,b)=>a.path.localeCompare(b.path)),
    canonicalPresent: [...present], canonicalMissing: [...missing],
    warnings: ['Säkra ZIP-gränser kontrollerade; full schema- och semantikvalidering genomförs först i DEV-004.', ...(missing.length ? [`Saknade kanoniska filer: ${missing.join(', ')}`] : [])],
  };
}
