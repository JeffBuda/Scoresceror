/**
 * useIdleDetection – reusable SolidJS reactive hook for idle-time detection.
 *
 * Sets up a recurring timer (via `onSettled` + `setInterval`) that
 * recalculates the idle duration in **seconds** based on a timestamp
 * retrieved from consumer-provided storage callbacks.
 *
 * The hook is storage-agnostic: the consumer supplies `getTimestamp` and
 * `setTimestamp` functions so that either IndexedDB, localStorage, or any
 * other backend can be used.
 *
 * @example
 * ```ts
 * const { idleSeconds, setLastActive } = useIdleDetection({
 *   getTimestamp,
 *   setTimestamp,
 *   onMount: (nowMs, idleSeconds) => {
 *     dispatch({ type: 'calculateIdlePoints', payload: { nowMs } });
 *   },
 *   onInterval: (nowMs, idleSeconds) => {
 *     dispatch({ type: 'updateTime', payload: { nowMs } });
 *   },
 *   // Optional: inject a custom timestamp provider for testing
 *   // nowMs: () => Date.now(),
 * });
 * ```
 */

import { createSignal, onSettled, type Accessor } from 'solid-js';

export interface IdleDetectionOptions {
  /**
   * Consumer-provided function to retrieve the last-known active timestamp
   * (epoch milliseconds) from persistent storage.
   * Returns `null` when no timestamp has been stored yet.
   */
  getTimestamp: () => Promise<number | null>;
  /**
   * Consumer-provided function to persist the last-known active timestamp
   * (epoch milliseconds) to persistent storage.
   */
  setTimestamp: (nowMs: number) => Promise<void>;
  /** Recurring check interval in milliseconds.  Default: 1000. */
  intervalMs?: number;
  /**
   * Called **once** right after mount with the initial idle calculation.
   */
  onMount?: (nowMs: number, idleSeconds: number) => void;
  /**
   * Called on every interval tick with the current idle calculation.
   */
  onInterval?: (nowMs: number, idleSeconds: number) => void;
  /**
   * Injectable timestamp provider.  Defaults to `Date.now`.
   * Inject a custom function (e.g. `() => Date.now()`) in tests to
   * make the hook deterministic and avoid side effects.
   */
  nowMs?: () => number;
}

export interface UseIdleDetectionResult {
  /** Reactive accessor: current idle duration in whole seconds. */
  idleSeconds: Accessor<number>;
  /**
   * Persist the current timestamp to storage and reset the idle timer.
   * Call this whenever the user interacts with the app.
   */
  setLastActive: () => void;
}

export function useIdleDetection(options: IdleDetectionOptions): UseIdleDetectionResult {
  const {
    getTimestamp,
    setTimestamp,
    intervalMs = 1000,
    nowMs: nowProvider = Date.now,
    onMount,
    onInterval,
  } = options;

  const [idleSeconds, setIdleSeconds] = createSignal<number>(0);
  let intervalId: ReturnType<typeof setInterval> | undefined;

  /**
   * Core calculation – reads the persisted timestamp, computes the
   * elapsed idle time in whole seconds, and updates the reactive signal.
   */
  const calculate = async (): Promise<{ nowMs: number; idleSeconds: number }> => {
    const storedMs = await getTimestamp();
    const nowMs = nowProvider();
    const seconds = storedMs === null ? 0 : Math.max(0, Math.floor((nowMs - storedMs) / 1000));
    setIdleSeconds(seconds);
    return { nowMs, idleSeconds: seconds };
  };

  const start = (): void => {
    // Immediate (mount) calculation.
    void calculate().then(({ nowMs, idleSeconds: secs }) => {
      onMount?.(nowMs, secs);
    });

    // Clear any pre-existing interval (defensive – onSettled only runs once).
    stop();

    intervalId = setInterval(async () => {
      const { nowMs, idleSeconds: secs } = await calculate();
      onInterval?.(nowMs, secs);
    }, intervalMs);
  };

  const stop = (): void => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  };

  /**
   * Persist the current timestamp and reset the idle timer.
   * The consumer should call this on every user interaction.
   */
  const setLastActive = (): void => {
    const nowMs = nowProvider();
    void setTimestamp(nowMs);
    setIdleSeconds(0);
  };

  // Run once after the component's first stable render; cleanup on unmount.
  onSettled(() => {
    start();
    return stop;
  });

  return { idleSeconds, setLastActive };
}
