import React, { useReducer, useEffect, useRef } from 'react';
import './App.css';

// Define the types for state and actions
interface State {
  count: number;
  lastFrameTime: number;
}

export type Action = 
  { type: 'increment' } | 
  { type: 'decrement' } | 
  { type: 'autoIncrement', payload: { time: number } };

// Define the reducer function
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'autoIncrement':
      const timeElapsed = action.payload.time - state.lastFrameTime;
      if (timeElapsed >= 1000) {
        const increments = Math.floor(timeElapsed / 1000);
        return { ...state, count: state.count + increments, lastFrameTime: action.payload.time };
      }
      return { ...state, count: state.count, lastFrameTime: action.payload.time };
    default:
      return state;
  }
};

const App: React.FC = () => {
  const initialState = {
    count: Number(localStorage.getItem('count')) || 0,
    lastFrameTime: performance.now(),
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  const intervalRef = useRef<number>();

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = performance.now();
      dispatch({ type: 'autoIncrement', payload: { time: currentTime } });
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
        dispatch({ type: 'autoIncrement', payload: { time: currentTime } });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('count', state.count.toString());
  }, [state.count]);

  return (
    <div className="container">
      <h1>🧙‍♂️ Scoresceror 🧙‍♀️</h1>
      <p>Press the button to increase your score!</p>
      <p>✨ Score: {state.count.toLocaleString()} ✨</p>
      <button onClick={() => dispatch({ type: 'increment' })}>🪄 Increase score! 🪄</button>
      {/* Add more components and game logic here */}
    </div>
  );
};

export default App;
