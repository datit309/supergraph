# Fix UserPromptSubmit JSON contract

Review: Approved (plan-reviewer)
User approval: yes

## Task 1: Enforce the UserPromptSubmit output contract
Status: completed
Risk: low
Dependencies: none
Files:
- Create: plugins/supergraph/tests/test-user-prompt-submit-hook.sh
- Modify: plugins/supergraph/hooks/user-prompt-submit
- Test: plugins/supergraph/tests/test-user-prompt-submit-hook.sh
Blast radius:
- plugins/supergraph/hooks/hooks.json
Acceptance:
- Every hook branch emits a valid `hookSpecificOutput` envelope for `UserPromptSubmit`.
- Regression test rejects the previous top-level `additionalContext` response and accepts the corrected schema.
TDD:
- Behavior: UserPromptSubmit emits the host-required JSON envelope.
- Test file: plugins/supergraph/tests/test-user-prompt-submit-hook.sh
- Test name: user prompt submit output follows hook contract
- RED command: `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
- Expected RED failure: current output has top-level `additionalContext` and lacks `hookSpecificOutput.hookEventName`.
- Minimal GREEN change: update `emit()` to serialize `hookSpecificOutput` with event name and context.
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: add a shell regression test that invokes the real hook and validates its JSON structure.
   Command: `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
   Expected: FAIL
2. GREEN: change only the JSON envelope emitted by `emit()`.
   Command: `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
   - `bash plugins/supergraph/tests/test-run-hook-cmd.sh`
   - `bash plugins/supergraph/tests/test-documentation-consistency.sh`
Checkpoint:
- Files: `plugins/supergraph/tests/test-user-prompt-submit-hook.sh plugins/supergraph/hooks/user-prompt-submit`
- Commit: `fix: emit valid user prompt submit hook output`

## Environment Context
- **Language:** Bash
- **Test command:** `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
- **Linter command:** none configured
- **Formatter command:** none configured
- **Build command:** none configured
- **Branch:** master (user explicitly approved changes)
- **Conventional commit style:** `fix: short description`

**Codebase conventions:** Bash uses `set -euo pipefail`; JSON assertions use Python standard library; tests use explicit `fail()` messages.

**Graph Context:**
- Blast radius: 0 additional files reported; runtime configuration references `plugins/supergraph/hooks/user-prompt-submit` through `plugins/supergraph/hooks/hooks.json`.
- Hub nodes: none identified for target; bridge nodes: none identified for target; communities crossed: none.

## Verification and Review
- RED: regression test failed because `hookSpecificOutput` was absent.
- GREEN: focused regression, Windows hook resolver, documentation consistency, and live hook contract checks passed.
- Integration/e2e: skipped; no integration/e2e configuration detected.
- Graph: risk 0.00, 0 additional impacted files, 0 affected flows.
- Independent review: YES; Critical 0, Important 0, Minor 0.
