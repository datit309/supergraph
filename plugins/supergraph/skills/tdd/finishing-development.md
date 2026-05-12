# Finishing Development Guide

Use at the end of TDD work before claiming completion or taking branch actions.

## Principle

Do not call work complete without fresh verification evidence and a clear user decision for branch actions.

## When to Apply

Apply after:

- TDD behavior completed
- `/supergraph:verify` passes
- `/supergraph:review` passes
- User asks to finish, commit, push, or PR

## Workflow

1. Verify fresh evidence:
   - tests pass
   - lint clean
   - build succeeds or skipped with reason
   - review verdict PASS
   - plan tasks completed or documented

2. Check git state:
   - `git status --porcelain`
   - `git diff --stat`
   - `git log --oneline -5`

3. Check plan status if plan exists:
   - no `Status: in_progress`
   - no unresolved `Status: stuck` unless user accepted
   - `## Plan Review` Approved
   - review PASS

4. Present finish options:
   - Create commit only
   - Push branch
   - Create PR
   - Keep changes local
   - Discard changes (requires explicit confirmation)

5. Execute only user's chosen action.

## TDD Completion Gate

A TDD task can be finished only when:

- RED evidence exists
- GREEN evidence exists
- refactor verification passed or no refactor needed
- tests avoid anti-patterns
- `/supergraph:verify` confirms task completion
- `/supergraph:review` passes

## Rules

- Fresh verification before completion claims
- Never push or create PR without explicit user request
- Never discard without explicit confirmation
- Never use `git add -A`
- Never finish with failing tests/lint/review
- Always present options instead of assuming desired finish action
