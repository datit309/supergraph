# Self-locating cross-platform hook runner

Review: Approved

## Analysis Decisions
- Approach: make existing polyglot `run-hook.cmd` derive plugin root from its own path on Unix and Windows | Why: fixes child-hook exit `127` without changing platform manifests
- Alternatives rejected: split manifests per agent runtime because unnecessary for observed launcher failure
- Risks: Windows branch receives static contract coverage locally; existing Git Bash resolver behavior remains unchanged

## Task 1: Make hook runner self-locating
Status: completed
Risk: low
Dependencies: none
Files:
- Modify: plugins/supergraph/tests/test-run-hook-cmd.sh
- Modify: plugins/supergraph/hooks/run-hook.cmd
Blast radius:
- plugins/supergraph/hooks/hooks.json
- plugins/supergraph/hooks.json
Acceptance:
- Unix runner invokes sibling hook without any plugin-root environment variable
- Windows runner derives plugin root from `%~dp0` instead of vendor environment variables
- Existing Git Bash discovery order and non-blocking fallback remain intact
- Paths containing spaces stay quoted
TDD:
- Behavior: bundled hook runner locates sibling hooks independently of runtime root variables
- Test file: plugins/supergraph/tests/test-run-hook-cmd.sh
- Test name: hook runner derives plugin root from launcher path on Unix and Windows
- RED command: `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
- Expected RED failure: runner still contains vendor root-variable resolution and lacks self-location markers
- Minimal GREEN change: derive Windows root from `%~dp0..` and Unix root from `dirname "$0"`
- Refactor candidates: remove obsolete missing-root error branch
- Mocking: none
Steps:
1. RED: assert self-location, absence of vendor-root dependency, quoting, and preserved Git Bash resolver order
   Command: `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
   Expected: FAIL on missing self-location behavior
2. GREEN: update both polyglot runner branches with minimal self-location logic
   Command: `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
   Expected: PASS
3. REFACTOR: remove obsolete root-variable fallback and error path
4. VERIFY:
   - `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
   - `bash plugins/supergraph/tests/test-hook-contracts.sh`
   - `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   - `bash -n plugins/supergraph/tests/test-run-hook-cmd.sh`
Checkpoint:
- Files: `plugins/supergraph/tests/test-run-hook-cmd.sh plugins/supergraph/hooks/run-hook.cmd`
- Commit: `fix: make hook runner self-locating`

## Environment Context
- **Language:** Bash/POSIX shell and Windows batch
- **Test command:** `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- **Linter command:** `bash -n plugins/supergraph/tests/test-run-hook-cmd.sh`
- **Formatter command:** none
- **Build command:** none
- **Branch:** `fix/cross-platform-hooks`
- **Conventional commit style:** `fix:`, `test:`, `feat:`, `chore:`

**Codebase conventions:** shell tests use `set -euo pipefail`, exact marker assertions, and resolver-order checks.

**Graph Context:**
- Blast radius: 4 files | Hub nodes: none
- Bridge nodes: runner-to-hook manifest configuration only | Communities crossed: none
