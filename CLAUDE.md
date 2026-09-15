# Project Rules for Agents (Claude / Cline)

This file is the project's **core rules** for any coding agent working in this
repository. Read it before making changes.

## Formatting — Prettier is the only allowed formatting tool

- **All code formatting MUST be applied by running Prettier.**
- Formatting must **NEVER** be fixed by hand-editing whitespace / indentation
  with an editor tool, nor by writing throwaway scripts (`node -e`, `sed`, `python`,
  etc.) to rewrite file contents.
- If a file has formatting issues, run one of:
  - `npx prettier --write <path>`
  - `npm run format` (once a `format` script is configured)
  - `npx prettier --write .` (whole project)
- Never leave a temporary formatting script in the repo; remove it before
  finishing.
- When in doubt about whether to format something by hand, the answer is always:
  **run Prettier instead.**

## Tooling

- Tests: `npm test` (Vitest)
- Type-check: `npx tsc --noEmit`
- Lint: `npm run lint` (ESLint)
- Format: `npx prettier --write .`

## Code style

- 2-space indent · single quotes · semicolons · trailing commas (`all`)
- SolidJS idioms (`createStore`, `createEffect`, `createMemo`, `onSettled`)
  are used throughout; prefer composition via custom hooks over logic in
  component files (Single Responsibility).
