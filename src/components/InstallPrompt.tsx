// InstallPrompt.tsx
//
// A lightweight, dismissible banner that instructs iOS / iPadOS users
// how to add the game to their Home Screen.  The banner is shown on
// every page load for iOS users who haven't launched the app from
// their Home Screen yet (per the user's request to prompt on every
// refresh).
import { createSignal, onSettled, Show } from 'solid-js';
import { shouldShowIOSInstallPrompt } from '../utils/pwa';
import './InstallPrompt.css';

const InstallPrompt = () => {
  const [visible, setVisible] = createSignal(false);

  onSettled(() => {
    setVisible(shouldShowIOSInstallPrompt());
  });

  return (
    <Show when={visible()}>
      <div class="install-prompt">
        <span>
          📱 Tap the <strong>Share</strong> button below, then
          <strong> Add to Home Screen</strong> to save your game permanently!
        </span>
        <button
          class="install-prompt__dismiss"
          onClick={() => setVisible(false)}
          aria-label="Dismiss install instructions"
        >
          ×
        </button>
      </div>
    </Show>
  );
};

export default InstallPrompt;
