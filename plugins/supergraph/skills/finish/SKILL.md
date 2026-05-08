---
name: supergraph-finish
description: Hoàn thành development — merge, PR, hoặc discard. Tự động kích hoạt khi implementation complete.
autoTrigger: completion
---

# Skill: Finish

> Auto-trigger: Khi implementation hoàn tất.

## Purpose

Guide completion với clear options: merge, PR, keep, hoặc discard.

## Steps

### 1. Verify Tests

Verify tests pass trước khi present options:

```bash
# Based on detected language
# Node.js: npm test | Flutter: flutter test | PHP: vendor/bin/phpunit
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing.
Cannot proceed until tests pass.
```

Stop. Don't proceed.

### 2. Detect Environment

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

| State | Menu | Cleanup |
|-------|------|---------|
| Normal repo | 4 options | None |
| Named worktree | 4 options | Provenance-based |
| Detached HEAD | 3 options (no merge) | None |

### 3. Present Options

**4 options:**
```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is
4. Discard this work

Which option?
```

**Detached HEAD — 3 options** (no merge):

```
Implementation complete. You're on a detached HEAD.

1. Push as new branch and create a Pull Request
2. Keep as-is
3. Discard this work

Which option?
```

### 4. Execute Choice

**Option 1: Merge Locally**
```bash
MAIN_ROOT=$(git -C "$(git rev-parse --git-common-dir)/.." rev-parse --show-toplevel)
cd "$MAIN_ROOT"
git checkout <base-branch> && git pull && git merge <feature-branch>
# Verify tests on merged result
# Cleanup worktree, then delete branch
git branch -d <feature-branch>
```

**Option 2: Push and Create PR**
```bash
git push -u origin <feature-branch>
gh pr create --title "<title>" --body "## Summary\n<bullets>\n## Test Plan\n- [ ] verify"
```
**Do NOT cleanup worktree** — user cần it for PR iteration.

**Option 3: Keep As-Is**
Report: "Keeping branch <name>. Worktree preserved."

**Option 4: Discard**
**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits
- Worktree at <path>

Type 'discard' to confirm.
```
Then: git branch -D <feature-branch>

### 5. Cleanup

Chỉ cho Options 1 và 4:

```bash
# If worktree under .worktrees/ or ~/.config/superpowers/worktrees/
git worktree remove "$WORKTREE_PATH"
git worktree prune
```

## Quick Reference

| Option | Merge | Push | Keep | Cleanup |
|--------|-------|------|------|---------|
| 1. Merge | ✓ | - | - | ✓ |
| 2. PR | - | ✓ | ✓ | - |
| 3. Keep | - | - | ✓ | - |
| 4. Discard | - | - | - | ✓ (force) |

## Red Flags

**Never:**
- Proceed với failing tests
- Merge without verify tests
- Delete without confirmation
- Remove worktree before confirming merge success

**Always:**
- Verify tests trước options
- Detect environment trước menu
- Get typed confirmation for discard