---
name: supergraph
description: Meta-orchestrator — dispatches to the right skill for the task. Use before any non-trivial work.
mcp: code-review-graph
---

# supergraph

Dispatch to the right skill. 1% rule: if it *might* apply, invoke it.

## Priority

1. User CLAUDE.md / AGENTS.md (highest)
2. This skill set
3. Default system behavior

## Dispatch Table

| User intent | Skill to invoke |
|-------------|----------------|
| "start", "begin", unclear scope | `/supergraph:design` |
| "plan", "lên kế hoạch", explicit plan request | `/supergraph:plan` |
| "implement", "build", "execute" (plan saved) | `/supergraph:execute` |
| "fix bug", "debug", "why failing" | `/supergraph:fix` |
| "test", "TDD", "add tests" | `/supergraph:tdd` |
| "refactor", "clean up", "reorganize" | `/supergraph:plan` (then execute) |
| integration/e2e tests, after unit green | `/supergraph:integration` |
| "done?", "verify", before commit/PR | `/supergraph:verify` |
| "review", "merge", "PR", before merge | `/supergraph:review` |
| Need project context | `/supergraph:scan` |

## Adaptive Gate

- **< 10 lines, 1 file, no hub nodes** → use `/supergraph:tdd` directly
- **1-3 files, clear requirement** → `/supergraph:plan` with lightweight tasks
- **Multi-file, ambiguous, hub/bridge nodes** → `/supergraph:design` first, then plan

## User Instructions

"Add X" or "Fix Y" is the WHAT. Skills determine HOW. Never skip a skill because the task "feels simple."

## Red Flags (STOP if you catch yourself):

- "I'll just do it quickly" → pick a skill, follow it
- "I already know what to do" → skills evolve, load current one
- "This is too simple for a skill" → simple becomes complex fast

## Integration

All skills depend on `/supergraph:scan` being loaded first in the session.

## Subagent Guard

When dispatching subagents (executor, code-reviewer, plan-writer, plan-reviewer):
- Subagents get self-contained prompts — never session history
- Subagents do NOT trigger skills independently — this is the orchestrator's job
- Subagents report results back; orchestrator decides next step (fix, verify, review)
