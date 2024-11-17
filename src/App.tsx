import React, { useReducer, useEffect, useRef } from 'react';
import './App.css';
import Modal from './Modal';

// Define the types for state and actions
interface State {
  count: number;
  lastFrameTime: number;
  isModalOpen: boolean;
  elapsedTime: number;
  points: number;
}

export type Action = 
  { type: 'increment' } | 
  { type: 'decrement' } | 
  { type: 'updateScore', payload: { time: number } } |
  { type: 'storeTime', payload: { time: number } } |
  { type: 'restoreTime', payload: { time: number } } |
  { type: 'openModal', payload: { elapsedTime: number, points: number } } |
  { type: 'closeModal' };

// Define the reducer function
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'updateScore':
      const timeElapsed = action.payload.time - state.lastFrameTime;
      if (timeElapsed >= 1000) {
        const increments = Math.floor(timeElapsed / 1000);
        return { ...state, count: state.count + increments, lastFrameTime: action.payload.time };
      }
      return { ...state, lastFrameTime: action.payload.time };
    case 'storeTime':
      localStorage.setItem('lastInteractionTime', action.payload.time.toString());
      localStorage.setItem('count', state.count.toString());
      return state;
    case 'restoreTime':
      const lastInteractionTime = Number(localStorage.getItem('lastInteractionTime'));
      const deltaTime = action.payload.time - lastInteractionTime;
      const deltaInSeconds = Math.floor(deltaTime / 1000);
      const previousScore = Number(localStorage.getItem('count')) || 0;
      return { 
        ...state, 
        count: previousScore + deltaInSeconds, 
        lastFrameTime: action.payload.time,
        isModalOpen: true,
        elapsedTime: deltaInSeconds,
        points: deltaInSeconds
      };
    case 'openModal':
      return { 
        ...state, 
        isModalOpen: true, 
        elapsedTime: action.payload.elapsedTime, 
        points: action.payload.points 
      };
    case 'closeModal':
      return { ...state, isModalOpen: false };
    default:
      return state;
  }
};

const App: React.FC = () => {
  const initialState: State = { 
    count: Number(localStorage.getItem('count')) || 0, 
    lastFrameTime: Number(localStorage.getItem('lastInteractionTime')),
    isModalOpen: false,
    elapsedTime: 0,
    points: 0
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const intervalRef = useRef<number>();

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = performance.now();
      dispatch({ type: 'updateScore', payload: { time: currentTime } });
    }, 1000);

    intervalRef.current = interval;

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [state.lastFrameTime]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentTime = performance.now();
        dispatch({ type: 'restoreTime', payload: { time: currentTime } });
      } else {
        const currentTime = performance.now();
        dispatch({ type: 'storeTime', payload: { time: currentTime } });
      }
    };

    const handleBeforeUnload = () => {
      const currentTime = performance.now();
      dispatch({ type: 'storeTime', payload: { time: currentTime } });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const currentTime = performance.now();
    const lastInteractionTime = Number(localStorage.getItem('lastInteractionTime'));
    if (lastInteractionTime) {
      dispatch({ type: 'restoreTime', payload: { time: currentTime } });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('count', state.count.toString());
  }, [state.count]);

  useEffect(() => {
    document.title = `✨ Score: ${state.count.toLocaleString()} ✨`;
  }, [state.count]);

  const handleIncrement = () => {
    dispatch({ type: 'increment' });
  };

  const handleCloseModal = () => {
    dispatch({ type: 'closeModal' });
  };

  return (
    <div className="container">
      <h1>🧙‍♂️ Scoresceror 🧙‍♀️</h1>
      <p>Press the button to increase your score!</p>
      <p>✨ Score: {state.count.toLocaleString()} ✨</p>
      <button onClick={handleIncrement}>🪄 Increase score! 🪄</button>
      <Modal 
        isOpen={state.isModalOpen} 
        onClose={handleCloseModal} 
        elapsedTime={state.elapsedTime} 
        points={state.points} 
      />
      {/* Add more components and game logic here */}
    </div>
  );
};

export default App;
