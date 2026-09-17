import { render } from '@solidjs/web';
import './index.css';
import App from './App.tsx';
import DebugView from './DebugView.tsx';
import { requestPersistentStorage } from './utils/pwa.ts';

// Request persistent storage so that localStorage game state is
// protected from routine browser eviction (iOS 15.2+ Safari support).
requestPersistentStorage().then((persistent) => {
  if (persistent) {
    console.log('Scoresceror: Storage is protected from routine eviction.');
  }
});

// Route: /debug renders the diagnostic page; everything else renders the game.
const root = document.getElementById('root')!;
const isDebugRoute = window.location.pathname.includes('/debug');

render(() => (isDebugRoute ? <DebugView /> : <App />), root);
