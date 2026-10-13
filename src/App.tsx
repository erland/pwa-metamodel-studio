import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { openZip } from './lib/archive';
import type { ZipWorkspace } from './lib/archive';
import { applyEdit, updateGuide } from './lib/editing';
import type { EditableKind } from './lib/editing';
import { parseMetamodel, CANONICAL_FILES } from './lib/metamodel';
import type { CanonicalName, MetamodelEntity, ParsedMetamodel } from './lib/metamodel';
import { validateMetamodel } from './lib/validation';
import type { Diagnostic, ValidationReport } from './lib/validation';
import { listDrafts, listRevisions, removeDraft, restoreRevision, saveDraftRevision } from './lib/draftStore';
import type { DraftRevision, DraftSummary } from './lib/draftStore';
import { changeVersion, compareRevision, diffFromImport, exportRelease, staleArtifacts, type DiffEntry, type StalePolicy } from './lib/release';
import GraphView from './GraphView';
import './styles.css';

const TITLES: Record<CanonicalName, string> = {
  version: 'Version', metamodel: 'Metamodell', properties: 'Egenskaper',
  constraints: 'Regler', viewpoints: 'Vyer', notation: 'Notation',
  provenance: 'Ursprung', guidance: 'Vägledning',
};
const KIND_LABELS: Record<string, string> = {
  element: 'Elementtyp', relationship: 'Relationstyp', property: 'Egenskap',
  propertySet: 'Egenskapsmängd', dataType: 'Datatyp', enumeration: 'Uppräkning',
  constraint: 'Regel', viewpoint: 'Vy', style: 'Stil', source: 'Källa',
  pattern: 'Mönster', antiPattern: 'Antimönster', mapping:'Ursprungsmappning', guidanceElement:'Elementvägledning', guidanceRelationship:'Relationsvägledning', guidanceViewpoint:'Vyvägledning', faq:'Fråga och svar',
};
const stringify = (value: unknown) => JSON.stringify(value, null, 2) ?? String(value);
const PROPERTY_KINDS: EditableKind[] = ['property','propertySet','dataType','enumeration'];
const INDEXED_KINDS: EditableKind[] = ['mapping','guidanceElement','guidanceRelationship','guidanceViewpoint','faq'];
const EXTRA_KINDS: EditableKind[] = ['viewpoint','style','source'];
const FILE_KINDS: Partial<Record<CanonicalName, EditableKind[]>> = {viewpoints:['viewpoint'], notation:['style'], provenance:['source','mapping'], guidance:['pattern','antiPattern','guidanceElement','guidanceRelationship','guidanceViewpoint','faq']};
const NEW_ITEMS: Record<EditableKind, Record<string, unknown>> = {
  element:{id:'',name:'',kind:'structure',description:'',property_sets:[]},
  relationship:{id:'',name:'',kind:'structural',directed:true,source:{types:[],cardinality:'1'},target:{types:[],cardinality:'0..*'},description:''},
  property:{id:'',name:'',type:{builtin:'string'}},
  propertySet:{id:'',name:'',properties:[]},
  dataType:{id:'',name:'',base:'string'},
  enumeration:{id:'',name:'',values:[{id:'value_1',name:'Värde 1'}]},
  viewpoint:{id:'',name:'',allowed_elements:[],allowed_relationships:[]},
  style:{id:'',applies_to:{kind:'element',type:''},shape:'rectangle'},
  source:{id:'',name:'',kind:'standard'}, pattern:{id:'',name:''}, antiPattern:{id:'',name:''},
  mapping:{target:{kind:'element',id:''},source:{source_id:''},relationship:'derived_from'},
  guidanceElement:{type:''},guidanceRelationship:{type:''},guidanceViewpoint:{viewpoint:''},faq:{question:'',answer:''},
};
const searchable = (entity: MetamodelEntity) => [entity.id, entity.name, entity.kind, stringify(entity.data)].join(' ').toLocaleLowerCase('sv');

export default function App() {
  const [workspace, setWorkspace] = useState<ZipWorkspace | null>(null);
  const [archiveName, setArchiveName] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<DraftSummary[]>([]);
  const [revisions, setRevisions] = useState<DraftRevision[]>([]);
  const [storageMessage, setStorageMessage] = useState('');
  const [storageError, setStorageError] = useState('');
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const skipNextSave = useRef(false);
  useEffect(() => { void listDrafts().then(setSavedDrafts).catch(e => setStorageError(String(e))); }, []);
  useEffect(() => {
    if (!workspace || !draftId) return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    const current = workspace, id = draftId, name = archiveName;
    saveQueue.current = saveQueue.current.catch(() => undefined).then(async () => {
      await saveDraftRevision(id, name, current, 'Automatiskt sparad revision');
      const [all, mine] = await Promise.all([listDrafts(), listRevisions(id)]);
      setSavedDrafts(all); if (id === draftId) setRevisions(mine);
      setStorageError(''); setStorageMessage('Sparat lokalt');
    }).catch(e => { setStorageMessage(''); setStorageError(`Utkastet kunde inte sparas: ${String(e)}`); });
  }, [workspace, draftId, archiveName]);
  const [comparison, setComparison] = useState<DiffEntry[] | null>(null);
  const [releasePolicy, setReleasePolicy] = useState<StalePolicy>('exclude');
  const [acknowledgeStale, setAcknowledgeStale] = useState(false);
  const [versionDraft, setVersionDraft] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [releaseMessage, setReleaseMessage] = useState('');
  const [history, setHistory] = useState<ZipWorkspace[]>([]);
  const [editing, setEditing] = useState<{ action: 'create' | 'update'; kind: EditableKind } | null>(null);
  const [draft, setDraft] = useState('');
  const [guideDraft, setGuideDraft] = useState<string | null>(null);
  const [indexedEditor, setIndexedEditor] = useState<{kind: EditableKind; field: string; index: number} | null>(null);
  const [editError, setEditError] = useState('');
  const [model, setModel] = useState<ParsedMetamodel | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState('');
  const [activeFile, setActiveFile] = useState<CanonicalName>('metamodel');
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [tab, setTab] = useState<'entities' | 'document' | 'diagnostics' | 'graph'>('entities');
  const [severity, setSeverity] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  async function load(bytes: Uint8Array, name: string) {
    setError(''); setWorkspace(null); setHistory([]); setEditing(null); setModel(null); setReport(null); setSelectedKey(null); setQuery('');
    try {
      const opened = openZip(bytes);
      const parsed = parseMetamodel(opened);
      setDraftId(crypto.randomUUID()); setRevisions([]); setStorageMessage(''); setStorageError('');
      setWorkspace(opened);
      setReport(validateMetamodel(parsed));
      setModel(parsed); setArchiveName(name); setActiveFile('metamodel'); setTab('entities');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Det gick inte att läsa metamodellen.');
    }
  }
  async function openSavedDraft(draft: DraftSummary) {
    try {
      await saveQueue.current;
      const entries = await listRevisions(draft.id);
      if (!entries.length) throw Error('Utkastet saknar revisioner.');
      const opened = await restoreRevision(entries[0]);
      const parsed = parseMetamodel(opened);
      skipNextSave.current = true;
      setWorkspace(opened); setModel(parsed); setReport(validateMetamodel(parsed));
      setDraftId(draft.id); setArchiveName(draft.name); setRevisions(entries);
      setHistory([]); setEditing(null); setSelectedKey(null); setActiveFile('metamodel'); setTab('entities'); setError('');
      setStorageMessage('Utkastet återöppnat'); setStorageError('');
    } catch (cause) { setStorageError(`Kunde inte öppna utkast: ${String(cause)}`); }
  }
  async function restoreSavedRevision(revision: DraftRevision) {
    try {
      await saveQueue.current;
      if (!workspace) return;
      const restored = await restoreRevision(revision);
      const parsed = parseMetamodel(restored);
      setHistory(h => [...h, workspace]); setWorkspace(restored);
      setModel(parsed); setReport(validateMetamodel(parsed)); setSelectedKey(null); setEditing(null);
      setStorageMessage('Revision återställd. En ny revision sparas automatiskt.');
    } catch (cause) { setStorageError(`Återställningen misslyckades: ${String(cause)}`); }
  }
  async function deleteSavedDraft(id: string) {
    if (!window.confirm('Ta bort detta lokala utkast och alla dess revisioner?')) return;
    try { await saveQueue.current; await removeDraft(id); setSavedDrafts(await listDrafts());
      if (id === draftId) { setDraftId(null); setRevisions([]); setStorageMessage('Utkastet borttaget från lokal lagring'); }
    } catch (cause) { setStorageError(String(cause)); }
  }
  function fileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.zip')) setError('Välj en ZIP-fil.');
      else void file.arrayBuffer().then(buffer => load(new Uint8Array(buffer), file.name)).catch(() => setError('Kunde inte läsa filen.'));
    }
    event.currentTarget.value = '';
  }
  async function example() {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}fixtures/application-architecture-metamodel-0.7.0.zip`);
      if (!response.ok) throw new Error('Exempelarkivet kunde inte hämtas.');
      await load(new Uint8Array(await response.arrayBuffer()), 'application-architecture-metamodel-0.7.0.zip');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Det gick inte att öppna exempelmodellen.'); }
  }
  function startEdit(action: 'create' | 'update', kind: EditableKind) {
    const original = action === 'update' && selected?.kind === kind ? selected.data : NEW_ITEMS[kind];
    setIndexedEditor(null);setDraft(stringify(original)); setEditError(''); setEditing({action,kind});
  }
  function performEdit() {
    if (!workspace || !editing) return;
    try {
      const value: unknown = JSON.parse(draft);
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Ange ett JSON-objekt.');
      const id = indexedEditor ? String(indexedEditor.index) : INDEXED_KINDS.includes(editing.kind) ? '0' : editing.action === 'update' ? selected?.id : (value as {id?:string}).id;
      if (!id) throw Error('ID saknas.');
      const result = applyEdit(workspace, { ...editing, id, value: value as Record<string, unknown> });
      setHistory(previous => [...previous, workspace]); setWorkspace(result.workspace); setModel(result.model);
      setReport(validateMetamodel(result.model)); setSelectedKey(INDEXED_KINDS.includes(editing.kind) ? null : `${editing.kind}:${id}`); setEditing(null); setIndexedEditor(null); setEditError('');
    } catch (cause) { setEditError(cause instanceof Error ? cause.message : 'Ogiltig ändring.'); }
  }
  function removeSelected() {
    if (!workspace || !selected || !(['element','relationship',...PROPERTY_KINDS,...EXTRA_KINDS] as string[]).includes(selected.kind)) return;
    if (!window.confirm(`Radera ${selected.name}? Ändringen sparas enbart lokalt tills ZIP exporteras.`)) return;
    try {
      const result = applyEdit(workspace, {action:'delete', kind:selected.kind as EditableKind, id:selected.id});
      setHistory(previous => [...previous, workspace]); setWorkspace(result.workspace); setModel(result.model);
      setReport(validateMetamodel(result.model)); setSelectedKey(null); setEditError('');
    } catch (cause) { setEditError(cause instanceof Error ? cause.message : 'Kunde inte radera.'); }
  }
  function undo() {
    const previous = history.at(-1); if (!previous) return;
    const restored = parseMetamodel(previous); setWorkspace(previous); setModel(restored);
    setReport(validateMetamodel(restored)); setHistory(items => items.slice(0,-1)); setSelectedKey(null); setEditing(null);
  }
  function downloadEdited() {
    if (!workspace) return;
    try {
    if (report?.counts.error) throw Error('Exporten blockeras eftersom modellen innehåller valideringsfel.');
    const output = exportRelease(workspace, releasePolicy, acknowledgeStale);
    const bytes = output.bytes;
    const blob = new Blob([Uint8Array.from(bytes)], {type:'application/zip'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = archiveName.replace(/\.zip$/i,'') + '-edited.zip'; link.click();
    URL.revokeObjectURL(url);
    setReleaseMessage(output.stale.length ? `Export klar. ${output.excluded.length} genererade filer uteslöts; statusmanifest inkluderat.` : 'ZIP exporterad utan inaktuella genererade artefakter.');
    } catch (cause) { setEditError(String(cause)); }
  }
  const importDiff = useMemo(() => workspace ? diffFromImport(workspace) : [], [workspace]);
  const stale = useMemo(() => workspace ? staleArtifacts(workspace) : [], [workspace]);
  function commitVersion() {
    if (!workspace) return;
    try { const next=changeVersion(workspace,versionDraft,releaseNotes); const parsed=parseMetamodel(next); setHistory(h=>[...h,workspace]);setWorkspace(next);setModel(parsed);setReport(validateMetamodel(parsed));setEditError('');setReleaseMessage('Versionen är uppdaterad lokalt.'); }
    catch (cause) {setEditError(String(cause));}
  }
  const entities = useMemo(() => model?.graph.nodes.filter(node => node.file === activeFile && searchable(node).includes(query.toLocaleLowerCase('sv').trim())) ?? [], [model, activeFile, query]);
  const selected = model?.graph.nodes.find(node => node.key === selectedKey && node.file === activeFile);
  const diagnostics = useMemo(() => report?.diagnostics.filter(item => item.file === activeFile && (severity === 'all' || item.severity === severity) && (!query || [item.code, item.message, item.path].join(' ').toLocaleLowerCase('sv').includes(query.toLocaleLowerCase('sv')))) ?? [], [report, activeFile, severity, query]);
  function openGraphEntity(entity: MetamodelEntity) { setActiveFile(entity.file); setSelectedKey(entity.key); setTab('entities'); setQuery(''); }
  function openFile(name: CanonicalName) { setActiveFile(name); setSelectedKey(null); setTab('entities'); setQuery(''); }
  const relevant = selected ? report?.diagnostics.filter(d => d.entityKey === selected.key) ?? [] : [];
  return <div className="app">
    <header><div className="wordmark">◈ Metamodel Studio</div><span className="status">DEV-011 · Grafisk modellvisualisering</span></header>
    <main>
      <section className="hero compact"><p className="eyebrow">Lokal bearbetning · Metamodel Builder</p><h1>Utforska en metamodell</h1>
        <p>Öppna en ZIP, utforska modellen och redigera element-, relationstyper och egenskapsdefinitioner lokalt. Originalfilen ändras inte.</p>
        <div className="actions"><label className="primary">Välj ZIP-fil<input aria-label="Välj ZIP-fil" type="file" accept=".zip,application/zip" onChange={fileChange}/></label><button type="button" onClick={() => void example()}>Öppna exempelmodellen</button></div>
      </section>
      {error && <div className="error" role="alert">{error}</div>}
      <section className="edit-panel" aria-label="Lokala utkast och revisioner">
        <h2>Lokala utkast</h2><p className="small">Sparas automatiskt i IndexedDB i den här webbläsaren. Upp till 25 revisioner per utkast. Rensa inte webbplatsdata om du vill behålla dem.</p>
        {storageError && <div className="error" role="alert">{storageError}</div>}
        {storageMessage && <p role="status">{storageMessage}</p>}
        {savedDrafts.map(d => <div className="actions" key={d.id}>
          <span>{d.name} · {d.revisionCount} revisioner · {new Date(d.updatedAt).toLocaleString('sv-SE')}</span>
          <button type="button" onClick={() => void openSavedDraft(d)}>Öppna</button>
          <button type="button" onClick={() => void deleteSavedDraft(d.id)}>Ta bort</button>
        </div>)}
        {draftId && <><h3>Historik för öppet utkast</h3><div className="revision-list">{revisions.map(rev => <div key={rev.id} className="actions"><span>{new Date(rev.createdAt).toLocaleString('sv-SE')} · {rev.label}</span><button type="button" onClick={() => void restoreSavedRevision(rev)}>Återställ</button><button type="button" onClick={() => {try { if(workspace) setComparison(compareRevision(workspace,rev.bytes)); }catch(cause){setEditError(String(cause));}}}>Jämför</button></div>)}</div></>}
      </section>
      {model && report ? <section className="explorer" aria-label="Modellutforskare">
        <div className="explorer-top"><div><p className="eyebrow">Öppen modell · Version {model.modelVersion}</p><h2>{archiveName}</h2><p className="small">Projektrot: <code>{model.projectRoot}</code></p></div><div className="counts" aria-label="Diagnostiksammanfattning"><span className="count-error">{report.counts.error} fel</span><span className="count-warning">{report.counts.warning} varningar</span><span>{report.counts.info} info</span></div></div>
        <div className="edit-toolbar"><button type="button" onClick={() => startEdit('create','element')}>+ Elementtyp</button><button type="button" onClick={() => startEdit('create','relationship')}>+ Relationstyp</button>{(FILE_KINDS[activeFile] ?? []).map(kind => <button key={kind} type="button" onClick={() => {setSelectedKey(null);startEdit('create',kind);}}>+ {KIND_LABELS[kind]}</button>)}{PROPERTY_KINDS.map(kind => <button key={kind} type="button" onClick={() => {setActiveFile('properties');setSelectedKey(null);startEdit('create',kind);}}>+ {KIND_LABELS[kind]}</button>)}<button type="button" disabled={!history.length} onClick={undo}>Ångra ({history.length})</button><button type="button" disabled={!workspace} onClick={downloadEdited}>Exportera ZIP {workspace?.changed.size ? `(${workspace.changed.size} ändrad fil)` : ''}</button></div>
        <section className="edit-panel" aria-label="Versioner, ändringar och export">
          <h3>Ändringar och versioner</h3>
          <p className="small">{importDiff.length} ändrade filer sedan importen · {importDiff.filter(d=>d.canonical).length} kanoniska filer ändrade. Jämförelse sker mot innehållet, inte ZIP-metadata.</p>
          <div className="actions"><button type="button" onClick={()=>setComparison(importDiff)}>Jämför med ursprunglig ZIP</button><button type="button" onClick={()=>setComparison(null)}>Dölj jämförelse</button></div>
          {comparison && <div className="revision-list"><h4>Filskillnader ({comparison.length})</h4>{comparison.length===0 ? <p>Inga innehållsskillnader.</p> : comparison.map(d=><p key={d.path}><code>{d.status}</code> {d.canonical?'Kanonisk · ':''}{d.path}</p>)}</div>}
          <h4>Modellversion {model.modelVersion}</h4>
          <div className="actions"><label>Ny version <input aria-label="Ny semantisk version" value={versionDraft} onChange={e=>setVersionDraft(e.target.value)} placeholder="0.8.0"/></label><label>Versionsanteckning <input aria-label="Versionsanteckning" value={releaseNotes} onChange={e=>setReleaseNotes(e.target.value)}/></label><button type="button" onClick={commitVersion}>Uppdatera version</button></div>
          <h4>Exportpolicy</h4>
          {stale.length>0 ? <><p role="alert" className="error">{stale.length} genererade filer kan vara inaktuella efter ändringar av kanoniskt innehåll. De regenereras inte automatiskt.</p><ul>{stale.map(p=><li key={p}><code>{p}</code></li>)}</ul>
            <label>Hantera genererade filer <select aria-label="Exportpolicy för genererade filer" value={releasePolicy} onChange={e=>{setReleasePolicy(e.target.value as StalePolicy);setAcknowledgeStale(false);}}><option value="exclude">Uteslut inaktuella filer (rekommenderas)</option><option value="retain-with-warning">Behåll men markera som inaktuella</option></select></label>
            {releasePolicy==='retain-with-warning' && <label><input type="checkbox" checked={acknowledgeStale} onChange={e=>setAcknowledgeStale(e.target.checked)}/> Jag förstår att de genererade filerna kan vara felaktiga och inte får användas som uppdaterade.</label>}
          </> : <p className="small">Inga inaktuella genererade filer har identifierats sedan importen.</p>}
          <button type="button" disabled={report.counts.error>0 || (stale.length>0 && releasePolicy==='retain-with-warning' && !acknowledgeStale)} onClick={downloadEdited}>Exportera säker ZIP</button>
          {releaseMessage && <p role="status">{releaseMessage}</p>}
        </section>
        {editError && <div className="error" role="alert">{editError}</div>}
        {model && (activeFile === 'provenance' || activeFile === 'guidance') && <section className="edit-panel" aria-label="Redigera vägledning och mappningar"><h3>Listposter i {TITLES[activeFile]}</h3>{(activeFile === 'provenance' ? [['mapping','mappings']] : [['pattern','patterns'],['antiPattern','anti_patterns'],['guidanceElement','elements'],['guidanceRelationship','relationships'],['guidanceViewpoint','viewpoints'],['faq','faq']]).map(([kind,field]) => <div key={field}><h4>{field}</h4>{((model.documents[activeFile].data[field] as unknown[]) ?? []).map((item,index) => <div key={index} className="actions"><span>{index + 1}. {stringify(item).slice(0,100)}</span><button type="button" onClick={() => {setIndexedEditor({kind:kind as EditableKind, field,index}); setDraft(stringify(item));setEditing({action:'update',kind:kind as EditableKind});setEditError('');}}>Ändra</button><button type="button" onClick={() => {if (!workspace || !window.confirm('Radera denna post?')) return;try {const result=applyEdit(workspace,{action:'delete',kind:kind as EditableKind,id:String(index)});setHistory(previous=>[...previous,workspace]);setWorkspace(result.workspace);setModel(result.model);setReport(validateMetamodel(result.model));}catch(error){setEditError(String(error));}}}>Radera</button></div>)}</div>)}</section>}
        {model && activeFile === 'guidance' && <section className="edit-panel"><h3>Guide</h3><button type="button" onClick={() => setGuideDraft(stringify(model.documents.guidance.data.guide))}>Redigera guide</button>{guideDraft !== null && <><textarea aria-label="Guide i JSON" rows={10} value={guideDraft} onChange={e=>setGuideDraft(e.target.value)}/><button type="button" onClick={() => {if (!workspace) return;try {const result=updateGuide(workspace,JSON.parse(guideDraft));setHistory(h=>[...h,workspace]);setWorkspace(result.workspace);setModel(result.model);setReport(validateMetamodel(result.model));setGuideDraft(null);setEditError('');}catch(error){setEditError(String(error));}}}>Spara guide</button><button type="button" onClick={()=>setGuideDraft(null)}>Avbryt</button></>}</section>}
        {editing && <section className="edit-panel" aria-label="Redigera definition"><h3>{editing.action === 'create' ? 'Skapa' : 'Ändra'} {(KIND_LABELS[editing.kind] ?? editing.kind).toLowerCase()}</h3><p className="small">Redigera JSON-objektet. ID får inte ändras vid uppdatering. Referenser kontrolleras före ändringen.</p><textarea aria-label="Definition i JSON" value={draft} onChange={e => setDraft(e.target.value)} rows={14}/><div className="actions"><button type="button" className="primary" onClick={performEdit}>Spara lokalt</button><button type="button" onClick={() => {setEditing(null);setEditError('');}}>Avbryt</button></div></section>}
        <div className="explorer-body"><nav className="file-nav" aria-label="Kanoniska dokument"><h3>Dokument</h3>{CANONICAL_FILES.map(name => { const count = model.graph.nodes.filter(n => n.file === name).length; const issues = report.diagnostics.filter(d => d.file === name && d.severity === 'error').length; return <button type="button" key={name} aria-current={activeFile === name ? 'page' : undefined} className={activeFile === name ? 'active' : ''} onClick={() => openFile(name)}><span>{TITLES[name]}<small>{name}.yaml</small></span><span className="nav-count">{count}{issues > 0 ? ` · ${issues} !` : ''}</span></button>; })}</nav>
          <div className="editor-area"><div className="workspace-header"><div><p className="eyebrow">{activeFile}.yaml</p><h3>{TITLES[activeFile]}</h3></div><span className="read-only">{activeFile === 'metamodel' ? 'Element och relationer redigerbara' : 'Skrivskyddad'}</span></div>
            <div className="tabs" role="tablist" aria-label="Innehåll"><button role="tab" aria-selected={tab === 'entities'} className={tab === 'entities' ? 'active' : ''} onClick={() => setTab('entities')}>Definitioner ({model.graph.nodes.filter(n => n.file === activeFile).length})</button><button role="tab" aria-selected={tab === 'graph'} className={tab === 'graph' ? 'active' : ''} onClick={() => setTab('graph')}>Referensgraf</button><button role="tab" aria-selected={tab === 'document'} className={tab === 'document' ? 'active' : ''} onClick={() => setTab('document')}>Hela dokumentet</button><button role="tab" aria-selected={tab === 'diagnostics'} className={tab === 'diagnostics' ? 'active' : ''} onClick={() => setTab('diagnostics')}>Diagnostik ({report.diagnostics.filter(d => d.file === activeFile).length})</button></div>
            {tab !== 'document' && <div className="filters"><input value={query} onChange={e => setQuery(e.target.value)} type="search" aria-label="Sök i aktuell vy" placeholder={tab === 'diagnostics' ? 'Sök felkod eller meddelande…' : 'Sök ID, namn eller innehåll…'}/>{tab === 'diagnostics' && <select aria-label="Filtrera allvarlighetsgrad" value={severity} onChange={e => setSeverity(e.target.value as typeof severity)}><option value="all">Alla nivåer</option><option value="error">Fel</option><option value="warning">Varningar</option><option value="info">Information</option></select>}</div>}
            {tab === 'entities' && <div className="entity-layout"><div className="entity-list" aria-label="Definitioner">{entities.map(node => <button type="button" key={node.key} className={selectedKey === node.key ? 'chosen' : ''} onClick={() => setSelectedKey(node.key)}><strong>{node.name}</strong><small>{KIND_LABELS[node.kind] ?? node.kind} · {node.id}</small></button>)}{entities.length === 0 && <p className="empty-state">{query ? 'Inga matchande definitioner.' : 'Inga identifierade definitioner. Öppna ”Hela dokumentet” för övriga fält.'}</p>}</div><div className="detail" aria-live="polite">{selected ? <><h4>{selected.name}</h4>{((activeFile === 'metamodel' && (selected.kind === 'element' || selected.kind === 'relationship')) || (activeFile === 'properties' && PROPERTY_KINDS.includes(selected.kind as EditableKind)) || (EXTRA_KINDS.includes(selected.kind as EditableKind))) && <div className="actions"><button type="button" onClick={() => startEdit('update',selected.kind as EditableKind)}>Ändra</button><button type="button" onClick={removeSelected}>Radera</button></div>}<p className="small">{KIND_LABELS[selected.kind] ?? selected.kind} · <code>{selected.id}</code></p><h5>Fält och värden</h5><dl className="field-list">{Object.entries(selected.data).map(([key, value]) => <div key={key}><dt>{key}</dt><dd><pre>{typeof value === 'string' ? value : stringify(value)}</pre></dd></div>)}</dl><h5>Referenser</h5><ul className="references">{model.graph.edges.filter(edge => edge.from === selected.key).map((edge, i) => <li key={`${edge.to}-${i}`}>{edge.field} → <code>{edge.to}</code> <span className={edge.resolved ? 'ok' : 'bad'}>{edge.resolved ? 'Löst' : 'Olöst'}</span></li>)}{model.graph.edges.every(edge => edge.from !== selected.key) && <li>Inga identifierade referenser</li>}</ul>{relevant.length > 0 && <><h5>Diagnostik för definitionen</h5>{relevant.map((d,i) => <p key={i} className={`diagnostic ${d.severity}`}>{d.code}: {d.message}</p>)}</>}</> : <p className="empty-state">Välj en definition för att visa dess egenskaper och referenser.</p>}</div></div>}
            {tab === 'graph' && <GraphView graph={model.graph} selectedKey={selectedKey} onSelect={openGraphEntity}/>}
            {tab === 'document' && <section className="document-detail"><p className="small">Strukturerad JSON-vy av inläst YAML. Visas skrivskyddat.</p><pre>{stringify(model.documents[activeFile].data)}</pre></section>}
            {tab === 'diagnostics' && <div className="diagnostic-list" aria-live="polite">{diagnostics.length ? diagnostics.map((d: Diagnostic, i) => <article key={`${d.code}-${d.path}-${i}`} className={`diagnostic ${d.severity}`}><div><strong>{d.severity.toUpperCase()} · {d.code}</strong><code>{d.path}</code></div><p>{d.message}</p></article>) : <p className="empty-state">Inga diagnostikposter matchar aktuella filter. Detta innebär inte att modellen har validerats mot alla tänkbara semantiska regler.</p>}</div>}
          </div></div>
      </section> : <section className="empty"><h2>Ingen modell öppnad</h2><p>Öppna den medföljande Application Architecture Metamodel 0.7.0 eller välj din egen ZIP.</p></section>}
    </main><footer>Metamodel Studio 0.1.13 · DEV-011 · Referensgraf och modellnavigering · npm-verifiering uppskjuten</footer>
  </div>;
}
