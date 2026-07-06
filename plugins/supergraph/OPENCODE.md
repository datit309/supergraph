# Supergraph for OpenCode

Supergraph skills are installed as OpenCode skills. Use `/skills` and pick the skill name (`scan`, `analyze`, `plan`, `tdd`, `execute`, `fix`, `verify`, `review`, etc.). Do not use `/supergraph:*` slash commands in OpenCode.

## Mandatory workflow

1. Start every session with the `scan` skill.
2. For ambiguous work, use `analyze` before planning.
3. Before non-trivial code changes, use `plan`.
4. Implement through `tdd` or execute a saved plan with `execute`.
5. After coding, use `fix`.
6. Before claiming done, use `verify`.
7. Before merge, use `review`.

## Skill routing

| Need | OpenCode skill |
|---|---|
| Start session / load graph | `scan` |
| Ambiguous scope / risk analysis | `analyze` |
| Create implementation plan | `plan` |
| Implement one task with RED → GREEN → REFACTOR | `tdd` |
| Execute saved plan | `execute` |
| Auto-fix tests/lint/graph issues | `fix` |
| Integration/e2e checks | `integration` |
| Evidence gate before done | `verify` |
| Final independent review | `review` |
| Unknown bug cause | `diagnose` |
| Need module map | `zoom-out` |
| Architecture report | `architecture` |
| Requirements → PRD | `prd` |
| Issue triage | `triage` |
| Throwaway validation | `prototype` |
| Session compaction | `handoff` |
| Token compression style | `caveman` |

## Hard rules

- Never code without a plan unless the change is trivial (<10 lines, 1 file).
- Never implement without a verified failing test first.
- Never modify hub/bridge nodes without user approval.
- Never claim done without fresh verification evidence.
- Use graph MCP tools before assuming file relationships.
- Use Serena MCP tools when available for diagnostics and symbol impact.

## OpenCode limitations

OpenCode skills are invoked through `/skills`, not `/supergraph:*` slash commands. Bash hooks from Claude Code are not active on OpenCode; trigger workflow skills manually.
