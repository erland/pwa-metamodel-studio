import { unzipSync, zipSync } from 'fflate';
import { parseDocument, type Document } from 'yaml';

/** DEV-002: bounded ZIP reader and lossless no-change round trip. */
export const ARCHIVE_LIMITS = {
  maxArchiveBytes: 32 * 1024 * 1024,
  maxEntries: 512,
  maxEntryBytes: 8 * 1024 * 1024,
  maxTotalBytes: 64 * 1024 * 1024,
  maxExpansionRatio: 200,
} as const;

export type ZipWorkspace = {
  /** Original compressed input retained for exact-byte no-op round trips. */
  original: Uint8Array;
  entries: Map<string, Uint8Array>;
  root: string;
  changed: Set<string>;
};

const u16 = (v: DataView, p: number) => v.getUint16(p, true);
const u32 = (v: DataView, p: number) => v.getUint32(p, true);
const decoder = new TextDecoder('utf-8', { fatal: true });
function requireSafePath(path: string): void {
  if (!path || path.includes('\\') || path.startsWith('/') || /^[a-zA-Z]:/.test(path) || path.includes('\0')) throw Error(`Osäker ZIP-sökväg: ${path}`);
  const segments = path.split('/');
  if (segments.some((p, i) => p === '.' || p === '..' || (p === '' && i !== segments.length - 1))) throw Error(`Osäker ZIP-sökväg: ${path}`);
  if (/\p{Cc}/u.test(path)) throw Error(`Kontrolltecken i ZIP-sökväg: ${path}`);
}

/** Validate ZIP central directory *before* asking the decompressor to allocate output. */
export function preflightZip(bytes: Uint8Array): void {
  if (bytes.byteLength > ARCHIVE_LIMITS.maxArchiveBytes) throw Error('ZIP-filen överskrider storleksgränsen.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (u32(view, i) === 0x06054b50 && i + 22 + u16(view, i + 20) === bytes.length) { eocd = i; break; }
  }
  if (eocd < 0) throw Error('Ogiltig ZIP: slutkatalog saknas.');
  const count = u16(view, eocd + 10);
  const dirSize = u32(view, eocd + 12), dirOffset = u32(view, eocd + 16);
  if (u16(view, eocd + 8) !== count || u16(view, eocd + 4) !== 0 || u16(view, eocd + 6) !== 0) throw Error('ZIP med flera diskar stöds inte.');
  if (count === 0 || count === 65535 || count > ARCHIVE_LIMITS.maxEntries || dirSize === 0xffffffff || dirOffset === 0xffffffff) throw Error('Antalet ZIP-poster eller ZIP64 stöds inte.');
  if (dirOffset + dirSize > eocd) throw Error('ZIP-katalogen ligger utanför filen.');
  let pos = dirOffset, total = 0;
  const names = new Set<string>();
  for (let i = 0; i < count; i++) {
    if (pos + 46 > eocd || u32(view, pos) !== 0x02014b50) throw Error('Korrupt ZIP-katalog.');
    const flags = u16(view, pos + 8), method = u16(view, pos + 10);
    const compressed = u32(view, pos + 20), uncompressed = u32(view, pos + 24);
    const nameLength = u16(view, pos + 28), extra = u16(view, pos + 30), comment = u16(view, pos + 32);
    const external = u32(view, pos + 38), creator = bytes[pos + 5];
    const localOffset = u32(view, pos + 42);
    if (pos + 46 + nameLength + extra + comment > eocd) throw Error('Korrupt ZIP-post.');
    const name = decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLength));
    requireSafePath(name);
    if (names.has(name)) throw Error(`Dubblett i ZIP: ${name}`);
    names.add(name);
    if (flags & 1 || (flags & 0x40)) throw Error('Krypterade ZIP-filer stöds inte.');
    if (method !== 0 && method !== 8) throw Error(`ZIP-komprimering stöds inte: ${method}`);
    if (compressed === 0xffffffff || uncompressed === 0xffffffff || localOffset === 0xffffffff) throw Error('ZIP64 stöds inte.');
    if (uncompressed > ARCHIVE_LIMITS.maxEntryBytes) throw Error(`ZIP-post för stor: ${name}`);
    if (uncompressed > Math.max(1, compressed) * ARCHIVE_LIMITS.maxExpansionRatio) throw Error(`Misstänkt ZIP-expansion: ${name}`);
    if (creator === 3 && ((external >>> 16) & 0xf000) === 0xa000) throw Error(`Symbolisk länk stöds inte: ${name}`);
    if (localOffset + 30 > bytes.length || u32(view, localOffset) !== 0x04034b50) throw Error(`ZIP-post saknar lokalt header: ${name}`);
    const localNameLength = u16(view, localOffset + 26), localExtra = u16(view, localOffset + 28);
    if (decoder.decode(bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength)) !== name || localOffset + 30 + localNameLength + localExtra + compressed > bytes.length) throw Error(`Felaktig lokal ZIP-post: ${name}`);
    total += uncompressed;
    if (total > ARCHIVE_LIMITS.maxTotalBytes) throw Error('ZIP överskrider gränsen för uppackad data.');
    pos += 46 + nameLength + extra + comment;
  }
  if (pos !== dirOffset + dirSize) throw Error('ZIP-katalogens längd stämmer inte.');
}

export function openZip(bytes: Uint8Array): ZipWorkspace {
  preflightZip(bytes);
  const extracted = unzipSync(bytes);
  const entries = new Map(Object.entries(extracted).filter(([name]) => !name.endsWith('/')).map(([name, content]) => [name, new Uint8Array(content)]));
  const roots = [...entries.keys()].filter(p => p.endsWith('/canonical/metamodel.yaml'));
  if (roots.length !== 1) throw Error('ZIP behöver exakt en projektrot med canonical/metamodel.yaml.');
  return { original: new Uint8Array(bytes), entries, root: roots[0].slice(0, -'canonical/metamodel.yaml'.length), changed: new Set() };
}

/** Edit canonical YAML using yaml Document, which retains comments/ordering. No mutation of original workspace. */
export function editYaml(workspace: ZipWorkspace, relativePath: string, edit: (document: Document) => void): ZipWorkspace {
  if (!/^canonical\/[a-z0-9_-]+\.yaml$/.test(relativePath)) throw Error('Endast kanoniska YAML-filer kan uppdateras i DEV-002.');
  const path = workspace.root + relativePath;
  const bytes = workspace.entries.get(path);
  if (!bytes) throw Error(`Filen saknas: ${path}`);
  const content = decoder.decode(bytes);
  const document = parseDocument(content, { keepSourceTokens: true, strict: true, uniqueKeys: true });
  if (document.errors.length) throw Error(`YAML-fel i ${path}: ${document.errors[0].message}`);
  edit(document);
  if (document.errors.length) throw Error('YAML-ändringen är ogiltig.');
  const result = document.toString({ lineWidth: 0 });
  if (result === content) return workspace;
  const entries = new Map(workspace.entries);
  entries.set(path, new TextEncoder().encode(result));
  return { ...workspace, entries, changed: new Set([...workspace.changed, path]) };
}

/** Unchanged archives are returned as identical bytes. Changed archives retain unchanged entry contents byte-for-byte. */
export function exportZip(workspace: ZipWorkspace): Uint8Array {
  if (workspace.changed.size === 0) return new Uint8Array(workspace.original);
  const output: Record<string, Uint8Array> = {};
  for (const [name, bytes] of workspace.entries) output[name] = bytes;
  const zipped = zipSync(output, { level: 6 });
  preflightZip(zipped);
  return zipped;
}
