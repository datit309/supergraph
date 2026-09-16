# Plan: Integrate Taste Skill design workflows
Review: approved
Date: 2026-09-16

## Analysis Decisions

- **Tier:** Full. Four new skill files plus contract tests and SDD; external source boundary.
- **Approach:** Add canonical plugin-local skill directories mapped from upstream; preserve `frontend-design`.
- **Alternatives rejected:** Replace existing `frontend-design` (breaking discovery); install globally (outside plugin scope); import image-generation-only skills (not needed for coding/design integration).
- **Risk controls:** Contract test before import; exact path/name mapping; no runtime or dependency changes; source inspection after fetch.
- **Approval:** User explicitly requested integration in the current turn; master-branch work is authorized by that request.

## Environment Context

- **Language:** Bash 3.2 + Markdown + Python 3; no package manifest detected.
- **Test command:** `status=0; for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file" || status=1; done; exit "$status"`
- **Focused test command:** `bash plugins/supergraph/tests/test-taste-skill-integration.sh`
- **Lint command:** `bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh`
- **Formatter/build:** none configured.
- **Branch:** `master`; explicit user request authorizes this scoped change.
- **Conventions:** skills use YAML frontmatter; tests use `set -euo pipefail`, `fail`, and `PASS/FAIL` output; edits remain plugin-local.
- **Baseline:** existing suite has a pre-existing environment failure requiring `codebase-memory-mcp 0.9.0`; this integration must not introduce additional failures.
- **Baseline resolution (2026-09-16):** the stale exact-version gate and 0.10.x CLI response handling were fixed separately; the original RED evidence above is retained as historical execution evidence.
- **Fetched source revision:** `ccbc15639c97057cbfcf32ecebc38ef716e4bb37` (`refs/heads/main`, fetched 2026-09-16).

## Graph Context

- **Provider/project:** codebase-memory-mcp / `supergraph`.
- **Generation:** `2026-09-16T03:13:20Z`; 1,261 nodes, 1,742 edges; no recorded issue for the manifest/current frontend skill.
- **Affected area:** `plugins/supergraph/skills` and `plugins/supergraph/tests`; source-only Markdown, no graph hub/bridge or runtime entry point.
- **Blast radius:** 5 implementation files + 2 planning artifacts = 7 total; below the 20-file stop threshold.
- **Coverage limitation:** the skills scope has four intentionally excluded script/example subtrees; none is touched.

## Task 1: Add the Taste Skill import contract test
Wave: 1
Status: completed
Risk: low
Dependencies: none
Model: flash

Files:
- Create: `plugins/supergraph/tests/test-taste-skill-integration.sh`

Blast radius:
- `plugins/supergraph/tests/test-taste-skill-integration.sh`

Spec: `docs/supergraph/sdd/2026-09-16-sdd-taste-skill-design-integration.md`

Acceptance:
- [ ] Test checks all four canonical `SKILL.md` paths.
- [ ] Test validates frontmatter delimiters, exactly one `name:`, exactly one `description:`, expected canonical name, and pinned SHA-256 source hash.
- [ ] Test fails for missing imports before source files are added.

TDD:
- Behavior: imported Taste Skill files are discoverable and structurally valid.
- Test file: `plugins/supergraph/tests/test-taste-skill-integration.sh`
- Test name: canonical skill registration
- RED command: `bash plugins/supergraph/tests/test-taste-skill-integration.sh`
- Expected RED failure: first required imported file is missing; no setup/import error.
- Minimal GREEN change: none in this task; test becomes GREEN after Tasks 2–3 import the files.
- Refactor candidates: keep assertions portable to Bash 3.2.
- Mocking: none; inspect real plugin files.

Steps:
1. RED: create the test and run it against the absent source files.
2. GREEN: deferred to Tasks 2–3.
3. REFACTOR: keep expected mapping in one table/array.
4. VERIFY: run focused test after import.

Checkpoint:
- Files: `plugins/supergraph/tests/test-taste-skill-integration.sh`
- Commit: `test: define Taste Skill registration contract`

## Task 2: Import core and redesign Taste Skill workflows
Wave: 2
Status: completed
Risk: medium
Dependencies: Task 1
Model: inherit

Files:
- Create: `plugins/supergraph/skills/design-taste-frontend/SKILL.md`
- Create: `plugins/supergraph/skills/redesign-existing-projects/SKILL.md`

Blast radius:
- `plugins/supergraph/skills/design-taste-frontend/SKILL.md`
- `plugins/supergraph/skills/redesign-existing-projects/SKILL.md`

Spec: `docs/supergraph/sdd/2026-09-16-sdd-taste-skill-design-integration.md`

Acceptance:
- [ ] Files are copied from upstream `skills/taste-skill/SKILL.md` and `skills/redesign-skill/SKILL.md`.
- [ ] Frontmatter names are `design-taste-frontend` and `redesign-existing-projects`.
- [ ] Existing `plugins/supergraph/skills/frontend-design/SKILL.md` is unchanged.
- [ ] Existing `plugins/supergraph/skills/frontend-design/SKILL.md` and `plugins/supergraph/.codex-plugin/plugin.json` have no diff.
- [ ] No runtime dependency or hook is added.

TDD:
- Behavior: core and redesign skills are available under canonical plugin names.
- Test file: `plugins/supergraph/tests/test-taste-skill-integration.sh`
- Test name: core and redesign registration
- RED command: `bash plugins/supergraph/tests/test-taste-skill-integration.sh`
- Expected RED failure: required files absent.
- Minimal GREEN change: copy exact upstream Markdown into mapped plugin paths.
- Refactor candidates: none; preserve upstream content.
- Mocking: none.

Steps:
1. RED: confirm Task 1 test fails before import.
2. GREEN: fetch/copy the two exact upstream files into mapped paths.
3. REFACTOR: inspect frontmatter and verify existing skill diff is empty.
4. VERIFY: run focused test, `git diff --check`, and `git diff --exit-code -- plugins/supergraph/skills/frontend-design/SKILL.md plugins/supergraph/.codex-plugin/plugin.json`.

Checkpoint:
- Files: two new skill files.
- Commit: `feat(skills): add Taste core and redesign workflows`

## Task 3: Import strict Codex and image-first workflows
Wave: 2
Status: completed
Risk: medium
Dependencies: Task 1
Model: inherit

Files:
- Create: `plugins/supergraph/skills/gpt-taste/SKILL.md`
- Create: `plugins/supergraph/skills/image-to-code/SKILL.md`

Blast radius:
- `plugins/supergraph/skills/gpt-taste/SKILL.md`
- `plugins/supergraph/skills/image-to-code/SKILL.md`

Spec: `docs/supergraph/sdd/2026-09-16-sdd-taste-skill-design-integration.md`

Acceptance:
- [ ] Files are copied from upstream `skills/gpt-tasteskill/SKILL.md` and `skills/image-to-code-skill/SKILL.md`.
- [ ] Frontmatter names are `gpt-taste` and `image-to-code`.
- [ ] Image-first instructions remain opt-in and do not alter plugin hooks.
- [ ] No extra dependency is added.

TDD:
- Behavior: strict Codex and image-first skills are available under canonical plugin names.
- Test file: `plugins/supergraph/tests/test-taste-skill-integration.sh`
- Test name: strict and image-first registration
- RED command: `bash plugins/supergraph/tests/test-taste-skill-integration.sh`
- Expected RED failure: required files absent.
- Minimal GREEN change: copy exact upstream Markdown into mapped plugin paths.
- Refactor candidates: none; preserve upstream content.
- Mocking: none.

Steps:
1. RED: confirm Task 1 test fails before import.
2. GREEN: fetch/copy the two exact upstream files into mapped paths.
3. REFACTOR: inspect large image-first file for truncation and valid frontmatter.
4. VERIFY: run focused test and `git diff --check`.

Checkpoint:
- Files: two new skill files.
- Commit: `feat(skills): add strict Codex and image-first workflows`

## Task 4: Run full contract/lint verification and record source evidence
Wave: 3
Status: completed
Risk: low
Dependencies: Task 2, Task 3
Model: flash

Files:
- Modify: `docs/supergraph/plans/2026-09-16-taste-skill-design-integration.md`
- Test: `plugins/supergraph/tests/test-taste-skill-integration.sh`

Blast radius:
- Four imported skill files.
- `plugins/supergraph/tests/test-taste-skill-integration.sh`.

Spec: `docs/supergraph/sdd/2026-09-16-sdd-taste-skill-design-integration.md`

Acceptance:
- [ ] Focused Taste Skill contract passes.
- [ ] Existing documentation/upstream-content contract tests pass.
- [ ] Shell syntax lint passes.
- [ ] Graph index is refreshed or source-only coverage limitation is recorded.
- [ ] Plan records fetched upstream revision/date and fresh verification results.

TDD:
- Behavior: imported skills do not regress existing plugin contracts.
- Test file: `plugins/supergraph/tests/test-taste-skill-integration.sh` and existing `plugins/supergraph/tests/test-*.sh`.
- Test name: full Taste integration verification
- RED command: `N/A` (verification-only task; RED evidence is recorded in Task 1 and the import tasks).
- Expected RED failure: not applicable; this task creates no production or test behavior.
- Minimal GREEN change: none; verify completed import.
- Refactor candidates: none.
- Mocking: none.

Steps:
1. Run focused contract and inspect all four imported files.
2. Run relevant existing tests and full suite; distinguish baseline failure from new failure.
3. Run Bash syntax lint and `git diff --check`.
4. Refresh/index source-only paths as needed and record evidence.

Checkpoint:
- Files: test, four skill files, plan evidence.
- Commit: `test: verify Taste Skill integration contracts`

## Execution Notes

- Use the public upstream repository `https://github.com/Leonxlnx/taste-skill`.
- Imported source is pinned by verification to commit `ccbc15639c97057cbfcf32ecebc38ef716e4bb37`.
- Keep downloaded source in a temporary directory first; do not install into global `$CODEX_HOME/skills`.
- Use `apply_patch` for local test/docs edits; source imports are a deliberate bulk import from upstream.
- Do not change `plugin.json` unless the plugin loader proves explicit per-skill enumeration is required; current manifest points at `./skills/`.

## Execution Evidence

- Plan review: `Approved`; Critical/Important/Minor = 0/0/0.
- RED: focused contract exited 1 on missing `design-taste-frontend` before imports.
- GREEN: focused contract exited 0 after all four imports.
- Source identity: all four plugin files `cmp` identical to the temporary fetch and direct raw GitHub SHA-256 output from upstream revision `ccbc15639c97057cbfcf32ecebc38ef716e4bb37`.
- Regression guard: `git diff --exit-code -- plugins/supergraph/skills/frontend-design/SKILL.md plugins/supergraph/.codex-plugin/plugin.json` exited 0.
- Focused tests: Taste contract, upstream-content contracts, docs consistency, and hook contracts all exited 0.
- Lint: `bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh` exited 0.
- Full suite: exited 1 only because the pre-existing `codebase-memory-mcp 0.9.0 required` assertion fails; every other test printed PASS.
- Resolution: the baseline failure was fixed by accepting `codebase-memory-mcp >= 0.10.8,<0.11.0`, normalizing the 0.10.x JSON/envelope output, and pinning CI to 0.10.8.
- Graph: canonical `supergraph` reindexed at `2026-09-16T03:46:28Z` with 1,473 nodes/1,963 edges; cycle query returned 0; changed skill paths have no recorded coverage issue.
- Final review: `YES`; Critical/Important/Minor = 0/0/0. The reviewer confirmed all four pinned SHA-256 values and no regression/runtime impact.
