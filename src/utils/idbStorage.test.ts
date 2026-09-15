import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getTimestamp, setTimestamp, clearTimestamp } from './idbStorage';
import { LocalStorageKeys } from '../reducer';

interface MockRequest {
  result: unknown;
  error: Error | null;
  onsuccess: ((e: Event) => void) | null;
  onerror: ((e: ErrorEvent) => void) | null;
}

function createMockRequest(result: unknown): MockRequest {
  const req: MockRequest = {
    result,
    error: null,
    onsuccess: null,
    onerror: null,
  };
  Promise.resolve().then(() => {
    if (req.onsuccess) req.onsuccess({} as Event);
  });
  return req;
}

interface MockObjectStore {
  get: (key: string) => MockRequest;
  put: (value: unknown, key: string) => MockRequest;
  delete: (key: string) => MockRequest;
}

interface MockTransaction {
  objectStore: (name: string) => MockObjectStore;
  oncomplete: (() => void) | null;
  onerror: (() => void) | null;
}

interface MockDB {
  objectStoreNames: { contains: (name: string) => boolean };
  transaction: (name: string, mode: string) => MockTransaction;
  close: () => void;
}

function createMockIDB() {
  const store = new Map<string, unknown>();

  const mockObjectStore: MockObjectStore = {
    get: (key: string) => createMockRequest(store.get(key)),
    put: (value: unknown, key: string) => {
      store.set(key, value);
      return createMockRequest(undefined);
    },
    delete: (key: string) => {
      store.delete(key);
      return createMockRequest(undefined);
    },
  };

  const mockTransaction: MockTransaction = {
    objectStore: () => mockObjectStore,
    oncomplete: null,
    onerror: null,
  };

  const mockDB: MockDB = {
    objectStoreNames: { contains: () => true },
    transaction: () => {
      const tx: MockTransaction = { ...mockTransaction };
      Promise.resolve().then(() => {
        if (tx.oncomplete) tx.oncomplete();
      });
      return tx;
    },
    close: vi.fn(),
  };

  return {
    indexedDB: {
      open: vi.fn(() => createMockRequest(mockDB)),
      deleteDatabase: vi.fn(() => createMockRequest(undefined)),
      cmp: (): number => 0,
    },
    store,
  };
}

function createMockStorage() {
  const data = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => (data.has(key) ? data.get(key) : null)),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
    clear: vi.fn(() => data.clear()),
    key: vi.fn((i: number) => Array.from(data.keys())[i] ?? null),
    length: 0,
  };
}

describe('idbStorage', () => {
  let mockIDB: ReturnType<typeof createMockIDB>;
  let mockLocalStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockIDB = createMockIDB();
    mockLocalStorage = createMockStorage();

    vi.stubGlobal('indexedDB', mockIDB.indexedDB);
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTimestamp', () => {
    it('should return null when no timestamp is stored', async () => {
      const result = await getTimestamp();
      expect(result).toBeNull();
    });

    it('should return the stored timestamp after setTimestamp', async () => {
      await setTimestamp(1234567890);
      const result = await getTimestamp();
      expect(result).toBe(1234567890);
    });

    it('should store and retrieve multiple timestamps', async () => {
      await setTimestamp(100);
      expect(await getTimestamp()).toBe(100);

      await setTimestamp(200);
      expect(await getTimestamp()).toBe(200);
    });
  });

  describe('setTimestamp', () => {
    it('should call indexedDB.open', async () => {
      await setTimestamp(999999);
      expect(mockIDB.indexedDB.open).toHaveBeenCalled();
    });

    it('should store the value in the object store', async () => {
      await setTimestamp(42);
      expect(mockIDB.store.get('lastActiveMs')).toBe(42);
    });
  });

  describe('clearTimestamp', () => {
    it('should remove the stored timestamp', async () => {
      await setTimestamp(12345);
      expect(await getTimestamp()).toBe(12345);

      await clearTimestamp();
      expect(await getTimestamp()).toBeNull();
    });
  });

  describe('localStorage fallback', () => {
    beforeEach(() => {
      vi.stubGlobal('indexedDB', undefined);
    });

    it('should fall back to localStorage when IndexedDB is unavailable', async () => {
      await setTimestamp(777777);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        LocalStorageKeys.updateTimeMs,
        '777777',
      );

      const result = await getTimestamp();
      expect(result).toBe(777777);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(LocalStorageKeys.updateTimeMs);
    });

    it('should return null from localStorage when no value is stored', async () => {
      const result = await getTimestamp();
      expect(result).toBeNull();
    });
  });
});
