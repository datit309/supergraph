# SDD: Port upstream Superpowers v6.3 workflow safeguards
Date: 2026-09-16
Status: approved

## 1. Context & Scope

- **Problem Statement:** Upstream obra/superpowers v6.3 adds lifecycle safeguards that local Supergraph lacks: Codex hook isolation, durable per-plan review artifacts, scoped fix rounds, stronger test falsifiability, and task-sized brainstorming.
- **Goals:** Port those behaviors into the existing Supergraph skills without replacing the graph/MCP workflow or adding duplicate skills.
- **Non-Goals:** Add Devin/Hermes/Grok installers, add the upstream Codex portal packager, add a separate worktree-finishing skill, or rename the Supergraph version to upstream 6.3.0.

## 2. Component & Flow Architecture

~~~mermaid
sequenceDiagram
    autonumber
    actor User
    participant Analyze as /supergraph:analyze
    participant SDD as /supergraph:sdd
    participant Plan as /supergraph:plan
    participant Execute as /supergraph:execute
    participant Worker as executor agent
    participant Review as reviewer agent
    participant Fix as /supergraph:fix
    User->>Analyze: request change
    Analyze-->>User: spike/bounded/architectural classification
    User->>SDD: approve design for full-scope change
    SDD-->>Plan: Spec pointer
    Plan->>Execute: approved plan with Wave/Model
    Execute->>Worker: task brief + explicit model + report path
    Worker-->>Execute: report + TDD evidence
    Execute->>Review: review package for exact task diff
    Review-->>Execute: spec/quality verdict
    Execute->>Fix: open findings and prior report
    Fix-->>Worker: resume rounds 1-3; fresh stronger worker rounds 4-5
    Worker-->>Fix: appended fix report + covering tests
    Fix-->>Review: scoped re-review package
~~~

## 3. Interface & Data Contracts

### 3.1 Codex manifest contract

- plugins/supergraph/.codex-plugin/plugin.json must contain "hooks": {} exactly.
- plugins/supergraph/plugin.json keeps the Claude-compatible "./hooks.json" registration.
- Codex must discover skills and MCP without registering the Claude shell hook set.

### 3.2 Per-plan artifact contract

~~~text
.supergraph/sdd/<plan-basename>/
├── .gitignore              # contains '*'
├── task-N-brief.md         # extracted task section
├── task-N-report.md        # implementer report; fix reports append
├── review-<base>..<head>.diff
└── ledger.md               # rulings, rounds, completion
~~~

Scripts under plugins/supergraph/skills/execute/scripts/:

| Script | Contract |
|---|---|
| sdd-workspace PLAN_FILE | Print absolute plan-scoped artifact directory; create self-ignoring directory. |
| task-brief PLAN_FILE TASK_NUMBER [OUTFILE] | Extract the matching Task N section, excluding headings inside fenced code. Exit 3 when absent; OUTFILE is a filename inside the workspace. |
| review-package PLAN_FILE BASE HEAD [OUTFILE] | Write commit list, stat, and diff for one review range. Reject invalid plan/ref inputs; OUTFILE is a filename inside the workspace. |

Ledger invariants:

- Every conflict gets Ruling: <decision> — <why> — <cost if wrong>.
- Every fix round records round number, addressed/open findings, and commit range.
- Completion records the plan, commit range, review-clean state, or parked findings.

### 3.3 Test-writing contract

- Every behavior test names a production break it catches.
- Expected values derive from literals or independently hand-checked fixtures.
- Script/skill/config checks test observable behavior when feasible; static contract checks remain allowed for manifest/schema invariants.
- Mocks isolate slow/external boundaries and never become the asserted behavior.
- Each realistic mutation must be caught by at least one test.

### 3.4 Analyze classification contract

- spike: answer/probe only; no retained implementation.
- bounded: short in-chat design; explicit user approval before implementation.
- architectural: full design/spec approval before planning.
- Hidden complexity can upgrade the path; it cannot downgrade the required approval gate.

## 4. Platform Compatibility Matrix

| Feature | Claude Code | Antigravity | OpenCode | Codex |
|---|---|---|---|---|
| Skills | skills/ | installer + AGENTS.md | flat skills + JS plugin | native skills + AGENTS.md |
| Lifecycle hooks | hooks/hooks.json | best-effort installer hooks | .opencode-plugin/plugin.ts | no Claude hook registration |
| Plan artifacts | working-tree .supergraph/sdd/<plan>/ | same | same | same |
| Review transport | report/diff files | report/diff files | report/diff files | report/diff files |
| Missing optional runtime | non-blocking hook skip | fallback allow | plugin no-op | native skill fallback |

## 5. Failure Modes & Fallback Matrix

| Failure | Behavior | Recovery |
|---|---|---|
| Codex sees Claude hooks | Manifest test fails | Set Codex manifest hooks to {}; keep Claude manifest unchanged. |
| Plan file missing | Artifact script exits non-zero | Stop execution; request valid plan path. |
| Task heading missing | task-brief exits 3 | Stop task dispatch; repair plan. |
| Invalid git ref | review-package exits non-zero | Keep tree unchanged; provide valid BASE/HEAD. |
| Worker fix evidence missing | Re-review is not dispatched | Resume worker only after report has test, command, output. |
| Five fix rounds still open | Circuit breaker | Controller records ruling/parks or escalates load-bearing defect. |
| Existing baseline dependency failure | Preserve original failure | Report dependency failure; do not weaken unrelated tests. |

## 6. Architecture Decision Records

- **ADR-1: Keep platform manifests separate**
  - *Context:* Codex auto-discovery can register the Claude hook file when the Codex manifest omits or misstates hooks.
  - *Options:* Share hook registration; disable Codex hook registration; duplicate Codex-native hooks.
  - *Decision:* Disable Claude hook registration in Codex with exact hooks: {}; keep the existing Claude and OpenCode integrations.
  - *Trade-off:* Codex loses shell-hook lifecycle injection but avoids duplicate/invalid hook execution; skills remain native.

- **ADR-2: Store short-lived execution artifacts in the working tree**
  - *Context:* .git/ is protected on some harnesses and a global workspace mixes plans.
  - *Decision:* Use .supergraph/sdd/<plan-basename>/ with * ignore and lifecycle-controlled retention.
  - *Trade-off:* git clean -fdx can remove scratch artifacts; committed plan/checkpoint history remains authoritative.

- **ADR-3: Extend existing Supergraph skills instead of importing duplicate upstream names**
  - *Context:* Supergraph already has analyze, sdd, plan, execute, fix, tdd, and review with graph-specific contracts.
  - *Decision:* Add supporting scripts/reference and strengthen those skills in place.
  - *Trade-off:* Users keep /supergraph:* commands; upstream wording is adapted rather than byte-identical.
