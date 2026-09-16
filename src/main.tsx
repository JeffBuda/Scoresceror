import { render } from '@solidjs/web';
import './index.css';
import App from './App.tsx';
import { requestPersistentStorage } from './utils/pwa.ts';

// Request persistent storage so that localStorage game state is
// protected from routine browser eviction (iOS 15.2+ Safari support).
requestPersistentStorage().then((persistent) => {
  if (persistent) {
    console.log('Scoresceror: Storage is protected from routine eviction.');
  }
});

render(() => <App />, document.getElementById('root')!);
