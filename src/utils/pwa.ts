/**
 * PWA and persistent storage utilities.
 *
 * These helpers detect iOS / iPadOS devices, check whether the app is
 * already running in standalone (installed) mode, and request
 * persistent storage so that game state in `localStorage` is not
 * evicted by the browser's storage quota manager.
 */

/**
 * Detect whether the user is on an iOS / iPadOS device.
 *
 * iPhone and (traditional) iPad user agents are matched directly.
 * iPadOS 13+ ships a macOS-style "Mac" user agent on Safari, so we
 * also check `navigator.maxTouchPoints` to distinguish touch-enabled
 * iPads from desktop Macs.
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOSMatch = /iPad|iPhone|iPod/.test(ua);
  const iPadOSMacc = /Mac/.test(ua) && navigator.maxTouchPoints > 1;
  return iOSMatch || iPadOSMacc;
}

/**
 * Check whether the web app is currently running in standalone mode
 * (i.e. the user has launched it from their home screen).
 */
export function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}

/**
 * Request persistent storage from the browser.
 *
 * On iOS 15.2+ Safari supports `navigator.storage.persist()`, which
 * moves the origin into a "persistent" storage bucket that is exempt
 * from routine eviction.  This means `localStorage` data (our game
 * state) will survive even when the browser needs to free up space.
 *
 * Returns `true` when storage was granted (or already persistent),
 * `false` otherwise.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    // Persist API not available – storage behavior is browser-default.
    return false;
  }

  try {
    const persistent = await navigator.storage.persist();
    return persistent;
  } catch {
    return false;
  }
}

/**
 * Combined check: should we show the iOS install banner?
 *
 * We show the banner when:
 *   - The device is iOS / iPadOS, AND
 *   - The app is NOT already running in standalone mode.
 */
export function shouldShowIOSInstallPrompt(): boolean {
  return isIOSDevice() && !isInStandaloneMode();
}
