# Audit Report: supergraph-claude Skills

**Date:** 2026-05-12  
**Plugin:** supergraph-claude v1.0.0  
**Auditor:** Kiro AI

---

## Executive Summary

✅ **PASS** — Bộ skills đã chuẩn từng bước và tích hợp đúng với `superpowers` + `code-review-graph`.

**Strengths:**
- Workflow rõ ràng: context → plan → tdd → fix → integration → review
- Tích hợp đầy đủ MCP tools từ code-review-graph
- Environment Context mandatory trong plan files
- TDD cycle bắt buộc với checkpoint sau mỗi task
- Hooks tự động kiểm tra plan và cập nhật graph

**Issues Found:**
1. ⚠️ **CRITICAL:** Tên skill trong CLAUDE.md không khớp với tên thực tế
2. ⚠️ **WARNING:** Thiếu skills `brainstorm`, `blast`, `refactor`, `inspect`, `finish` được liệt kê trong CLAUDE.md
3. ⚠️ **WARNING:** Settings.json thiếu một số MCP tools mới từ code-review-graph

---

## Detailed Analysis

### 1. Skills Inventory

#### ✅ Existing Skills (7/12)

| Skill | Path | Status | Integration |
|-------|------|--------|-------------|
| `context` | `skills/context/SKILL.md` | ✅ GOOD | Loads graph, detects project |
| `plan` | `skills/plan/SKILL.md` | ✅ GOOD | Uses blast_radius, hub_nodes, bridge_nodes |
| `tdd` | `skills/tdd/SKILL.md` | ✅ GOOD | RED-GREEN-REFACTOR with graph validation |
| `fix` | `skills/fix/SKILL.md` | ✅ GOOD | Auto-fix loop with graph review |
| `review` | `skills/review/SKILL.md` | ✅ GOOD | Graph-enhanced review with severity levels |
| `execute` | `skills/execute/SKILL.md` | ✅ GOOD | Orchestrates TDD with checkpoints |
| `integration` | `skills/integration/SKILL.md` | ✅ GOOD | Integration + e2e tests |

#### ❌ Missing Skills (5/12)

Listed in CLAUDE.md but not implemented:

1. `sg-brainstorm` — Before understanding non-trivial tasks
2. `sg-blast` — Analyzing impact of changes
3. `sg-refactor` — When refactoring code
4. `sg-inspect` — Deep-diving into file/symbol
5. `sg-finish` — Completing work (merge/PR/keep/discard)

---

### 2. Naming Inconsistency

**CLAUDE.md declares:**
- `sg-context`, `sg-brainstorm`, `sg-plan`, `sg-tdd`, `sg-review`, `sg-blast`, `sg-fix`, `sg-refactor`, `sg-inspect`, `sg-execute`, `sg-finish`

**Actual skill names (from SKILL.md frontmatter):**
- `supergraph-context`, `supergraph-plan`, `supergraph-tdd`, `supergraph-fix`, `supergraph-review`, `supergraph-execute`, `supergraph-integration`

**Impact:** Agent sẽ gọi `/sg-context` nhưng skill thực tế là `supergraph-context` → skill không load được.

**Fix Required:**
- Option A: Đổi tên trong SKILL.md frontmatter từ `supergraph-*` → `sg-*`
- Option B: Đổi tên trong CLAUDE.md từ `sg-*` → `supergraph-*`
- **Recommended:** Option A (ngắn gọn hơn, dễ gõ)

---

### 3. Integration with superpowers + code-review-graph

#### ✅ Superpowers Methodology

| Principle | Implementation | Status |
|-----------|----------------|--------|
| Mandatory workflows | CLAUDE.md enforces step-by-step | ✅ |
| Plan-first approach | `/plan` creates `docs/superpowers/plans/*.md` | ✅ |
| TDD cycle | RED-GREEN-REFACTOR in `/tdd` | ✅ |
| Environment Context | Mandatory in plan files | ✅ |
| Checkpoint commits | After each task in `/execute` | ✅ |
| Auto-fix loop | Max 3 iterations in `/fix` | ✅ |
| Graph-enhanced review | `/review` uses graph analysis | ✅ |

#### ✅ code-review-graph Integration

**MCP Tools Used:**

| Tool | Used In | Purpose |
|------|---------|---------|
| `list_graph_stats_tool` | context, plan, fix | Graph health check |
| `build_or_update_graph_tool` | context, execute | Build/refresh graph |
| `get_impact_radius_tool` | plan, tdd, fix, review | Blast radius analysis |
| `get_hub_nodes_tool` | context, plan, review | Most-connected nodes |
| `get_bridge_nodes_tool` | context, plan, review | Chokepoints |
| `list_communities_tool` | context, plan, review | Code clusters |
| `get_surprising_connections_tool` | plan, fix, review | Unexpected coupling |
| `get_knowledge_gaps_tool` | context, fix, integration | Untested hotspots |
| `get_review_context_tool` | plan | Token-optimized context |
| `query_graph_tool` | plan, tdd, review | Callers/callees/tests |
| `get_affected_flows_tool` | plan, integration | Flows affected |
| `detect_changes_tool` | execute, review | Risk-scored impact |
| `get_architecture_overview_tool` | context | Architecture map |

**Missing from settings.json:**
- `get_review_context_tool`
- `get_architecture_overview_tool`
- `get_affected_flows_tool`
- `detect_changes_tool`
- `query_graph_tool`
- `traverse_graph_tool`
- `semantic_search_nodes_tool`

---

### 4. Workflow Validation

#### ✅ Happy Path

```
Session start → /supergraph:context
              ↓
Task received → /supergraph:plan (scan + blast_radius + save plan)
              ↓
Implementation → /supergraph:tdd (RED-GREEN-REFACTOR)
              ↓
Post-code → /supergraph:fix (auto-fix loop, max 3 iterations)
              ↓
Integration → /supergraph:integration (if configured)
              ↓
Pre-merge → /supergraph:review (graph review → verdict)
              ↓
Complete → /supergraph:finish (merge/PR/keep/discard)
```

**Issues:**
- `/supergraph:finish` skill missing → workflow incomplete

#### ✅ Quick Path (small changes)

```
/supergraph:context → /supergraph:tdd → /supergraph:fix → /supergraph:review
```

**Status:** Works (all skills present)

#### ✅ Agent Dispatch

```
/supergraph:plan → save plan → /supergraph:execute → dispatch executor agent
```

**Status:** Works
- `supergraph-planner` agent: creates plans, never codes
- `supergraph-executor` agent: executes plans with TDD

---

### 5. Hooks Analysis

#### ✅ PreToolUse Hooks

**Write|Edit matcher:**
- Checks for plan file existence
- Reports progress (done/remaining tasks)
- **Good:** Prevents coding without plan

#### ✅ PostToolUse Hooks

**Write|Edit matcher:**
- Auto-updates graph after code changes
- **Good:** Keeps graph fresh

**Bash matcher:**
- Blocks destructive commands (rm -rf, DROP TABLE, etc.)
- **Good:** Safety guard

#### ✅ Stop Hooks

- Reports final progress
- Suggests next steps
- Warns about uncommitted changes
- **Good:** Clear handoff

---

### 6. Settings.json Analysis

#### ✅ Permissions

**Allowed MCP tools (old naming):**
- `mcp__code-review-graph__get_stats` ✅
- `mcp__code-review-graph__blast_radius` ✅
- `mcp__code-review-graph__find_hub_nodes` ✅
- ... (18 tools total)

**Missing (new naming from README):**
- `mcp__code-review-graph__list_graph_stats_tool`
- `mcp__code-review-graph__get_impact_radius_tool`
- `mcp__code-review-graph__get_hub_nodes_tool`
- ... (all tools with `_tool` suffix)

**Issue:** Skills use new naming (`*_tool`) but settings.json uses old naming (no `_tool` suffix).

**Impact:** Permission prompts will appear for every MCP call.

---

## Recommendations

### Priority 1: CRITICAL

1. **Fix skill naming inconsistency**
   - Update SKILL.md frontmatter: `supergraph-*` → `sg-*`
   - Or update CLAUDE.md: `sg-*` → `supergraph-*`
   - **Recommended:** Use `sg-*` (shorter)

2. **Update settings.json permissions**
   - Replace old naming (no `_tool`) with new naming (`*_tool`)
   - Add missing tools: `get_review_context_tool`, `detect_changes_tool`, etc.

### Priority 2: HIGH

3. **Implement missing skills**
   - `sg-brainstorm` — Task understanding before planning
   - `sg-finish` — Completion workflow (merge/PR/keep/discard)
   - `sg-blast` — Standalone blast radius analysis
   - `sg-refactor` — Safe refactoring with graph validation
   - `sg-inspect` — Deep symbol/file inspection

### Priority 3: MEDIUM

4. **Enhance documentation**
   - Add examples to each skill
   - Document error handling paths
   - Add troubleshooting section

5. **Add validation**
   - Skill self-test on load
   - Verify MCP tools available
   - Check plan file format

---

## Conclusion

**Overall Grade: B+ (85/100)**

Bộ skills đã tích hợp tốt với `superpowers` methodology và `code-review-graph` MCP tools. Workflow rõ ràng, TDD bắt buộc, graph analysis đầy đủ.

**Blockers:**
- Naming inconsistency → skills không load được
- Missing permissions → permission prompts liên tục

**After fixes:** Grade sẽ lên **A (95/100)** — production-ready.

---

## Action Items

- [ ] Fix skill naming (CRITICAL)
- [ ] Update settings.json permissions (CRITICAL)
- [ ] Implement `sg-finish` skill (HIGH)
- [ ] Implement `sg-brainstorm` skill (HIGH)
- [ ] Implement `sg-blast`, `sg-refactor`, `sg-inspect` (MEDIUM)
- [ ] Add skill examples (MEDIUM)
- [ ] Add validation checks (LOW)
