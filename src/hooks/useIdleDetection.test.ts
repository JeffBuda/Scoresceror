import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist mock state so it is available before vi.mock / imports
const solidMock = vi.hoisted(() => {
  let cleanup: (() => void) | undefined;

  const createSignal = (initial: unknown) => {
    let value: unknown = initial;
    const get: () => unknown = () => value;
    const set = (v: unknown) => {
      value = typeof v === 'function' ? (v as () => unknown)() : v;
    };
    return [get, set] as [() => unknown, (v: unknown) => void];
  };

  const onSettled = (fn: () => (() => void) | void) => {
    cleanup = fn() as (() => void) | undefined;
  };

  return {
    createSignal,
    onSettled,
    getCleanup: () => cleanup,
    resetCleanup: () => {
      cleanup = undefined;
    },
  };
});

vi.mock('solid-js', () => ({
  createSignal: solidMock.createSignal,
  onSettled: solidMock.onSettled,
}));

import { useIdleDetection } from './useIdleDetection';

describe('useIdleDetection', () => {
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const onMount = vi.fn();
  const onInterval = vi.fn();
  let currentTime: number;

  beforeEach(() => {
    currentTime = 1_000_000_000_000;
    vi.useFakeTimers();
    mockGet.mockReset();
    mockSet.mockReset();
    onMount.mockReset();
    onInterval.mockReset();
    solidMock.resetCleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
    solidMock.resetCleanup();
  });

  it('should have idleSeconds equal to 0 initially', () => {
    mockGet.mockResolvedValue(currentTime);

    const { idleSeconds } = useIdleDetection({
      getTimestamp: mockGet,
      setTimestamp: mockSet,
      nowMs: () => currentTime,
    });

    expect(idleSeconds()).toBe(0);
  });

  it('should call onMount with calculated idle seconds', async () => {
    mockGet.mockResolvedValue(currentTime - 5_000); // 5 s ago

    useIdleDetection({
      getTimestamp: mockGet,
      setTimestamp: mockSet,
      nowMs: () => currentTime,
      onMount,
    });

    await vi.runAllTicks();

    expect(mockGet).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(onMount).toHaveBeenCalledWith(currentTime, 5);
    });
  });

  it('should call onInterval on each interval tick', async () => {
    mockGet.mockResolvedValue(currentTime - 2_000); // 2 s ago

    useIdleDetection({
      getTimestamp: mockGet,
      setTimestamp: mockSet,
      nowMs: () => currentTime,
      onInterval,
      intervalMs: 1_000,
    });

    await vi.runAllTicks(); // flush initial calculate

    currentTime += 1_000; // advance mock time by 1 s
    vi.advanceTimersByTime(1_000); // trigger interval
    await vi.runAllTicks(); // flush interval calculate

    await vi.waitFor(() => {
      expect(onInterval).toHaveBeenCalledTimes(1);
    });
    expect(onInterval).toHaveBeenCalledWith(currentTime, expect.any(Number));
  });

  it('should reset idleSeconds and call setTimestamp on setLastActive', async () => {
    mockGet.mockResolvedValue(currentTime - 5_000);

    const { idleSeconds, setLastActive } = useIdleDetection({
      getTimestamp: mockGet,
      setTimestamp: mockSet,
      nowMs: () => currentTime,
    });

    await vi.runAllTicks();
    expect(idleSeconds()).toBe(5);

    setLastActive();

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(idleSeconds()).toBe(0);
  });

  it('should clear the interval on unmount', async () => {
    mockGet.mockResolvedValue(currentTime);

    useIdleDetection({
      getTimestamp: mockGet,
      setTimestamp: mockSet,
      nowMs: () => currentTime,
      onInterval,
    });

    await vi.runAllTicks();

    const cleanup = solidMock.getCleanup();
    expect(cleanup).toBeDefined();
    cleanup!(); // simulate unmount

    vi.advanceTimersByTime(5_000);
    expect(onInterval).not.toHaveBeenCalled();
  });

  it('should return 0 idleSeconds when getTimestamp returns null', async () => {
    mockGet.mockResolvedValue(null);

    const { idleSeconds } = useIdleDetection({
      getTimestamp: mockGet,
      setTimestamp: mockSet,
      nowMs: () => currentTime,
      onMount,
    });

    await vi.runAllTicks();

    expect(idleSeconds()).toBe(0);
    await vi.waitFor(() => {
      expect(onMount).toHaveBeenCalledWith(currentTime, 0);
    });
  });

  it('should not crash when onMount/onInterval are omitted', async () => {
    mockGet.mockResolvedValue(currentTime - 3_000);

    expect(() =>
      useIdleDetection({
        getTimestamp: mockGet,
        setTimestamp: mockSet,
        nowMs: () => currentTime,
      }),
    ).not.toThrow();

    await vi.runAllTicks();
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
