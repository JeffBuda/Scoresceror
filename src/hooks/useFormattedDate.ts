import { BUILD_TIMESTAMP } from '../version';

/**
 * Returns the build timestamp formatted in the user's browser locale.
 *
 * Lives in a hook because view (.tsx) files are prohibited from using
 * Date directly — see the `no-restricted-globals` rule with message
 * "Time reads must live in hooks, not views" in eslint.config.js.
 *
 * `toLocaleString()` is evaluated at runtime (in the browser), so the
 * locale follows the user's browser settings, not the CI runner locale.
 */
export function useFormattedBuildDate(): string {
  return new Date(BUILD_TIMESTAMP).toLocaleString();
}
