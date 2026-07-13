# One-command Supergraph plugin installer

## Analysis Decisions
- Approach: separate root bootstrap installers for POSIX Bash and Windows PowerShell; clone/update a persistent Git checkout, then delegate platform linking to `plugins/supergraph/install.sh`.
- Alternatives rejected: embedding remote bootstrap logic in the existing symlink installer mixes lifecycle concerns and breaks script-path assumptions under pipes; an npm CLI adds package/release infrastructure beyond current need.
- Risks: remote-code execution through one-liners, dirty checkout loss, non-fast-forward updates, Windows path/file-lock behavior.
- Mitigations: exact HTTPS repository URL, documented recommendation to inspect scripts before piping, no destructive Git commands, dirty-tree refusal, `git pull --ff-only`, environment overrides for hermetic tests, clear recovery errors.

## Task 1: Add POSIX Git bootstrap installer
Status: completed
Risk: medium
Dependencies: none
Files:
- Create: install.sh
- Test: plugins/supergraph/tests/test-bootstrap-installer.sh
Blast radius:
- plugins/supergraph/install.sh
- user Git checkout under `${XDG_DATA_HOME:-$HOME/.local/share}/supergraph`
Acceptance:
- `curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform <platform>` can clone a missing checkout and delegate installation.
- Test proves first clone and argument forwarding using a local Git fixture.
TDD:
- Behavior: POSIX bootstrap clones a persistent checkout and forwards platform arguments.
- Test file: plugins/supergraph/tests/test-bootstrap-installer.sh
- Test name: `bootstrap installer clones checkout and forwards platform arguments`
- RED command: `bash plugins/supergraph/tests/test-bootstrap-installer.sh`
- Expected RED failure: root `install.sh` does not exist.
- Minimal GREEN change: portable Bash bootstrap with `SUPERGRAPH_REPO_URL` and `SUPERGRAPH_INSTALL_DIR` overrides, Git preflight, clone flow, and delegation.
- Refactor candidates: extract small error/preflight functions after GREEN.
- Mocking: local bare Git repository and stub delegated installer avoid network and user directories.
Steps:
1. RED: create local Git fixture tests for first install and argument forwarding.
   Command: `bash plugins/supergraph/tests/test-bootstrap-installer.sh`
   Expected: FAIL
2. GREEN: create minimal root Bash bootstrap.
   Command: `bash plugins/supergraph/tests/test-bootstrap-installer.sh`
   Expected: PASS
3. REFACTOR: reduce repeated path checks while preserving output and exit codes.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-bootstrap-installer.sh`
   - `bash -n install.sh plugins/supergraph/tests/test-bootstrap-installer.sh`
Checkpoint:
- Files: `plugins/supergraph/tests/test-bootstrap-installer.sh install.sh`
- Commit: `feat: add POSIX one-command plugin installer`

## Task 2: Protect POSIX update and error paths
Status: completed
Risk: medium
Dependencies: Task 1
Files:
- Modify: install.sh
- Modify: plugins/supergraph/tests/test-bootstrap-installer.sh
Blast radius:
- persistent Supergraph Git checkout
Acceptance:
- Existing clean checkout updates only through `git pull --ff-only`.
- Existing dirty checkout exits non-zero without changing tracked files.
- Missing Git or malformed checkout produces actionable non-zero error.
- Separate test cases prove clean update, dirty refusal, and dependency/malformed-checkout errors.
TDD:
- Behavior: POSIX bootstrap updates safely without discarding local work.
- Test file: plugins/supergraph/tests/test-bootstrap-installer.sh
- Test name: `bootstrap installer fast-forwards clean checkout and refuses unsafe states`
- RED command: `bash plugins/supergraph/tests/test-bootstrap-installer.sh`
- Expected RED failure: Task 1 bootstrap delegates from an existing checkout without dirty-tree and fast-forward guards.
- Minimal GREEN change: add checkout validation, dirty-tree refusal, and `git pull --ff-only` update path.
- Refactor candidates: centralize fatal error output after GREEN.
- Mocking: local bare Git repository and controlled PATH provide deterministic Git states.
Steps:
1. RED: add distinct clean-update, dirty-checkout, missing-Git, and malformed-checkout cases.
   Command: `bash plugins/supergraph/tests/test-bootstrap-installer.sh`
   Expected: FAIL
2. GREEN: add minimal safety guards and fast-forward update.
   Command: `bash plugins/supergraph/tests/test-bootstrap-installer.sh`
   Expected: PASS
3. REFACTOR: centralize repeated validation without changing exit behavior.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-bootstrap-installer.sh`
   - `bash -n install.sh plugins/supergraph/tests/test-bootstrap-installer.sh`
Checkpoint:
- Files: `plugins/supergraph/tests/test-bootstrap-installer.sh install.sh`
- Commit: `feat: protect Git installer updates`

## Task 3: Add Windows PowerShell Git bootstrap installer
Status: completed
Risk: medium
Dependencies: Task 2
Files:
- Create: install.ps1
- Test: plugins/supergraph/tests/test-bootstrap-installer-powershell.sh
- Create: .github/workflows/installer-tests.yml
Blast radius:
- plugins/supergraph/install.sh
- Windows checkout under `%LOCALAPPDATA%\supergraph`
Acceptance:
- `irm https://raw.githubusercontent.com/datit309/supergraph/master/install.ps1 | iex` can clone a missing checkout and delegate installation on Windows.
- Existing clean checkout updates only through fast-forward Git operations.
- Existing dirty checkout exits non-zero without changing tracked files.
- Contract test verifies safety markers on every host; Windows CI behavior test is mandatory under `powershell.exe`; optional local execution uses `pwsh` or `powershell.exe` when available.
- `-Help` prints usage and exits successfully without Git or filesystem mutation.
TDD:
- Behavior: PowerShell bootstrap mirrors safe Git lifecycle behavior on Windows.
- Test file: plugins/supergraph/tests/test-bootstrap-installer-powershell.sh
- Test name: `PowerShell bootstrap clones updates forwards and protects dirty checkout on Windows`
- RED command: `bash plugins/supergraph/tests/test-bootstrap-installer-powershell.sh`
- Expected RED failure: root `install.ps1` does not exist.
- Minimal GREEN change: PowerShell 5.1-compatible bootstrap with `-Help`, environment overrides, Git preflight, dirty-tree guard, fast-forward update, and delegation through Git Bash where required.
- Refactor candidates: centralize command invocation and error handling after GREEN.
- Mocking: local Git fixture; Windows CI runs the behavior through `powershell.exe`, while Bash contract checks remain host-independent.
Steps:
1. RED: add cross-host contract assertions, local runner detection for `pwsh`/`powershell.exe`, and Windows CI job requiring the PowerShell behavior suite.
   Command: `bash plugins/supergraph/tests/test-bootstrap-installer-powershell.sh`
   Expected: FAIL
2. GREEN: create minimal root PowerShell bootstrap.
   Command: `bash plugins/supergraph/tests/test-bootstrap-installer-powershell.sh`
   Expected: PASS
3. REFACTOR: align messages/options with POSIX installer without sharing runtime code.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-bootstrap-installer-powershell.sh`
   - `if command -v pwsh >/dev/null 2>&1; then pwsh -NoProfile -File ./install.ps1 -Help; elif command -v powershell.exe >/dev/null 2>&1; then powershell.exe -NoProfile -File ./install.ps1 -Help; fi`
Checkpoint:
- Files: `plugins/supergraph/tests/test-bootstrap-installer-powershell.sh install.ps1 .github/workflows/installer-tests.yml`
- Commit: `feat: add PowerShell one-command plugin installer`

## Task 4: Document one-command installation and update behavior
Status: completed
Risk: low
Dependencies: Task 2, Task 3
Files:
- Modify: README.md
- Modify: README-VI.md
- Test: plugins/supergraph/tests/test-documentation-consistency.sh
Blast radius:
- installation instructions for Claude Code, Antigravity CLI, Codex CLI, and OpenCode users
Acceptance:
- English and Vietnamese installation sections show exact `master` URLs for `curl` and PowerShell commands, plus inspect-before-pipe guidance.
- Documentation explains checkout location, update behavior, dirty-tree refusal, platform argument forwarding, and manual clone fallback.
- Documentation consistency tests require both one-command entry points.
TDD:
- Behavior: users can discover correct one-command installers for POSIX and Windows without reading clone steps.
- Test file: plugins/supergraph/tests/test-documentation-consistency.sh
- Test name: `documentation advertises exact POSIX and PowerShell bootstrap commands`
- RED command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
- Expected RED failure: README files lack `https://raw.githubusercontent.com/datit309/supergraph/master/install.sh` and `https://raw.githubusercontent.com/datit309/supergraph/master/install.ps1` commands.
- Minimal GREEN change: update both Markdown installation sections and their contract assertions.
- Refactor candidates: remove duplicated manual clone instructions while retaining fallback guidance.
- Mocking: none.
Steps:
1. RED: add documentation assertions for `curl -fsSL`, `install.ps1`, exact `master` URLs, and inspect-before-pipe guidance.
   Command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   Expected: FAIL
2. GREEN: update README.md and README-VI.md installation sections.
   Command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   Expected: PASS
3. REFACTOR: keep English/Vietnamese command blocks structurally aligned.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   - `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
Checkpoint:
- Files: `plugins/supergraph/tests/test-documentation-consistency.sh README.md README-VI.md`
- Commit: `docs: add one-command plugin installation`

## Environment Context
- **Language:** Bash 3.2+ and PowerShell 5.1+
- **Test command:** `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- **Linter command:** `bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh`
- **Formatter command:** none configured
- **Build command:** none configured
- **Branch:** master; direct changes approved by user
- **Conventional commit style:** `feat:`, `fix:`, `test:`, `docs:`

**Codebase conventions:** Bash uses `#!/usr/bin/env bash` plus `set -euo pipefail`; tests use temporary local fixtures and explicit failure messages; installers refuse destructive overwrite; marketplace files remain command-managed.

**Graph Context:**
- Blast radius: 8 direct files plus existing delegated `plugins/supergraph/install.sh` behavior | Hub nodes: none affected
- Bridge nodes: none affected | Communities crossed: documentation and installer boundaries only, justified by user-facing installation flow
- Existing installer graph: 4 functions, maximum fan-in 1, direct top-level caller only
- Test graph: no `TESTS` edges modeled; filesystem tests provide evidence
- Provider limitation: `detect_changes` MCP unavailable; compensated with healthy `index_status`, graph recipes, Git status, symbol trace, and fresh index

## Review Log
- Review range: `c1c209816570962eb257dd78fb56c25540bc59db..bb57a52`
- Stage 1 spec compliance: PASS
- Stage 2 code quality/security: PASS
- Verdict: YES | Critical: 0 | Important: 0 | Minor: 1
- Minor accepted: root `install.sh` remains mode `100644`; documented one-command paths execute it through `sh`, so accepted behavior is unaffected.
