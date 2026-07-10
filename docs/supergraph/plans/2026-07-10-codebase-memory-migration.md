# Migrate Supergraph to codebase-memory-mcp

Goal: remove active `code-review-graph` dependencies and use `codebase-memory-mcp >= 0.9.0` across Supergraph hosts and workflows.

Scope rule: do not rewrite `docs/supergraph/plans/**` or historical entries already present in `plugins/supergraph/CHANGELOG.md`. Every other active executable name, MCP namespace, permission glob, cache path, metadata keyword, prompt call, and setup instruction is migration scope.

## Analysis Decisions
- Approach: native Codebase Memory MCP integration plus one shared graph contract and executable contract tests.
- Alternatives rejected: mechanical renaming because schemas differ; permanent dual-provider support because it retains old coupling; CLI adapter for normal agent queries because it hides native MCP schemas.
- Provider contract: stable `CBM_PROJECT`; `index_repository` lifecycle; `get_graph_schema` before Cypher; `search_graph` for discovery; `trace_path` for callers/data flow; `get_code_snippet` for source; `get_architecture` for overview/clusters/hotspots; `detect_changes` for git impact; `query_graph` recipes for cycles, hubs, bridges, tests, and complexity.
- Approved scope: user approved after review of 35 files/117 references. Active blast radius is 36 existing files plus contract/test fixture files.

## Task 1: Enforce execution prerequisites
Status: completed
Risk: low
Dependencies: none
Files:
- Modify: none
- Test: none
Blast radius:
- All later tasks
Acceptance:
- Execution stops on `master` before modifying any implementation file.
- Execution continues only after `git switch -c feat/codebase-memory-migration` succeeds and `git branch --show-current` prints `feat/codebase-memory-migration`.
- Execution verifies `command -v codebase-memory-mcp` and exact version `codebase-memory-mcp 0.9.0`; if absent/wrong, installation uses `python3 -m pip install --user codebase-memory-mcp==0.9.0` after explicit user approval.
TDD:
- Behavior: migration cannot execute on the protected branch or with a missing/unpinned Codebase Memory CLI.
- Test file: none
- Test name: branch and pinned CLI prerequisite gate
- RED command: `test "$(git branch --show-current)" != master && command -v codebase-memory-mcp >/dev/null && test "$(codebase-memory-mcp --version)" = "codebase-memory-mcp 0.9.0"`
- Expected RED failure: current branch is `master` even when the local CLI already reports `0.9.0`.
- Minimal GREEN change: after explicit approval, create the feature branch; install exact CLI version only if its command/version assertion fails.
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: verify branch and pinned CLI prerequisites together.
   Command: `test "$(git branch --show-current)" != master && command -v codebase-memory-mcp >/dev/null && test "$(codebase-memory-mcp --version)" = "codebase-memory-mcp 0.9.0"`
   Expected: FAIL
2. GREEN: request explicit approval for feature-branch creation and any required pinned CLI installation, then repeat the complete gate.
   Command: `test "$(git branch --show-current)" = feat/codebase-memory-migration && command -v codebase-memory-mcp >/dev/null && test "$(codebase-memory-mcp --version)" = "codebase-memory-mcp 0.9.0"`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `git branch --show-current`
Checkpoint:
- Files: `none`
- Commit: `none`

## Task 2: Add shared graph contract and static validator
Status: completed
Risk: medium
Dependencies: Task 1
Files:
- Create: plugins/supergraph/references/codebase-memory-contract.md
- Create: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/scan/SKILL.md
- plugins/supergraph/skills/plan/SKILL.md
- plugins/supergraph/skills/fix/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- Contract defines version `>=0.9.0`, project identity, index/freshness lifecycle, pagination, tool fallbacks, failure semantics, and named Cypher recipes.
- Validator has named sections and scans all active repository files while exempting only `docs/supergraph/plans/**` and pre-existing historical `CHANGELOG.md` lines.
- Full validator rejects legacy executable names, MCP namespaces, permission globs, `.code-review-graph` cache paths, and metadata keywords.
TDD:
- Behavior: static validation detects missing contract content and every category of active legacy reference.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: rejects incomplete graph contract and active legacy references
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section contract`
- Expected RED failure: contract is absent.
- Minimal GREEN change: add contract plus deterministic shell assertions; final legacy scan remains expected to fail until Task 19.
- Refactor candidates: centralize file exemptions and assertion helpers.
- Mocking: none
Steps:
1. RED: write contract assertions, then run them before creating the contract.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section contract`
   Expected: FAIL
2. GREEN: add the contract with every required marker and query name.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section contract`
   Expected: PASS
3. REFACTOR: emit file/line diagnostics for every static failure.
4. VERIFY:
   - `bash -n plugins/supergraph/tests/test-codebase-memory-migration.sh`
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section contract`
Checkpoint:
- Files: `plugins/supergraph/references/codebase-memory-contract.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `test: add codebase memory graph contract`

## Task 3: Add executable Codebase Memory recipe tests
Status: completed
Risk: high
Dependencies: Task 2
Files:
- Create: plugins/supergraph/tests/fixtures/codebase-memory/app.sh
- Create: plugins/supergraph/tests/fixtures/codebase-memory/app_test.sh
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/references/codebase-memory-contract.md
- plugins/supergraph/skills/analyze/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- Test verifies `codebase-memory-mcp --version` is at least `0.9.0`, indexes the deterministic Bash fixture as `supergraph-cbm-contract-fixture`, and obtains `get_graph_schema` through CLI.
- Test executes every contract Cypher recipe through `codebase-memory-mcp cli query_graph`, parses JSON, and distinguishes valid empty `rows: []` from an error/nonzero exit.
- Cycle recipe uses the CBM 0.9.0-compatible one-hop query `MATCH (a)-[:CALLS|IMPORTS]->(b) RETURN a.qualified_name, b.qualified_name LIMIT 100000`; the validator builds an adjacency list and runs client-side DFS capped at depth 8, preserving mixed `CALLS`/`IMPORTS` cycle detection. Variable-range union and path-binding syntax are forbidden because the 0.9.0 parser rejects them.
- One-hop results are paginated where supported; if the returned row count reaches the hard `100000` ceiling without a completeness signal, validator/CI fails as incomplete evidence instead of claiming zero cycles.
- The fixture includes a mixed `CALLS → IMPORTS` cycle of depth ≤8 and asserts the client DFS finds it; a separate synthetic adjacency assertion remains so the algorithm is tested even if a language parser omits one edge type.
- Bridge recipe uses `MATCH (a)-[r]->(b) RETURN a.file_path, b.file_path LIMIT 100000`; the validator filters rows client-side where both file paths are present and differ. Unsupported comparison operators in Cypher are forbidden, and a full 100k result without pagination fails as incomplete evidence.
- Test-gap recipe uses `MATCH (n) RETURN n.qualified_name, n.is_test LIMIT 100000` plus `MATCH (t)-[:TESTS]->(n) RETURN n.qualified_name LIMIT 100000`; the validator treats false/missing `is_test` nodes without a covered qualified name as gaps. Unsupported `coalesce`/boolean operators are forbidden, and either 100k result without pagination fails as incomplete evidence.
- Complexity recipe uses `MATCH (n) RETURN n.qualified_name, n.complexity, n.cognitive LIMIT 100000`; the validator normalizes missing values to zero, filters `complexity > 10 OR cognitive > 15`, and sorts client-side. Unsupported `coalesce`/boolean operators are forbidden, and a full 100k result without pagination fails as incomplete evidence.
- Cross-boundary recipe uses `MATCH (a)-[r]->(b) RETURN a.module, b.module LIMIT 100000`; the validator filters rows client-side where both module values are present and differ. Unsupported comparison operators are forbidden, and a full 100k result without pagination fails as incomplete evidence.
- Fixture produces at least one CALLS edge and one test relationship or test-marked node, while recipes whose fixture result is empty are still asserted as successful structured responses.
- Test initializes a deterministic git repository in a temporary fixture copy, commits a base, changes one tracked source file, then runs the exact CI calls `index_repository` with `{"repo_path":"<absolute-fixture>","name":"supergraph-cbm-contract-fixture","mode":"fast"}`, `index_status` with `{"project":"supergraph-cbm-contract-fixture"}`, and `detect_changes` with `{"project":"supergraph-cbm-contract-fixture","since":"HEAD~1"}`.
- Executable assertions parse the index `status`, index-status project/node/edge fields, and the real `detect_changes` fields `changed_files`, `changed_count`, `impacted_symbols`, and `depth`; missing fields, tool errors, and valid empty arrays are distinguished explicitly.
- Codebase Memory supplies impact evidence, not a risk classification. Supergraph derives risk from impacted-symbol count, validated hub/bridge recipes, and cycle findings.
TDD:
- Behavior: invalid or schema-incompatible canonical recipes fail migration validation.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: executes canonical recipes against deterministic fixture
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section recipes`
- Expected RED failure: fixture and recipe runner are absent.
- Minimal GREEN change: add fixture, index command, schema assertion, recipe loop, JSON parsing, and empty-result checks.
- Refactor candidates: store recipe names and Cypher in one machine-readable shell table mirrored by the contract.
- Mocking: none; real pinned Codebase Memory CLI required
Steps:
1. RED: add recipe section and run it without fixture/query definitions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section recipes`
   Expected: FAIL
2. GREEN: add deterministic git fixture; execute index, index-status, detect-changes, schema, and every canonical query successfully.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section recipes`
   Expected: PASS
3. REFACTOR: isolate CLI JSON parsing and preserve command stderr on failure.
4. VERIFY:
   - `bash -n plugins/supergraph/tests/fixtures/codebase-memory/app.sh plugins/supergraph/tests/fixtures/codebase-memory/app_test.sh`
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section recipes`
Checkpoint:
- Files: `plugins/supergraph/tests/fixtures/codebase-memory/app.sh plugins/supergraph/tests/fixtures/codebase-memory/app_test.sh plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `test: validate codebase memory query recipes`

## Task 4: Migrate Claude MCP configuration and permissions
Status: completed
Risk: medium
Dependencies: Task 2
Files:
- Modify: plugins/supergraph/.mcp.json
- Modify: plugins/supergraph/settings.json
- Modify: plugins/supergraph/.claude-plugin/plugin.json
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/scan/SKILL.md
- plugins/supergraph/SKILL.md
Acceptance:
- Claude JSON schemas configure server key and command `codebase-memory-mcp` with empty arguments and retain Serena unchanged.
- Settings permit the Codebase Memory namespace and contain no old provider permission glob.
- Claude metadata names Codebase Memory; JSON files parse successfully. Acceptance covers configuration correctness, not host process launch.
TDD:
- Behavior: Claude manifests and permissions resolve one correct provider configuration.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates Claude provider manifests and permissions
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section claude`
- Expected RED failure: manifests and permissions name the old provider.
- Minimal GREEN change: replace provider entries/keywords while preserving host schema and Serena.
- Refactor candidates: normalize JSON ordering.
- Mocking: none
Steps:
1. RED: add JSON-aware provider, args, permissions, keyword, and Serena-preservation assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section claude`
   Expected: FAIL
2. GREEN: update the three Claude configuration/metadata files.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section claude`
   Expected: PASS
3. REFACTOR: keep provider blocks structurally aligned.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section claude`
Checkpoint:
- Files: `plugins/supergraph/.mcp.json plugins/supergraph/settings.json plugins/supergraph/.claude-plugin/plugin.json plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: configure codebase memory for claude`

## Task 5: Migrate Codex and OpenCode MCP configuration
Status: completed
Risk: medium
Dependencies: Task 2
Files:
- Modify: plugins/supergraph/.codex-plugin/.mcp.json
- Modify: plugins/supergraph/.codex-plugin/plugin.json
- Modify: plugins/supergraph/.opencode-plugin/opencode.json
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/scan/SKILL.md
- plugins/supergraph/SKILL.md
Acceptance:
- Codex and OpenCode host-specific schemas configure `codebase-memory-mcp` with empty arguments and retain Serena unchanged.
- Metadata names Codebase Memory and every JSON file parses. Acceptance covers configuration correctness, not host process launch.
TDD:
- Behavior: Codex and OpenCode manifests resolve the same provider without schema drift.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates Codex and OpenCode provider manifests
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section codex-opencode`
- Expected RED failure: both manifests launch `code-review-graph serve`.
- Minimal GREEN change: replace provider entries/keywords while retaining each host's native JSON shape.
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: add provider, args, JSON, keyword, and Serena assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section codex-opencode`
   Expected: FAIL
2. GREEN: update the three host files.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section codex-opencode`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section codex-opencode`
Checkpoint:
- Files: `plugins/supergraph/.codex-plugin/.mcp.json plugins/supergraph/.codex-plugin/plugin.json plugins/supergraph/.opencode-plugin/opencode.json plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: configure codebase memory for codex and opencode`

## Task 6: Rebuild scan lifecycle around stable project identity
Status: completed
Risk: high
Dependencies: Task 3, Task 4, Task 5
Files:
- Modify: plugins/supergraph/skills/scan/SKILL.md
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/analyze/SKILL.md
- plugins/supergraph/skills/plan/SKILL.md
- plugins/supergraph/skills/fix/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- Scan uses `list_projects`, `index_status`, `index_repository`, `get_graph_schema`, and `get_architecture` with an absolute repo path and stable project name.
- `.supergraph-env` records `GRAPH_PROVIDER`, `CBM_PROJECT`, `CBM_INDEX_MODE`, `CBM_INDEXED_AT`, branch, detected commands, and reverified Serena state.
- Error, missing project, stale branch, and `status:"degraded"` paths are explicit; no false freshness state is written.
TDD:
- Behavior: downstream workflows receive a verified project-scoped graph context.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates Codebase Memory scan lifecycle
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section scan`
- Expected RED failure: scan calls old stats/index/minimal-context tools and lacks CBM fields.
- Minimal GREEN change: replace scan decision table and environment/report contract.
- Refactor candidates: link query detail to shared contract.
- Mocking: none
Steps:
1. RED: add lifecycle, absolute-path, degraded-state, reuse, and environment assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section scan`
   Expected: FAIL
2. GREEN: rewrite scan around Codebase Memory project status/indexing.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section scan`
   Expected: PASS
3. REFACTOR: remove duplicated contract prose.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section scan`
Checkpoint:
- Files: `plugins/supergraph/skills/scan/SKILL.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: migrate scan lifecycle to codebase memory`

## Task 7: Migrate analyze and plan workflows
Status: completed
Risk: high
Dependencies: Task 6
Files:
- Modify: plugins/supergraph/skills/analyze/SKILL.md
- Modify: plugins/supergraph/skills/plan/SKILL.md
- Modify: plugins/supergraph/agents/plan-writer.md
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/execute/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- Analyze and plan use project-scoped `detect_changes`, `search_graph`, `trace_path`, architecture context, and named contract recipes.
- Plan writer checks provider/project availability and reports exact install/index recovery commands.
- Existing >20-file, hub, bridge, boundary, and surprise/cross-boundary escalation semantics remain explicit.
TDD:
- Behavior: planning derives blast/risk evidence from Codebase Memory without inventing missing results.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates graph-informed analysis and planning
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section analyze-plan`
- Expected RED failure: files invoke removed convenience tools and omit `CBM_PROJECT`.
- Minimal GREEN change: translate calls to native tools and named recipes with explicit fallback.
- Refactor candidates: align risk-report vocabulary.
- Mocking: none
Steps:
1. RED: add provider, project-scope, native-tool, recipe, and escalation assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section analyze-plan`
   Expected: FAIL
2. GREEN: migrate analyze, plan, and plan-writer.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section analyze-plan`
   Expected: PASS
3. REFACTOR: remove duplicated recipe definitions.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section analyze-plan`
Checkpoint:
- Files: `plugins/supergraph/skills/analyze/SKILL.md plugins/supergraph/skills/plan/SKILL.md plugins/supergraph/agents/plan-writer.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: migrate graph planning workflows`

## Task 8: Migrate architecture orientation workflows
Status: completed
Risk: medium
Dependencies: Task 6
Files:
- Modify: plugins/supergraph/SKILL.md
- Modify: plugins/supergraph/skills/architecture/SKILL.md
- Modify: plugins/supergraph/skills/zoom-out/SKILL.md
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/analyze/SKILL.md
- plugins/supergraph/skills/plan/SKILL.md
Acceptance:
- Meta/architecture/zoom-out prompts use `get_architecture` overview, hotspots, boundaries, layers, and clusters plus named hub/bridge/gap recipes.
- Optional graph failures are labeled unavailable and fall back only to documented filesystem/Serena evidence.
TDD:
- Behavior: orientation workflows produce a Codebase Memory-backed module map or explicit fallback.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates architecture and zoom-out provider usage
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section architecture`
- Expected RED failure: three files use old overview/community/hub tools.
- Minimal GREEN change: replace calls with architecture aspects and contract recipes.
- Refactor candidates: share cluster terminology.
- Mocking: none
Steps:
1. RED: add architecture-aspect, recipe, project, and fallback assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section architecture`
   Expected: FAIL
2. GREEN: migrate meta, architecture, and zoom-out prompts.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section architecture`
   Expected: PASS
3. REFACTOR: align output labels.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section architecture`
Checkpoint:
- Files: `plugins/supergraph/SKILL.md plugins/supergraph/skills/architecture/SKILL.md plugins/supergraph/skills/zoom-out/SKILL.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: migrate architecture workflows`

## Task 9: Migrate execute and fix workflows
Status: completed
Risk: high
Dependencies: Task 6, Task 7
Files:
- Modify: plugins/supergraph/skills/execute/SKILL.md
- Modify: plugins/supergraph/skills/fix/SKILL.md
- Modify: plugins/supergraph/agents/executor.md
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/verify/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- Execute/fix explicitly call `index_status`; stale/degraded state triggers `index_repository` before graph checks.
- Diff impact, data flow, cycles, test gaps, complexity, and cross-boundary findings use native tools/validated recipes.
- Three-iteration fix limit and mandatory escalation remain unchanged.
TDD:
- Behavior: execution gates use fresh graph evidence after edits.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates execute and fix graph freshness
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section execute-fix`
- Expected RED failure: files call old update, surprise, gap, and refactor tools.
- Minimal GREEN change: migrate freshness and graph phases to contract primitives.
- Refactor candidates: standardize graph verdict output.
- Mocking: none
Steps:
1. RED: add freshness, reindex, recipe, and retry-limit assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section execute-fix`
   Expected: FAIL
2. GREEN: migrate execute, fix, and executor prompts.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section execute-fix`
   Expected: PASS
3. REFACTOR: centralize recovery wording.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section execute-fix`
Checkpoint:
- Files: `plugins/supergraph/skills/execute/SKILL.md plugins/supergraph/skills/fix/SKILL.md plugins/supergraph/agents/executor.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: migrate execution graph gates`

## Task 10: Migrate TDD, verify, and review gates
Status: completed
Risk: high
Dependencies: Task 9
Files:
- Modify: plugins/supergraph/skills/tdd/SKILL.md
- Modify: plugins/supergraph/skills/verify/SKILL.md
- Modify: plugins/supergraph/skills/review/SKILL.md
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/agents/code-reviewer.md
- plugins/supergraph/.github/workflows/graph-review.yml
Acceptance:
- Gates use fresh Codebase Memory index state, `detect_changes`, `trace_path`, and validated cycle/hub/bridge/test-gap recipes.
- Completion/review remains blocked by degraded index, new cycle, unapproved hub impact, missing required tests, or independent reviewer Critical findings.
TDD:
- Behavior: verification cannot claim success from stale or invalid graph evidence.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates final graph quality gates
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section verify-review`
- Expected RED failure: gate prompts use old provider tools and do not require CBM project/freshness.
- Minimal GREEN change: replace provider calls while retaining all blocking conditions.
- Refactor candidates: align PASS/WARNING/CRITICAL wording.
- Mocking: none
Steps:
1. RED: assert project, freshness, native impact/trace, validated recipes, and blocking conditions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section verify-review`
   Expected: FAIL
2. GREEN: migrate TDD, verify, and review prompts.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section verify-review`
   Expected: PASS
3. REFACTOR: remove obsolete surprise-tool vocabulary.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section verify-review`
Checkpoint:
- Files: `plugins/supergraph/skills/tdd/SKILL.md plugins/supergraph/skills/verify/SKILL.md plugins/supergraph/skills/review/SKILL.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: migrate verification graph gates`

## Task 11: Migrate database and integration skills
Status: pending
Risk: medium
Dependencies: Task 7, Task 10
Files:
- Modify: plugins/supergraph/skills/database-migrations/SKILL.md
- Modify: plugins/supergraph/skills/integration/SKILL.md
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/fix/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- Schema dependents/data flow use `trace_path` plus dependency recipes; integration uses affected call/data-flow paths.
- Existing >20-file schema escalation and integration coverage checks remain explicit.
TDD:
- Behavior: domain safety checks retain equivalent Codebase Memory evidence.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates database and integration graph checks
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section database-integration`
- Expected RED failure: skills invoke old impact/flow/hub/cycle/gap tools.
- Minimal GREEN change: translate each safety check to native trace/query recipes.
- Refactor candidates: reuse dependency and gap recipe names.
- Mocking: none
Steps:
1. RED: add per-skill capability and escalation assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section database-integration`
   Expected: FAIL
2. GREEN: migrate the two skills.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section database-integration`
   Expected: PASS
3. REFACTOR: remove duplicated Cypher.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section database-integration`
Checkpoint:
- Files: `plugins/supergraph/skills/database-migrations/SKILL.md plugins/supergraph/skills/integration/SKILL.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: migrate database graph checks`

## Task 12: Migrate diagnose and web testing skills
Status: pending
Risk: medium
Dependencies: Task 7, Task 10
Files:
- Modify: plugins/supergraph/skills/diagnose/SKILL.md
- Modify: plugins/supergraph/skills/webapp-testing/SKILL.md
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/fix/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- Diagnose uses `search_graph` then inbound/outbound `trace_path`; web testing uses changed routes/call/data-flow traces and test-gap recipes.
- Empty graph results trigger explicit filesystem/Serena fallback and never become fabricated callers/flows.
TDD:
- Behavior: diagnostic and web-test prioritization use native Codebase Memory traversal.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates diagnose and web testing graph paths
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section diagnose-web`
- Expected RED failure: both skills call old caller/flow/impact/gap tools.
- Minimal GREEN change: replace calls with search/trace/diff/query sequence.
- Refactor candidates: share empty-result fallback language.
- Mocking: none
Steps:
1. RED: add search-before-trace, project-scope, gap-recipe, and fallback assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section diagnose-web`
   Expected: FAIL
2. GREEN: migrate both skills.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section diagnose-web`
   Expected: PASS
3. REFACTOR: align flow terminology.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section diagnose-web`
Checkpoint:
- Files: `plugins/supergraph/skills/diagnose/SKILL.md plugins/supergraph/skills/webapp-testing/SKILL.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: migrate diagnostic graph traversal`

## Task 13: Replace graph refresh and pre-commit hooks
Status: pending
Risk: medium
Dependencies: Task 6, Task 9
Files:
- Modify: plugins/supergraph/hooks/post-tool-use
- Modify: plugins/supergraph/.githooks/pre-commit
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/fix/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- Post-tool hook relies exclusively on Codebase Memory `auto_watch=true`; it performs no synchronous reindex and prints no graph-fresh claim.
- Pre-commit runs the full migration validator and rejects active legacy references while honoring only the two documented historical exemptions.
- Both shell files pass `bash -n`; a PATH stub proves the post-tool hook never executes `code-review-graph` or `codebase-memory-mcp`.
TDD:
- Behavior: hooks cannot create write latency, false freshness, or legacy-provider calls.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates non-blocking auto-watch hook policy
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section hooks`
- Expected RED failure: post-tool hook invokes `code-review-graph update` and pre-commit lacks full migration validation.
- Minimal GREEN change: reduce post-tool hook to documented no-op/auto-watch behavior and add pre-commit validator call.
- Refactor candidates: delete unused TOOL_INPUT parsing if no other hook behavior remains.
- Mocking: temporary PATH stubs record executable invocation
Steps:
1. RED: add syntax, invocation-spy, pre-commit, and active-scope assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section hooks`
   Expected: FAIL
2. GREEN: update both hooks to the chosen auto-watch policy.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section hooks`
   Expected: PASS
3. REFACTOR: minimize no-op hook code.
4. VERIFY:
   - `bash -n plugins/supergraph/hooks/post-tool-use plugins/supergraph/.githooks/pre-commit`
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section hooks`
Checkpoint:
- Files: `plugins/supergraph/hooks/post-tool-use plugins/supergraph/.githooks/pre-commit plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `fix: replace legacy graph refresh hooks`

## Task 14: Replace pull-request graph review CI
Status: pending
Risk: high
Dependencies: Task 3, Task 10
Files:
- Modify: plugins/supergraph/.github/workflows/graph-review.yml
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/docs/TEAM-SETUP.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- CI installs exactly `codebase-memory-mcp==0.9.0`, indexes checkout as `supergraph-ci` in `fast` mode, and fails unless index JSON status equals `indexed`.
- CI runs `codebase-memory-mcp cli detect_changes` with JSON arguments `{"project":"supergraph-ci","since":"origin/${{ github.base_ref }}"}` and runs the contract cycle query through `query_graph`.
- CI calculates cycle count client-side with the same adjacency-list DFS (depth 8) over one-hop rows; it does not use unsupported variable-range union or Cypher path binding.
- CI fails when one-hop traversal reaches `100000` rows without complete pagination, preventing silent truncation.
- GitHub summary contains provider version, project name, index status, `changed_count`, impacted-symbol count, trace `depth`, and cycle count; nonzero cycle count fails the job.
- Workflow must not read nonexistent `risk`, `risk_level`, `risk_summary`, or `summary` fields from `detect_changes`; Supergraph derives risk from impact/hub/bridge/cycle evidence.
- Existing project test command remains strict; lint is no longer swallowed with `|| true`.
TDD:
- Behavior: PR graph review is reproducible and blocks degraded indexes/new cycles.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates pinned Codebase Memory CI workflow
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section ci`
- Expected RED failure: workflow installs/invokes old provider and lacks exact CBM commands/gates/summary fields.
- Minimal GREEN change: rewrite install, index, change detection, cycle, summary, and lint steps.
- Refactor candidates: define project/base JSON once in shell environment.
- Mocking: none
Steps:
1. RED: add exact YAML text/structure assertions for pinned version, arguments, status/cycle failures, summary fields, and strict lint.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section ci`
   Expected: FAIL
2. GREEN: migrate workflow to exact CLI commands and gates.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section ci`
   Expected: PASS
3. REFACTOR: make JSON quoting readable and safe.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section ci`
Checkpoint:
- Files: `plugins/supergraph/.github/workflows/graph-review.yml plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `ci: migrate graph review to codebase memory`

## Task 15: Update English setup and privacy documentation
Status: pending
Risk: medium
Dependencies: Task 6, Task 13, Task 14, Task 16
Files:
- Modify: .gitignore
- Modify: README.md
- Modify: PRIVACY.md
- Modify: plugins/supergraph/docs/TEAM-SETUP.md
- Modify: plugins/supergraph/.github/pull_request_template.md
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/.claude-plugin/marketplace.json
- README-VI.md
Acceptance:
- English install/setup requires Codebase Memory `>=0.9.0`, documents exact install/verification/index commands, and matches the migrated CI workflow.
- Privacy/persistence text describes local `~/.cache/codebase-memory-mcp` storage and optional `.codebase-memory/graph.db.zst`; ignore rules cover the chosen artifact policy.
- Pull-request template requests Codebase Memory graph evidence and contains no active legacy provider reference.
TDD:
- Behavior: English/team-facing setup and privacy guidance describe the migrated provider accurately.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates English Codebase Memory documentation
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section docs-en`
- Expected RED failure: English docs, privacy, setup, ignore rules, and PR template describe the old provider.
- Minimal GREEN change: update the five active English/setup/privacy files.
- Refactor candidates: deduplicate install verification snippets.
- Mocking: none
Steps:
1. RED: add exact version/install/storage/privacy/CI/template assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section docs-en`
   Expected: FAIL
2. GREEN: update English, setup, privacy, ignore, and template content.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section docs-en`
   Expected: PASS
3. REFACTOR: align repeated setup snippets.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section docs-en`
Checkpoint:
- Files: `.gitignore README.md PRIVACY.md plugins/supergraph/docs/TEAM-SETUP.md plugins/supergraph/.github/pull_request_template.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `docs: document codebase memory setup`

## Task 16: Migrate Gemini and generic plugin metadata
Status: pending
Risk: medium
Dependencies: Task 2
Files:
- Modify: plugins/supergraph/mcp_config.json
- Modify: plugins/supergraph/plugin.json
- Modify: plugins/supergraph/.claude-plugin/marketplace.json
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/scan/SKILL.md
- README.md
Acceptance:
- Gemini MCP config uses command `codebase-memory-mcp`, empty args, and unchanged Serena entry.
- Generic plugin and marketplace metadata use Codebase Memory keywords/descriptions and parse as JSON.
- Acceptance covers configuration correctness, not host launch.
TDD:
- Behavior: Gemini and generic marketplace metadata advertise the migrated provider.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates Gemini and generic provider metadata
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section gemini-metadata`
- Expected RED failure: config/metadata still name the old provider.
- Minimal GREEN change: update the three JSON files without changing Serena.
- Refactor candidates: align keywords with host-specific manifests.
- Mocking: none
Steps:
1. RED: add JSON provider, args, Serena, keyword, and description assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section gemini-metadata`
   Expected: FAIL
2. GREEN: update Gemini and generic metadata.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section gemini-metadata`
   Expected: PASS
3. REFACTOR: normalize keyword ordering.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section gemini-metadata`
Checkpoint:
- Files: `plugins/supergraph/mcp_config.json plugins/supergraph/plugin.json plugins/supergraph/.claude-plugin/marketplace.json plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: configure codebase memory metadata`

## Task 17: Migrate Flutter graph review skill
Status: pending
Risk: medium
Dependencies: Task 7, Task 10
Files:
- Modify: plugins/supergraph/skills/flutter-dart-code-review/SKILL.md
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/fix/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- Flutter hotspots, cycles, large functions, complexity, cross-layer coupling, and test gaps use validated project-scoped recipes.
- Existing Flutter thresholds and review categories remain unchanged.
TDD:
- Behavior: Flutter review retains equivalent Codebase Memory safety evidence.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates Flutter graph review recipes
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section flutter`
- Expected RED failure: skill invokes old large-function/hub/cycle/surprise/gap tools.
- Minimal GREEN change: replace calls with architecture hotspots and validated recipes.
- Refactor candidates: link recipe definitions to contract.
- Mocking: none
Steps:
1. RED: add provider, project, hotspot, cycle, complexity, coupling, and gap assertions.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section flutter`
   Expected: FAIL
2. GREEN: migrate the Flutter review skill.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section flutter`
   Expected: PASS
3. REFACTOR: remove duplicated Cypher.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section flutter`
Checkpoint:
- Files: `plugins/supergraph/skills/flutter-dart-code-review/SKILL.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `feat: migrate flutter graph review`

## Task 18: Update Vietnamese Markdown and HTML documentation
Status: pending
Risk: low
Dependencies: Task 15
Files:
- Modify: README-VI.md
- Modify: README-VI.html
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- README.md
- PRIVACY.md
Acceptance:
- Vietnamese Markdown matches English provider version, install, indexing, persistence, and troubleshooting semantics.
- `README-VI.html` is manually synchronized from changed Vietnamese sections because the repository has no HTML generation command.
- Validator asserts matching version, executable, cache, and artifact markers in both files.
TDD:
- Behavior: Vietnamese Markdown and HTML expose the same migrated setup.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates synchronized Vietnamese documentation
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section docs-vi`
- Expected RED failure: both Vietnamese files describe the old provider.
- Minimal GREEN change: update Markdown, then manually mirror changed sections in HTML.
- Refactor candidates: preserve existing HTML structure/classes.
- Mocking: none
Steps:
1. RED: add matching provider/version/storage marker assertions for both files.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section docs-vi`
   Expected: FAIL
2. GREEN: update and synchronize Vietnamese Markdown/HTML.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section docs-vi`
   Expected: PASS
3. REFACTOR: align translated heading order with English README.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh --section docs-vi`
Checkpoint:
- Files: `README-VI.md README-VI.html plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `docs: update vietnamese codebase memory guide`

## Task 19: Record migration and enforce final active scope
Status: pending
Risk: medium
Dependencies: Task 4, Task 5, Task 6, Task 8, Task 11, Task 12, Task 13, Task 14, Task 15, Task 16, Task 17, Task 18
Files:
- Modify: plugins/supergraph/CHANGELOG.md
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- All 36 active migration files
Acceptance:
- Changelog adds a new migration entry without modifying historical release entries.
- Full validator checks every active file and exempts only historical plans plus pre-existing changelog history.
- Full validator and exact active-scope `rg` report no legacy executable, namespace, permission glob, cache path, or metadata keyword.
TDD:
- Behavior: migration cannot finish with any active legacy provider dependency.
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: validates complete active migration scope
- RED command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Expected RED failure: changelog migration marker/final enforcement is not enabled and any remaining active legacy reference is reported.
- Minimal GREEN change: add changelog entry, enable final scope assertions, and remove residual active references.
- Refactor candidates: sort final diagnostics by file and line.
- Mocking: none
Steps:
1. RED: enable final validator and verify it reports changelog/residual migration gaps.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
   Expected: FAIL
2. GREEN: add migration entry and resolve every active-scope failure.
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
   Expected: PASS
3. REFACTOR: simplify exemptions without broadening them.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
   - `rg -n 'code-review-graph|code_review_graph|mcp__code-review-graph|mcp__code_review_graph|\.code-review-graph' . --hidden --glob '!.git/**' --glob '!docs/supergraph/plans/**' --glob '!plugins/supergraph/CHANGELOG.md'`
Checkpoint:
- Files: `plugins/supergraph/CHANGELOG.md plugins/supergraph/tests/test-codebase-memory-migration.sh`
- Commit: `chore: complete codebase memory migration`

## Environment Context
- **Language:** Markdown, Bash, JSON, YAML
- **Existing test command from `.supergraph-env`:** none
- **Existing linter command from `.supergraph-env`:** none
- **Existing formatter command from `.supergraph-env`:** none
- **Existing build command from `.supergraph-env`:** none
- **Planned migration validation command:** `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
- **Planned shell lint command:** `bash -n plugins/supergraph/tests/test-codebase-memory-migration.sh plugins/supergraph/hooks/post-tool-use plugins/supergraph/.githooks/pre-commit`
- **Branch:** master; Task 1 blocks implementation until explicit approval creates `feat/codebase-memory-migration`
- **Conventional commit style:** `feat:`, `fix:`, `docs:`, `test:`, `ci:`

**Codebase conventions:** workflow behavior is Markdown `SKILL.md` with YAML frontmatter; host manifests have distinct JSON shapes; hooks use Bash strict mode; graph failures block mandatory gates or are explicitly marked unavailable only in optional orientation flows; Serena remains a separate optional symbol/type provider.

**Graph Context:**
- Blast radius: 36 active existing files plus contract/validator/fixture files; user approved scope above the 20-file escalation threshold.
- Co-change hotspots: `skills/fix/SKILL.md`, `skills/review/SKILL.md`, `skills/tdd/SKILL.md`, `skills/database-migrations/SKILL.md`, `skills/webapp-testing/SKILL.md`.
- Bridge nodes: host manifests, `skills/scan/SKILL.md`, shared graph contract, validator.
- Communities crossed: host configuration, core workflows, specialized workflows, agents/hooks, CI, documentation.
- Evidence: Codebase Memory moderate index `supergraph` produced 830 nodes/853 edges. Repository graph is Markdown/Bash-heavy; executable contract tests supplement sparse application-call relationships.
