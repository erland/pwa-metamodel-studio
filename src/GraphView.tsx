import { useMemo, useState } from 'react';
import type { MetamodelEntity, ReferenceGraph } from './lib/metamodel';

type Scope = 'all' | 'relations' | 'dependencies';
interface Props { graph: ReferenceGraph; selectedKey: string | null; onSelect: (entity: MetamodelEntity) => void; }
const short = (text: string, max = 22) => text.length > max ? `${text.slice(0,max-1)}…` : text;

/** Read-only graph. All edits are performed in the existing explorer. */
export default function GraphView({graph, selectedKey, onSelect}: Props) {
  const [scope,setScope] = useState<Scope>('relations');
  const [filter,setFilter] = useState('');
  const [focus,setFocus] = useState(false);
  const [showUnresolved,setShowUnresolved] = useState(true);
  const [limit,setLimit] = useState(80);
  const visible = useMemo(() => {
    const matches = (n:MetamodelEntity) => `${n.name} ${n.id} ${n.kind}`.toLocaleLowerCase('sv').includes(filter.trim().toLocaleLowerCase('sv'));
    const scopeNodes = graph.nodes.filter(n => scope==='all' || scope==='dependencies' || n.kind==='element' || n.kind==='relationship');
    const valid = new Set(scopeNodes.map(n=>n.key));
    const relevantEdges = graph.edges.filter(e=>valid.has(e.from) && (valid.has(e.to)||showUnresolved));
    let keys = new Set(scopeNodes.filter(matches).map(n=>n.key));
    if(focus && selectedKey) {
      const neighbourhood = new Set([selectedKey]);
      for(const edge of relevantEdges) if(edge.from===selectedKey || edge.to===selectedKey) {neighbourhood.add(edge.from);neighbourhood.add(edge.to);}
      keys = new Set([...keys].filter(k=>neighbourhood.has(k)));
      if(valid.has(selectedKey)) keys.add(selectedKey);
    }
    // When searching, include source and target neighbours to preserve graph context.
    if(filter.trim() && !focus) for(const edge of relevantEdges) if(keys.has(edge.from)||keys.has(edge.to)) {keys.add(edge.from);keys.add(edge.to);}
    const nodes=scopeNodes.filter(n=>keys.has(n.key)).slice(0,limit);
    const shown=new Set(nodes.map(n=>n.key));
    const edges=relevantEdges.filter(e=>shown.has(e.from) && (shown.has(e.to) || (!e.resolved && showUnresolved)));
    return {nodes,edges,truncated:scopeNodes.filter(n=>keys.has(n.key)).length>limit};
  },[graph,scope,filter,focus,selectedKey,showUnresolved,limit]);
  const geometry = useMemo(()=>{
    const columns=Math.min(4,Math.max(1,Math.ceil(Math.sqrt(visible.nodes.length/1.8))));
    const rows=Math.max(1,Math.ceil(visible.nodes.length/columns));
    const positions=new Map<string,{x:number;y:number}>();
    visible.nodes.forEach((n,i)=>positions.set(n.key,{x:125+(i%columns)*230,y:50+Math.floor(i/columns)*110}));
    return {positions,width:Math.max(330,columns*230+20),height:Math.max(150,rows*110+25)};
  },[visible.nodes]);
  return <section className="graph-view" aria-label="Interaktiv referensgraf">
    <div className="graph-controls">
      <label>Grafens innehåll <select aria-label="Välj grafvy" value={scope} onChange={e=>{setScope(e.target.value as Scope);setLimit(80);}}><option value="relations">Element och relationer</option><option value="dependencies">Alla referensberoenden</option><option value="all">Alla definitioner</option></select></label>
      <label>Sök <input aria-label="Sök i graf" type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Namn, ID eller typ"/></label>
      <label className="graph-check"><input type="checkbox" checked={focus} onChange={e=>setFocus(e.target.checked)} disabled={!selectedKey}/> Fokusera vald nod</label>
      <label className="graph-check"><input type="checkbox" checked={showUnresolved} onChange={e=>setShowUnresolved(e.target.checked)}/> Visa olösta referenser</label>
    </div>
    <p className="small">{visible.nodes.length} noder · {visible.edges.length} referenser. Streckade linjer visar olösta referenser. Välj en nod för att öppna den i modellutforskaren.</p>
    <div className="graph-canvas" tabIndex={0} aria-label="Graf med rullning i båda riktningarna">
      {visible.nodes.length===0 ? <p className="empty-state">Inga noder matchar filtret.</p> : <svg xmlns="http://www.w3.org/2000/svg" width={geometry.width} height={geometry.height} viewBox={`0 0 ${geometry.width} ${geometry.height}`} role="img" aria-label={`Referensgraf med ${visible.nodes.length} noder`}>
        <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#7590a4"/></marker></defs>
        {visible.edges.map((edge,index)=>{const a=geometry.positions.get(edge.from); const b=geometry.positions.get(edge.to);if(!a)return null;
          const x2=b?.x ?? a.x+82, y2=b?.y ?? a.y+45;
          return <line key={`${edge.from}-${edge.to}-${edge.field}-${index}`} x1={a.x} y1={a.y} x2={x2} y2={y2} stroke={edge.resolved?'#7590a4':'#bf493d'} strokeWidth="1.5" strokeDasharray={edge.resolved?undefined:'5 4'} markerEnd="url(#arrow)"><title>{edge.field}: {edge.from} → {edge.to}{edge.resolved?'':' (olöst)'}</title></line>;
        })}
        {visible.nodes.map(n=>{const p=geometry.positions.get(n.key)!;return <g key={n.key} role="button" tabIndex={0} aria-label={`Visa ${n.name}`} onClick={()=>onSelect(n)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(n);}}} className="graph-node" style={{cursor:'pointer'}}>
          <rect x={p.x-91} y={p.y-25} width="182" height="50" rx="9" stroke={selectedKey===n.key?'#155d85':'#8ba8bb'} strokeWidth={selectedKey===n.key?3:1.2} fill={n.kind==='relationship'?'#fdf0d9':n.kind==='element'?'#dceefa':'#e9f5ea'}/>
          <text x={p.x} y={p.y-3} textAnchor="middle" fontSize="12" fontWeight="600" fill="#1f3548">{short(n.name)}</text>
          <text x={p.x} y={p.y+14} textAnchor="middle" fontSize="10" fill="#47677b">{short(n.kind+':'+n.id,28)}</text>
          <title>{n.name} ({n.kind}:{n.id})</title>
        </g>})}
      </svg>}
    </div>
    {visible.truncated && <p className="small">Visningen är begränsad för att förhindra långa renderingar. <button type="button" onClick={()=>setLimit(v=>v+80)}>Visa ytterligare 80 noder</button></p>}
    <details><summary>Tillgänglig nodlista ({visible.nodes.length})</summary><div className="graph-node-list">{visible.nodes.map(n=><button type="button" key={n.key} onClick={()=>onSelect(n)}>{n.name} · {n.kind}</button>)}</div></details>
  </section>;
}
