# Fix Windows hook Bash resolution

## Task 1: Resolve Git Bash dynamically in run-hook.cmd
Status: completed
Risk: medium
Dependencies: none
Files:
- Modify: plugins/supergraph/hooks/run-hook.cmd
- Create: plugins/supergraph/tests/test-run-hook-cmd.sh
- Test: plugins/supergraph/tests/test-run-hook-cmd.sh
Blast radius:
- plugins/supergraph/hooks/hooks.json
- plugins/supergraph/hooks/run-hook.cmd
- All Windows hook events invoking run-hook.cmd
Acceptance:
- Windows resolver priority is `CLAUDE_CODE_GIT_BASH_PATH`, `%ProgramFiles%\Git\bin\bash.exe`, `%LocalAppData%\Programs\Git\bin\bash.exe`, then `where git.exe` with `..\bin\bash.exe` derivation.
- `CLAUDE_CODE_GIT_BASH_PATH` is accepted only when it points to an existing executable; an invalid override falls through to the remaining candidates.
- Missing Git Bash prints `supergraph: Git Bash not found — hooks skipped` to stderr and exits `0`; missing plugin root remains an error.
- Resolved Bash receives the existing login-shell command with cygpath conversion, hook name, and plugin root intact.
- Static regression test verifies ordering, `if exist` checks, user-level path support, `where git.exe` plus `..\bin\bash.exe` derivation, quoted paths containing spaces, graceful exit, and absence of the old hardcoded literal.
TDD:
- Behavior: a user-level Git installation executes hooks successfully; an unavailable Git Bash skips non-blockingly.
- Test file: plugins/supergraph/tests/test-run-hook-cmd.sh
- Test name: validates Windows Git Bash resolver contract
- RED command: `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
- Expected RED failure: run-hook.cmd contains the hardcoded Program Files command and no resolver/fallback contract.
- Minimal GREEN change: replace only the Windows CMDBLOCK with ordered dynamic resolution and graceful skip; pass the resolved path through a quoted variable to `bash.exe`, preserving `PLUGIN_ROOT`/`cygpath` quoting; leave Unix block unchanged.
- Refactor candidates: none beyond quoting/parentheses needed for cmd.exe.
- Mocking: none; static contract test is portable on non-Windows CI
Steps:
1. RED: add shell assertions for resolver markers and forbidden hardcoded command.
   Command: `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
   Expected: FAIL
2. GREEN: implement ordered resolver and non-blocking missing-Bash path in run-hook.cmd.
   Command: `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
   Expected: PASS
3. REFACTOR: verify cmd.exe quoting and preserve existing Unix behavior.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
   - `bash -n plugins/supergraph/tests/test-run-hook-cmd.sh`
Checkpoint:
- Files: `plugins/supergraph/hooks/run-hook.cmd plugins/supergraph/tests/test-run-hook-cmd.sh`
- Commit: `fix: resolve git bash dynamically for windows hooks`

## Environment Context
- **Language:** Bash and Windows batch
- **Test command:** none configured in `.supergraph-env`
- **Linter command:** none configured in `.supergraph-env`
- **Formatter command:** none configured in `.supergraph-env`
- **Build command:** none configured in `.supergraph-env`
- **Planned validation:** `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
- **Branch:** feat/codebase-memory-migration
- **Conventional commit style:** `fix:`

**Codebase conventions:** hooks are non-blocking where possible; shell scripts use strict mode; Windows wrapper keeps a POSIX fallback block after the `CMDBLOCK` marker; tests use portable shell assertions.

**Graph Context:**
- Blast radius: 3 directly affected paths plus all Windows hook events
- Hub nodes: none; wrapper is a bridge from host hook events to plugin scripts
- Bridge nodes: `plugins/supergraph/hooks/run-hook.cmd`
