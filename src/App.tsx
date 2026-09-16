import type { JSX } from '@solidjs/web';
import './App.css';
import Modal from './Modal';
import InstallPrompt from './components/InstallPrompt';
import { useGameState } from './hooks/useGameState';
import './components/InstallPrompt.css';

/**
 * App is a pure view component: it owns no orchestration of its own.
 * All game-state wiring lives in `useGameState` so that this file is
 * concerned only with *rendering* the current state and forwarding user
 * events to the handlers the hook provides (Single Responsibility).
 */
const App = (): JSX.Element => {
  const { state, idleSeconds, handleIncrement, handleCloseModal } = useGameState();

  return (
    <div class="container">
      <InstallPrompt />
      <h1>🧙‍♂️ Scoresceror 🧙‍♀️</h1>
      <p>Press the button to increase your score!</p>
      <p>✨ Score: {state.score.toLocaleString()} ✨</p>
      <button onClick={handleIncrement}>🪄 Increase score! 🪄</button>
      <p>🧊 Idle for: {idleSeconds()} seconds</p>
      <Modal
        isOpen={state.isModalOpen}
        elapsedTimeMs={state.idleTimeMs || 0}
        points={state.idlePoints || 0}
        onClose={handleCloseModal}
      />
      {/* Add more components and game logic here */}
    </div>
  );
};

export default App;
