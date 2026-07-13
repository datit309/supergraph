# Audit and fix Codex hook contracts

Review: pending
User approval: yes

## Analysis Decisions
- Approach: validate every configured hook through one event-schema contract matrix, then minimally normalize invalid outputs and Codex stdin handling.
- Alternatives rejected: fixing only `Stop` leaves known invalid event paths; replacing hooks with no-op JSON discards useful workflow behavior.
- Risks: cross-client compatibility; retain compatibility environment variables and test real scripts through the shared runner.

## Task 1: Fix lifecycle message output contracts
Status: pending
Risk: medium
Dependencies: none
Files:
- Create: plugins/supergraph/tests/test-hook-contracts.sh
- Modify: plugins/supergraph/hooks/stop
- Modify: plugins/supergraph/hooks/pre-compact
- Modify: plugins/supergraph/hooks/post-tool-use-bash
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/hooks/hooks.json
Acceptance:
- Stop emits JSON with `systemMessage`, never plain stdout.
- PreCompact emits supported common JSON fields.
- PostToolUse Bash emits `hookSpecificOutput` with the correct event name and context.
TDD:
- Behavior: lifecycle message hooks emit event-valid Codex JSON.
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: lifecycle message hooks follow Codex output contracts
- RED command: `bash plugins/supergraph/tests/test-hook-contracts.sh lifecycle`
- Expected RED failure: existing Stop output is plain text and PreCompact/PostToolUse context shapes are invalid.
- Minimal GREEN change: use `systemMessage` for Stop/PreCompact and the PostToolUse context envelope.
- Refactor candidates: test-only JSON assertion helper after GREEN.
- Mocking: none; invoke real scripts with representative Codex JSON.
Steps:
1. RED: add lifecycle contract cases and run them against current scripts.
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh lifecycle`
   Expected: FAIL
2. GREEN: minimally serialize supported JSON fields for the three scripts.
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh lifecycle`
   Expected: PASS
3. REFACTOR: consolidate test assertions only if focused tests remain green.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh lifecycle`
   - `bash -n plugins/supergraph/hooks/stop plugins/supergraph/hooks/pre-compact plugins/supergraph/hooks/post-tool-use-bash plugins/supergraph/tests/test-hook-contracts.sh`
Checkpoint:
- Files: `plugins/supergraph/tests/test-hook-contracts.sh plugins/supergraph/hooks/stop plugins/supergraph/hooks/pre-compact plugins/supergraph/hooks/post-tool-use-bash`
- Commit: `fix: emit valid lifecycle hook JSON`

## Task 2: Fix PreToolUse input and decision contracts
Status: pending
Risk: medium
Dependencies: Task 1
Files:
- Modify: plugins/supergraph/tests/test-hook-contracts.sh
- Modify: plugins/supergraph/hooks/pre-tool-use
- Modify: plugins/supergraph/hooks/bash-guard
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/hooks/hooks.json
Acceptance:
- Both PreToolUse scripts read Codex `tool_input` from stdin with legacy `TOOL_INPUT` fallback.
- Informational context and destructive-command denial use valid PreToolUse JSON shapes.
- No-op paths exit 0 without stdout.
TDD:
- Behavior: PreToolUse hooks consume Codex input and emit valid context/denial decisions.
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: pre tool use hooks follow Codex input and decision contracts
- RED command: `bash plugins/supergraph/tests/test-hook-contracts.sh pre-tool`
- Expected RED failure: current scripts ignore stdin and destructive input is not returned as `permissionDecision: deny`.
- Minimal GREEN change: parse stdin `tool_input`, retain env fallback, and serialize event-specific context/deny envelopes.
- Refactor candidates: share local JSON serialization pattern only after GREEN.
- Mocking: none; invoke real scripts with representative Codex event JSON.
Steps:
1. RED: add warning, denial, and no-op PreToolUse cases.
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh pre-tool`
   Expected: FAIL
2. GREEN: update input parsing and JSON output in both guards.
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh pre-tool`
   Expected: PASS
3. REFACTOR: none unless focused tests prove a safe deduplication.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh pre-tool`
   - `bash -n plugins/supergraph/hooks/pre-tool-use plugins/supergraph/hooks/bash-guard plugins/supergraph/tests/test-hook-contracts.sh`
Checkpoint:
- Files: `plugins/supergraph/tests/test-hook-contracts.sh plugins/supergraph/hooks/pre-tool-use plugins/supergraph/hooks/bash-guard`
- Commit: `fix: consume Codex pre tool hook input`

## Task 3: Complete the configured hook contract matrix
Status: pending
Risk: low
Dependencies: Task 1, Task 2
Files:
- Modify: plugins/supergraph/tests/test-hook-contracts.sh
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/hooks/hooks.json
Acceptance:
- Matrix covers SessionStart, UserPromptSubmit, Stop, PreCompact, both PostToolUse scripts, and both PreToolUse scripts.
- Every configured script either emits no stdout on success or event-valid JSON.
TDD:
- Behavior: the complete configured hook set is protected by executable contract coverage.
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: all configured Supergraph hooks satisfy Codex contracts
- RED command: `bash plugins/supergraph/tests/test-hook-contracts.sh all`
- Expected RED failure: full coverage cases for SessionStart/UserPromptSubmit/post-tool-use no-op do not exist until added.
- Minimal GREEN change: add passing contract cases for the already-valid configured scripts without changing production behavior.
- Refactor candidates: centralize section dispatch and JSON assertions.
- Mocking: none; invoke every real configured hook implementation.
Steps:
1. RED: make the `all` section require coverage markers for every configured implementation.
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   Expected: FAIL because coverage markers/cases are missing.
2. GREEN: add real execution cases for the remaining configured scripts.
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   Expected: PASS
3. REFACTOR: simplify test section dispatch with no behavior change.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   - `bash -n plugins/supergraph/hooks/* plugins/supergraph/tests/test-hook-contracts.sh`
Checkpoint:
- Files: `plugins/supergraph/tests/test-hook-contracts.sh`
- Commit: `test: audit all Codex hook contracts`

## Task 4: Verify regressions and document the hook audit
Status: pending
Risk: low
Dependencies: Task 3
Files:
- Modify: plugins/supergraph/CHANGELOG.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/CHANGELOG.md
Acceptance:
- All hook, runner, marketplace, and documentation checks pass together.
- Changelog records the full Codex hook contract audit.
TDD:
- Behavior: release notes accurately record the verified hook compatibility fix.
- Test file: plugins/supergraph/tests/test-documentation-consistency.sh
- Test name: hook audit documentation remains consistent
- RED command: `rg -q 'full Codex hook contract audit' plugins/supergraph/CHANGELOG.md`
- Expected RED failure: changelog does not yet contain the audit entry.
- Minimal GREEN change: add one Unreleased Fixed entry after all behavior tests pass.
- Refactor candidates: none.
- Mocking: none.
Steps:
1. RED: verify the audit release-note marker is absent.
   Command: `rg -q 'full Codex hook contract audit' plugins/supergraph/CHANGELOG.md`
   Expected: FAIL
2. GREEN: add the verified audit entry.
   Command: `rg -q 'full Codex hook contract audit' plugins/supergraph/CHANGELOG.md`
   Expected: PASS
3. REFACTOR: none.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   - `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
   - `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
   - `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   - `python3 -m json.tool plugins/supergraph/hooks/hooks.json`
   - `bash -n plugins/supergraph/hooks/* plugins/supergraph/tests/test-hook-contracts.sh`
   - `git diff --check`
Checkpoint:
- Files: `plugins/supergraph/CHANGELOG.md`
- Commit: `docs: record Codex hook contract audit`

## Environment Context
- **Language:** Bash and JSON
- **Test command:** `bash plugins/supergraph/tests/test-hook-contracts.sh all`
- **Linter command:** `bash -n plugins/supergraph/hooks/* plugins/supergraph/tests/test-hook-contracts.sh`
- **Formatter command:** none configured
- **Build command:** none configured
- **Branch:** master (user explicitly approved changes)
- **Conventional commit style:** `fix: short description`

**Codebase conventions:** hook scripts use strict Bash, Python standard-library JSON, exit 0 with no output for no-op paths, and `run-hook.cmd` for cross-platform dispatch.

**Graph Context:**
- Blast radius: 9 files | Hub nodes: none identified
- Bridge nodes: none identified | Communities crossed: plugin hook runtime and tests only
