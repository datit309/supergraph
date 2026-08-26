# Subagent Trim — deduplicate executor/plan-writer/reviewer prompts

## Task 1: Trim executor re-parse
Status: completed
Risk: medium
Dependencies: none
Files:
- Modify: plugins/supergraph/agents/executor.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/agents/executor.md
Acceptance:
- Executor bỏ `1. Load Plan` + `2. Critical Review` + `3. Extract Environment Context` + `5. Branch Setup` + `6. Baseline` (orchestrator đã làm ở `execute:18-49`), chỉ giữ `7. Filter Tasks by Scope` → `8. Execute Tasks (TDD)` → `10. Final Verification`
- `wc -c executor.md` giảm >=30% (8904→~6200)
- `bash plugins/supergraph/tests/test-hook-contracts.sh` PASS
TDD:
- Behavior: executor assumes validated context, skips re-parse
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: executor lean
- RED command: `wc -c plugins/supergraph/agents/executor.md`
- Expected RED failure: 8904 (baseline)
- Minimal GREEN change: delete sections 1-6, keep Filter+Execute
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: `wc -c executor.md` → 8904
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh`
   Expected: PASS
2. GREEN: edit executor.md to remove redundant Load/Review/Context/Branch/Baseline
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh`
   Expected: PASS
3. REFACTOR: ensure `## Task N:` parsing still at column 0
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh`
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
Checkpoint:
- Files: `plugins/supergraph/agents/executor.md`
- Commit: `refactor: trim executor re-parse`

## Task 2: Shared prefix for parallel executors
Status: completed
Risk: low
Dependencies: Task 1
Files:
- Modify: plugins/supergraph/skills/execute/SKILL.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/skills/execute/SKILL.md
Acceptance:
- `execute:65` Parallel ghi rõ `Orchestrator sends Environment Context + shared rules once; each Agent receives only ## Task N snippet`
- Không đổi hành vi, chỉ docs
- Tests PASS
TDD:
- Behavior: parallel prompt is smaller
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: shared prefix
- RED command: `grep -c "shared" plugins/supergraph/skills/execute/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: add shared prefix note
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: `grep -c shared` → 0
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh`
   Expected: PASS
2. GREEN: edit execute:65 to add shared prefix sentence
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh`
Checkpoint:
- Files: `plugins/supergraph/skills/execute/SKILL.md`
- Commit: `docs: shared prefix for parallel executors`

## Task 3: Limit code-reviewer diff size
Status: completed
Risk: low
Dependencies: Task 2
Files:
- Modify: plugins/supergraph/skills/review/SKILL.md
- Modify: plugins/supergraph/agents/code-reviewer.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/skills/review/SKILL.md
- plugins/supergraph/agents/code-reviewer.md
Acceptance:
- `review:49` prompt ghi `git diff --stat full + git diff first 300 lines or get_code_snippet for hub files`, không ôm full diff
- `code-reviewer:24-28` note `If diff >300 lines, summarize via git diff --name-only + per-file snippet`
- Tests PASS
TDD:
- Behavior: reviewer prompt is bounded
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: bounded diff
- RED command: `grep -c "300 lines" plugins/supergraph/skills/review/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: add limit note
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: `grep -c "300"` → 0
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh`
   Expected: PASS
2. GREEN: edit review:49 and code-reviewer:24-28 to add limit
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh`
   Expected: PASS
3. REFACTOR: ensure `Critical` still references file:line
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh`
Checkpoint:
- Files: `plugins/supergraph/skills/review/SKILL.md plugins/supergraph/agents/code-reviewer.md`
- Commit: `perf: bound code-reviewer diff size`

## Task 4: Deduplicate plan-writer vs plan skill
Status: completed
Risk: low
Dependencies: Task 3
Files:
- Modify: plugins/supergraph/agents/plan-writer.md
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/agents/plan-writer.md
Acceptance:
- `plan-writer:12-47` thu gọn `Scan Codebase` + `Ensure Graph` + `Graph Analysis` thành `See skills/plan/SKILL.md: Steps 0-3` (giữ spec alignment + validate)
- `wc -c plan-writer.md` giảm >=30% (4904→~3400)
- `bash plugins/supergraph/tests/test-codebase-memory-migration.sh` PASS (vẫn chứa `CBM_PROJECT`, `codebase-memory-mcp`)
TDD:
- Behavior: plan-writer references plan skill as single source
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: plan-writer dedup
- RED command: `grep -c "See skills/plan" plugins/supergraph/agents/plan-writer.md`
- Expected RED failure: 0
- Minimal GREEN change: replace sections 1-4 with reference
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: `grep -c "See skills"` → 0
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
   Expected: PASS
2. GREEN: edit plan-writer.md to replace Scan/Graph sections with reference
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
   Expected: PASS
3. REFACTOR: keep `CBM_PROJECT` marker for test
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
Checkpoint:
- Files: `plugins/supergraph/agents/plan-writer.md`
- Commit: `refactor: deduplicate plan-writer to reference plan skill`

## Environment Context
- **Language:** Bash 3.2 + Markdown
- **Test command:** `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- **Linter command:** `bash -n plugins/supergraph/agents/*.md plugins/supergraph/skills/*.md`
- **Formatter command:** not configured
- **Build command:** not configured
- **Branch:** chore/subagent-trim
- **Conventional commit style:** `refactor:`, `perf:`, `docs:`

**Codebase conventions:** Agents use `## Task N:` headings, no indentation under fields, exact status values.

**Graph Context:**
- Blast radius: 4 files | Hub nodes: none | Bridge nodes: none

## Analysis Decisions
- Approach: trim executor re-parse + shared prefix + bounded diff + plan-writer dedup
- Alternatives rejected: removing subagents entirely breaks independent review gate; keeping full duplication wastes 5x tokens for parallel tasks
