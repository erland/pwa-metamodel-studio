import type { ZipWorkspace } from './archive';
import { openZip, exportZip } from './archive';

/** DEV-009: Browser-local drafts. No network transport or server storage. */
const DB_NAME = 'metamodel-studio-drafts';
const DB_VERSION = 1;
const MAX_REVISIONS = 25;
export interface DraftRevision {
  id: string;
  draftId: string;
  createdAt: number;
  label: string;
  bytes: Uint8Array;
}
export interface DraftSummary { id: string; name: string; updatedAt: number; revisionCount: number }
interface DraftRecord { id: string; name: string; updatedAt: number }

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error ?? Error('IndexedDB-fel')); });
}
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) { reject(Error('IndexedDB stöds inte i denna webbläsare.')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('drafts')) db.createObjectStore('drafts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('revisions')) {
        const store = db.createObjectStore('revisions', { keyPath: 'id' });
        store.createIndex('draftId', 'draftId');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? Error('Kunde inte öppna lokal lagring.'));
    req.onblocked = () => reject(Error('Databasen är blockerad av en annan flik.'));
  });
}
async function withStores<T>(names: string[], mode: IDBTransactionMode, run: (tx: IDBTransaction) => Promise<T>): Promise<T> {
  const db = await openDb();
  try {
    const tx = db.transaction(names, mode);
    const completion = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? Error('Databastransaktionen avbröts.'));
      tx.onerror = () => reject(tx.error ?? Error('Databastransaktionen misslyckades.'));
    });
    const value = await run(tx);
    await completion;
    return value;
  } finally { db.close(); }
}
export async function listDrafts(): Promise<DraftSummary[]> {
  return withStores(['drafts', 'revisions'], 'readonly', async tx => {
    const drafts = await request(tx.objectStore('drafts').getAll() as IDBRequest<DraftRecord[]>);
    const revisions = await request(tx.objectStore('revisions').getAll() as IDBRequest<DraftRevision[]>);
    return drafts.map(d => ({ ...d, revisionCount: revisions.filter(r => r.draftId === d.id).length }))
      .sort((a,b) => b.updatedAt - a.updatedAt);
  });
}
export async function listRevisions(draftId: string): Promise<DraftRevision[]> {
  return withStores(['revisions'], 'readonly', async tx => {
    const revisions = await request(tx.objectStore('revisions').index('draftId').getAll(draftId) as IDBRequest<DraftRevision[]>);
    return revisions.sort((a,b) => b.createdAt - a.createdAt);
  });
}
export async function saveDraftRevision(draftId: string, name: string, workspace: ZipWorkspace, label: string): Promise<DraftRevision> {
  const revision: DraftRevision = { id: crypto.randomUUID(), draftId, createdAt: Date.now(), label, bytes: exportZip(workspace) };
  await withStores(['drafts', 'revisions'], 'readwrite', async tx => {
    tx.objectStore('drafts').put({ id: draftId, name, updatedAt: revision.createdAt } satisfies DraftRecord);
    const store = tx.objectStore('revisions');
    const existing = await request(store.index('draftId').getAll(draftId) as IDBRequest<DraftRevision[]>);
    for (const old of existing.sort((a,b) => b.createdAt - a.createdAt).slice(MAX_REVISIONS - 1)) store.delete(old.id);
    store.put(revision);
  });
  return revision;
}
export async function restoreRevision(revision: DraftRevision): Promise<ZipWorkspace> {
  // Reuse bounded ZIP checks on every restore; never trust bytes from browser storage.
  return openZip(new Uint8Array(revision.bytes));
}
export async function removeDraft(draftId: string): Promise<void> {
  await withStores(['drafts','revisions'],'readwrite', async tx => {
    tx.objectStore('drafts').delete(draftId);
    const revisions = await request(tx.objectStore('revisions').index('draftId').getAll(draftId) as IDBRequest<DraftRevision[]>);
    revisions.forEach(r => tx.objectStore('revisions').delete(r.id));
  });
}
