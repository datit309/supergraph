# Plan: Codebase Memory MCP 0.10.8 compatibility

Status: complete; implementation and independent review finished.
Date: 2026-09-16

## Objective

Fix the baseline `codebase-memory-mcp 0.9.0 required` failure and make the migration recipes compatible with the installed 0.10.8 CLI output contract.

## Analysis decisions

- Tier: Full. Scope crosses shell tests, CI, docs, plugin metadata, and generated workflow guidance.
- Root cause: stale exact-version gate plus unhandled 0.10.x CLI output format.
- Compatibility range: `>=0.10.8,<0.11.0`; CI remains exact `==0.10.8`.
- Runtime boundary: normalize CLI JSON in `test-codebase-memory-migration.sh`; do not alter MCP server wiring or hooks.
- Historical records: preserve changelog and historical migration plans; add a resolution note to the current Taste plan instead of rewriting its original RED evidence.

## Environment context

- Repository: `/Users/trantandat/GIC/Freelancer/supergraph`; branch: `master` (user explicitly authorized this fix).
- Project type: Markdown/Bash; no `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or `pubspec.yaml`.
- `.supergraph-env`: `TEST_CMD=for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`; `LINT_CMD=bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh`; `FORMAT_CMD=`; `BUILD_CMD=`; `GRAPH_PROVIDER=codebase-memory-mcp`; `CBM_PROJECT=supergraph`; Serena active.
- Verification: focused migration recipe, full `plugins/supergraph/tests/test-*.sh` suite with accumulated status, and `bash -n` lint. No configured app integration/e2e suite.
- Commit style: conventional-commit history; no commit requested in this task.
- Host binary: `codebase-memory-mcp 0.10.8`; normal CLI cache permissions may require host-level execution during verification.

## Graph context and blast radius

- Project `supergraph` index was ready before diagnosis: 1475 nodes / 1968 edges, generation `2026-09-16T03:58:56Z`.
- Qualified path: `supergraph.plugins.supergraph.tests.test-codebase-memory-migration.recipes` calls `cbm`; the test entry calls `recipes`.
- Pre-change coverage had no recorded gap for the test, contract, or workflow paths. Docs, plugin metadata, `.serena`, Taste plan, and `scan/SKILL.md` require an explicit coverage check after edits.
- Post-change coverage was checked for every operated path. Source-backed paths have no recorded issue; `docs/`, `plugins/supergraph/docs/`, and `plugins/supergraph/scripts/` are intentionally excluded from graph indexing, and `README-VI.html` retains known parse-partial ranges including changed line 540; those files were read directly and validated by tests.
- No new cycle, hub, or bridge concern was found for this bounded contract change. `scan/SKILL.md` is a shared workflow surface and is therefore reviewed separately.

## RED evidence

Before implementation, the focused recipe test reproduces:

```text
FAIL: codebase-memory-mcp 0.9.0 required
```

The installed binary reports `codebase-memory-mcp 0.10.8`. A controlled shim then demonstrated the second failure: without `--json`, `detect_changes` emits text; with `--json`, the result is wrapped under `structuredContent`. The first implementation diff is intentionally limited to the test contract (not production plugin runtime) and exposed two further 0.10.8 differences: `detect_changes` needs `format:"json"`, and `query_graph` returns row-rendered text inside the MCP envelope. The GREEN phase must finish the adapter and then validate all recipe branches.

## Tasks

## Task 1: Repair migration CLI contract

Model: inherit
Wave: 1 (critical path)
Status: completed
Risk: medium; shell/Python boundary and multiple CLI response shapes.
Dependencies: none; baseline RED captured.
Files:
  Create: `plugins/supergraph/scripts/normalize-codebase-memory-json.py`
  Modify: `plugins/supergraph/tests/test-codebase-memory-migration.sh`
  Test file: `plugins/supergraph/tests/test-codebase-memory-migration.sh`
  Test name: `cli-contract`, `recipes`
Blast radius: migration contract test and its fixture-only graph calls.
TDD:
  RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh recipes` on the baseline.
  Expected: `FAIL: codebase-memory-mcp 0.9.0 required`.
  Minimal GREEN: version range check, `cli --json`, direct/envelope/duplicate normalization, text-row normalization, and `format:"json"` for `detect_changes`.
  Mocking: no mocks in final recipe; controlled CLI shim was diagnostic only. Version/response fixtures are inline in `cli-contract`.
  REFACTOR: parser moved to shared Python adapter and query columns are scalar.
Steps:
  1. Run the baseline RED command and record the stale version failure.
  2. Run `cli-contract` with version cases `0.10.7`, `0.10.8`, `0.10.9`, `0.11.0`, malformed, and empty output.
  3. Run `recipes` with the real `codebase-memory-mcp 0.10.8` binary.
  4. Compile-check `plugins/supergraph/scripts/normalize-codebase-memory-json.py`.
Acceptance: `cli-contract` passes direct JSON, MCP envelope, duplicate stream, text-only query envelope, malformed/human-readable rejection, and all version boundaries; `recipes` passes with real 0.10.8.
Checkpoint: recipe passes and test diff reviewed before docs/CI changes.

## Task 2: Align current contract, CI, docs, and metadata

Model: inherit
Wave: 2 (parallel after Task 1)
Status: completed
Risk: medium; many duplicated user-facing markers and JSON metadata.
Dependencies: Task 1 completed.
Files:
  Create: none
  Modify: `plugins/supergraph/.github/workflows/graph-review.yml`, `plugins/supergraph/references/codebase-memory-contract.md`, `README.md`, `README-VI.md`, `README-VI.html`, `plugins/supergraph/docs/TEAM-SETUP.md`, `plugins/supergraph/.claude-plugin/plugin.json`, `plugins/supergraph/.claude-plugin/marketplace.json`, `plugins/supergraph/.codex-plugin/plugin.json`, `plugins/supergraph/plugin.json`, `plugins/supergraph/tests/test-documentation-consistency.sh`, `.serena/memories/tech_stack.md`, `docs/supergraph/plans/2026-09-16-taste-skill-design-integration.md` (resolution note only)
  Test file: `plugins/supergraph/tests/test-codebase-memory-migration.sh`
  Test name: `contract`, `ci`, `docs-en`, `docs-vi`, `legacy`, `claude`, `codex-opencode`, `gemini-metadata`
Blast radius: current installation guidance, CI graph review, manifest descriptions, and consistency checks.
TDD:
  RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh ci` and `bash plugins/supergraph/tests/test-codebase-memory-migration.sh docs-en` on current files.
  Expected: old `codebase-memory-mcp==0.9.0` / `0.9.0` markers are found and CI raw output is not normalized.
  Minimal GREEN: every CI graph call pipes through the shared normalizer; `detect_changes` uses `format:"json"`; assertions validate `status`, project/counts, schema, changed-file/impact fields, `rows`, and no `next_cursor`.
  Mocking: CI-equivalent static contract only; no remote service mock.
  REFACTOR: use one shared normalizer and shell-safe pip range.
Steps:
  1. Use shell-safe `pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'` for ranges.
  2. Pin CI to `pip install codebase-memory-mcp==0.10.8`.
  3. In `graph-review.yml`, pipe `index_repository`, `index_status`, `get_graph_schema`, `detect_changes` with `format:"json"`, and `query_graph` through `plugins/supergraph/scripts/normalize-codebase-memory-json.py`.
  4. Assert `status`, project/counts/schema fields, changed-file/impact fields, `rows`, and no `next_cursor` in corresponding JSON files.
  5. Update current markers to 0.10.8.
  6. Preserve historical changelog/plan content.
  7. Leave MCP arrays/hooks unchanged.
Acceptance: exact `contract`, `ci`, `docs-en`, `docs-vi`, `claude`, `codex-opencode`, `gemini-metadata`, and `legacy` commands pass; CI has one normalizer pipeline per graph call; no operational current file requires exact 0.9.0; the Taste plan retains original RED evidence and only appends a resolution note.
Checkpoint: `git diff --check`; no active current file requires exact 0.9.0.

## Task 3: Harden generated scan test command

Model: inherit
Wave: 2 (parallel with Task 2)
Status: completed
Risk: low/medium; shared workflow guidance.
Dependencies: none.
Files:
  Create: none
  Modify: `plugins/supergraph/skills/scan/SKILL.md`
  Generated: `.supergraph-env`
  Test file: `plugins/supergraph/tests/test-codebase-memory-migration.sh`
  Test name: `scan`; generated `TEST_CMD` failure-propagation check
Blast radius: scan-generated local test command.
TDD:
  RED command: `status=0; false || status=1; true; exit "$status"` compared with current generated command behavior.
  Expected: current command shape can return success after an earlier failed test.
  Minimal GREEN: accumulator returns nonzero if any test fails and existing scan markers remain.
  Mocking: use shell `false`/`true` only for failure-propagation behavior; graph calls remain real/unchanged.
  REFACTOR: preserve all other scan output fields and refresh `.supergraph-env` through scan.
Steps:
  1. Change emitted `TEST_CMD` to use `status=0`, run each test with `|| status=1`, then `exit "$status"`.
  2. Run scan/generation.
  3. Execute generated command with an accumulating wrapper.
Acceptance: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh scan` passes; generated `TEST_CMD` cannot hide an earlier failure; graph freshness/provider behavior unchanged.
Checkpoint: generated command still matches Markdown instructions and no provider calls change.

## Task 4: Fix loop, refresh graph, verify, and review

Model: inherit
Wave: 3 (after Tasks 1–3)
Status: completed
Risk: low; verification only, except bounded fixes if checks fail.
Dependencies: Tasks 1–3.
Files:
  Create: none
  Modify: none
  Test file: `plugins/supergraph/tests/test-codebase-memory-migration.sh`, graph MCP project `supergraph`, and review package
  Test name: `all`, `bash -n`, `index_status`, `check_index_coverage`, cycle query, independent code/graph review
Blast radius: full active plugin contract.
TDD:
  RED command: `status=0; for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file" || status=1; done; exit "$status"`.
  Expected: any failing active test produces a nonzero aggregate status.
  Minimal GREEN: focused recipe, full suite, syntax, graph freshness/coverage, and review gates pass.
  Mocking: none; use real local tests, graph index, and review package.
  REFACTOR: none; verification-only task.
Steps:
  1. Run fix loop up to three iterations.
  2. Run integration only if configured.
  3. Re-index and inspect exact changed-path coverage.
  4. Query cycles and bounded impact.
  5. Obtain independent code review and graph review.
Acceptance: exact commands above plus `bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh` pass; graph coverage is checked for every changed path with intentional excluded/parse-partial ranges disclosed, no new cycles, and no CRITICAL review findings.
Checkpoint: final evidence recorded before claim of completion.

## Compatibility test matrix

The version parser must be exercised with `0.10.7` (reject), `0.10.8` (accept), `0.10.9` (accept), `0.11.0` (reject), malformed output (reject), and missing command (reject). The JSON adapter must be exercised with direct result, MCP `structuredContent`, duplicate JSON stream, text-only query envelope, and malformed/human-readable output (reject or explicit normalization where specified).

## Verification commands

```bash
bash plugins/supergraph/tests/test-codebase-memory-migration.sh recipes
status=0; for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file" || status=1; done; exit "$status"
bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh
```

The real CLI recipe run may require normal host cache permissions; do not “fix” that by changing or deleting cache directories.

## Acceptance criteria

- Operational gates no longer require exact 0.9.0; historical changelog assertions remain intentionally historical.
- Real `codebase-memory-mcp 0.10.8` passes migration recipes.
- Full active shell suite and syntax checks pass with accumulated status.
- CI graph-review uses machine-readable 0.10.8-compatible output.
- Graph index is refreshed; changed paths have coverage checked with intentional excluded/parse-partial ranges disclosed; no new cycles.
- Independent plan/code/graph review has no CRITICAL findings.
