# Team Setup Guide

## Quick Start (new member)

**Step 1 — In Claude Code chat:**
```
/plugin marketplace add https://github.com/datit309/supergraph.git
/plugin install supergraph
```

**Step 2 — In terminal:**
```bash
pip install codebase-memory-mcp==0.9.0
codebase-memory-mcp --version
codebase-memory-mcp cli index_repository --repo-path "$(pwd)" --name supergraph --mode moderate
uv tool install -p 3.13 serena-agent  # requires uv: brew install uv
```

**Step 3 — In Claude Code chat, open your project and run:**
```
/supergraph:scan
```
First run builds the graph automatically.

> Your team repo should already have `.mcp.json` and `CLAUDE.md` committed — if not, see the [README Team Setup](../../../../README.md#team-setup) for how to add them.

Claude Code auto-loads `.mcp.json` and `CLAUDE.md` from the repo root.

## What's in Git

| Path | In Git? | Reason |
|---|---|---|
| `.mcp.json` | ✅ Yes | MCP server config |
| `.codebase-memory/graph.db.zst` | Optional | Compressed bootstrap artifact; local indexes live in `~/.cache/codebase-memory-mcp` |
| `docs/supergraph/plans/` | ✅ Yes | Plans are contracts — team can see/track |
| `CLAUDE.md` | ✅ Yes | Project instructions |
| `.supergraph-env` | ⚠️ Optional | Personal flags (`CAVEMAN`, etc.) — gitignore if personal |
| `.claude/settings.local.json` | ❌ No | Personal overrides |

Add to `.gitignore`:
```
.claude/settings.local.json
.supergraph-env  # optional: remove this line if sharing env flags with team
```

## Team Conventions

### Commit Style

Use conventional commits:
```
feat: add user login
fix: resolve null pointer in auth
chore: update dependencies
test: add unit tests for auth module
refactor: extract auth service
docs: update API docs
```

### Branch Strategy

```
main          ← stable, always deployable
├── feature/* ← new features (from plan files)
├── fix/*     ← bug fixes
└── refactor/* ← refactoring tasks
```

### Plan Files

Plans go in `docs/supergraph/plans/`. Naming:
```
docs/supergraph/plans/2026-05-11-user-auth.md
```

Format: `YYYY-MM-DD-<feature-slug>.md`

Commit plan files — they serve as documentation and enable team coordination.

## CI/CD Integration

### GitHub Actions — Graph Review on PR

```yaml
# .github/workflows/graph-review.yml
name: Graph Review
on:
  pull_request:
    branches: [main]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install Codebase Memory
        run: pip install codebase-memory-mcp==0.9.0

      - name: Build graph
        run: codebase-memory-mcp cli index_repository '{"repo_path":".","name":"supergraph-ci","mode":"fast"}'

      - name: Detect changes
        run: |
          CHANGED=$(git diff --name-only origin/main...HEAD)
          echo "Changed files:"
          echo "$CHANGED"

      - name: Run graph analysis
        run: |
          codebase-memory-mcp cli detect_changes '{"project":"supergraph-ci","since":"origin/${{ github.base_ref }}"}'
          codebase-memory-mcp cli index_status '{"project":"supergraph-ci"}'

      - name: Check for cycles
        run: |
          # Fail if new circular dependencies introduced
          codebase-memory-mcp cli get_architecture '{"project":"supergraph-ci","aspects":["clusters"]}'
          sleep 2
          # Manual check or use MCP
          kill %1
```

### Pre-commit Hook (for non-Claude Code users)

```bash
# .githooks/pre-commit
#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Run tests
if [ -f "package.json" ]; then
    npm test || exit 1
    npm run lint || exit 1
elif [ -f "pyproject.toml" ]; then
    pytest || exit 1
    ruff check . || exit 1
elif [ -f "go.mod" ]; then
    go test ./... || exit 1
fi

echo "✅ Pre-commit checks passed"
```

```bash
# Setup
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

### PR Template

```markdown
<!-- .github/pull_request_template.md -->
## Changes

<!-- What changed and why -->

## Graph Impact

<!-- Auto-fill from graph-review CI output -->
- Blast radius: _N files_
- Hub nodes affected: _list_
- New cycles: _none / list_

## Checklist

- [ ] Tests pass
- [ ] Lint clean
- [ ] Blast radius reviewed
- [ ] No new circular dependencies
- [ ] Hub node changes justified
- [ ] Plan file updated (if applicable)
```

## Settings

### Shared (in git)

`settings.json` — team-wide defaults.

### Personal overrides

Create `.claude/settings.local.json` (gitignored):

```json
{
  "agent": "supergraph-executor"
}
```

## Multi-developer Coordination

### Graph conflicts

If optional `.codebase-memory/graph.db.zst` has merge conflicts:
```bash
codebase-memory-mcp cli index_repository --repo-path "$(pwd)" --name supergraph --mode moderate
```

### Plan conflicts

If two people edit the same plan file:
1. Communicate in plan file comments
2. Use separate task ownership
3. Rebuild graph after merge

### Graph freshness

The plugin auto-updates graph on file changes (PostToolUse hook). For team:
- Each member has local graph
- CI rebuilds graph on PR
- Local graph data remains in `~/.cache/codebase-memory-mcp`; share `.codebase-memory/graph.db.zst` only when the team chooses persistence.
