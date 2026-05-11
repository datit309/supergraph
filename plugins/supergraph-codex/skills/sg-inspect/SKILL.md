---
name: sg-inspect
description: Kiểm tra sâu file, symbol hoặc module sử dụng graph analysis.
autoTrigger: manual
---

# Skill: sg-inspect

> Trigger: When deep-diving into a file, symbol, or module.

## Purpose

Deep inspection of any code element using graph analysis.

## Steps

### If File Path

    mcp__code-review-graph__blast_radius(files=[target], depth=3)
    mcp__code-review-graph__find_dependencies(file=target)
    mcp__code-review-graph__find_dependents(file=target)
    mcp__code-review-graph__surprise_score(file=target)
    mcp__code-review-graph__find_tests_for(file=target)

### If Symbol Name

    mcp__code-review-graph__find_symbol(name=target)
    mcp__code-review-graph__find_callers(symbol=[found_symbol])
    mcp__code-review-graph__find_callees(symbol=[found_symbol])

### If Module

    mcp__code-review-graph__find_communities()
    mcp__code-review-graph__blast_radius(files=[community_files], depth=2)
    mcp__code-review-graph__find_bridge_nodes()

### Present

    ## Inspection: [target]
    - Type: [file | symbol | module]
    - Path: [location]
    - Language: [detected]
    - Depends on: [list]
    - Depended on by: [list]
    - Hub: [yes/no]
    - Bridge: [yes/no]
    - Surprise: [score]
    - In cycle: [yes/no]
    - Tests: [yes/no] — [list]
    - Callers: [list]
    - Callees: [list]
    - Community: [name]

## Escalation

| Condition                   | Action                   |
| --------------------------- | ------------------------ |
| Hub node detected          | Flag for review          |
| Cycle detected             | Flag as CRITICAL         |
| No tests found             | Flag as WARNING          |
| High surprise score        | REQUIRE investigation    |
