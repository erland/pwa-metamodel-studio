import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { openZip } from './archive';
import { applyEdit } from './editing';
import { parseMetamodel } from './metamodel';
const load = () => openZip(new Uint8Array(readFileSync('public/fixtures/application-architecture-metamodel-0.7.0.zip')));
describe('DEV-006 local editing', () => {
  it('creates an element and rebuilds the reference graph without mutating input', () => {
    const original = load();
    const result = applyEdit(original,{action:'create',kind:'element',id:'example_new',value:{id:'example_new',name:'Example New',kind:'structure',description:'Test',property_sets:[]}});
    expect(result.model.graph.nodes.some(n=>n.key==='element:example_new')).toBe(true);
    expect(parseMetamodel(original).graph.nodes.some(n=>n.key==='element:example_new')).toBe(false);
  });
  it('blocks duplicate ids', () => {
    expect(()=>applyEdit(load(),{action:'create',kind:'element',id:'application_service',value:{id:'application_service',name:'Duplicate',kind:'structure'}})).toThrow(/finns redan/);
  });
  it('blocks deletion of referenced elements', () => {
    expect(()=>applyEdit(load(),{action:'delete',kind:'element',id:'application_service'})).toThrow(/referenser/);
  });
  it('rejects ID changes in edits', () => {
    expect(()=>applyEdit(load(),{action:'update',kind:'element',id:'application_service',value:{id:'changed',name:'Changed'}})).toThrow(/oförändrat ID/);
  });
});
