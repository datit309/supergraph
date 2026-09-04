# Plan: Wave-based DAG Parallelism & Subagent Optimization
Review: Approved

## Task 1: Cập nhật plan skill và plan-reviewer agent với Wave & Model Tiering
Status: completed
Risk: low
Dependencies: none

Files:
- Modify: plugins/supergraph/skills/plan/SKILL.md
- Modify: plugins/supergraph/agents/plan-reviewer.md

Blast radius:
- plugins/supergraph/skills/plan/SKILL.md
- plugins/supergraph/agents/plan-reviewer.md

Acceptance:
- [ ] `plan/SKILL.md` định dạng task có trường `Wave: 1 | 2 | 3` và `Model: flash | inherit | pro (optional)`
- [ ] Hướng dẫn phân Wave: Wave 1 (foundations/contracts), Wave 2 (independent features, parallel), Wave 3 (UI/integration), Wave 4 (E2E/cleanup)
- [ ] `plan-reviewer.md` kiểm tra Wave assignments (tasks trong Wave N chỉ phụ thuộc Wave < N, tasks cùng Wave độc lập)

TDD:
- Behavior: plan template chứa trường Wave và Model
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: wave planning schema
- 🔴 RED command: `grep -c "^Wave:" plugins/supergraph/skills/plan/SKILL.md`
- Expected 🔴 RED failure: 0
- Minimal 🟢 GREEN change: thêm Wave và Model vào template task trong plan/SKILL.md và rules trong plan-reviewer.md
- Refactor candidates: none
- Mocking: none

Steps:
1. 🔴 RED: `grep -c "^Wave:" plugins/supergraph/skills/plan/SKILL.md` → 0
   Command: `grep -c "^Wave:" plugins/supergraph/skills/plan/SKILL.md`
   Expected: FAIL (0)
2. 🟢 GREEN: thêm Wave và Model hint vào `plan/SKILL.md` và `plan-reviewer.md`
   Command: `grep -c "^Wave:" plugins/supergraph/skills/plan/SKILL.md`
   Expected: PASS (>0)
3. REFACTOR: format sạch sẽ, nhất quán
4. VERIFY:
   - `grep "^Wave:" plugins/supergraph/skills/plan/SKILL.md`

Checkpoint:
- Files: `plugins/supergraph/skills/plan/SKILL.md plugins/supergraph/agents/plan-reviewer.md`
- Commit: `feat(plan): add Wave-based DAG field and Model tiering hint to task format`

## Task 2: Nâng cấp execute skill và executor agent thành Wave Scheduler
Status: completed
Risk: medium
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/skills/execute/SKILL.md
- Modify: plugins/supergraph/agents/executor.md

Blast radius:
- plugins/supergraph/skills/execute/SKILL.md
- plugins/supergraph/agents/executor.md

Acceptance:
- [ ] `execute/SKILL.md` thay thế rule nhị phân bằng Wave-by-Wave Dispatch Engine
- [ ] Hỗ trợ auto-grouping tasks thành Waves theo dependencies nếu plan không có trường Wave
- [ ] Chạy song song subagents trong cùng 1 Wave (hỗ trợ `Workspace: branch` để tránh conflict file / git index lock)
- [ ] Orchestrator đồng bộ và merge kết quả sau mỗi Wave trước khi sang Wave kế tiếp
- [ ] Giữ nguyên các marker bắt buộc: `detect_changes`, `trace_path`, `cycles`, `test-gaps`, `complexity`, `cross-boundary`, `max 3`
- [ ] `test-codebase-memory-migration.sh` execute_fix test PASS

TDD:
- Behavior: execute skill hỗ trợ Wave dispatch và giữ đầy đủ markers
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: execute-fix migration test
- 🔴 RED command: `grep -c "Wave-by-Wave" plugins/supergraph/skills/execute/SKILL.md`
- Expected 🔴 RED failure: 0
- Minimal 🟢 GREEN change: cập nhật execute/SKILL.md và executor.md với Wave execution
- Refactor candidates: none
- Mocking: none

Steps:
1. 🔴 RED: `grep -c "Wave-by-Wave" plugins/supergraph/skills/execute/SKILL.md` → 0
   Command: `grep -c "Wave-by-Wave" plugins/supergraph/skills/execute/SKILL.md`
   Expected: FAIL (0)
2. 🟢 GREEN: cập nhật `execute/SKILL.md` và `executor.md`
   Command: `grep -c "Wave-by-Wave" plugins/supergraph/skills/execute/SKILL.md`
   Expected: PASS (>0)
3. REFACTOR: kiểm tra bảo tồn đầy đủ 7 marker trong test-codebase-memory-migration.sh
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh execute-fix`

Checkpoint:
- Files: `plugins/supergraph/skills/execute/SKILL.md plugins/supergraph/agents/executor.md`
- Commit: `feat(execute): implement Wave-based DAG dispatch engine with workspace branch isolation`

## Environment Context
- **Language:** Bash 3.2 + Markdown + Python 3
- **Test command:** `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- **Linter command:** `bash -n plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh`
- **Formatter command:** not configured
- **Build command:** not configured
- **Branch:** master
- **Conventional commit style:** `feat:`, `docs:`, `refactor:`

**Codebase conventions:** Executor follows RED->GREEN->REFACTOR; execute skill maintains contract markers; subagent parallelization respects dependency graphs.

**Graph Context:**
- Blast radius: 4 files (2 skills + 2 agent definitions)
- Hub nodes: none
- Bridge nodes: none
- Communities crossed: none
