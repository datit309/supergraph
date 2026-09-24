# Supergraph for DeepSeek Harness (DSH)

Supergraph skills are installed as native DSH skills via `@deepseek-ai/dsh-skill-filesystem`.

In DeepSeek Harness, skills are registered with their bare kebab-case names according to DSH specifications (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`).
Do **not** use the `/supergraph:*` prefix in DSH.

## Invoking Skills

- **Slash command**: Type `/scan`, `/plan`, `/tdd`, `/verify`, `/review`, `/fix`, `/execute`, `/diagnose`, etc.
- **Model tool call**: `skill(name="scan")`, `skill(name="plan")`, etc.

## Mandatory workflow

1. Start every session with `/scan` (or `skill(name="scan")`).
2. Run `/analyze` to assess ambiguity/risk and select approach — required before `/plan` (skip only for Micro: <20 lines, ≤2 files).
3. For architectural, data model, or API contract changes, draft `/sdd` before planning.
4. Create plan with `/plan` (graph-informed, plan-reviewer approval required).
5. Implement through `/tdd` or execute a saved plan with `/execute`.
6. After coding, use `/fix`.
7. Before claiming done, use `/verify`.
8. Before merge, use `/review`.

## Skill routing

| Need | DSH Command / Tool |
|---|---|
| Start session / load graph | `/scan` or `skill(name="scan")` |
| Ambiguous scope / risk analysis | `/analyze` or `skill(name="analyze")` |
| Software design & contracts | `/sdd` or `skill(name="sdd")` |
| Create implementation plan | `/plan` or `skill(name="plan")` |
| Implement one task with RED → GREEN → REFACTOR | `/tdd` or `skill(name="tdd")` |
| Execute saved plan | `/execute` or `skill(name="execute")` |
| Auto-fix tests/lint/graph issues | `/fix` or `skill(name="fix")` |
| Integration/e2e checks | `/integration` or `skill(name="integration")` |
| Evidence gate before done | `/verify` or `skill(name="verify")` |
| Final independent review | `/review` or `skill(name="review")` |
| Unknown bug cause | `/diagnose` or `skill(name="diagnose")` |
| Need module map | `/zoom-out` or `skill(name="zoom-out")` |
| Architecture report | `/architecture` or `skill(name="architecture")` |
| Requirements → PRD | `/prd` or `skill(name="prd")` |
| Issue triage | `/triage` or `skill(name="triage")` |
| Throwaway validation | `/prototype` or `skill(name="prototype")` |
| Session compaction | `/handoff` or `skill(name="handoff")` |
| Token compression style | `/caveman` or `skill(name="caveman")` |

## Installation & Bundle Architecture

Supergraph installs as a native Cordis Bundle via `dsh.bundle.patch` (`plugins/supergraph/cordis.patch.yml`):
- `supergraph-skills`: Mounts all 38 skills directly via `@deepseek-ai/dsh-skill-filesystem`.
- `mcp-codebase-memory`: Connects Codebase Memory MCP via `@deepseek-ai/dsh-mcp-client`.
- `mcp-serena`: Connects Serena MCP via `@deepseek-ai/dsh-mcp-client`.
- `preset-supergraph`: Declares the native `Supergraph Engineer` Agent Preset via `@deepseek-ai/dsh-agent-preset`, configured with token-optimized persona, graph-first workflow priority, plan mode, and strict tool-result pruning (`@deepseek-ai/dsh-compaction-tool-result-pruner`).
- Workflow rules are natively loaded from `AGENTS.md` by `@deepseek-ai/dsh-agent-instructions`.

## Agent Preset: Supergraph Engineer

Supergraph bundles a dedicated Agent Preset selectable in DSH Web GUI:
- **Preset ID**: `supergraph`
- **Name**: `Supergraph Engineer`
- **Focus**: Graph-first navigation (Codebase Memory + Serena), mandatory TDD, Plan Mode, subagent delegation, and strict log pruning to minimize token consumption.
- **Selection**: Select `Supergraph Engineer` from the preset dropdown in DSH Web session header, or configure it as default in Settings.
