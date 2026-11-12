# Mobile runtime repair

## Architecture & Contracts
Preserve mobile-agent public name and separate WDA/UiAutomator2 MCP tools. Android source accepts native XML; refs remain usable after delta, removed refs cannot target another node. Do not claim real-device readiness from synthetic tests. No remote push authorized this turn.

## Environment Context
Node ESM; test: npm test. Syntax: node --check for changed JS; bash -n for changed shell. Base master cb88ce2. Graph indexed Users-trantandat-GIC-Freelancer-supergraph; graph symbol query unavailable due query/semantic_query argument conflict. Serena bash server only. User approved repair after deterministic XML and delta reproductions.

## Task 1: Native snapshot parsing
Wave: 1
Status: in_progress
Risk: medium
Dependencies: none
Files:
- Modify: plugins/supergraph/src/uiautomator2/parser.js
- Modify: plugins/supergraph/src/wda/parser.js
- Create: plugins/supergraph/tests/test-mobile-parser-regressions.mjs
Acceptance: XML parsed; unchanged delta keeps refs; mutation/removal tracked.
TDD: node --test plugins/supergraph/tests/test-mobile-parser-regressions.mjs; demonstrate behavioral RED before GREEN.
Steps: RED; minimal GREEN; npm test; scoped commit.
Checkpoint: fix/mobile-parser in /tmp/supergraph-mobile-parser.

## Task 2: Runtime driver contracts
Wave: 1
Status: in_progress
Risk: medium
Dependencies: none
Files:
- Modify: plugins/supergraph/src/wda/client.js
- Modify: plugins/supergraph/src/wda/mcp-server.js
- Modify: plugins/supergraph/src/uiautomator2/client.js
- Modify: plugins/supergraph/src/uiautomator2/mcp-server.js
- Create: plugins/supergraph/tests/test-mobile-runtime-regressions.mjs
Acceptance: proven route/payload/fill/lifecycle/session failures fixed using upstream source evidence.
TDD: node --test plugins/supergraph/tests/test-mobile-runtime-regressions.mjs; RED before GREEN.
Steps: inspect upstream; RED; minimal GREEN; npm test; scoped commit.
Checkpoint: fix/mobile-runtime in /tmp/supergraph-mobile-runtime.

## Task 3: Honest setup and verification
Wave: 2
Status: pending
Risk: low
Dependencies: Task 1, Task 2
Files:
- Modify: plugins/supergraph/skills/mobile-agent/SKILL.md
Acceptance: remove unmeasured performance claims, exact parameters, prerequisites, missing-MCP fallback and no unsupported concurrency claims.
TDD: documentation review against runtime schemas; run npm test.
Steps: review diffs; update skill; full tests; independent review; report physical-device verification separately.
Checkpoint: no push.

## Execution deviation
Supergraph Team initialized and two DAG tasks registered. sg_task_claim failed because server is rooted /Users/trantandat/GIC (not Git repository), leaving claimed tasks without worktrees. Lead explicitly authorized git-created isolated worktrees above. Workers must not submit/merge using broken server root. Lead reviews and integrates verified commits. No shared source write sets overlap.

## Verification log
- Integrated parser ec598c3 and runtime 546e8ef on fix/mobile-agent-integration, not master.
- Added two shared parser helpers within Task 1 scope.
- Expanded Task 3 to three DSH cordis bundle registrations, mobile registration regression and plugin AGENTS/CLAUDE routing (18 changed files total).
- Registration RED: 3 failed; GREEN: 3 passed.
- Integrated serial full suite: 89 tests passed, 0 failed; syntax checks and git diff --check passed.
- Parallel suite has intermittent unrelated browser MCP initialize deadline; serial runner used without weakening tests.
- Device E2E BLOCKED: neither localhost:8100/status nor localhost:6790/status reachable; adb and idevice_id unavailable. No physical-device operation claimed.
- Installed DSH mobile skill points to ~/.local/share/supergraph, not this checkout; repair is not deployed to the active host yet.
- Cross-review found duplicate-ID stale-handle retargeting; follow-up b05bc97 invalidates ambiguous handles. RED 6 failures before fix; full integrated serial suite now 95 passed, 0 failed.
- Runtime independent cross-review: no Critical/Important new findings; parser follow-up independent re-review: PASS and original wrong-target reproduction passes.
- Setup/config review remains limited to lead inspection plus 3 registration regressions; no loaded-host deployment verification. No remote push.
