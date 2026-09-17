/**
 * Build-time version metadata, injected via Vite env variables.
 *
 * In CI the deploy job sets VITE_DEPLOY_VERSION (github.run_number),
 * VITE_COMMIT_SHA (github.sha), and VITE_BUILD_TIMESTAMP
 * (github.run_started_at).  Local dev falls back to 0 / "local" / now.
 */

export const DEPLOY_VERSION: number = Number(import.meta.env.VITE_DEPLOY_VERSION ?? 0);

export const COMMIT_SHA: string = import.meta.env.VITE_COMMIT_SHA ?? 'local';

export const BUILD_TIMESTAMP: string =
  import.meta.env.VITE_BUILD_TIMESTAMP ?? new Date().toISOString();

/**
 * Human-readable version string, e.g. `v0.0.27 (a1b2c3d)`.
 */
export const VERSION_STRING: string = `v0.0.${DEPLOY_VERSION} (${COMMIT_SHA.slice(0, 7)})`;
