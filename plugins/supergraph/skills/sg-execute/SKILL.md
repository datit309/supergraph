---
name: supergraph:sg-execute
description: Thực thi plan đã lưu với checkpoint resume. Tự động kích hoạt khi cần execute plan.
autoTrigger: execution
---

# Skill: sg-execute

> Auto-trigger: When executing a saved plan.

## Purpose

Thực thi tasks từ plan file đã lưu với khả năng resume. Cho long-running work và team collaboration.

## Steps

### 1. Load Plan

Đọc plan file: `docs/superpowers/plans/<plan-name>.md`

Review:
- Verify task sequence và dependencies
- Note checkpoint intervals

Nếu có concerns → hỏi user trước khi bắt đầu.

### 2. Detect Resume Point

Kiểm tra completed tasks (checkboxes):

```bash
grep -n "^\- \[x\]" docs/superpowers/plans/<plan-name>.md
```

Nếu có incomplete plan:
- Hỏi user: "Resume từ Task N? Hay bắt đầu lại?"

### 3. Execute Tasks

Với mỗi incomplete task:

1. Mark as in_progress
2. Follow each step exactly như plan
3. Run verifications
4. Mark as completed
5. Update plan file (checkbox)
6. Git commit với checkpoint message

### 4. Complete

Sau khi all tasks complete:
- Run supergraph:finishing skill
- Verify all tests pass
- Present completion options

## Checkpoint Strategy

Save progress after each task:

```bash
git add -A && git commit -m "checkpoint: completed Task N"
```

Update plan checkboxes:
```markdown
- [x] Task N: [Name]
- [ ] Task N+1: [Name]
```

## Resume Protocol

Nếu session chết hoặc team member continue:

1. Read plan file
2. Find first unchecked task
3. Verify git status matches last checkpoint
4. Resume from that point

## Key Principles

- Follow plan steps exactly
- Don't skip verifications
- Save checkpoint after each task
- Stop when blocked, don't guess
- Never start on main branch without explicit consent