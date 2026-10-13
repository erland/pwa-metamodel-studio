import type { ErrorObject } from 'ajv';
import * as validators from './generated/validators.js';
import type { CanonicalName, ParsedMetamodel, MetamodelEntity } from './metamodel';

export type Severity = 'error' | 'warning' | 'info';
export interface Diagnostic {
  severity: Severity;
  code: string;
  file: CanonicalName;
  path: string;
  message: string;
  entityKey?: string;
}
export interface ValidationReport {
  diagnostics: Diagnostic[];
  counts: Record<Severity, number>;
  valid: boolean;
}
const schemaNames = ['version','metamodel','properties','constraints','viewpoints','notation','provenance','guidance'] as const;
function pathOf(e: ErrorObject): string {
  const suffix = e.keyword === 'required' ? '/' + String(e.params.missingProperty) : e.keyword === 'additionalProperties' ? '/' + String(e.params.additionalProperty) : '';
  return (e.instancePath + suffix) || '/';
}
const escaped = (x: string): string => x.replace(/~/g,'~0').replace(/\//g,'~1');
const collections: Record<string,string> = {element:'elements',relationship:'relationships',property:'property_definitions',propertySet:'property_sets',dataType:'data_types',enumeration:'enumerations',constraint:'constraints',viewpoint:'viewpoints',style:'styles',source:'sources',pattern:'patterns',antiPattern:'anti_patterns'};
function nodePath(n: MetamodelEntity, index: number): string { return `/${collections[n.kind]}/${index}`; }
/** Validerar v1-struktur samt referenser. Naturliga språkregler kan inte exekveras. */
export function validateMetamodel(model: ParsedMetamodel): ValidationReport {
  const diagnostics: Diagnostic[] = [];
  const issue = (severity: Severity, code: string, file: CanonicalName, path: string, message: string, entityKey?: string) => diagnostics.push({severity,code,file,path,message, ...(entityKey ? {entityKey} : {})});
  for (const name of schemaNames) {
    const valid = validators[name](model.documents[name].data);
    if (!valid) for (const error of validators[name].errors ?? []) {
      issue('error','SCHEMA_'+error.keyword.toUpperCase(),name,pathOf(error),`JSON Schema: ${error.message ?? error.keyword}`);
    }
  }
  const groups = new Map<string,MetamodelEntity[]>();
  const locations = new Map<string,string>();
  for (const n of model.graph.nodes) {
    const index = model.graph.nodes.filter(x => x.kind === n.kind && x.file === n.file).indexOf(n);
    const path = nodePath(n,index);
    locations.set(n.key,path);
    const group = groups.get(n.key) ?? [];group.push(n);groups.set(n.key,group);
  }
  for (const [key,nodes] of groups) if(nodes.length > 1) for(const node of nodes.slice(1)) {
    issue('error','DUPLICATE_ID',node.file,locations.get(key) ?? '/',`Duplicerat ID inom ${node.kind}: ${node.id}`,key);
  }
  for (const edge of model.graph.unresolved) {
    const owner = model.graph.nodes.find(n=>n.key===edge.from);
    const file: CanonicalName = owner?.file ?? (edge.from.startsWith('guidance:') ? 'guidance' : 'provenance');
    const field = edge.field.split('.').map(escaped).join('/');
    issue('error','UNRESOLVED_REFERENCE',file,(owner ? locations.get(owner.key) ?? '' : '/')+'/'+field,`Okänd referens: ${edge.to} (från ${edge.from})`,owner?.key);
  }
  // Check the cardinalities not representable by generic cross-document references.
  for (const r of model.graph.nodes.filter(n=>n.kind==='relationship')) {
    for (const end of ['source','target'] as const) {
      const part = r.data[end];
      if (typeof part !== 'object' || part === null || Array.isArray(part)) continue;
      const cardinality = (part as Record<string,unknown>).cardinality;
      if (typeof cardinality !== 'string') continue; // Schema will report missing/wrong type.
      const m = /^(\d+)\.\.(\d+|\*)$/.exec(cardinality);
      if(m && m[2] !== '*' && Number(m[1]) > Number(m[2])) issue('error','CARDINALITY_RANGE','metamodel',(locations.get(r.key) ?? '')+'/'+end+'/cardinality',`Ogiltigt intervall: ${cardinality}`,r.key);
    }
  }
  // Document natural-language model constraints without falsely claiming that they are executable.
  const natural = model.graph.nodes.filter(n=>n.kind==='constraint' && typeof n.data.rule==='object' && n.data.rule !== null && (n.data.rule as Record<string,unknown>).language === 'natural_language');
  if(natural.length) issue('info','NON_EXECUTABLE_CONSTRAINTS','constraints','/constraints',`${natural.length} naturliga språkregler kräver mänsklig bedömning och har inte exekverats.`);
  diagnostics.sort((a,b)=>({error:0,warning:1,info:2}[a.severity]-{error:0,warning:1,info:2}[b.severity]) || a.file.localeCompare(b.file) || a.path.localeCompare(b.path));
  const counts = {error:0,warning:0,info:0};
  for (const d of diagnostics) counts[d.severity]++;
  return {diagnostics,counts,valid:counts.error===0};
}
