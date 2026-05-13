---
name: context
description: Load codebase graph context at session start. Run once per session. Other skills depend on this.
---

# Skill: Context

Load codebase graph context. Run once per session — other skills depend on this.

For ambiguous or non-trivial tasks, apply `skills/context/brainstorming.md` after loading graph context and before planning.

## Steps

### 0. Announce

Start by saying:

> "📡 /supergraph:context — loading codebase graph context..."

### 1. Detect Project

```bash
eval "$(bash bin/detect-project.sh)"
```

Store: `PROJECT_TYPE`, `TEST_CMD`, `LINT_CMD`, `FORMAT_CMD`, `BUILD_CMD`, `BRANCH`.

**Fallback (if `bin/detect-project.sh` missing):**

```bash
# Auto-detect by checking config files
[ -f package.json ] && PROJECT_TYPE=node && TEST_CMD="npm test" && LINT_CMD="npx eslint ." && FORMAT_CMD="npx prettier --write ." && BUILD_CMD="npm run build"
[ -f Cargo.toml ] && PROJECT_TYPE=rust && TEST_CMD="cargo test" && LINT_CMD="cargo clippy" && FORMAT_CMD="cargo fmt" && BUILD_CMD="cargo build"
[ -f pyproject.toml ] && PROJECT_TYPE=python && TEST_CMD="pytest" && LINT_CMD="ruff check ." && FORMAT_CMD="ruff format ." && BUILD_CMD="python -m build"
[ -f go.mod ] && PROJECT_TYPE=go && TEST_CMD="go test ./..." && LINT_CMD="golangci-lint run" && FORMAT_CMD="gofmt -w ." && BUILD_CMD="go build ./..."
[ -f Gemfile ] && PROJECT_TYPE=ruby && TEST_CMD="bundle exec rspec" && LINT_CMD="rubocop" && FORMAT_CMD="rubocop -A" && BUILD_CMD="bundle exec rake"
```

If none matched → ASK user for commands.

### 2. Verify Graph

```
mcp__code-review-graph__list_graph_stats_tool()
```

If fails → "Run `pip install code-review-graph && code-review-graph install && code-review-graph build`"

### 3. Load Context

Call minimal context first to stay token-efficient:

```
mcp__code-review-graph__get_minimal_context_tool()
mcp__code-review-graph__list_graph_stats_tool()
mcp__code-review-graph__list_communities_tool()
mcp__code-review-graph__get_hub_nodes_tool()
mcp__code-review-graph__get_bridge_nodes_tool()
mcp__code-review-graph__get_knowledge_gaps_tool()
mcp__code-review-graph__get_architecture_overview_tool()
mcp__code-review-graph__list_flows_tool()
mcp__code-review-graph__find_large_functions_tool()
```

### 4. Report Completion

```markdown
✅ /supergraph:context complete
- Project: $PROJECT_TYPE | Branch: $BRANCH
- Commands: test=$TEST_CMD | lint=$LINT_CMD | format=$FORMAT_CMD | build=$BUILD_CMD
- Graph: N files | N communities | N hub nodes | N bridge nodes
- Next: /supergraph:plan (non-trivial tasks) or /supergraph:tdd (small changes, 1-2 files)
```

### 5. Present

```
## Graph Context
- Type: $PROJECT_TYPE | Test: $TEST_CMD | Lint: $LINT_CMD
- Files: N | Communities: N
- Hub nodes: [list]
- Bridge nodes: [list]
- Knowledge gaps: [list]
```

## Output for Other Skills

After running context, these are available:

- `$PROJECT_TYPE` — language/framework
- `$TEST_CMD` — test command
- `$LINT_CMD` — linter command
- `$FORMAT_CMD` — formatter command
- `$BUILD_CMD` — build command
- `$BRANCH` — current git branch
- Graph data (hub nodes, bridge nodes, communities, knowledge gaps)

Other skills should reference "context from /supergraph:context" instead of re-loading.

## Rules

- Run once per session
- If fallback detection fails, ASK — don't guess
- Save detected commands to `.supergraph-env` for reuse
