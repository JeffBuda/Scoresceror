import { calculatePoints, type State, type Action } from './state';

// Re-export the data model so existing import sites (useGameState,
// usePersistedState, indexedDb, reducer.test) keep resolving `../reducer`.
export { calculatePoints, type Action, type State, LocalStorageKeys, restoreState } from './state';

/**
 * reducer — pure state transitions for the Scoresceror game machine.
 * Always returns a NEW state object; never mutates the previous one.
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'increment':
      return { ...state, score: state.score + 1 };
    case 'updateTime': {
      const timeElapsedMs = action.payload.nowMs - (state.updateTimeMs || 0);
      return {
        ...state,
        score: state.score + calculatePoints(timeElapsedMs),
        updateTimeMs: action.payload.nowMs,
      };
    }
    case 'openModal':
      return { ...state, isModalOpen: true };
    case 'calculateIdlePoints': {
      if (!state.score) {
        return {
          ...state,
          score: 0,
          idlePoints: 0,
          idleTimeMs: 0,
          updateTimeMs: action.payload.nowMs,
        };
      }
      const idleTimeMs = action.payload.nowMs - state.updateTimeMs;
      const idlePoints = calculatePoints(idleTimeMs);
      return { ...state, idleTimeMs, idlePoints, updateTimeMs: action.payload.nowMs };
    }
    case 'awardIdlePoints':
      return {
        ...state,
        idlePoints: 0,
        score: state.score + state.idlePoints,
        updateTimeMs: action.payload.nowMs,
      };
    case 'closeModal':
      return { ...state, isModalOpen: false };
    default:
      return state;
  }
};
