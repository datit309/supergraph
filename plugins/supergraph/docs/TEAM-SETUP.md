# Team Setup Guide

## Quick Start (new member)

```bash
# 1. Install code-review-graph
pip install code-review-graph

# 2. Clone repo and setup
git clone <repo-url>
cd <repo>
code-review-graph install
code-review-graph build

# 3. Verify
code-review-graph status
```

Claude Code will auto-load the plugin from `.claude-plugin/`.

## What's in Git

| Path | In Git? | Reason |
|---|---|---|
| `.claude-plugin/` | ✅ Yes | Plugin manifest + skills |
| `.mcp.json` | ✅ Yes | MCP server config |
| `.code-review-graph/` | ✅ Yes | Graph data (shared across team) |
| `docs/supergraph/plans/` | ✅ Yes | Plans are contracts — team can see/track |
| `CLAUDE.md` | ✅ Yes | Project instructions |
| `.claude/settings.local.json` | ❌ No | Personal overrides |

Add to `.gitignore`:
```
.claude/settings.local.json
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

      - name: Install code-review-graph
        run: pip install code-review-graph

      - name: Build graph
        run: code-review-graph build

      - name: Detect changes
        run: |
          CHANGED=$(git diff --name-only origin/main...HEAD)
          echo "Changed files:"
          echo "$CHANGED"

      - name: Run graph analysis
        run: |
          code-review-graph detect-changes
          code-review-graph status

      - name: Check for cycles
        run: |
          # Fail if new circular dependencies introduced
          code-review-graph serve --tools list_communities_tool &
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

If `.code-review-graph/` has merge conflicts:
```bash
code-review-graph build  # rebuild from scratch
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
- Commit graph data periodically: `code-review-graph build && git add .code-review-graph/`
