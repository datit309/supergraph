# Review Speed — tiered + parallel (A+B)

## Task 1: Tiered graph recipes in review
Status: completed
Risk: low
Dependencies: none
Files:
- Modify: plugins/supergraph/skills/review/SKILL.md
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- Micro (≤2 files, <20 lines, no hub/bridge) chỉ chạy `cycles` + `test-gaps` (0.04s), bỏ `hubs/bridges/complexity/cross-boundary`
- Standard (≤5 files, không cross-boundary) chạy `cycles/hubs/test-gaps` + `cross-boundary` optional
- Full (>5 files hoặc hub/bridge) chạy đủ 6 recipe
- `bash plugins/supergraph/tests/test-codebase-memory-migration.sh` PASS
TDD:
- Behavior: review chạy ít recipe hơn cho thay đổi nhỏ
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: tiered recipes
- RED command: `grep -c "Tiered" plugins/supergraph/skills/review/SKILL.md`
- Expected RED failure: 0 (chưa có tiered)
- Minimal GREEN change: thêm `### 3. Graph Analysis (tiered)` với if blast_radius
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: `grep -c Tiered plugins/supergraph/skills/review/SKILL.md` → 0
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
   Expected: FAIL (chưa tiered)
2. GREEN: edit review:36-47 thêm tiered logic: `if [ $(git diff --name-only BASE_SHA..HEAD | wc -l) -le 2 ]; then cycles+test-gaps else full`
   Command: `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
   Expected: PASS
3. REFACTOR: ensure `hubs/bridges` still present for Full tier
4. VERIFY:
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
   - `bash plugins/supergraph/tests/test-hook-contracts.sh`
Checkpoint:
- Files: `plugins/supergraph/skills/review/SKILL.md`
- Commit: `perf: tiered graph recipes for review`

## Task 2: Parallelize tests + code-reviewer in review
Status: completed
Risk: medium
Dependencies: Task 1
Files:
- Modify: plugins/supergraph/skills/review/SKILL.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- `review:41 Dispatch Code Reviewer` và `review:47 Verify Tests+Lint` chạy song song (spawn agent và `$TEST_CMD` cùng lúc), gộp ở `review:50 Classify`
- Wall-time Standard giảm ~6s (tests 6s song song reviewer 15s thay vì 21s tuần tự)
- `bash plugins/supergraph/tests/test-hook-contracts.sh` PASS
TDD:
- Behavior: tests và reviewer chạy song song
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: parallel review
- RED command: `grep -c "song song\|parallel" plugins/supergraph/skills/review/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: đổi `### 4. Dispatch` + `### 5. Verify` thành `### 4. Dispatch (parallel with tests)` và note `Run $TEST_CMD concurrently with Agent`
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: `grep -c parallel plugins/supergraph/skills/review/SKILL.md` → 0
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh`
   Expected: PASS (baseline)
2. GREEN: edit review:41-48 để mô tả parallel: `Spawn code-reviewer agent concurrently with $TEST_CMD/$LINT_CMD; collect both before Classify`
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh`
   Expected: PASS
3. REFACTOR: ensure `Critical` still blocks if either fails
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh`
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
Checkpoint:
- Files: `plugins/supergraph/skills/review/SKILL.md`
- Commit: `perf: parallelize review tests and code-reviewer`

## Task 3: Selective Serena + cache index for review
Status: completed
Risk: low
Dependencies: Task 2
Files:
- Modify: plugins/supergraph/skills/review/SKILL.md
- Modify: plugins/supergraph/skills/scan/SKILL.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/skills/review/SKILL.md
- plugins/supergraph/skills/scan/SKILL.md
Acceptance:
- Serena `review:49-58` chỉ `get_diagnostics_for_file` cho file hub/bridge hoặc complexity>10, bỏ `find_implementations` nếu không phải interface/abstract
- `review:37` reuse `CBM_INDEXED_AT` + `BASE_SHA` từ `.supergraph-env` nếu `git diff --name-only BASE_SHA..HEAD` rỗng, skip `index_repository`
- `bash plugins/supergraph/tests/test-hook-contracts.sh` PASS, `bash plugins/supergraph/tests/test-codebase-memory-migration.sh` PASS
TDD:
- Behavior: Serena và reindex chạy ít hơn cho thay đổi nhỏ
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: selective Serena
- RED command: `grep -c "chỉ.*hub/bridge" plugins/supergraph/skills/review/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: thêm note `Serena: only hub/bridge/complexity>10` và `Reindex: reuse if BASE_SHA unchanged`
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: `grep -c "hub/bridge" plugins/supergraph/skills/review/SKILL.md` → 1 (existing)
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh`
   Expected: PASS
2. GREEN: edit review:49-58 và review:37-39 để thêm selective logic
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh`
   Expected: PASS
3. REFACTOR: ensure `auto_watch=true` vẫn trong `hooks/post-tool-use`
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh`
   - `bash plugins/supergraph/tests/test-codebase-memory-migration.sh`
Checkpoint:
- Files: `plugins/supergraph/skills/review/SKILL.md plugins/supergraph/skills/scan/SKILL.md`
- Commit: `perf: selective Serena and cached reindex for review`

## Environment Context
- **Language:** Bash 3.2 + Markdown
- **Test command:** `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- **Linter command:** `bash -n plugins/supergraph/hooks/* plugins/supergraph/tests/test-*.sh`
- **Formatter command:** not configured
- **Build command:** not configured
- **Branch:** chore/review-speed
- **Conventional commit style:** `perf:`, `fix:`, `refactor:`

**Codebase conventions:** Hooks emit one JSON object; tests use `fail` helper; skills keep `## Task N:` headings and 8 fields.

**Graph Context:**
- Blast radius: 2 files | Hub nodes: none | Bridge nodes: none
- Communities crossed: none

## Analysis Decisions
- Approach: A+B tiered + parallel, giữ gate Critical, đo thực tế 979 nodes cho thấy graph 0.3s không phải bottleneck, LLM 30-60s và tests 6s mới là bottleneck
- Alternatives rejected: chỉ cache index (tiết kiệm 0.2s trên repo nhỏ), chỉ tiered recipes (tiết kiệm 0.08s) — không đủ; cần parallel để tiết kiệm 6s
