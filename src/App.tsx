import React, { useReducer, useEffect, useRef } from 'react';
import './App.css';
import Modal from './Modal';
import { restoreState, reducer, State, LocalStorageKeys } from './reducer';
  
const App: React.FC = () => {
  const initialState: State = restoreState();
  const [state, dispatch] = useReducer(reducer, initialState);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      dispatch({ type: 'updateTime', payload: { nowMs: currentTime } });
    }, 1000);

    intervalRef.current = interval;

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(
    () => {
      dispatch({ type: 'calculateIdlePoints', payload: { nowMs: Date.now() } });
    },
    []);

  useEffect(() => {
    if (state.idlePoints && !state.isModalOpen) {
      dispatch({ type: 'openModal' });
    }
  },
  [state.idlePoints, state.isModalOpen]);

  // store state in local storage
  useEffect(
    () => {
      localStorage.setItem(LocalStorageKeys.score, state.score.toString());
      localStorage.setItem(LocalStorageKeys.updateTimeMs, state.updateTimeMs.toString());
    },
    [state.score, state.updateTimeMs]);

  const handleIncrement = () => {
    dispatch({ type: 'increment' });
  };

  const handleCloseModal = () => {
    dispatch({ type: 'closeModal' });
    dispatch({ type: 'awardIdlePoints', payload: { nowMs: Date.now() } });
  };

  return (
    <div className="container">
      <h1>🧙‍♂️ Scoresceror 🧙‍♀️</h1>
      <p>Press the button to increase your score!</p>
      <p>✨ Score: {state.score.toLocaleString()} ✨</p>
      <button onClick={handleIncrement}>🪄 Increase score! 🪄</button>
      <Modal
        isOpen={state.isModalOpen}
        elapsedTimeMs={Math.floor((state.idleTimeMs || 0))}
        points={state.idlePoints || 0}
        onClose={handleCloseModal}
      />
      {/* Add more components and game logic here */}
    </div>
  );
};

export default App;
