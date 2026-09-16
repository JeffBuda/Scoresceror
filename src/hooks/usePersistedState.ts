/**
 * usePersistedState – extracts localStorage + IndexedDB persistence for game
 * state into a reusable, testable hook.
 *
 * The effect's **compute phase** reads only `state.score` and
 * `state.updateTimeMs`, leveraging SolidJS store fine-grained reactivity so
 * the side effect fires exclusively when those fields change — transient
 * fields like `isModalOpen` toggling will never trigger a write.
 *
 * Uses the two-argument `createEffect(compute, effect)` form (separate compute
 * and effect phases) which is the recommended SolidJS 2.0 pattern.
 */

import { createEffect, type Store } from 'solid-js';
import { LocalStorageKeys, type State } from '../reducer';
import { setTimestamp } from '../utils/idbStorage';

export function usePersistedState(state: Store<State>): void {
  createEffect(
    () => ({ score: state.score, updateTimeMs: state.updateTimeMs }),
    (deps: { score: number; updateTimeMs: number }) => {
      localStorage.setItem(LocalStorageKeys.score, deps.score.toString());
      localStorage.setItem(LocalStorageKeys.updateTimeMs, deps.updateTimeMs.toString());
      void setTimestamp(deps.updateTimeMs);
    },
  );
}
