# Plan: Port selected upstream superpowers v6.3 improvements

Status: completed
Review: approved
Approved scope: user approved implementation with “ok làm đi”
Date: 2026-09-16

## Analysis Decisions

- Tier: Full. Scope crosses Codex/Claude manifest boundaries and changes more than five files.
- Approach: port the high-value workflow contracts that fit this plugin; do not copy upstream platform-specific documentation or replace the existing Supergraph pipeline.
- Risk: medium. The Codex manifest change is isolated to Codex registration; Claude/Antigravity shell hooks remain unchanged.
- Hub/bridge decision: do not modify SupergraphPlugin, pre-invocation runtime code, or hook execution code. New workflow helpers remain under execute/scripts and are invoked by documented skills.
- Version decision: keep the current plugin version unchanged in this scoped port; release/version bump is a separate release task.
- Planned unique changed files: 19, including this SDD and plan; below the repository stop threshold of 20.

## Environment Context

- Project type: Bash/YAML/Markdown plugin; detector reports `unknown` because no package manager manifest exists.
- Test command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- Lint command: `bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh`
- Formatter/build: none configured.
- Branch: `master`; implementation is explicitly approved by the user.
- Conventions: shell scripts use `set -euo pipefail`, tests print PASS/FAIL, workflow contracts are documented in skill markdown, edits use repo-local paths.
- Baseline: shell syntax passes; the suite has one pre-existing environment failure requiring `codebase-memory-mcp 0.9.0` exactly.

## Graph Evidence

- Provider/project: codebase-memory-mcp / `supergraph`.
- Generation: `2026-09-16T03:13:20Z`; 1,261 nodes, 1,742 edges; no skipped paths in the relevant source scopes.
- Relevant entry points: `.opencode-plugin/plugin.ts`, `hooks/pre-invocation`.
- Relevant symbols: `SupergraphPlugin`, `findLatestPlan`, `readPlanStats`.
- Trace result: `findLatestPlan` has four inbound event callers; `readPlanStats` has three. No changed task targets these runtime hubs.
- Coverage checks completed for all current task targets: manifest, analyze/execute/fix/tdd/sdd skills, agents, hooks, tests, and install files. CHANGELOG is intentionally excluded from this port.
- Known limitation: `README-VI.html` has a recorded partial parse range; it is outside this change.

## Task Format

Each task must be implemented with a RED test before production/documentation changes, then GREEN, then a minimal refactor. Every task includes Status, Wave, Model, Risk, Dependencies, Blast radius, Spec, Files, TDD, Steps, Checkpoint, and Acceptance. Independent tasks can run in the same wave. Every task reports changed files, test command, result, and artifact paths.

## Tasks

## Task 1: Isolate Codex from Claude shell hooks

Status: completed
Wave: 1
Model: inherit
Risk: low
Dependencies: none
Blast radius:

- `plugins/supergraph/.codex-plugin/plugin.json`
- `plugins/supergraph/tests/test-hook-contracts.sh`
Spec: docs/supergraph/sdd/2026-09-16-upstream-superpowers-v6-3-port.md

Files:

- Modify: `plugins/supergraph/.codex-plugin/plugin.json`.
- Test: `plugins/supergraph/tests/test-hook-contracts.sh`.

Behavior: Codex native plugin loading must not auto-register the Claude shell hook event map. The Codex manifest must declare an empty hooks object, while the Claude manifest remains responsible for its own hook configuration.

TDD:

- Test file: `plugins/supergraph/tests/test-hook-contracts.sh`.
- Test name: `codex-manifest`.
- Expected RED failure: assertion reports the current string hook path instead of `{}`.
- Minimal GREEN change: replace only the Codex manifest `hooks` value with `{}`.
- Mocking: none; test real JSON files.
- RED: Add a focused `codex-manifest` contract test and run `rtk bash plugins/supergraph/tests/test-hook-contracts.sh codex-manifest`; it must fail against the current string hook path.
- GREEN: Change `plugins/supergraph/.codex-plugin/plugin.json` so `hooks` is `{}`.
- REFACTOR: Run the focused test, then the complete hook-contract test.

Steps:

1. Add the contract assertion and capture the expected RED output.
2. Change only the Codex manifest hook value.
3. Run focused and adjacent hook tests.

Checkpoint:

- Focused test is RED before manifest change and GREEN after it.
- Files: `plugins/supergraph/.codex-plugin/plugin.json`, `plugins/supergraph/tests/test-hook-contracts.sh`.
- Commit: `test: cover Codex hook isolation`, then `fix: isolate Codex from Claude hooks`.
- Result: focused manifest, full hook-contract, and hook-command tests pass; RED observed before manifest change.
- TDD Evidence: RED `rtk bash plugins/supergraph/tests/test-hook-contracts.sh codex-manifest` → exit 1, expected hook path found; GREEN focused/all hook tests → exit 0.

Acceptance:

- JSON parses.
- `hooks === {}` in `.codex-plugin/plugin.json`.
- Existing Claude/Antigravity hook tests still pass.
- No changes to `plugins/supergraph/hooks/hooks.json` or runtime hook code.

## Task 2: Add plan workspace, task brief, and review package helpers

Status: completed
Wave: 1
Model: inherit
Risk: medium
Dependencies: none
Blast radius:

- `plugins/supergraph/skills/execute/scripts/sdd-workspace`
- `plugins/supergraph/skills/execute/scripts/task-brief`
- `plugins/supergraph/skills/execute/scripts/review-package`
- `plugins/supergraph/tests/test-upstream-superpowers.sh`
Spec: docs/supergraph/sdd/2026-09-16-upstream-superpowers-v6-3-port.md

Files:

- Create: `plugins/supergraph/skills/execute/scripts/sdd-workspace`.
- Create: `plugins/supergraph/skills/execute/scripts/task-brief`.
- Create: `plugins/supergraph/skills/execute/scripts/review-package`.
- Test: `plugins/supergraph/tests/test-upstream-superpowers.sh`.

Behavior: A plan path deterministically maps to `.supergraph/sdd/<plan-basename>/`; task briefs extract exactly one `## Task N:` section; review packages validate refs and capture commits, stat, and diff. Invalid plan/task/ref inputs fail without silently selecting another scope.

TDD:

- Test file: `plugins/supergraph/tests/test-upstream-superpowers.sh`.
- Test name: `scripts`.
- Expected RED failure: helper invocation fails because the three commands do not exist.
- Minimal GREEN change: add only the three strict-mode helper scripts required by the fixture.
- Mocking: use a temporary real git repository; no mocked git output.
- RED: Add the lifecycle fixture and run `rtk bash plugins/supergraph/tests/test-upstream-superpowers.sh scripts`; it must fail because the helpers do not exist.
- GREEN: Implement the three Bash helpers with strict mode, explicit input validation, deterministic paths, and no destructive git operations.
- REFACTOR: Mark helpers executable; rerun the focused test and shell syntax check.

Steps:

1. Add valid/invalid fixture cases for workspace, task extraction, and review package generation.
2. Implement helpers with no destructive git operations.
3. Inspect new sources, run syntax checks, then run behavior tests.

Source verification: because the new helper paths were not present during the initial graph scan, inspect the exact new files with `rtk sed`, run `rtk bash -n` on them, reindex incrementally, and run `check_index_coverage` for all three paths before relying on graph evidence.

Checkpoint:

- Behavior test is RED before helper creation and GREEN after helpers are executable.
- New helper paths have post-creation graph coverage or documented source fallback.
- Files: `plugins/supergraph/skills/execute/scripts/`, `plugins/supergraph/tests/test-upstream-superpowers.sh`.
- Commit: `test: define SDD artifact helper behavior`, then `feat: add SDD artifact helpers`.
- Result: helper lifecycle test and Bash syntax checks pass; optional outputs are workspace-confined; helper scripts are excluded from graph indexing, so source inspection is the authoritative fallback.
- TDD Evidence: RED `rtk bash plugins/supergraph/tests/test-upstream-superpowers.sh scripts` → exit 127, helpers absent; GREEN focused lifecycle test → exit 0.
- Review-fix Evidence: RED focused lifecycle test → exit 1, invalid task returned 1 instead of documented 3; GREEN focused lifecycle test → exit 0 after exit code and output-path hardening.
- Review-fix Evidence 2: RED focused lifecycle test → exit 1, mixed fence content was lost; GREEN focused lifecycle test → exit 0 after delimiter tracking and symlink/non-regular output rejection.

Acceptance:

- `sdd-workspace PLAN_FILE` creates the artifact directory and `.gitignore` containing `*`, then prints the directory.
- `task-brief PLAN_FILE TASK_NUMBER [OUTFILE]` writes a task brief and excludes neighboring task sections; an explicit output is restricted to a filename inside the workspace.
- `review-package PLAN_FILE BASE_REF HEAD_REF [OUTFILE]` validates refs and writes a self-contained review artifact with commit list, stat, and diff; an explicit output is restricted to a filename inside the workspace.
- Existing untracked files are never removed or overwritten outside the generated artifact path.
- Focused tests cover valid and invalid inputs.

## Task 3: Add durable SDD/execute/fix review-loop contracts

Status: completed
Wave: 2
Model: inherit
Risk: medium
Dependencies: Task 2
Blast radius:

- `plugins/supergraph/skills/sdd/SKILL.md`
- `plugins/supergraph/skills/plan/SKILL.md`
- `plugins/supergraph/skills/execute/SKILL.md`
- `plugins/supergraph/skills/fix/SKILL.md`
- `plugins/supergraph/skills/review/SKILL.md`
- `plugins/supergraph/agents/executor.md`
- `plugins/supergraph/agents/code-reviewer.md`
- `plugins/supergraph/tests/test-upstream-superpowers.sh`
Spec: docs/supergraph/sdd/2026-09-16-upstream-superpowers-v6-3-port.md

Files:

- Modify: `plugins/supergraph/skills/sdd/SKILL.md`.
- Modify: `plugins/supergraph/skills/plan/SKILL.md`.
- Modify: `plugins/supergraph/skills/execute/SKILL.md`.
- Modify: `plugins/supergraph/skills/fix/SKILL.md`.
- Modify: `plugins/supergraph/skills/review/SKILL.md`.
- Modify: `plugins/supergraph/agents/executor.md`.
- Modify: `plugins/supergraph/agents/code-reviewer.md`.
- Test: `plugins/supergraph/tests/test-upstream-superpowers.sh`.

Behavior: Plans point to their governing SDD; execution produces task briefs/reports and a ledger; controllers batch compatible tasks, scan conflicts before dispatch, prevent nested subagents, and record non-catastrophic conflict rulings; fix/review loops resume the original implementer for rounds 1–3, use a fresh stronger pass for rounds 4–5, re-review only changed scope, and stop after five rounds with a circuit-breaker report.

TDD:

- Test file: `plugins/supergraph/tests/test-upstream-superpowers.sh`.
- Test name: `docs`.
- Expected RED failure: required lifecycle markers are missing from the current workflow documents.
- Minimal GREEN change: add only the contract text and artifact paths needed by the assertions.
- Mocking: none; assert real documentation contracts.
- RED: Extend the lifecycle contract test with required markers for SDD artifact paths, `Spec:`, ledger, task brief/review package helpers, conflict scan/ruling, no nested subagents, bounded review rounds, and circuit-breaker reporting; run `rtk bash plugins/supergraph/tests/test-upstream-superpowers.sh docs`; it must fail before the seven skill/agent documents are updated.
- GREEN: Update the seven skill/agent documents with the smallest coherent workflow additions and explicit artifact locations.
- REFACTOR: Run `rtk bash plugins/supergraph/tests/test-upstream-superpowers.sh docs`, `rtk bash -n plugins/supergraph/tests/test-*.sh`, and `rtk bash plugins/supergraph/tests/test-documentation-consistency.sh`.

Steps:

1. Add only lifecycle markers to the existing fixture and capture RED.
2. Update SDD, plan, execute, fix, review, executor, and code-reviewer contracts.
3. Run focused docs, shell syntax, and consistency tests.

Acceptance:

- SDD and plan docs define the artifact/ledger contract and `Spec:` pointer.
- Execute docs require pre-dispatch conflict scanning, batching, task artifacts, and no nested subagents.
- Fix/review docs define scoped re-review, implementer continuity, five-round breaker, and finish-report ruling.
- Agent instructions do not authorize implementers or reviewers to spawn subagents.
- No claim depends on a new external service.

Checkpoint:

- Lifecycle contract is RED before docs changes and GREEN after all seven docs are updated.
- Files: `plugins/supergraph/skills/{sdd,plan,execute,fix,review}/SKILL.md`, `plugins/supergraph/agents/{executor,code-reviewer}.md`, `plugins/supergraph/tests/test-upstream-superpowers.sh`.
- Commit: `test: define workflow artifact contracts`, then `docs: add durable SDD review loop`.
- Result: docs contract GREEN, shell syntax pass, documentation-consistency pass.
- TDD Evidence: RED `rtk bash plugins/supergraph/tests/test-upstream-superpowers.sh docs` → exit 1, SDD artifact marker absent; GREEN docs/syntax/consistency checks → exit 0.

## Task 4: Add falsifiable test-writing guidance

Status: completed
Wave: 3
Model: inherit
Risk: low
Dependencies: Task 3
Blast radius:

- `plugins/supergraph/skills/tdd/writing-good-tests.md`
- `plugins/supergraph/skills/tdd/SKILL.md`
- `plugins/supergraph/tests/test-upstream-content-contracts.sh`
Spec: docs/supergraph/sdd/2026-09-16-upstream-superpowers-v6-3-port.md

Files:

- Create: `plugins/supergraph/skills/tdd/writing-good-tests.md`.
- Modify: `plugins/supergraph/skills/tdd/SKILL.md`.
- Test: `plugins/supergraph/tests/test-upstream-content-contracts.sh`.

Behavior: TDD guidance must teach tests that can fail for the intended reason: independent expected values, behavior-level assertions, correct mock level, and mutation-oriented validation. The main TDD skill must link to the guide.

TDD:

- Test file: `plugins/supergraph/tests/test-upstream-content-contracts.sh`.
- Test name: `test-writing-good-tests`.
- Expected RED failure: guide-link/content assertions fail because the guide and link are absent.
- Minimal GREEN change: add one guide and one link; do not alter TDD gate semantics.
- Mocking: none; assert real documentation contracts.
- RED: Add `test-upstream-content-contracts.sh` with guide/link assertions and run `rtk bash plugins/supergraph/tests/test-upstream-content-contracts.sh`; it must fail before the guide/link exists.
- GREEN: Add the guide and link it from TDD.
- REFACTOR: Run `rtk bash plugins/supergraph/tests/test-upstream-content-contracts.sh` and the full suite with `rtk bash -c 'for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done'`.

Steps:

1. Add the isolated guide/link contract and capture RED.
2. Add the guide and link it from TDD.
3. Run focused and full tests.

Acceptance:

- Guide covers breakability, independent expected values, behavior over implementation text, mock-level choice, and mutation checking.
- TDD skill links to the guide without weakening RED-before-production requirements.

Checkpoint:

- Isolated guide test is RED before documentation changes and GREEN after them.
- Files: `plugins/supergraph/skills/tdd/writing-good-tests.md`, `plugins/supergraph/skills/tdd/SKILL.md`, `plugins/supergraph/tests/test-upstream-content-contracts.sh`.
- Commit: `test: define falsifiable test guidance contract`, then `docs: add test-writing guidance`.
- Result: guide/link contract passes after expected RED; main TDD RED-before-production rules unchanged.
- TDD Evidence: RED `rtk bash plugins/supergraph/tests/test-upstream-content-contracts.sh writing` → exit 1, guide link absent; GREEN focused writing contract → exit 0.

## Task 5: Scale brainstorming ceremony by complexity

Status: completed
Wave: 3
Model: inherit
Risk: low
Dependencies: Task 4
Blast radius:

- `plugins/supergraph/skills/analyze/SKILL.md`
- `plugins/supergraph/tests/test-upstream-content-contracts.sh`
Spec: docs/supergraph/sdd/2026-09-16-upstream-superpowers-v6-3-port.md

Files:

- Modify: `plugins/supergraph/skills/analyze/SKILL.md`.
- Test: `plugins/supergraph/tests/test-upstream-content-contracts.sh`.

Behavior: Analyze must classify work as `spike`, `bounded`, or `architectural`, choose the smallest matching ceremony, require approval before implementation for every path, and upgrade only when hidden complexity is discovered.

TDD:

- Test file: `plugins/supergraph/tests/test-upstream-content-contracts.sh`.
- Test name: `analyze`.
- Expected RED failure: `spike`, `bounded`, `architectural`, and approval markers are absent from analyze.
- Minimal GREEN change: add the three-path router and upgrade rule to analyze only.
- Mocking: none; assert real documentation contracts.
- RED: Add classification/approval assertions to `test-upstream-content-contracts.sh` and run `rtk bash plugins/supergraph/tests/test-upstream-content-contracts.sh analyze`; it must fail against the current analyze document.
- GREEN: Add the three-path router and upgrade rule to analyze.
- REFACTOR: Run `rtk bash plugins/supergraph/tests/test-upstream-content-contracts.sh analyze` and the full suite with `rtk bash -c 'for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done'`.

Steps:

1. Add the isolated classification/approval contract and capture RED.
2. Add the three-path router and upgrade rule to analyze.
3. Run focused and full tests.

Acceptance:

- All three classifications and their entry/exit criteria are explicit.
- Approval is required before implementation on every path.
- The router does not bypass graph risk checks or mandatory TDD/verification gates.

Checkpoint:

- Isolated routing test is RED before analyze changes and GREEN after them.
- Files: `plugins/supergraph/skills/analyze/SKILL.md`, `plugins/supergraph/tests/test-upstream-content-contracts.sh`.
- Commit: `test: define analyze ceremony contract`, then `docs: scale analyze ceremony by complexity`.
- Result: analyze routing contract passes after expected RED; approval and one-way upgrade rules are documented.
- TDD Evidence: RED `rtk bash plugins/supergraph/tests/test-upstream-content-contracts.sh analyze` → exit 1, `spike` marker absent; GREEN focused/analyze content contracts → exit 0.

## Execution and Review Protocol

- Plan reviewer must check task independence, graph evidence, RED commands, exact files, and acceptance criteria before execution.
- Execute Wave 1 tasks independently; Wave 2 starts only after Wave 1 focused tests pass; execute Task 4 then Task 5 sequentially because they extend the same content-contract test.
- After coding, run `/supergraph:fix` with at most three repair iterations for ordinary failures.
- Run integration only if the repository exposes an integration/e2e command; otherwise record `not configured`.
- Before completion, run `/supergraph:verify` with fresh tests/lint and `/supergraph:review` with independent code-reviewer and graph checks.
- Preserve the known `codebase-memory-mcp 0.9.0 required` baseline failure unless the environment changes independently.

## Final Review

- Verdict: YES; 0 Critical, 0 Important, 1 Minor fixed by setting the plan status to completed.
- Tests: focused contracts PASS; strict full suite runs all tests and retains only the pre-existing `codebase-memory-mcp 0.9.0 required` failure.
- Lint: PASS.
- Graph: generation `2026-09-16T03:13:20Z`, 1,261 nodes/1,742 edges; helper/docs exclusions are by design and source-audited directly; no new 2-cycle found.
