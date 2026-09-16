# Project Rules for Agents (Claude / Cline)

## ⚠️ CRITICAL: Anti-Paging / No Interactive Terminal Commands

**The terminal MUST NEVER be left blocked waiting for user input.** This is a
hard constraint — any command that opens an interactive pager, waits for stdin,
or pauses the terminal will deadlock the agent context loop. The following
patterns are **strictly forbidden** based on historical incidents in this repo:

### Commands that caused terminal hangs (DO NOT USE)

| #   | Forbidden pattern                                                | Why it hangs                                                 | Safe replacement                                                       |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | `git log`                                                        | Opens interactive pager (`less`/`more`)                      | `git --no-pager log` or `GIT_PAGER=cat git log`                        |
| 2   | `git show <sha>`                                                 | Opens interactive pager                                      | `git --no-pager show <sha>` or `GIT_PAGER=cat git show <sha>`          |
| 3   | `git diff`                                                       | Opens interactive pager                                      | `git --no-pager diff` or `GIT_PAGER=cat git diff`                      |
| 4   | `git log --oneline -3`                                           | Opens interactive pager                                      | `git --no-pager log --oneline -3`                                      |
| 5   | `git show --stat HEAD`                                           | Opens interactive pager                                      | `git --no-pager show --stat HEAD`                                      |
| 6   | `git log --oneline -5 --stat`                                    | Opens interactive pager                                      | `git --no-pager log --oneline -5 --stat`                               |
| 7   | `git branch -a`                                                  | Opens interactive pager                                      | `git --no-pager branch -a`                                             |
| 8   | `curl ... \| node -e "...readFileSync(0)..."`                    | Node reads from stdin; curl blocks on pipe; never terminates | Use `node -e` with `https.get()` instead of piping curl                |
| 9   | `node -e "const fs = require('fs'); fs.readFileSync(0, 'utf8')"` | Reads from stdin — blocks forever in non-interactive context | Never read from stdin in `node -e`. Fetch data via HTTP APIs directly. |
| 10  | `npx <tool>` without `--yes`                                     | Some npx tools open interactive prompts                      | Always use `npx --yes <tool>`                                          |

### Defensive habits (ALWAYS follow)

- **Prefix all git commands with `GIT_PAGER=cat`** or use `--no-pager`:
  ```
  GIT_PAGER=cat git log --oneline -5
  git --no-pager show HEAD
  ```
- **Never pipe output through stdin** (`| node -e "..."` that reads `readFileSync(0)`):
  fetch APIs data via `https.get()` / `https.request()` instead.
- **Always use `--no-pager`** even with `git log --oneline` (the `--oneline`
  flag does NOT disable the pager — it only changes the format).
- **Set `CI=true` environment variable** for all commands to ensure tools
  run non-interactively.
- **If a command might produce long output**, redirect to a file first, then
  read the file: `git --no-pager log > /tmp/log.txt 2>&1; cat /tmp/log.txt`

### Memory aid

> "If you didn't type `--no-pager`, you typed a pager that will hang."
> "If you didn't write to a file, you wrote to a blocked pipe."

Core rules for any coding agent working in this repository. Read before making
changes. A Cline-specific copy is mirrored in `.clinerules.md`.

## Formatting — Prettier is the only allowed formatting tool

- **All code formatting MUST be applied by running Prettier.**
- Formatting must **NEVER** be fixed by hand-editing whitespace/indentation with
  an editor tool, nor by writing throwaway scripts (`node -e`, `sed`, `python`)
  to rewrite file contents.
- Use `npx prettier --write <path>`, `npm run format`, or
  `npx prettier --write .`.
- Never leave a temporary formatting script in the repo.

## Tooling

- Tests: `npm test` (Vitest) — `*.test.ts` lives next to its source.
- Test (non-watch, used by CI): `npm run test:run`
- Type-check: `npx tsc --noEmit` (= `npm run typecheck`)
- Lint: `npm run lint` (ESLint) — the single gate for architecture.
- Format: `npm run format` (Prettier).
- CI: `.github/workflows/ci.yml` runs `lint`, `typecheck`, and `test:run`
  on every push and pull request.

## File-size limits (ESLint `max-lines`; tests exempt)

| Location                                    | Max lines |
| ------------------------------------------- | --------- |
| `src/**/*.tsx` (components / views)         | 150       |
| `src/hooks/**/*.ts` (custom hooks)          | 200       |
| `src/utils/**/*.ts` and other `src` modules | 80        |

## Architecture (enforced via ESLint)

- **Components are pure views.** View files (`src/**/*.tsx`) must not import
  `createStore` nor touch side-effectful browser APIs directly
  (`localStorage`, `indexedDB`, `setTimeout`, `setInterval`, `Date`). State
  creation and side effects live in hooks.
- **Hooks own orchestration.** `useGameState` is the single composition root
  for game state; components only consume what it returns (Single Responsibility).
- SOLID intent (JavaScript cannot fully express SOLID statically): prefer
  composition + small, single-purpose hooks; keep files minimal.

## SolidJS 2.0 (v2 RC) — quick reference

> Installed: `solid-js@2.0.0-rc.7`. The public docs (`docs.solidjs.com`)
> describe a _future_ split where `createStore` lives in `solid-js/store`.
> **That subpath does not exist in this RC** — do not use it. Import
> `createStore`, `createEffect`, `createMemo`, `onCleanup`, `onSettled`, and the
> types `Store`/`Accessor` from `solid-js` (as the codebase does).

- **Signals:** `const [get, set] = createSignal(initial)`. Read `get()`; update
  with `set(v)` or `set((p) => next)`. Mutating objects/arrays in place does
  **not** notify — return new references.
- **Stores:** `createStore(obj)` is fine-grained; mutate via the setter path.
  `produce` and `unwrap` are **not** available in this RC.
- **Effects:** the two-arg `createEffect(compute, effect)` is the 2.0 idiom;
  lifecycle via `onSettled` / `onCleanup`.
- **JSX:** use `class`, not `className`.
- **Components are pure:** side effects live in hooks or event handlers, not in
  the render body.

## Code style

2-space indent · single quotes · semicolons · trailing commas (`all`).

## Core PWA Constraints

- Always ensure imports use explicit `.ts` or `.tsx` extensions if required by the Vite config.
- If modifying the GitHub Actions CI/CD pipeline (`.github/workflows/`), ensure the pipeline strictly halts on test failures before deploying to GitHub Pages.
- Maintain strict separation between UI components and the `src/engine/` logic.
- **Editor Tool Bug**: Substring matching in `old_text` can double leading whitespace on this Windows + PowerShell setup. When replacing lines with leading whitespace, include the FULL original indentation in both `old_text` and `new_text`, or use `node -e` to write files directly.
- **TypeScript Check**: `npx tsc --noEmit` produces pre-existing TS6305/TS6306/TS6310 errors (stale `.d.ts` files). Use `npm run build` for the authoritative type check.
- **Shell Commands**: `cd /D` fails in PowerShell. Use `Set-Location` or `node -e` with absolute paths.
- **GitHub CLI (gh)**: Installed at `C:\Program Files\GitHub CLI\gh.exe`. Add `C:\Program Files\GitHub CLI` to PATH, or invoke directly: `& "C:\Program Files\GitHub CLI\gh.exe" pr create --title "..." --body "..." --base main --head <branch>`.
- **Formatting Workflow**: Always run Prettier in fix mode FIRST (`npm run format`) to auto-format all code before running tests. Then run `npm run test` to verify all code works. Then run `npm run build` to verify the production build succeeds. **Never use text editor tools, custom scripts (.cjs files), or manual find/replace to fix code formatting — always run `npm run format` instead.** Prettier handles all formatting automatically.
- **Formatting Tooling**: This project uses Prettier (`npm run format`) for comprehensive code formatting, integrated with ESLint via `eslint-config-prettier` to disable conflicting rules. Prettier config lives in `.prettierrc.cjs` with ignores in `.prettierignore`. **Do not use editor tools or `.cjs` scripts for formatting fixes — only Prettier auto-formats code.** The workflow is: `npm run format` -> `npm run test` -> `npm run build`.
- **Terminal Hygiene (Windows PowerShell/CLI)**: When executing Windows PowerShell or CLI commands, you MUST strictly follow these rules to prevent the terminal from hanging:
  - **NO PAGERS**: Never use commands that open interactive pagers. Always set `GIT_PAGER=cat` or use `git --no-pager`.
  - **PACKAGE MANAGERS**: Always run npm, yarn, pnpm, and npx in non-interactive/CI mode.
    - Prepend `CI=true` to environments if possible.
    - Always append `--yes` or `-y` to `npm init`, `npx create-*`, or package installs to bypass "Are you sure?" prompts.
  - **POWERSHELL COMMANDS**: Always append `-Force` and `-Confirm:$false` to destructive PowerShell cmdlets (like `Remove-Item` or `Stop-Process`) to bypass confirmation prompts.
  - **BACKGROUND PROCESSES**: If starting a persistent dev server (e.g., `npm run dev`, `npx vite`), you must acknowledge that it will block the terminal. Do NOT wait for it to finish. If you need to run it in the background, use `Start-Process -NoNewWindow` or explicitly state you are leaving it running.
  - **NO EDITOR LAUNCHES**: Never run commands that open GUI editors (like `code .` or `notepad`) as this can halt the execution loop.
- **Work Session Hygiene**: New work sessions should always start by pulling the latest `main` and creating a new feature branch off of it, ensuring a clean separation from any existing in-progress work.
- **Deterministic Seeds in Tests**: Always use a fixed, repeatable RNG seed in test environments. In E2E/Playwright tests, inject a known `rngSeed` into the game state via `writeGameState(page, { rngSeed: 'test-seed', starMap: null })` so that the engine's `generateStarMap(seed)` produces a reproducible graph. Never use `Math.random()` anywhere — it is banned by the `no-restricted-properties` ESLint rule. For entropy, use `crypto.getRandomValues()` from `src/utils/rng.ts` (`createRandomSeed`) or the Web Crypto API directly. For deterministic procedural generation, use `createSeededRNG()` from `src/utils/rng.ts`. Non-deterministic seeds cause flaky CI failures when random extra-edges violate test adjacency assumptions (observed: ~15% failure rate for sys_5 <-> sys_1 adjacency). See `docs/e2e-testing-guide.md` §3 for details.
