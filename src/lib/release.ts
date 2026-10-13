import { zipSync } from 'fflate';
import { editYaml, exportZip, openZip, preflightZip, type ZipWorkspace } from './archive';
import { CANONICAL_FILES, parseMetamodel, type CanonicalName } from './metamodel';
import { validateMetamodel } from './validation';

const enc = new TextEncoder();
export type DiffEntry = { path: string; status: 'added'|'removed'|'modified'; canonical: boolean };
export type StalePolicy = 'exclude'|'retain-with-warning';
export type ExportResult = { bytes: Uint8Array; excluded: string[]; stale: string[]; changed: DiffEntry[] };
const equals = (a?: Uint8Array,b?: Uint8Array): boolean => !!a && !!b && a.length === b.length && a.every((v,i)=>v===b[i]);
export function compareArchives(base: ZipWorkspace, current: ZipWorkspace): DiffEntry[] {
  const result: DiffEntry[] = [];
  for (const path of new Set([...base.entries.keys(), ...current.entries.keys()])) {
    const a=base.entries.get(path), b=current.entries.get(path);
    if (a && b && equals(a,b)) continue;
    result.push({ path, status: !a?'added':!b?'removed':'modified', canonical: path.startsWith(current.root+'canonical/') && path.endsWith('.yaml') });
  }
  return result.sort((a,b)=>a.path.localeCompare(b.path));
}
export function originalWorkspace(current: ZipWorkspace): ZipWorkspace { return openZip(current.original); }
export function diffFromImport(current: ZipWorkspace): DiffEntry[] { return compareArchives(originalWorkspace(current),current); }
export function generatedArtifacts(current: ZipWorkspace): string[] {
  // Strict path classification: do not classify hand-maintained platform mappings as generated.
  return [...current.entries.keys()].filter(p => p.startsWith(current.root+'generated/')).sort();
}
export function staleArtifacts(current: ZipWorkspace): string[] {
  return diffFromImport(current).some(d=>d.canonical) ? generatedArtifacts(current) : [];
}
export function changeVersion(current: ZipWorkspace, next: string, notes: string): ZipWorkspace {
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(next)) throw Error('Ange en giltig semantisk version (t.ex. 0.8.0).');
  const prior = parseMetamodel(current).modelVersion;
  if (next === prior) throw Error('Ny version måste skilja sig från den nuvarande.');
  const updated=editYaml(current,'canonical/version.yaml',doc=> {
    doc.setIn(['version','current'],next);
    doc.setIn(['version','release_notes'],notes.trim() || `Ändringar sedan ${prior}.`);
  });
  const parsed=parseMetamodel(updated);
  if (validateMetamodel(parsed).counts.error) throw Error('Versionsändringen bryter mot modellens valideringsregler.');
  return updated;
}
export function exportRelease(current: ZipWorkspace, policy: StalePolicy, acknowledge=false): ExportResult {
  const changed=diffFromImport(current);
  const stale=staleArtifacts(current);
  if (!stale.length) return {bytes:exportZip(current),excluded:[],stale:[],changed};
  if (policy==='retain-with-warning' && !acknowledge) throw Error('Du måste uttryckligen bekräfta att genererade filer är inaktuella.');
  const entries: Record<string,Uint8Array>={};
  const excluded: string[]=[];
  for (const [path,data] of current.entries) {
    if (policy==='exclude' && stale.includes(path)) {excluded.push(path);continue;}
    entries[path]=data;
  }
  // Manifest is advisory, not a replacement for regenerating generated artifacts.
  const manifestPath=current.root+'metamodel-studio-export-status.json';
  if (entries[manifestPath]) throw Error('Exportstatusfil finns redan: exportera utan att skriva över befintligt innehåll.');
  entries[manifestPath]=enc.encode(JSON.stringify({
    schema:'metamodel-studio-export-status/v1',
    model_version:parseMetamodel(current).modelVersion,
    generated_status:policy==='exclude'?'excluded-stale':'retained-stale-DO-NOT-USE',
    canonical_changes:changed.filter(d=>d.canonical).map(d=>({path:d.path,status:d.status})),
    stale_artifacts:stale,
    excluded_artifacts:excluded,
    warning:'Genererade artefakter har inte regenererats av Metamodel Studio.'
  },null,2)+'\n');
  const bytes=zipSync(entries,{level:6}); preflightZip(bytes);
  const checked=openZip(bytes);
  for (const file of CANONICAL_FILES) {
    const path=current.root+`canonical/${file}.yaml`;
    if (!equals(checked.entries.get(path),current.entries.get(path))) throw Error('Kanonisk fil har förändrats under exporten: '+file);
  }
  return {bytes,excluded,stale,changed};
}
export function compareRevision(current: ZipWorkspace, revisionBytes: Uint8Array): DiffEntry[] {
  return compareArchives(openZip(new Uint8Array(revisionBytes)),current);
}
export function summarizeDiff(items: DiffEntry[]): Record<CanonicalName,number> {
  return Object.fromEntries(CANONICAL_FILES.map(n=>[n,items.filter(d=>d.path.endsWith('/canonical/'+n+'.yaml')).length])) as Record<CanonicalName,number>;
}
