/**
 * idbStorage.ts
 *
 * Async key-value persistence for the "last active" timestamp. Uses the native
 * IndexedDB substrate (`indexedDb.ts`) and transparently falls back to
 * `localStorage` when IndexedDB is unavailable (SSR, private-browsing, etc.).
 */

import {
  LS_FALLBACK_KEY,
  STORE_NAME,
  TIMESTAMP_KEY,
  isIndexedDBAvailable,
  openDatabase,
} from './indexedDb';

/**
 * Retrieve the last-active timestamp (epoch milliseconds) from persistent
 * storage. Returns `null` when no value has been stored yet.
 */
export async function getTimestamp(): Promise<number | null> {
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

  const raw = localStorage.getItem(LS_FALLBACK_KEY);
  return raw ? Number(raw) : null;
}

/**
 * Persist the last-active timestamp (epoch milliseconds) to persistent storage.
 * Falls back to `localStorage` when IndexedDB is unavailable.
 */
export async function setTimestamp(nowMs: number): Promise<void> {
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

  localStorage.setItem(LS_FALLBACK_KEY, nowMs.toString());
}

/** Remove the stored timestamp from persistent storage. */
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
