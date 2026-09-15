import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { type State, LocalStorageKeys } from '../reducer';

/** Type of the deps object returned by the persistence effect's compute phase. */
type PersistDeps = { score: number; updateTimeMs: number };

/**
 * Capture `createEffect` calls so we can manually drive the compute + effect
 * phases without needing the real SolidJS reactive runtime (same convention as
 * useIdleDetection.test.ts).
 */
const effectRegistry = vi.hoisted(() => {
  const captures: Array<{
    compute: () => PersistDeps;
    effect: (deps: PersistDeps) => void;
  }> = [];

  return {
    register: (compute: () => PersistDeps, effect: (deps: PersistDeps) => void) => {
      captures.push({ compute, effect });
    },
    getCaptures: () => captures,
    reset: () => {
      captures.length = 0;
    },
  };
});

vi.mock('solid-js', () => ({
  createEffect: effectRegistry.register,
}));

const setTimestampMock = vi.hoisted(() => vi.fn());

vi.mock('../utils/idbStorage', () => ({
  setTimestamp: setTimestampMock,
}));

import { usePersistedState } from './usePersistedState';

/** Helper: build a fully-populated State for tests. */
function makeState(overrides: Partial<State> = {}): State {
  return {
    score: 0,
    updateTimeMs: 0,
    isModalOpen: false,
    idleTimeMs: 0,
    idlePoints: 0,
    ...overrides,
  };
}

describe('usePersistedState', () => {
  const mockLocalStorage = {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn(),
  };

  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage);
    vi.mocked(mockLocalStorage.setItem).mockClear();
    vi.mocked(setTimestampMock).mockClear();
    effectRegistry.reset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should persist score and updateTimeMs to localStorage and IndexedDB', () => {
    const state = makeState({ score: 12_345, updateTimeMs: 777_777 });

    usePersistedState(state);

    const captures = effectRegistry.getCaptures();
    expect(captures).toHaveLength(1);

    // Simulate SolidJS compute phase → read deps
    const deps = captures[0].compute();

    // Simulate SolidJS effect phase → run side effect
    captures[0].effect(deps);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(LocalStorageKeys.score, '12345');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(LocalStorageKeys.updateTimeMs, '777777');
    expect(setTimestampMock).toHaveBeenCalledWith(777_777);
  });

  it('should only read score and updateTimeMs from state (fine-grained reactivity)', () => {
    const readProps: string[] = [];
    const baseState = makeState();

    const state = new Proxy(baseState, {
      get(target, prop) {
        if (typeof prop === 'string') readProps.push(prop);
        return (target as Record<string, unknown>)[prop as string];
      },
    });

    usePersistedState(state);

    const deps = effectRegistry.getCaptures()[0].compute();

    // The compute function should return only the persisted fields
    expect(deps).toEqual({ score: 0, updateTimeMs: 0 });

    // Verify ONLY persisted fields were read — transient fields like
    // isModalOpen, idlePoints, idleTimeMs should NOT be tracked, so
    // changes to them will not trigger the persistence effect.
    expect(readProps).toContain('score');
    expect(readProps).toContain('updateTimeMs');
    expect(readProps).not.toContain('isModalOpen');
    expect(readProps).not.toContain('idlePoints');
    expect(readProps).not.toContain('idleTimeMs');
  });

  it('should handle score and updateTimeMs of 0 correctly', () => {
    const state = makeState({ score: 0, updateTimeMs: 0, isModalOpen: true, idleTimeMs: 5000 });

    usePersistedState(state);

    const captures = effectRegistry.getCaptures();
    const deps = captures[0].compute();
    captures[0].effect(deps);

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(LocalStorageKeys.score, '0');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(LocalStorageKeys.updateTimeMs, '0');
    expect(setTimestampMock).toHaveBeenCalledWith(0);
  });

  it('should not read transient fields from state (fine-grained reactivity)', () => {
    // The compute function captures score + updateTimeMs. If only transient
    // fields change, the compute would be re-evaluated by SolidJS only if it
    // read those fields — which it doesn't. This confirms the compute's
    // read-set is limited to persisted fields.
    const readProps: string[] = [];
    const baseState = makeState({ score: 100, updateTimeMs: 500 });

    const state = new Proxy(baseState, {
      get(target, prop) {
        if (typeof prop === 'string') readProps.push(prop);
        return (target as Record<string, unknown>)[prop as string];
      },
    });

    usePersistedState(state);

    effectRegistry.getCaptures()[0].compute();

    // No transient field accesses
    expect(readProps.filter((p) => !['score', 'updateTimeMs'].includes(p))).toHaveLength(0);
  });
});
