---
name: supergraph-blast
description: Phân tích blast radius để xác định tác động của thay đổi. Tự động kích hoạt khi phân tích impact.
autoTrigger: impact_analysis
---

# Skill: Blast Radius

> Auto-trigger: When analyzing impact of changes.

## Purpose

Find exactly which files are affected by a change.

## Steps

### 1. Determine Target Files

- If specific files mentioned → use those
- If no specific files → `git diff --name-only`

### 2. Run Analysis

    mcp__code-review-graph__blast_radius(files=[targets], depth=3, direction="both")
    mcp__code-review-graph__blast_radius_visualize(files=[targets])

### 3. Enrich Results

For each file in result:

    mcp__code-review-graph__surprise_score(file=[file])
    mcp__code-review-graph__find_tests_for(file=[file])

Check hub status:

    mcp__code-review-graph__find_hub_nodes(threshold=5)

### 4. Present

    ## Blast Radius
    Input: [files]
    Affected (depth=3): [files with relationship]
    Hub nodes: [list or none]
    Surprise: [file: score] — flag > 0.5
    Tests: [file: yes/no]
    Risk:
    - Total: N
    - Hubs: N
    - Untested: N
    - High surprise: N
    - Level: [LOW | MEDIUM | HIGH]

### Rules

- ALWAYS use depth=3 unless told otherwise
- ALWAYS include direction="both"
- ALWAYS check surprise_score for each result
- ALWAYS flag untested files
