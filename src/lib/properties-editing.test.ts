import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { openZip, exportZip } from './archive';
import { applyEdit } from './editing';
import { parseMetamodel } from './metamodel';
const original = () => openZip(new Uint8Array(readFileSync('public/fixtures/application-architecture-metamodel-0.7.0.zip')));
describe('DEV-007 properties CRUD', () => {
  it('creates a data type without mutating source', () => {
    const source = original();
    const result = applyEdit(source,{action:'create',kind:'dataType',id:'dev007_type',value:{id:'dev007_type',name:'Dev007 Type',base:'string'}});
    expect(result.model.graph.nodes.some(n=>n.key==='dataType:dev007_type')).toBe(true);
    expect(parseMetamodel(source).graph.nodes.some(n=>n.key==='dataType:dev007_type')).toBe(false);
    expect(result.workspace.changed.has(source.root+'canonical/properties.yaml')).toBe(true);
  });
  it('creates property and property set with linked references', () => {
    const source = original();
    const p = applyEdit(source,{action:'create',kind:'property',id:'dev007_prop',value:{id:'dev007_prop',name:'Dev007 Prop',type:{builtin:'string'}}});
    const set = applyEdit(p.workspace,{action:'create',kind:'propertySet',id:'dev007_set',value:{id:'dev007_set',name:'Dev007 Set',properties:['dev007_prop']}});
    expect(set.model.graph.edges.some(e=>e.from==='propertySet:dev007_set' && e.to==='property:dev007_prop' && e.resolved)).toBe(true);
    expect(()=>applyEdit(set.workspace,{action:'delete',kind:'property',id:'dev007_prop'})).toThrow(/referenser/);
    expect(parseMetamodel(openZip(exportZip(set.workspace))).graph.nodes.some(n=>n.key==='propertySet:dev007_set')).toBe(true);
  });
  it('rejects references to missing types', () => {
    expect(()=>applyEdit(original(),{action:'create',kind:'property',id:'dev007_missing',value:{id:'dev007_missing',name:'Missing',type:{data_type:'missing_type'}}})).toThrow(/valideringsfel/);
  });
  it('creates and updates enumerations', () => {
    const source = original();
    const value={id:'dev007_enum',name:'Enum',values:[{id:'one',name:'One'}]};
    const created=applyEdit(source,{action:'create',kind:'enumeration',id:value.id,value});
    const changed=applyEdit(created.workspace,{action:'update',kind:'enumeration',id:value.id,value:{...value,description:'Test'}});
    expect(changed.model.graph.nodes.find(n=>n.key==='enumeration:dev007_enum')?.data.description).toBe('Test');
  });
});
