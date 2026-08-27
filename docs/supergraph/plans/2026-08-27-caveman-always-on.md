# Caveman Always-On — bỏ xử lý bật/tắt

## Task 1: Bỏ toggle caveman, luôn bật trong 3 hook + skill
Status: completed
Risk: low
Dependencies: none
Files:
- Modify: plugins/supergraph/hooks/user-prompt-submit
- Modify: plugins/supergraph/hooks/session-start
- Modify: plugins/supergraph/hooks/pre-invocation
- Modify: plugins/supergraph/skills/caveman/SKILL.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/hooks/user-prompt-submit
- plugins/supergraph/hooks/session-start
- plugins/supergraph/hooks/pre-invocation
- plugins/supergraph/skills/caveman/SKILL.md
Acceptance:
- [ ] `user-prompt-submit` không còn `grep caveman|compress` và `normal mode|verbose`, không `sed SUPERGRAPH_CAVEMAN`, chỉ emit `CAVEMAN_RULES` cứng mỗi prompt
- [ ] `session-start` không `grep SUPERGRAPH_CAVEMAN=true`, luôn `parts+= caveman mode ON`
- [ ] `pre-invocation` không `re.search caveman|normal mode`, luôn `parts.append(caveman_rules)` + bỏ ghi `.supergraph-env`
- [ ] `caveman/SKILL.md` ghi `Mặc định luôn bật, không cần bật/tắt` thay vì Activation phrases
- [ ] `bash plugins/supergraph/tests/test-hook-contracts.sh` PASS
TDD:
- Behavior: caveman luôn bật không toggle
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: caveman always-on
- 🔴 RED command: `grep -c "SUPERGRAPH_CAVEMAN=false\|normal mode.*caveman off" plugins/supergraph/hooks/user-prompt-submit`
- Expected 🔴 RED failure: >0 (còn toggle logic)
- Minimal 🟢 GREEN change: xoá block bật/tắt, thay bằng emit cứng `CAVEMAN_RULES` ở cả 3 hook
- Refactor candidates: none
- Mocking: none
Steps:
1. 🔴 RED: `grep -c "normal mode" plugins/supergraph/hooks/user-prompt-submit` → >0
   Command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: FAIL (còn toggle)
2. 🟢 GREEN: edit 3 hook xoá bật/tắt, để luôn ON; edit caveman SKILL bỏ Deactivate/Activation phrases, ghi luôn bật
   Command: `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   Expected: PASS
3. REFACTOR: đảm bảo `LANG_CTX` và triage/diagnose hint vẫn giữ sau caveman emit
4. VERIFY:
   - `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
   - `bash -n plugins/supergraph/hooks/user-prompt-submit plugins/supergraph/hooks/session-start`
Checkpoint:
- Files: `plugins/supergraph/hooks/user-prompt-submit plugins/supergraph/hooks/session-start plugins/supergraph/hooks/pre-invocation plugins/supergraph/skills/caveman/SKILL.md`
- Commit: `refactor: caveman always-on, remove toggle`

## Environment Context
- **Language:** Bash 3.2 + Markdown + Python 3
- **Test command:** `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- **Linter command:** `bash -n plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh`
- **Formatter command:** not configured
- **Build command:** not configured
- **Branch:** master
- **Conventional commit style:** `refactor:`, `perf:`, `fix:`

**Codebase conventions:** Hooks emit one JSON object; tests dùng `fail` helper; skill `caveman` là persistent compression.

**Graph Context:**
- Blast radius: 4 files (3 hooks + 1 skill) | Hub nodes: none | Bridge nodes: none
- Communities crossed: none
