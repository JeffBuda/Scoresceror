import type { JSX } from '@solidjs/web';
import './DebugView.css';
import { VERSION_STRING, BUILD_TIMESTAMP, COMMIT_SHA } from './version';

/**
 * DebugView — a diagnostic page at /debug that shows build/version metadata.
 *
 * Route is handled client-side in main.tsx (no router dependency).  The
 * "Close" button does a hard navigation back to the app root.
 */
const DebugView = (): JSX.Element => {
  return (
    <div class="container debug-page">
      <h1>⚙️ Debug</h1>

      <div class="debug-info">
        <p>
          <strong>Version:</strong> {VERSION_STRING}
        </p>
        <p>
          <strong>Build Date:</strong> {BUILD_TIMESTAMP}
        </p>
        <p>
          <strong>Commit:</strong> {COMMIT_SHA}
        </p>
      </div>

      <button
        class="debug-close-btn"
        onClick={() => (window.location.href = import.meta.env.BASE_URL)}
      >
        Close
      </button>
    </div>
  );
};

export default DebugView;
