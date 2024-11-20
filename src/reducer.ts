
export enum LocalStorageKeys { score = 'score', updateTimeMs = 'updateTimeMs' };

// Define the types for state and actions
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
    { type: 'increment' } |
    { type: 'openModal' } |
    { type: 'closeModal' } |
    { type: 'updateTime', payload: { nowMs: number } } |
    { type: 'calculateIdlePoints', payload: { nowMs: number } } |
    { type: 'awardIdlePoints', payload: { nowMs: number } };


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

export function calculatePoints(deltaTimeMs: number): number {
    return Math.floor(deltaTimeMs / 1000);
}

export const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'increment':
            return { ...state, score: state.score + 1 };
        case 'updateTime':
            const timeElapsedMs = action.payload.nowMs - (state.updateTimeMs || 0)
            return {
                ...state,
                score: state.score + calculatePoints(timeElapsedMs),
                updateTimeMs: action.payload.nowMs
            };
        case 'openModal':
            return {
                ...state,
                isModalOpen: true,
            };
        case 'calculateIdlePoints':
            if (!state.score) {
                // first time ever load of game
                return { ...state, score: 0, idlePoints: 0, idleTimeMs: 0, updateTimeMs: action.payload.nowMs };
            }

            //resume saved game
            const idleTimeMs = action.payload.nowMs - state.updateTimeMs;
            const idlePoints = calculatePoints(idleTimeMs);
            return {
                ...state,
                idleTimeMs,
                idlePoints,
                updateTimeMs: action.payload.nowMs
            };
        case 'awardIdlePoints':
            return {
                ...state,
                idlePoints: 0,
                score: state.score + state.idlePoints,
                updateTimeMs: action.payload.nowMs
            }
        case 'closeModal':
            return {
                ...state,
                isModalOpen: false
            };
        default:
            return state;
    }
};