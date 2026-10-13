import { parseDocument } from 'yaml';
import type { ZipWorkspace } from './archive';

/** DEV-003 is read-only. Semantic validation belongs to DEV-004. */
export const CANONICAL_FILES = ['version', 'metamodel', 'properties', 'constraints', 'viewpoints', 'notation', 'provenance', 'guidance'] as const;
export type CanonicalName = typeof CANONICAL_FILES[number];
export type RecordValue = Record<string, unknown>;
export type EntityKind = 'element' | 'relationship' | 'property' | 'propertySet' | 'dataType' | 'enumeration' | 'constraint' | 'viewpoint' | 'style' | 'source' | 'pattern' | 'antiPattern';
export interface MetamodelEntity { key: string; kind: EntityKind; id: string; name: string; file: CanonicalName; data: RecordValue; }
export interface ReferenceEdge { from: string; to: string; field: string; resolved: boolean; }
export interface ReferenceGraph { nodes: MetamodelEntity[]; edges: ReferenceEdge[]; unresolved: ReferenceEdge[]; }
export interface CanonicalDocument { name: CanonicalName; path: string; schemaVersion: number; data: RecordValue; }
export interface ParsedMetamodel { projectRoot: string; documents: Record<CanonicalName, CanonicalDocument>; modelVersion: string; graph: ReferenceGraph; }
export class UnsupportedSchemaVersion extends Error {
  constructor(public readonly filename: CanonicalName, public readonly found: unknown) {
    super(`Schema-version stöds inte i ${filename}.yaml: ${String(found)} (endast 1 stöds).`);
  }
}
const decode = new TextDecoder('utf-8', { fatal: true });
const obj = (v: unknown): v is RecordValue => typeof v === 'object' && v !== null && !Array.isArray(v);
const string = (v: unknown): string | undefined => typeof v === 'string' && v.length > 0 ? v : undefined;
const records = (v: unknown): RecordValue[] => Array.isArray(v) ? v.filter(obj) : [];
const asStrings = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
const keyOf = (kind: EntityKind, id: string): string => `${kind}:${id}`;

export function parseMetamodel(workspace: ZipWorkspace): ParsedMetamodel {
  const docs = {} as Record<CanonicalName, CanonicalDocument>;
  for (const name of CANONICAL_FILES) {
    const path = `${workspace.root}canonical/${name}.yaml`;
    const bytes = workspace.entries.get(path);
    if (!bytes) throw Error(`Kanonisk fil saknas: canonical/${name}.yaml`);
    const doc = parseDocument(decode.decode(bytes), { strict: true, uniqueKeys: true });
    if (doc.errors.length) throw Error(`YAML-fel i ${name}.yaml: ${doc.errors[0].message}`);
    const data: unknown = doc.toJS();
    if (!obj(data)) throw Error(`Felaktig dokumentrot i ${name}.yaml: förväntade objekt.`);
    if (data.schema_version !== 1) throw new UnsupportedSchemaVersion(name, data.schema_version);
    docs[name] = { name, path, schemaVersion: 1, data };
  }
  const v = docs.version.data.version;
  const modelVersion = obj(v) ? (string(v.current) ?? string(v.version) ?? string(v.semver) ?? 'unknown') : string(v) ?? 'unknown';
  return { projectRoot: workspace.root, documents: docs, modelVersion, graph: buildReferenceGraph(docs) };
}

export function buildReferenceGraph(docs: Record<CanonicalName, CanonicalDocument>): ReferenceGraph {
  const nodes: MetamodelEntity[] = [];
  const edges: ReferenceEdge[] = [];
  const add = (file: CanonicalName, field: string, kind: EntityKind, idField = 'id') => {
    for (const data of records(docs[file].data[field])) {
      const id = string(data[idField]);
      if (id) nodes.push({ key: keyOf(kind, id), kind, id, name: string(data.name) ?? id, file, data });
    }
  };
  add('metamodel','elements','element'); add('metamodel','relationships','relationship');
  add('properties','property_definitions','property'); add('properties','property_sets','propertySet');
  add('properties','data_types','dataType'); add('properties','enumerations','enumeration');
  add('constraints','constraints','constraint'); add('viewpoints','viewpoints','viewpoint');
  add('notation','styles','style'); add('provenance','sources','source');
  add('guidance','patterns','pattern'); add('guidance','anti_patterns','antiPattern');
  const known = new Set(nodes.map(n => n.key));
  const link = (from: string, kind: EntityKind, target: unknown, field: string) => {
    const id = string(target); if (id) { const to = keyOf(kind,id); edges.push({ from, to, field, resolved: known.has(to) }); }
  };
  const linkMany = (from: string, kind: EntityKind, values: unknown, field: string) => { for (const v of asStrings(values)) link(from, kind, v, field); };
  for (const n of nodes) {
    const d = n.data;
    if (n.kind === 'element') linkMany(n.key,'propertySet',d.property_sets,'property_sets');
    if (n.kind === 'relationship') {
      for (const end of ['source','target'] as const) {
        if (obj(d[end])) linkMany(n.key,'element',d[end].types,`${end}.types`);
      }
      linkMany(n.key,'propertySet',d.property_sets,'property_sets');
    }
    if (n.kind === 'propertySet') linkMany(n.key,'property',d.properties,'properties');
    if (n.kind === 'property' && obj(d.type)) {
      link(n.key,'dataType',d.type.data_type,'type.data_type');
      link(n.key,'enumeration',d.type.enumeration,'type.enumeration');
    }
    if (n.kind === 'viewpoint') {
      linkMany(n.key,'element',d.allowed_elements,'allowed_elements');
      linkMany(n.key,'relationship',d.allowed_relationships,'allowed_relationships');
    }
    if (n.kind === 'style' && obj(d.applies_to)) {
      if (d.applies_to.kind === 'element') link(n.key,'element',d.applies_to.type,'applies_to.type');
      if (d.applies_to.kind === 'relationship') link(n.key,'relationship',d.applies_to.type,'applies_to.type');
    }
  }
  // Guidance and provenance reference entities but are not themselves always identified entities.
  for (const [file, field, idField, kind] of [
    ['guidance','elements','type','element'], ['guidance','relationships','type','relationship'],
    ['guidance','viewpoints','viewpoint','viewpoint'],
  ] as const) {
    records(docs[file].data[field]).forEach((d, i) => {
      const id = string(d[idField]);
      if (id) { const from = `guidance:${field}:${i}`; link(from,kind,id,idField); }
    });
  }
  for (const [i,d] of records(docs.provenance.data.mappings).entries()) {
    if (obj(d.source)) link(`provenance:mappings:${i}`,'source',d.source.source_id,'source.source_id');
    if (obj(d.target)) {
      const kind = d.target.kind;
      const kinds: Record<string, EntityKind> = { element:'element', relationship:'relationship', property:'property', viewpoint:'viewpoint', constraint:'constraint' };
      if (typeof kind === 'string' && kinds[kind]) link(`provenance:mappings:${i}`,kinds[kind],d.target.id,'target.id');
    }
  }
  return { nodes, edges, unresolved: edges.filter(edge => !edge.resolved) };
}
