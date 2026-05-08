---
name: supergraph:sg-context
description: Load graph context của codebase lúc bắt đầu session. Tự động kích hoạt mỗi session.
autoTrigger: session_start
---

# Skill: sg-context

> Auto-trigger: Start of every session.

## Purpose

Load codebase graph context so every subsequent decision is data-informed.

## Steps

### 1. Detect Project Type

Check which file exists in project root:

- `pubspec.yaml` → Flutter/Dart, TEST=`flutter test`, LINT=`flutter analyze`
- `package.json` → Node.js, detect test runner from dependencies
- `composer.json` → PHP, detect from require-dev

### 2. Verify MCP Available

Call `mcp__code-review-graph__get_stats()`.
If MCP not available → inform user: "Run `pip install code-review-graph` and `code-review-graph index .` first"

### 3. Load Full Context

    mcp__code-review-graph__get_stats()
    mcp__code-review-graph__find_communities()
    mcp__code-review-graph__find_hub_nodes(threshold=5)
    mcp__code-review-graph__find_bridge_nodes()
    mcp__code-review-graph__find_cycles()
    mcp__code-review-graph__find_untested_files()

### 4. Present to User

    ## Supergraph Context
    - Type: [Node.js | Flutter | PHP]
    - Test: [command]
    - Lint: [command]
    - Files: N
    - Languages: [list]
    - Communities: N — [name]: [count] files
    - Hub nodes: [list]
    - Bridge nodes: [list]
    - Circular deps: [list or none]
    - Untested: N files

### 5. Re-index if Stale

    mcp__code-review-graph__index_incremental(directory=".")
