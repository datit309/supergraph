---
name: sg-brainstorm
description: Hiểu requirement với dữ liệu graph trước khi code. Tự động kích hoạt cho các task phức tạp.
autoTrigger: pre_task
---

# Skill: sg-brainstorm

> Auto-trigger: Before any non-trivial task.

## Purpose

Use graph data to ask informed questions instead of guessing.

## Steps

### 1. Load Context

    mcp__code-review-graph__get_stats()

### 2. Explore Based on Task Type

**Feature:**

    mcp__code-review-graph__find_symbol(name=[related_names])
    mcp__code-review-graph__find_callers(symbol=[related_symbols])
    mcp__code-review-graph__find_communities()

**Bug:**

    mcp__code-review-graph__blast_radius(files=[buggy_file], depth=2)
    mcp__code-review-graph__surprise_score(file=[buggy_file])
    mcp__code-review-graph__find_callers(symbol=[buggy_function])

**Refactor:**

    mcp__code-review-graph__find_communities()
    mcp__code-review-graph__find_hub_nodes(threshold=5)
    mcp__code-review-graph__find_cycles()

### 3. Ask Informed Questions

Use graph data:

- "This function is called by N files — backward compat needed?"
- "This file is a hub node — changes will ripple widely. Proceed?"
- "Graph shows tight coupling with module X — address that too?"
- "Existing circular dependencies found — fix those first?"

### 4. Summarize

- What you understand the requirement to be
- Blast radius estimate
- Risk assessment (hubs, communities, surprise scores)
- Blockers or concerns

### 5. Confirm

Get explicit user confirmation before proceeding.
NEVER skip for non-trivial tasks.
NEVER assume without asking.
