/**
 * useGameState – the single orchestration root for Scoresceror's game logic.
 *
 * SolidJS components are at their cleanest when they are *pure views*: they
 * declare "given this state, here is the UI, and here are the handlers for
 * user events."  All of the *wiring* that used to live in `App.tsx` — creating
 * the reactive store, building the dispatch abstraction, connecting the
 * storage-agnostic `useIdleDetection` hook to the reducer, opening the modal
 * when idle points are earned, persisting state, and composing the increment /
 * close-modal handlers — belongs in a dedicated composite hook with one clear
 * responsibility: **manage the lifecycle of game state.**
 *
 * This is a "facade" over the lower-level hooks (`useIdleDetection`,
 * `usePersistedState`) and the pure `reducer`.  It exists so that `App.tsx` can
 * stay focused on rendering.
 */

import { createStore, createEffect, type Store } from 'solid-js';
import { restoreState, reducer, type State, type Action } from '../reducer';
import { getTimestamp, setTimestamp } from '../utils/idbStorage';
import { useIdleDetection } from './useIdleDetection';
import { usePersistedState } from './usePersistedState';

export interface UseGameStateResult {
  /** The reactive game-state store consumed by the view layer. */
  state: Store<State>;
  /** Reactive accessor (seconds since last activity) for display. */
  idleSeconds: () => number;
  /** Increase the score and record an active interaction. */
  handleIncrement: () => void;
  /** Close the idle-award modal and credit the earned points. */
  handleCloseModal: () => void;
}

export function useGameState(): UseGameStateResult {
  const initialState: State = restoreState();
  const [state, setState] = createStore<State>(initialState);

  const dispatch = (action: Action) => {
    setState((prev: State) => reducer(prev, action));
  };

  // Idle detection with persistent timestamp storage.
  // The hook is storage-agnostic: it receives getTimestamp/setTimestamp
  // callbacks (backed by IndexedDB) and returns a reactive idleSeconds
  // accessor. onMount/onInterval dispatch to the reducer for game logic.
  const { idleSeconds, setLastActive } = useIdleDetection({
    getTimestamp,
    setTimestamp,
    onMount: (nowMs: number) => {
      dispatch({ type: 'calculateIdlePoints', payload: { nowMs } });
    },
    onInterval: (nowMs: number) => {
      dispatch({ type: 'updateTime', payload: { nowMs } });
    },
  });

  // Open modal when idle points are available
  createEffect(
    () => ({ idlePoints: state.idlePoints, isModalOpen: state.isModalOpen }),
    (deps: { idlePoints: number; isModalOpen: boolean }) => {
      if (deps.idlePoints && !deps.isModalOpen) {
        dispatch({ type: 'openModal' });
      }
    },
  );

  // Persist score and timestamp to localStorage + IndexedDB
  usePersistedState(state);

  const handleIncrement = () => {
    dispatch({ type: 'increment' });
    setLastActive();
    dispatch({ type: 'updateTime', payload: { nowMs: Date.now() } });
  };

  const handleCloseModal = () => {
    dispatch({ type: 'closeModal' });
    dispatch({ type: 'awardIdlePoints', payload: { nowMs: Date.now() } });
    setLastActive();
  };

  return { state, idleSeconds, handleIncrement, handleCloseModal };
}
