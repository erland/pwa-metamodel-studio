import { editYaml, type ZipWorkspace } from './archive';
import { buildReferenceGraph, parseMetamodel, type ParsedMetamodel, type RecordValue } from './metamodel';
import { validateMetamodel } from './validation';
import { isNode, isSeq } from 'yaml';

export type EditableKind = 'element' | 'relationship' | 'property' | 'propertySet' | 'dataType' | 'enumeration' | 'viewpoint' | 'style' | 'source' | 'pattern' | 'antiPattern' | 'mapping' | 'guidanceElement' | 'guidanceRelationship' | 'guidanceViewpoint' | 'faq';
export type EditorAction = 'create' | 'update' | 'delete';
export interface EditCommand { action: EditorAction; kind: EditableKind; id: string; value?: RecordValue; }
export interface EditResult { workspace: ZipWorkspace; model: ParsedMetamodel; warnings: string[]; }
type EditableTarget = { file: 'metamodel' | 'properties' | 'viewpoints' | 'notation' | 'provenance' | 'guidance'; field: string };
const target = (kind: EditableKind): EditableTarget => ({
  element: {file:'metamodel',field:'elements'}, relationship:{file:'metamodel',field:'relationships'},
  property:{file:'properties',field:'property_definitions'}, propertySet:{file:'properties',field:'property_sets'},
  dataType:{file:'properties',field:'data_types'}, enumeration:{file:'properties',field:'enumerations'},
  viewpoint:{file:'viewpoints',field:'viewpoints'}, style:{file:'notation',field:'styles'}, source:{file:'provenance',field:'sources'},
  pattern:{file:'guidance',field:'patterns'}, antiPattern:{file:'guidance',field:'anti_patterns'},
  mapping:{file:'provenance',field:'mappings'}, guidanceElement:{file:'guidance',field:'elements'},
  guidanceRelationship:{file:'guidance',field:'relationships'}, guidanceViewpoint:{file:'guidance',field:'viewpoints'}, faq:{file:'guidance',field:'faq'},
} satisfies Record<EditableKind, EditableTarget>)[kind];
const isRecord = (v: unknown): v is RecordValue => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const idPattern = /^[a-z][a-z0-9_]*$/;

/** Immutable local change. Refuses to delete referenced entities and preserves YAML comments via editYaml. */
export function applyEdit(workspace: ZipWorkspace, command: EditCommand): EditResult {
  const before = parseMetamodel(workspace);
  const {action, kind, id, value} = command;
  if (!(['mapping','guidanceElement','guidanceRelationship','guidanceViewpoint','faq','pattern','antiPattern'].includes(kind) && (action === 'create' || /^\d+$/.test(id))) && !idPattern.test(id)) throw new Error('ID måste börja med liten bokstav och innehålla a–z, 0–9 eller _.');
  const {file, field} = target(kind);
  const items = before.documents[file].data[field];
  if (!Array.isArray(items)) throw new Error(`Samlingen ${field} saknas.`);
  const indexed = ['mapping','guidanceElement','guidanceRelationship','guidanceViewpoint','faq','pattern','antiPattern'].includes(kind);
  // Unkeyed collections use a stable-in-current-document numeric position for update/delete.
  const index = indexed ? (action === 'create' ? -1 : Number(id)) : items.findIndex(item => isRecord(item) && item.id === id);
  if (indexed && action !== 'create' && (!Number.isSafeInteger(index) || index < 0 || index >= items.length)) throw new Error('Ogiltigt listindex.');
  if (action === 'create' && index !== -1) throw new Error(`ID finns redan: ${id}`);
  if (action !== 'create' && index === -1) throw new Error(`ID saknas: ${id}`);
  if (action === 'delete') {
    const edges = before.graph.edges.filter(edge => edge.to === `${kind}:${id}`);
    if (edges.length) throw new Error(`Kan inte radera ${id}: ${edges.length} referenser finns (${edges.slice(0, 4).map(e => e.from).join(', ')}).`);
  } else {
    if (!isRecord(value)) throw new Error('Definitionen måste vara ett JSON-objekt.');
    if (!['mapping','guidanceElement','guidanceRelationship','guidanceViewpoint','faq','pattern','antiPattern'].includes(kind) && (value.id !== id || (kind !== 'style' && typeof value.name !== 'string'))) throw new Error('Objektet kräver oförändrat ID och ett namn.');
    if (kind === 'viewpoint' && (!Array.isArray(value.allowed_elements) || !Array.isArray(value.allowed_relationships))) throw new Error('En vy behöver tillåtna element och relationer.');
    if (kind === 'style' && (!isRecord(value.applies_to) || typeof value.shape !== 'string')) throw new Error('Notation kräver applies_to och shape.');
    if (kind === 'source' && typeof value.kind !== 'string') throw new Error('Källan kräver kind.');
    if (kind === 'mapping' && (!isRecord(value.target) || !isRecord(value.source) || typeof value.relationship !== 'string')) throw new Error('Mappning kräver target, source och relationship.');
    if (kind === 'faq' && (typeof value.question !== 'string' || typeof value.answer !== 'string')) throw new Error('FAQ kräver fråga och svar.');
    if (kind === 'relationship' && (!isRecord(value.source) || !isRecord(value.target))) throw new Error('Relationen kräver source och target.');
    if (kind === 'property' && (!isRecord(value.type) || Object.keys(value.type).length !== 1)) throw new Error('Egenskapen kräver precis en typ.');
    if (kind === 'propertySet' && !Array.isArray(value.properties)) throw new Error('Egenskapsmängden kräver en lista properties.');
    if (kind === 'dataType' && typeof value.base !== 'string') throw new Error('Datatypen kräver base.');
    if (kind === 'enumeration' && (!Array.isArray(value.values) || value.values.length === 0)) throw new Error('Uppräkningen kräver minst ett värde.');
  }
  const updated = editYaml(workspace, `canonical/${file}.yaml`, document => {
    const seq = document.get(field, true);
    if (!isSeq(seq)) throw new Error(`${field} är inte en YAML-lista.`);
    if (action === 'create') seq.items.push(document.createNode(value));
    else if (action === 'delete') seq.items.splice(index, 1);
    else {
      // Update in place to retain comments attached to existing YAML mapping when possible.
      const old = seq.items[index];
      const next = document.createNode(value);
      if (isNode(old) && isNode(next)) {
        next.commentBefore = old.commentBefore;
        next.comment = old.comment;
      }
      seq.items[index] = next;
    }
  });
  const model = parseMetamodel(updated);
  // Rebuild graph and reject newly introduced structural or semantic errors.
  const baseline = validateMetamodel(before).diagnostics.filter(d => d.severity === 'error');
  const key = (d: typeof baseline[number]) => `${d.code}:${d.file}:${d.path}`;
  const previousCounts = new Map<string, number>();
  baseline.forEach(d => previousCounts.set(key(d), (previousCounts.get(key(d)) ?? 0) + 1));
  const newErrors = validateMetamodel(model).diagnostics.filter(d => {
    if (d.severity !== 'error') return false;
    const k = key(d), remaining = previousCounts.get(k) ?? 0;
    if (remaining > 0) { previousCounts.set(k, remaining - 1); return false; }
    return true;
  });
  if (newErrors.length) throw new Error(`Ändringen introducerar valideringsfel: ${newErrors.slice(0,3).map(d => d.code + ' ' + d.message).join('; ')}`);
  return { workspace: updated, model: {...model, graph: buildReferenceGraph(model.documents)}, warnings: [] };
}

/** Edit the guide object without touching unrelated guidance collections. */
export function updateGuide(workspace: ZipWorkspace, value: RecordValue): EditResult {
  const before = parseMetamodel(workspace);
  if (!isRecord(value) || typeof value.title !== 'string') throw new Error('Guide behöver title.');
  const updated = editYaml(workspace, 'canonical/guidance.yaml', document => {
    document.set('guide', value);
  });
  const model = parseMetamodel(updated);
  const prior = validateMetamodel(before).diagnostics.filter(d => d.severity === 'error');
  const after = validateMetamodel(model).diagnostics.filter(d => d.severity === 'error');
  const count = (xs: typeof prior) => xs.reduce((m,d) => {const key=`${d.code}:${d.file}:${d.path}`;m.set(key,(m.get(key)??0)+1);return m;},new Map<string,number>());
  const baseline = count(prior);
  for (const d of after) {const key=`${d.code}:${d.file}:${d.path}`;const n=baseline.get(key)??0;if (n===0) throw new Error(`Valideringsfel: ${d.message}`);baseline.set(key,n-1);}
  return {workspace:updated,model,warnings:[]};
}
