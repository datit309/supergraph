# Fix Codex marketplace root name

Review: Approved (plan-reviewer)
User approval: yes

## Task 1: Validate the Codex marketplace root identity
Status: completed
Risk: low
Dependencies: none
Files:
- Modify: .agents/plugins/marketplace.json
- Modify: plugins/supergraph/tests/test-documentation-consistency.sh
- Test: plugins/supergraph/tests/test-documentation-consistency.sh
Blast radius:
- .agents/plugins/marketplace.json
Acceptance:
- Codex marketplace root contains `name: supergraph`.
- Documentation consistency test rejects a marketplace without the required root name.
TDD:
- Behavior: Codex can validate the marketplace root during upgrade.
- Test file: plugins/supergraph/tests/test-documentation-consistency.sh
- Test name: Codex marketplace has required root name
- RED command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
- Expected RED failure: `.agents/plugins/marketplace.json` lacks top-level `name`.
- Minimal GREEN change: add `"name": "supergraph"` before `plugins`.
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: add an assertion that parses the real Codex marketplace and checks its root name.
   Command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   Expected: FAIL
2. GREEN: add the required root marketplace name.
   Command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `python3 -m json.tool .agents/plugins/marketplace.json`
   - `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   - `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
Checkpoint:
- Files: `.agents/plugins/marketplace.json plugins/supergraph/tests/test-documentation-consistency.sh`
- Commit: `fix: add Codex marketplace root name`

## Environment Context
- **Language:** JSON and Bash
- **Test command:** `bash plugins/supergraph/tests/test-documentation-consistency.sh`
- **Linter command:** none configured
- **Formatter command:** none configured
- **Build command:** none configured
- **Branch:** master (user explicitly approved changes)
- **Conventional commit style:** `fix: short description`

**Codebase conventions:** JSON manifests use two-space indentation; Bash tests use embedded Python assertions against real repository files.

**Graph Context:**
- Blast radius: marketplace metadata only; no code symbols or runtime flows.
- Hub nodes: none; bridge nodes: none; communities crossed: none.

## Verification and Review
- RED: documentation consistency failed because the marketplace root lacked `name`.
- GREEN: JSON validation, marketplace contract, documentation consistency, and hook regression passed.
- Integration/e2e: skipped; no integration/e2e configuration detected.
- Independent review: YES; Critical 0, Important 0, Minor 0.
