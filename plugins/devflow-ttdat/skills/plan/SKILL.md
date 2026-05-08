---
name: devflow-plan
description: Tạo plan có thông tin graph trước khi viết code. Tự động kích hoạt trước khi implementation.
autoTrigger: pre_implementation
---

# Skill: Plan

> Auto-trigger: Before writing any code.

## Purpose

Never write code without a plan. Use blast_radius to know exact scope.

## Steps

### 1. Identify Likely Change Targets

Based on the task, determine which files will likely change.

### 2. Graph Analysis

    mcp__code-review-graph__blast_radius(files=[targets], depth=3, direction="both")
    mcp__code-review-graph__find_hub_nodes(threshold=5)
    mcp__code-review-graph__find_communities()
    mcp__code-review-graph__find_tests_for(files=[targets])
    mcp__code-review-graph__surprise_score(file=[targets])

### 3. Create Task Breakdown

Each task 2-5 minutes:

    ## Task N: [Description]
    - Files: [exact paths from blast_radius]
    - Blast radius: [files affected by this task]
    - Test: [specific test to write in RED phase]
    - Risk: [low | medium | high]
    - Verify: [how to confirm done]
    - Dependencies: [prerequisite tasks]

### 4. Validate Plan

- Every file in blast_radius covered by a task
- Hub modifications have review steps
- Cross-community changes justified
- Existing tests accounted for
- New tests planned
- Surprise-scored files have investigation tasks

### 5. Present Plan

    ## Plan: [Name]
    - Files in repo: N
    - Blast radius: M files
    - Hub nodes affected: [list]
    - Communities crossed: [list]
    - Token savings: reading M files instead of N

    ### Tasks
    [breakdown]

    ### Risks
    [list with mitigations]

### 6. Get Approval

NEVER start coding until user approves.
