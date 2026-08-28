// InstallPrompt.tsx
//
// A lightweight, dismissible banner that instructs iOS / iPadOS users
// how to add the game to their Home Screen.  The banner is shown on
// every page load for iOS users who haven't launched the app from
// their Home Screen yet (per the user's request to prompt on every
// refresh).
import React, { useState, useEffect } from 'react';
import { shouldShowIOSInstallPrompt } from '../utils/pwa';
import './InstallPrompt.css';

const InstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowIOSInstallPrompt());
  }, []);

  if (!visible) return null;

  return (
    <div className="install-prompt">
      <span>
        📱 Tap the <strong>Share</strong> button below, then
        <strong> Add to Home Screen</strong> to save your game
        permanently!
      </span>
      <button
        className="install-prompt__dismiss"
        onClick={() => setVisible(false)}
        aria-label="Dismiss install instructions"
      >
        ×
      </button>
    </div>
  );
};

export default InstallPrompt;
