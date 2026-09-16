# AGENTS.md — Critical Agent Instructions

## ⛔ NO INTERACTIVE TERMINAL COMMANDS (Anti-Paging Rules)

**The terminal MUST NEVER block waiting for user input.** Every command below
caused a terminal hang in this repository's history and is **strictly forbidden**.

### Forbidden commands & their safe replacements

| Forbidden (will hang)                              | Safe replacement                                 |
| -------------------------------------------------- | ------------------------------------------------ |
| `git log`                                          | `git --no-pager log` or `GIT_PAGER=cat git log`  |
| `git show <sha>`                                   | `git --no-pager show <sha>`                      |
| `git diff`                                         | `git --no-pager diff`                            |
| `git log --oneline -N`                             | `git --no-pager log --oneline -N`                |
| `git show --stat HEAD`                             | `git --no-pager show --stat HEAD`                |
| `git log --oneline -N --stat`                      | `git --no-pager log --oneline -N --stat`         |
| `git branch -a`                                    | `git --no-pager branch -a`                       |
| `curl URL \| node -e "...readFileSync(0)..."`      | Use `https.get()` inside `node -e`               |
| `node -e "...readFileSync(0...)..."` (reads stdin) | Never read from stdin in non-interactive scripts |
| `npx tool` (without `--yes`)                       | `npx --yes tool`                                 |

### Hard rules

1. **`--oneline` does NOT disable the pager.** It only changes the output format.
2. **ALL git commands** must use `--no-pager` or have `GIT_PAGER=cat` prepended.
3. **NEVER pipe curl output to `node -e`** that reads `readFileSync(0)` —
   stdin will block forever. Use `https.get()` instead.
4. **Set `CI=true`** as an environment variable for every command to force
   non-interactive mode.
5. **Redirect long output to a file** first, then read the file:
   ```
   git --no-pager log --oneline -20 > /tmp/log.txt 2>&1
   ```

### Quick reminder before every terminal command

> "If I didn't type `--no-pager`, I typed a pager that will hang the terminal.
> If I'm reading from stdin, I'm blocking forever."

---

For full project rules (formatting, linting, SolidJS 2.0 guide, architecture),
see `CLAUDE.md` (canonical) and `.clinerules.md` (Cline-facing mirror).
