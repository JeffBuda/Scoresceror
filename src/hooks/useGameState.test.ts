import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { State } from '../reducer';

/**
 * Capture `createStore` (state + setter) and `createEffect` (compute/effect
 * pair) calls so we can drive the orchestration logic manually without the real
 * SolidJS reactive runtime — same convention as useIdleDetection.test.ts and
 * usePersistedState.test.ts.
 */
const solidMock = vi.hoisted(() => {
  // Live holder mutated in place by the store setter so that reactive reads
  // through the returned Proxy always observe the latest committed state.
  let holder: Record<string, unknown> = {
    score: 0,
    updateTimeMs: 0,
    isModalOpen: false,
    idleTimeMs: 0,
    idlePoints: 0,
  };
  let set: ((updater: (prev: State) => State) => void) | undefined;

  const createStore = (initial: State) => {
    holder = { ...initial };
    set = vi.fn((updater: (prev: State) => State) => {
      const next = typeof updater === 'function' ? updater(holder as State) : updater;
      Object.assign(holder, next);
    });

    const proxy = new Proxy(holder, {
      get(target, prop) {
        return (target as Record<string, unknown>)[prop as string];
      },
    });
    return [proxy, set];
  };

  const effects: Array<{ compute: () => unknown; effect: (deps: unknown) => void }> = [];
  const createEffect = (compute: () => unknown, effect: (deps: unknown) => void) => {
    effects.push({ compute, effect });
  };

  return {
    createStore,
    createEffect,
    getSetter: () => set,
    getHolder: () => holder as State,
    getEffects: () => effects,
    reset: () => {
      effects.length = 0;
      set = undefined;
      holder = {
        score: 0,
        updateTimeMs: 0,
        isModalOpen: false,
        idleTimeMs: 0,
        idlePoints: 0,
      };
    },
  };
});

vi.mock('solid-js', () => ({
  createStore: solidMock.createStore,
  createEffect: solidMock.createEffect,
}));

const idleMock = vi.hoisted(() => {
  const setLastActive = vi.fn();
  const useIdleDetection = vi.fn(() => ({
    idleSeconds: () => 0,
    setLastActive,
  }));
  return {
    setLastActive,
    useIdleDetection,
    getLastOptions: () => useIdleDetection.mock.calls[0]?.[0],
  };
});

vi.mock('./useIdleDetection', () => ({
  useIdleDetection: idleMock.useIdleDetection,
}));

const persistenceMock = vi.hoisted(() => ({
  usePersistedState: vi.fn(),
}));

vi.mock('./usePersistedState', () => ({
  usePersistedState: persistenceMock.usePersistedState,
}));

vi.mock('../utils/idbStorage', () => ({
  getTimestamp: vi.fn(),
  setTimestamp: vi.fn(),
}));

// Mock the reducer module so `reducer` becomes a spy that *delegates* to the
// real implementation — letting us assert dispatched actions while still
// driving genuine state transitions through the live store.
vi.mock('../reducer', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('../reducer');
  return {
    ...actual,
    restoreState: vi.fn(() => ({
      score: 0,
      updateTimeMs: 0,
      isModalOpen: false,
      idleTimeMs: 0,
      idlePoints: 0,
    })),
    reducer: vi.fn(actual.reducer),
  };
});

import { useGameState } from './useGameState';
import { reducer as reducerSpy } from '../reducer';
import { getTimestamp, setTimestamp } from '../utils/idbStorage';
import { usePersistedState } from './usePersistedState';

describe('useGameState', () => {
  beforeEach(() => {
    solidMock.reset();
    idleMock.useIdleDetection.mockClear();
    idleMock.setLastActive.mockClear();
    usePersistedState.mockClear();
    reducerSpy.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('wires idle detection and persistence to the reactive store on mount', () => {
    useGameState();

    const opts = idleMock.getLastOptions();
    expect(opts.getTimestamp).toBe(getTimestamp);
    expect(opts.setTimestamp).toBe(setTimestamp);
    expect(typeof opts.onMount).toBe('function');
    expect(typeof opts.onInterval).toBe('function');

    expect(usePersistedState).toHaveBeenCalledTimes(1);
    expect(usePersistedState).toHaveBeenCalledWith(
      expect.objectContaining({ score: 0, updateTimeMs: 0 }),
    );
  });

  it('handleIncrement records activity and dispatches increment + updateTime in order', () => {
    const fixedNow = 1_234_567_890;
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { handleIncrement } = useGameState();
    const setSpy = solidMock.getSetter()!;

    handleIncrement();

    // dispatch(increment) -> setLastActive -> dispatch(updateTime)
    expect(setSpy).toHaveBeenCalledTimes(2);
    expect(idleMock.setLastActive).toHaveBeenCalledTimes(1);
    expect(setSpy.mock.invocationCallOrder[0]).toBeLessThan(
      idleMock.setLastActive.mock.invocationCallOrder[0],
    );
    expect(idleMock.setLastActive.mock.invocationCallOrder[0]).toBeLessThan(
      setSpy.mock.invocationCallOrder[1],
    );

    // The dispatched actions (2nd arg to the reducer spy).
    expect(reducerSpy.mock.calls[0][1]).toEqual({ type: 'increment' });
    expect(reducerSpy.mock.calls[1][1]).toEqual({
      type: 'updateTime',
      payload: { nowMs: fixedNow },
    });
  });

  it('handleCloseModal closes the modal, awards idle points, and records activity', () => {
    const fixedNow = 987_654_321;
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    const { handleCloseModal } = useGameState();
    const setSpy = solidMock.getSetter()!;

    handleCloseModal();

    expect(setSpy).toHaveBeenCalledTimes(2);
    expect(idleMock.setLastActive).toHaveBeenCalledTimes(1);

    expect(reducerSpy.mock.calls[0][1]).toEqual({ type: 'closeModal' });
    expect(reducerSpy.mock.calls[1][1]).toEqual({
      type: 'awardIdlePoints',
      payload: { nowMs: fixedNow },
    });
  });

  it('modal-open effect does NOT dispatch openModal when no idle points are earned', () => {
    useGameState();
    const setSpy = solidMock.getSetter()!;
    setSpy.mockClear();
    reducerSpy.mockClear();

    const [effect] = solidMock.getEffects();
    effect.effect(effect.compute());

    expect(setSpy).not.toHaveBeenCalled();
    expect(reducerSpy).not.toHaveBeenCalledWith(expect.anything(), { type: 'openModal' });
  });

  it('modal-open effect dispatches openModal when idle points are available and modal is closed', () => {
    useGameState();
    const holder = solidMock.getHolder();
    const setSpy = solidMock.getSetter()!;
    reducerSpy.mockClear();

    // Simulate the store having earned idle points while the modal is closed.
    holder.idlePoints = 5;
    holder.isModalOpen = false;

    const [effect] = solidMock.getEffects();
    effect.effect(effect.compute());

    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(reducerSpy.mock.calls[0][1]).toEqual({ type: 'openModal' });
    // The real reducer was applied, so the held state reflects the open modal.
    expect(holder.isModalOpen).toBe(true);
  });

  it('modal-open effect does NOT re-open the modal when it is already open', () => {
    useGameState();
    const holder = solidMock.getHolder();
    const setSpy = solidMock.getSetter()!;
    reducerSpy.mockClear();
    setSpy.mockClear();

    holder.idlePoints = 5;
    holder.isModalOpen = true;

    const [effect] = solidMock.getEffects();
    effect.effect(effect.compute());

    expect(setSpy).not.toHaveBeenCalled();
    expect(holder.isModalOpen).toBe(true);
  });
});
