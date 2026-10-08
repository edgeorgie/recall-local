import type { Doc, NoteChunk } from "./notes";

const DB = "recall-local";
const VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore("docs", { keyPath: "id" });
      const chunks = db.createObjectStore("chunks", { keyPath: "id" });
      chunks.createIndex("docId", "docId");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function all<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const r = store.getAll();
    r.onsuccess = () => resolve(r.result as T[]);
    r.onerror = () => reject(r.error);
  });
}

// Everything lives in this browser's IndexedDB. Nothing is uploaded.
export async function saveDoc(doc: Doc, chunks: NoteChunk[]): Promise<void> {
  const db = await open();
  const tx = db.transaction(["docs", "chunks"], "readwrite");
  tx.objectStore("docs").put(doc);
  for (const c of chunks) tx.objectStore("chunks").put(c);
  await done(tx);
  db.close();
}

export async function loadAll(): Promise<{ docs: Doc[]; chunks: NoteChunk[] }> {
  const db = await open();
  const tx = db.transaction(["docs", "chunks"], "readonly");
  const [docs, chunks] = await Promise.all([all<Doc>(tx.objectStore("docs")), all<NoteChunk>(tx.objectStore("chunks"))]);
  db.close();
  return { docs: docs.sort((a, b) => a.addedAt - b.addedAt), chunks: chunks.sort((a, b) => a.docId.localeCompare(b.docId) || a.index - b.index) };
}

export async function removeDoc(id: string): Promise<void> {
  const db = await open();
  const tx = db.transaction(["docs", "chunks"], "readwrite");
  tx.objectStore("docs").delete(id);
  const idx = tx.objectStore("chunks").index("docId");
  const req = idx.openKeyCursor(IDBKeyRange.only(id));
  req.onsuccess = () => {
    const cursor = req.result;
    if (cursor) {
      tx.objectStore("chunks").delete(cursor.primaryKey);
      cursor.continue();
    }
  };
  await done(tx);
  db.close();
}

export async function clearAll(): Promise<void> {
  const db = await open();
  const tx = db.transaction(["docs", "chunks"], "readwrite");
  tx.objectStore("docs").clear();
  tx.objectStore("chunks").clear();
  await done(tx);
  db.close();
}
