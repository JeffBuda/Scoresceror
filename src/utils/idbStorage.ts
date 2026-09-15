/**
 * idbStorage.ts
 *
 * Lightweight, async key-value persistence built on the **native** IndexedDB
 * API.  A single object store ("timestamps") holds timestamp values keyed by
 * a string name.  When IndexedDB is unavailable (SSR, private-browsing mode,
 * or older browsers) the module transparently falls back to `localStorage`.
 *
 * Only the subset of IndexedDB needed for timestamp persistence is used —
 * no external dependencies required.
 */

import { LocalStorageKeys } from '../reducer';

const DB_NAME = 'scoresceror-db';
const STORE_NAME = 'timestamps';
const DB_VERSION = 1;

// Key used for the "last active" timestamp inside either IndexedDB or
// the localStorage fallback.
const TIMESTAMP_KEY = 'lastActiveMs';
const LS_FALLBACK_KEY = LocalStorageKeys.updateTimeMs;

// ---------------------------------------------------------------------------
// Internal: open (or create) the database
// ---------------------------------------------------------------------------
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve the last-active timestamp (epoch milliseconds) from persistent
 * storage.  Returns `null` when no value has been stored yet.
 */
export async function getTimestamp(): Promise<number | null> {
  // --- IndexedDB path -------------------------------------------------------
  if (isIndexedDBAvailable()) {
    let db: IDBDatabase | null = null;
    try {
      db = await openDatabase();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(TIMESTAMP_KEY);

      const value = await new Promise<number | undefined>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as number | undefined);
        request.onerror = () => reject(request.error);
      });

      db.close();
      return value ?? null;
    } catch {
      db?.close();
      // fall through to localStorage
    }
  }

  // --- localStorage fallback ------------------------------------------------
  const raw = localStorage.getItem(LS_FALLBACK_KEY);
  return raw ? Number(raw) : null;
}

/**
 * Persist the last-active timestamp (epoch milliseconds) to persistent
 * storage.  Falls back to `localStorage` when IndexedDB is unavailable.
 */
export async function setTimestamp(nowMs: number): Promise<void> {
  // --- IndexedDB path -------------------------------------------------------
  if (isIndexedDBAvailable()) {
    let db: IDBDatabase | null = null;
    try {
      db = await openDatabase();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(nowMs, TIMESTAMP_KEY);

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      db.close();
      return;
    } catch {
      db?.close();
      // fall through to localStorage
    }
  }

  // --- localStorage fallback ------------------------------------------------
  localStorage.setItem(LS_FALLBACK_KEY, nowMs.toString());
}

/**
 * Remove the stored timestamp from persistent storage.
 */
export async function clearTimestamp(): Promise<void> {
  if (isIndexedDBAvailable()) {
    let db: IDBDatabase | null = null;
    try {
      db = await openDatabase();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(TIMESTAMP_KEY);
      await new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
      });
      db.close();
    } catch {
      db?.close();
    }
  }

  localStorage.removeItem(LS_FALLBACK_KEY);
}
