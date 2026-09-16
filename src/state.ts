/**
 * state.ts
 *
 * Domain model: the game's `State` shape, the `Action` union, the localStorage
 * key enum, the state-restoration helper, and the pure points-scoring helper.
 *
 * These are pure data + pure functions, so they live separately from the
 * reducer switch (`reducer.ts`) and are re-exported from there to preserve the
 * existing public import surface (`import { ... } from '../reducer'`).
 */

export enum LocalStorageKeys {
  score = 'score',
  updateTimeMs = 'updateTimeMs',
}

export interface State {
  // persisted
  score: number;
  updateTimeMs: number;

  // transient
  isModalOpen: boolean;
  idleTimeMs: number;
  idlePoints: number;
}

export type Action =
  | { type: 'increment' }
  | { type: 'openModal' }
  | { type: 'closeModal' }
  | { type: 'updateTime'; payload: { nowMs: number } }
  | { type: 'calculateIdlePoints'; payload: { nowMs: number } }
  | { type: 'awardIdlePoints'; payload: { nowMs: number } };

/** Recreate the `State` object from localStorage (returns a fresh seed if empty). */
export function restoreState(): State {
  const updateTimeMs = Number(localStorage.getItem(LocalStorageKeys.updateTimeMs) || 0);
  const score = Number(localStorage.getItem(LocalStorageKeys.score) || 0);
  return {
    score,
    updateTimeMs,
    isModalOpen: false,
    idleTimeMs: 0,
    idlePoints: 0,
  };
}

/** Convert a millisecond delta into whole idle points (1 pt per second). */
export function calculatePoints(deltaTimeMs: number): number {
  return Math.floor(deltaTimeMs / 1000);
}
