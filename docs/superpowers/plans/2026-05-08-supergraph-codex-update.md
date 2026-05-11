# supergraph-codex Plugin Update Plan

> **Goal:** Update supergraph-codex plugin to align with supergraph-claude structure and features

**Architecture:** The supergraph-codex plugin is the Codex variant that needs to be updated to match the newer supergraph-claude plugin structure, which has better agent definitions, skills, hooks, and tooling.

**Graph Context:**
- Files in plugin: ~30 files
- Blast radius: The entire plugin needs structural alignment
- Hub nodes affected: plugin.json, agents/, skills/
- Communities crossed: 3 (agents, skills, config)

---

## Task 1: Update plugin.json

**Files:**
- Modify: `plugins/supergraph-codex/.codex-plugin/plugin.json`

**Changes:**
- Add `minClaudeVersion: "1.0.0"`
- Add `agents` key pointing to agent files
- Move `skills` to root level (not nested under `interface`)
- Keep `hooks` reference

**Blast radius:** 1 file
**Risk:** Low

---

## Task 2: Update Agent Definitions

**Files:**
- Modify: `plugins/supergraph-codex/agents/planner.md`
- Modify: `plugins/supergraph-codex/agents/executor.md`

**Changes for planner.md:**
- Add `bin/detect-project.sh` usage for environment detection
- Use `get_impact_radius_tool` instead of `blast_radius`
- Add Environment Context mandatory section
- Add checkpoint report format

**Changes for executor.md:**
- Add Environment Context extraction (MANDATORY step)
- Use `get_impact_radius_tool`, `build_or_update_graph_tool`, `detect_changes_tool`
- Update to use exact tool names from MCP
- Add baseline verification step

**Blast radius:** 2 files
**Risk:** Medium

---

## Task 3: Update Skills with Better Structure

**Files:**
- Modify: `plugins/supergraph-codex/skills/sg-context/SKILL.md`
- Modify: `plugins/supergraph-codex/skills/sg-plan/SKILL.md`
- Modify: `plugins/supergraph-codex/skills/sg-tdd/SKILL.md`
- Modify: `plugins/supergraph-codex/skills/sg-fix/SKILL.md`
- Modify: `plugins/supergraph-codex/skills/sg-review/SKILL.md`
- Modify: `plugins/supergraph-codex/skills/sg-finish/SKILL.md`
- Modify: `plugins/supergraph-codex/skills/sg-blast/SKILL.md`
- Modify: `plugins/supergraph-codex/skills/sg-brainstorm/SKILL.md`
- Modify: `plugins/supergraph-codex/skills/sg-inspect/SKILL.md`
- Modify: `plugins/supergraph-codex/skills/sg-refactor/SKILL.md`
- Modify: `plugins/supergraph-codex/skills/sg-execute/SKILL.md`

**Key improvements to apply:**
- Each skill should have clear "When to read" / trigger condition
- Add mandatory workflow steps with exact commands
- Use MCP tool names consistently (get_impact_radius_tool, build_or_update_graph_tool, detect_changes_tool)
- Add checkpoint indicators
- Add escalation rules

**Blast radius:** 11 skill files
**Risk:** Medium

---

## Task 4: Add Missing Configuration Files

**Files:**
- Create: `plugins/supergraph-codex/.mcp.json` — MCP server config for code-review-graph
- Create: `plugins/supergraph-codex/settings.json` — Permissions allowlist
- Create: `plugins/supergraph-codex/hooks/hooks.json` — Updated hooks with PreToolUse, PostToolUse, Stop

**Content for .mcp.json:**
```json
{
  "mcpServers": {
    "code-review-graph": {
      "command": "code-review-graph",
      "args": ["serve"]
    }
  }
}
```

**Content for settings.json:** Permissions for all code-review-graph MCP tools and test/lint commands

**Blast radius:** 3 new files
**Risk:** Low

---

## Task 5: Add bin/detect-project.sh

**Files:**
- Create: `plugins/supergraph-codex/bin/detect-project.sh`

**Content:** Copy from supergraph-claude's detect-project.sh — detects Node.js, Flutter, PHP, Python, Go, Rust and sets TEST_CMD, LINT_CMD, FORMAT_CMD, BUILD_CMD

**Blast radius:** 1 new file
**Risk:** Low

---

## Task 6: Add .githooks/ and .github/

**Files:**
- Create: `plugins/supergraph-codex/.githooks/pre-commit` — Team pre-commit hook
- Create: `plugins/supergraph-codex/.github/workflows/` — CI workflow templates
- Create: `plugins/supergraph-codex/.github/pull_request_template.md`

**Blast radius:** ~3 files
**Risk:** Low

---

## Task 7: Update CLAUDE.md and README.md

**Files:**
- Modify: `plugins/supergraph-codex/README.md`
- Create: `plugins/supergraph-codex/CLAUDE.md` — Mandatory workflow rules

**Key content for CLAUDE.md:**
- List all skills with "When to read" table
- Mandatory workflow steps
- Hard rules (10 rules)
- Escalation table

**Blast radius:** 2 files
**Risk:** Low

---

## Task Dependencies

- Task 2 depends on: Task 1, Task 4, Task 5
- Task 3 depends on: Task 1, Task 4
- Task 4, 5, 6, 7 are independent and can run in parallel

---

## Verification

After all tasks:
1. Run `/reload-plugins` to verify plugin loads
2. Check `plugin marketplace list` shows supergraph-codex
3. Verify agents are registered: `supergraph-planner`, `supergraph-executor`
4. Verify skills are available: `/supergraph:sg-plan`, etc.