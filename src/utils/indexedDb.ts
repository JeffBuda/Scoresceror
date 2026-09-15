/**
 * indexedDb.ts
 *
 * Minimal IndexedDB substrate for Scoresceror's last-active timestamp.
 * Exposes database constants plus `openDatabase()` and an availability probe;
 * the storage facade (`idbStorage.ts`) builds the get/set/clear API on top.
 */

import { LocalStorageKeys } from '../reducer';

export const DB_NAME = 'scoresceror-db';
export const STORE_NAME = 'timestamps';
export const DB_VERSION = 1;

/** Key used for the "last active" timestamp inside either store. */
export const TIMESTAMP_KEY = 'lastActiveMs';
export const LS_FALLBACK_KEY = LocalStorageKeys.updateTimeMs;

/** `true` when the host exposes a real `indexedDB` (not SSR / unsupported). */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

/** Open (creating the object store on first run) the `timestamps` store. */
export function openDatabase(): Promise<IDBDatabase> {
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
