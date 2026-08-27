# Perf Skills — cache + parallel + dedup suite

## Task 1: Cache index_status TTL trong scan
Status: completed
Risk: low
Dependencies: none
Files:
- Modify: plugins/supergraph/skills/scan/SKILL.md
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/scan/SKILL.md
- plugins/supergraph/skills/plan/SKILL.md
- plugins/supergraph/skills/fix/SKILL.md
- plugins/supergraph/skills/verify/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- [ ] scan:33-42 ghi TTL 10 phút: nếu `CBM_INDEXED_AT` fresh và `BRANCH` không đổi và `status=ready` thì skip `index_repository`, chỉ `index_status` verify
- [ ] `degraded/stale/branch đổi/tool error` vẫn bắt buộc reindex, không cache sai
- [ ] `bash plugins/supergraph/tests/test-codebase-memory-migration.sh` PASS
TDD:
- Behavior: scan reuse index khi fresh
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: cached index reuse
- 🔴 RED command: `grep -c "TTL\|CBM_INDEXED_AT.*fresh" plugins/supergraph/skills/scan/SKILL.md`
- Expected 🔴 RED failure: 0 (chưa có TTL logic)
- Minimal 🟢 GREEN change: thêm đoạn `If now - CBM_INDEXED_AT < 600s and BRANCH == current and status==ready → skip index_repository` trong scan step 2
- Refactor candidates: none
- Mocking: none
Steps:
1. 🔴 RED: `grep -c "TTL" plugins/supergraph/skills/scan/SKILL.md` → 0
   Command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: FAIL (chưa TTL)
2. 🟢 GREEN: edit scan:33-42 thêm TTL cache logic + ghi `CBM_INDEXED_AT` vào `.supergraph-env` với timestamp ISO
   Command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: PASS
3. REFACTOR: đảm bảo `get_graph_schema` và `get_architecture` vẫn chạy sau fresh check
4. VERIFY:
   - `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   - `bash -n plugins/supergraph/skills/scan/SKILL.md 2>&1 | head -20`
Checkpoint:
- Files: `plugins/supergraph/skills/scan/SKILL.md`
- Commit: `perf: cache index_status TTL 10m in scan`

## Task 2: Song song hoá graph calls trong plan
Status: completed
Risk: low
Dependencies: Task 1
Files:
- Modify: plugins/supergraph/skills/plan/SKILL.md
- Test: plugins/supergraph/tests/test-codebase-memory-migration.sh
Blast radius:
- plugins/supergraph/skills/plan/SKILL.md
Acceptance:
- [ ] plan:32 ghi rõ `detect_changes, search_graph, trace_path(inbound/outbound/data-flow), get_architecture` chạy song song (Promise.all), chỉ `get_graph_schema` trước `hubs/bridges/test-gaps`
- [ ] Tiết kiệm ~1.5-2s so với tuần tự (chưa đo nhưng doc ghi rõ parallel)
- [ ] `bash plugins/supergraph/tests/test-codebase-memory-migration.sh` PASS
TDD:
- Behavior: plan chạy graph calls song song
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: parallel graph in plan
- 🔴 RED command: `grep -c "song song\|parallel" plugins/supergraph/skills/plan/SKILL.md`
- Expected 🔴 RED failure: 0 (chưa ghi parallel)
- Minimal 🟢 GREEN change: sửa plan step 3 thành `Run detect_changes + search_graph + trace_path inbound/outbound/data-flow + get_architecture in parallel; after get_graph_schema run hubs/bridges/test-gaps`
- Refactor candidates: none
- Mocking: none
Steps:
1. 🔴 RED: `grep -c "parallel" plugins/supergraph/skills/plan/SKILL.md` → 0
   Command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: FAIL
2. 🟢 GREEN: edit plan:32 thêm note parallel + giữ dependency schema→recipes
   Command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: PASS
3. REFACTOR: đảm bảo escalation `>20 files STOP` vẫn giữ
4. VERIFY:
   - `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   - `bash -n plugins/supergraph/skills/plan/SKILL.md 2>&1 | head -20`
Checkpoint:
- Files: `plugins/supergraph/skills/plan/SKILL.md`
- Commit: `perf: parallelize graph calls in plan`

## Task 3: Dedup suite giữa fix/verify/review
Status: completed
Risk: medium
Dependencies: Task 1
Files:
- Modify: plugins/supergraph/skills/fix/SKILL.md
- Modify: plugins/supergraph/skills/verify/SKILL.md
- Modify: plugins/supergraph/skills/review/SKILL.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/skills/fix/SKILL.md
- plugins/supergraph/skills/verify/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
- plugins/supergraph/skills/execute/SKILL.md
Acceptance:
- [ ] fix:41-46 ghi `nếu git diff --name-only HEAD và tests vừa PASS <2 phút trước thì verify reuse, ngược lại chạy lại` — vẫn đảm bảo `verify:103 Fresh only`
- [ ] verify:56 ghi `reuse chỉ khi HEAD_SHA và diff không đổi`, không bỏ fresh verification trước merge
- [ ] review:56 ghi `skip $TEST_CMD nếu verify vừa PASS` (reuse evidence <2p)
- [ ] `bash plugins/supergraph/tests/test-hook-contracts.sh` PASS
TDD:
- Behavior: dedup suite nhưng giữ fresh gate
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: dedup suite freshness
- 🔴 RED command: `grep -c "reuse.*PASS\|fresh.*reuse" plugins/supergraph/skills/verify/SKILL.md`
- Expected 🔴 RED failure: 0
- Minimal 🟢 GREEN change: thêm đoạn `Evidence reuse allowed only if HEAD_SHA unchanged and last PASS <120s else rerun $TEST_CMD` vào verify:56 và fix:41, review:56
- Refactor candidates: none
- Mocking: none
Steps:
1. 🔴 RED: `grep -c "reuse" plugins/supergraph/skills/verify/SKILL.md` → 0
   Command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: FAIL
2. 🟢 GREEN: edit 3 file thêm freshness reuse logic với điều kiện HEAD_SHA + 120s
   Command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: PASS
3. REFACTOR: đảm bảo `verify:103` Iron Law vẫn in đậm, không làm mờ fresh requirement
4. VERIFY:
   - `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   - `bash -n plugins/supergraph/skills/fix/SKILL.md plugins/supergraph/skills/verify/SKILL.md plugins/supergraph/skills/review/SKILL.md`
Checkpoint:
- Files: `plugins/supergraph/skills/fix/SKILL.md plugins/supergraph/skills/verify/SKILL.md plugins/supergraph/skills/review/SKILL.md`
- Commit: `perf: dedup suite with freshness guard`

## Task 4: Tối ưu flutter-ui scan sang rg
Status: completed
Risk: low
Dependencies: none
Files:
- Modify: plugins/supergraph/skills/flutter-ui/SKILL.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/skills/flutter-ui/SKILL.md
Acceptance:
- [ ] flutter-ui:26-29 thay 4 lần `find . | xargs grep -l` bằng 1 lần `rg --type dart "Color|TextStyle|EdgeInsets|ThemeData"` + fallback `search_graph`/`serena`
- [ ] Giữ STOP gate `registry empty → ask user` và `unmapped → STOP`
- [ ] `bash plugins/supergraph/tests/test-hook-contracts.sh` PASS
TDD:
- Behavior: scan token nhanh bằng rg
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: rg scan flutter-ui
- 🔴 RED command: `grep -c "rg --type dart\|ripgrep" plugins/supergraph/skills/flutter-ui/SKILL.md`
- Expected 🔴 RED failure: 0
- Minimal 🟢 GREEN change: thay block 4 find thành `rg --type dart -l "Color|TextStyle|EdgeInsets|ThemeData" | head -20` và note `prefer rg + search_graph over find|xargs grep`
- Refactor candidates: none
- Mocking: none
Steps:
1. 🔴 RED: `grep -c "rg --type dart" plugins/supergraph/skills/flutter-ui/SKILL.md` → 0
   Command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: FAIL
2. 🟢 GREEN: edit flutter-ui:26-39 thay find bằng rg, giữ grep -n extraction cho token registry
   Command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: PASS
3. REFACTOR: đảm bảo `grep -n "static.*Color"` vẫn chạy sau rg filter
4. VERIFY:
   - `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   - `bash -n plugins/supergraph/skills/flutter-ui/SKILL.md 2>&1 | head -20`
Checkpoint:
- Files: `plugins/supergraph/skills/flutter-ui/SKILL.md`
- Commit: `perf: use ripgrep for flutter-ui token scan`

## Task 5: Song song hoá with_server.py
Status: completed
Risk: low
Dependencies: none
Files:
- Modify: plugins/supergraph/skills/webapp-testing/scripts/with_server.py
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/skills/webapp-testing/scripts/with_server.py
Acceptance:
- [ ] with_server.py:64-82 khởi tất cả servers trước rồi poll tất cả ports trong 1 loop chung (timeout tổng 30s), không `start→wait` tuần tự
- [ ] Cleanup `terminate→wait(5)→kill` giữ nguyên cho từng process
- [ ] `bash plugins/supergraph/tests/test-hook-contracts.sh` PASS, `python3 -m py_compile plugins/supergraph/skills/webapp-testing/scripts/with_server.py` PASS
TDD:
- Behavior: servers khởi song song
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: parallel servers
- 🔴 RED command: `grep -c "Start all servers.*poll all\|poll.*all.*ports" plugins/supergraph/skills/webapp-testing/scripts/with_server.py`
- Expected 🔴 RED failure: 0
- Minimal 🟢 GREEN change: đổi for loop thành 2 phase: phase1 Popen all, phase2 poll all ports đến khi ready hoặc timeout tổng
- Refactor candidates: none
- Mocking: none
Steps:
1. 🔴 RED: `grep -c "poll all" plugins/supergraph/skills/webapp-testing/scripts/with_server.py` → 0
   Command: `python3 -m py_compile plugins/supergraph/skills/webapp-testing/scripts/with_server.py && for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: FAIL
2. 🟢 GREEN: edit with_server.py:64-82 thành `for server in servers: Popen` rồi `while not all ready and elapsed<timeout: poll each port` với `time.sleep(0.5)`
   Command: `python3 -m py_compile plugins/supergraph/skills/webapp-testing/scripts/with_server.py && for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: PASS
3. REFACTOR: đảm bảo `finally: terminate all` không đổi
4. VERIFY:
   - `python3 -m py_compile plugins/supergraph/skills/webapp-testing/scripts/with_server.py`
   - `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
Checkpoint:
- Files: `plugins/supergraph/skills/webapp-testing/scripts/with_server.py`
- Commit: `perf: parallelize with_server startup`

## Environment Context
- **Language:** Bash 3.2 + Markdown + Python 3
- **Test command:** `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- **Linter command:** `bash -n plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh`
- **Formatter command:** not configured
- **Build command:** not configured
- **Branch:** master
- **Conventional commit style:** `perf:`, `fix:`, `refactor:`

**Codebase conventions:** Hooks emit one JSON object; tests dùng `fail` helper; skills giữ `## Task N:` headings và 8 fields (Status,Risk,Dependencies,Files,Acceptance,TDD,Steps,Checkpoint); không `git add -A`.

**Graph Context:**
- Blast radius: 7 files (scan, plan, fix, verify, review, flutter-ui, with_server.py) | Hub nodes: none (docs skills) | Bridge nodes: none
- Communities crossed: none (chỉ docs/bash)
- Hotspots: 979 nodes / 1114 edges, architecture `overview/layers/boundaries/clusters/hotspots` đã load, `status=ready` (supergraph/master 0bc20bf)

## Analysis Decisions
- Approach: cache TTL + parallel graph + dedup suite có freshness guard + rg + parallel servers — 5 task mỗi task 2-5 phút, tiết kiệm ~40-50% pipeline (từ 8-12p xuống 4-6p) mà giữ gate `verify fresh` và `>20 files STOP`
- Alternatives considered: chỉ cache index (tiết kiệm 0.2s repo nhỏ, không đủ), chỉ tiered recipes (đã làm ở 2026-08-26-review-speed), bỏ luôn plan-reviewer cho micro (đồng bộ với review tier, đã xét nhưng để riêng task sau)
- Risks: cache sai nếu TTL quá dài → mitigation TTL 10p + check BRANCH+status; dedup sai nếu HEAD đổi → mitigation check HEAD_SHA + 120s; rg miss file không phải dart → mitigation fallback search_graph/serena
