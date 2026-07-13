# Platform update notification

## Exact Contracts
- Current version: `plugins/supergraph/plugin.json`.
- Remote version: `https://raw.githubusercontent.com/datit309/supergraph/master/plugins/supergraph/plugin.json`.
- Fetch: `curl -fsSL --connect-timeout 1 --max-time 2`.
- Cache: `${XDG_CACHE_HOME:-$HOME/.cache}/supergraph/update-check`, `<epoch>\t<latest-version>`, fresh for 86400 seconds.
- Versions: optional `v` plus exactly three numeric segments; prerelease/malformed values ignored.
- Detection precedence: `SUPERGRAPH_PLATFORM`; `CODEX_HOME`; `ANTIGRAVITY_PLUGIN_ROOT`; `AGY_PLUGIN_ROOT`; `GEMINI_PLUGIN_ROOT`; `OPENCODE_CONFIG_DIR`; `OPENCODE`; `CLAUDE_PLUGIN_ROOT`; then Claude fallback.
- Claude command: `/plugin marketplace update supergraph`.
- Codex command: `codex plugin marketplace upgrade supergraph`.
- Antigravity command: `curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform antigravity`.
- OpenCode command: `curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform opencode`.
- Opt-out: `SUPERGRAPH_UPDATE_CHECK=false`.
- OpenCode: update command documented; no automatic SessionStart claim.

## Analysis Decisions
- Approach: append cached non-blocking notice to existing SessionStart `parts`; preserve single JSON output.
- Alternatives rejected: per-start network check adds latency; Git metadata is unavailable in installed caches; OpenCode automatic notice lacks a supported SessionStart hook.

## Task 1: Implement tested SessionStart update notice
Status: completed
Risk: high
Dependencies: none
Files:
- Modify: `plugins/supergraph/hooks/session-start`
- Modify: `plugins/supergraph/tests/test-hook-contracts.sh`
- Test: `plugins/supergraph/tests/test-hook-contracts.sh`
Blast radius:
- `plugins/supergraph/tests/test-hook-contracts.sh` degree 10 test hub; user approved modification
- `plugins/supergraph/hooks/session-start` unindexed startup entrypoint registered by Claude/Codex and Antigravity manifests
Acceptance:
- Newer version emits `SUPERGRAPH UPDATE AVAILABLE`, current/latest versions, and exact command for Claude, Codex, Antigravity, and explicit OpenCode test override.
- Equal, older, malformed, prerelease, disabled, and offline cases emit no update notice.
- Fresh cache avoids a second fetch while retaining a cached newer-version notice.
- Output remains valid SessionStart JSON; failures never change exit code.
TDD:
- Behavior: SessionStart surfaces cached platform-specific update guidance without blocking startup
- Test file: `plugins/supergraph/tests/test-hook-contracts.sh`
- Test name: `update_notice`
- RED command: `bash plugins/supergraph/tests/test-hook-contracts.sh update-notice`
- Expected RED failure: `FAIL: newer version should emit SUPERGRAPH UPDATE AVAILABLE`
- Minimal GREEN change: Bash version/cache/fetch/platform helpers and one appended `parts` notice
- Refactor candidates: shared assertions; isolated normalization, comparison, and command mapping helpers
- Mocking: temporary `XDG_CACHE_HOME` and fake `curl` injected through `PATH` prevent real network
Steps:
1. RED: add focused cases and selector
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh update-notice`
   Expected: FAIL
2. GREEN: implement strict comparison, cache, timeout, platform command, opt-out, and notice
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh update-notice`
   Expected: PASS
3. REFACTOR: remove duplication while preserving Bash 3.2 and one-object JSON output
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh`
   - `bash -n plugins/supergraph/hooks/session-start plugins/supergraph/tests/test-hook-contracts.sh`
Checkpoint:
- Files: `plugins/supergraph/hooks/session-start plugins/supergraph/tests/test-hook-contracts.sh`
- Commit: `feat: notify users about plugin updates`

## Task 2: Document platform update behavior
Status: completed
Risk: low
Dependencies: Task 1
Files:
- Modify: `README.md`
- Modify: `README-VI.md`
- Test: `plugins/supergraph/tests/test-hook-contracts.sh`
Blast radius:
- `README.md` degree 41 documentation hub; user approved modification
- `README-VI.md` mirrors English installation guidance
Acceptance:
- Both READMEs document 24-hour checks and `SUPERGRAPH_UPDATE_CHECK=false`.
- Both READMEs contain exact Claude, Codex, Antigravity, and OpenCode update commands.
- Both READMEs state OpenCode lacks automatic SessionStart notification.
TDD:
- Behavior: bilingual documentation matches update behavior and emitted commands
- Test file: `plugins/supergraph/tests/test-hook-contracts.sh`
- Test name: `update_docs`
- RED command: `bash plugins/supergraph/tests/test-hook-contracts.sh update-docs`
- Expected RED failure: `FAIL: README missing automatic update notice documentation`
- Minimal GREEN change: concise update-notification section in each README
- Refactor candidates: align English and Vietnamese section structure
- Mocking: none
Steps:
1. RED: add exact documentation assertions
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh update-docs`
   Expected: FAIL
2. GREEN: add aligned English and Vietnamese update sections
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh update-docs`
   Expected: PASS
3. REFACTOR: remove duplicated prose while retaining exact commands
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh`
   - `bash -n plugins/supergraph/tests/test-hook-contracts.sh`
Checkpoint:
- Files: `README.md README-VI.md plugins/supergraph/tests/test-hook-contracts.sh`
- Commit: `docs: explain platform update notifications`

## Environment Context
- **Language:** Bash 3.2-compatible shell and Markdown
- **Test command:** `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- **Linter command:** `bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/hooks/session-start plugins/supergraph/tests/test-*.sh`
- **Formatter command:** not configured
- **Build command:** not configured
- **Branch:** `master`; user explicitly approved direct work
- **Conventional commit style:** `feat:`, `fix:`, `test:`, `docs:`

**Codebase conventions:** Hooks emit one valid JSON object on stdout; optional failures stay silent and non-blocking; tests use Bash functions and explicit `fail`; macOS, Linux, WSL, and Windows Git Bash supported.

**Graph Context:**
- Blast radius: 4 files | Hub nodes: `README.md` degree 41, `plugins/supergraph/tests/test-hook-contracts.sh` degree 10; user approved both
- Bridge nodes: none identified | Communities crossed: hook runtime, tests, documentation; justified by user-facing cross-platform behavior

## Review Log
- TDD RED: missing update notice; corrupt cache `08`; arbitrary-length semver; missing docs.
- TDD GREEN: all focused and full suites pass.
- Graph: reindexed, 980 nodes and 1154 edges; extensionless SessionStart remains parser-unindexed and is covered by contract tests.
- Independent review: YES; Critical 0, Important 0, Minor 0.
