---
name: sg-plan
description: Tạo plan có thông tin graph trước khi viết code. Tự động kích hoạt trước khi implementation.
autoTrigger: pre_implementation
---

# Skill: sg-plan

> Auto-trigger: Before writing any code.

## Purpose

Never write code without a plan. Use blast_radius to know exact scope. Save plan to file for tracking and resume.

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

### 5.1 Self-Review

After writing the complete plan, review against the original requirement:

**1. Spec coverage:** Can you point to a task for each requirement? List any gaps.

**2. Placeholder scan:** Search for red flags:

- "TBD", "TODO", "implement later"
- "Add appropriate error handling" / "add validation"
- "Similar to Task N" (repeat code instead)
- Steps that describe without showing how

**3. Type consistency:** Do method signatures and names match across tasks?

If issues found → fix inline, don't re-review.

### 6. Get Approval

NEVER start coding until user approves.

### 7. Save Plan to File (after approval)

After user approves, save the plan to: `docs/superpowers/plans/YYYY-MM-DD-<feature-slug>.md`

**Superpowers-compatible format:**

````markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** Use checkbox (`- [ ]`) syntax for tracking progress.
> **Required sub-skill:** superpowers:subagent-driven-development (recommended) or superpowers:executing-plans

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Graph Context:**

- Files in repo: N
- Blast radius: M files
- Hub nodes affected: [list]
- Communities crossed: [list]

**Tech Stack:** [Key technologies/libraries]

---

### Task N: [Component Name]

**Files:**

- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```
````

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```

---

### Task Dependencies

- Task 2 depends on: Task 1
- Task 3 depends on: Task 2

### 8. Resume Detection

At session start, check for existing plan files:

    docs/superpowers/plans/*.md

If uncompleted plans exist → ask user:
"You have an incomplete plan: `{filename}`. Resume from Task N?"

### 9. Execution Handoff

After saving plan, offer execution choice:

**"Plan complete and saved. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks

**2. Inline Execution** — Execute tasks in this session using superpowers:executing-plans, batch with checkpoints

**Which approach?"**

## Key Principles

- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits
- Never write placeholders (TBD, TODO, "implement later")
