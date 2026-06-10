# Plan: Tích hợp Serena vào Supergraph Skills

**Date:** 2026-06-10  
**Author:** Dattran  
**Slug:** serena-integration

## Context

Serena là một MCP server code intelligence dựa trên LSP, cung cấp symbol-level navigation, diagnostics, và targeted code surgery. Tích hợp Serena vào workflow supergraph để:
- Blast radius chính xác hơn (symbol-level thay vì file-level)
- Phát hiện type errors sớm trước khi chạy test suite  
- Code surgery an toàn (rename_symbol, replace_symbol_body)
- Persistent memory context qua sessions

## Analysis Decisions
- Approach: Hybrid — tạo skill serena mới + enhance 8 skills hiện tại
- Alternatives considered: Skill độc lập (quá isolated), Chỉ enhance (không có entry point)
- Key principle: Tất cả Serena calls là **optional/fallback** — nếu Serena MCP không available thì skip, không break workflow

---

## Task 1: Tạo skill serena/SKILL.md mới
Status: pending
Risk: low
Dependencies: none

Files:
- Create: plugins/supergraph/skills/serena/SKILL.md

Blast radius:
- plugins/supergraph/CLAUDE.md (cần update skill table)

Acceptance:
- File tồn tại với đầy đủ sections: trigger conditions, tool reference, memory workflow
- Skill giải thích khi nào dùng initial_instructions, activate_project, get_symbols_overview
- Có fallback instruction nếu Serena unavailable

TDD:
- Behavior: Skill file có cấu trúc đúng format frontmatter + sections
- Test file: manual review (không có automated test cho markdown)
- Test name: manual-verify-serena-skill-structure
- RED command: `cat plugins/supergraph/skills/serena/SKILL.md`
- Expected RED failure: file không tồn tại
- Minimal GREEN change: tạo file với đủ cấu trúc

Steps:
1. RED: verify file chưa tồn tại
   Command: `ls plugins/supergraph/skills/serena/SKILL.md 2>&1`
   Expected: FAIL (No such file)
2. GREEN: tạo file với đủ nội dung
   Command: `cat plugins/supergraph/skills/serena/SKILL.md | head -5`
   Expected: PASS (có frontmatter)
3. REFACTOR: review nội dung, đảm bảo consistent với style của skills khác
4. VERIFY:
   - `cat plugins/supergraph/skills/serena/SKILL.md` — đọc và confirm nội dung
   - `grep -c "##" plugins/supergraph/skills/serena/SKILL.md` — ít nhất 5 sections

Checkpoint:
- Files: `plugins/supergraph/skills/serena/SKILL.md`
- Commit: `feat: add serena foundation skill`

---

## Task 2: Enhance scan — thêm Serena project activation
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/skills/scan/SKILL.md

Blast radius:
- plugins/supergraph/skills/scan/SKILL.md

Acceptance:
- Step mới "2b. Serena context (optional)" sau step 2
- Calls: activate_project, get_symbols_overview
- Clearly marked optional (nếu Serena unavailable → skip)
- Report section bao gồm Serena symbols count

TDD:
- Behavior: scan skill có Serena optional step
- Test file: manual review
- Test name: manual-verify-scan-serena-step
- RED command: `grep "serena" plugins/supergraph/skills/scan/SKILL.md`
- Expected RED failure: grep returns nothing
- Minimal GREEN change: thêm Serena step vào scan

Steps:
1. RED: confirm Serena mention chưa có trong scan
   Command: `grep -c "serena\|Serena" plugins/supergraph/skills/scan/SKILL.md`
   Expected: 0
2. GREEN: thêm step 2b vào scan SKILL.md
   Command: `grep -c "Serena" plugins/supergraph/skills/scan/SKILL.md`
   Expected: >= 3
3. REFACTOR: đảm bảo step mới fit tự nhiên vào flow
4. VERIFY:
   - `grep "optional\|Optional\|if available" plugins/supergraph/skills/scan/SKILL.md` — phải có fallback note

Checkpoint:
- Files: `plugins/supergraph/skills/scan/SKILL.md`
- Commit: `feat: add serena activation to scan skill`

---

## Task 3: Enhance plan — thêm Serena symbol navigation
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/skills/plan/SKILL.md

Blast radius:
- plugins/supergraph/skills/plan/SKILL.md

Acceptance:
- Step "3b. Serena symbol analysis (optional)" sau step 3 (graph analysis)
- Calls: find_referencing_symbols, find_implementations để deepen blast radius
- Optional/fallback clearly stated
- Không làm phức tạp plan format

TDD:
- Behavior: plan skill có Serena symbol analysis step
- Test file: manual review
- RED command: `grep -c "serena\|Serena" plugins/supergraph/skills/plan/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: thêm step 3b

Steps:
1. RED: confirm chưa có
   Command: `grep -c "Serena" plugins/supergraph/skills/plan/SKILL.md`
   Expected: 0
2. GREEN: thêm step 3b
   Command: `grep -c "Serena" plugins/supergraph/skills/plan/SKILL.md`
   Expected: >= 3
3. REFACTOR: đảm bảo tự nhiên trong flow
4. VERIFY:
   - `grep "find_referencing_symbols\|find_implementations" plugins/supergraph/skills/plan/SKILL.md`

Checkpoint:
- Files: `plugins/supergraph/skills/plan/SKILL.md`
- Commit: `feat: add serena symbol navigation to plan skill`

---

## Task 4: Enhance analyze — thêm Serena dependency mapping
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/skills/analyze/SKILL.md

Blast radius:
- plugins/supergraph/skills/analyze/SKILL.md

Acceptance:
- Step "2b. Serena dependency check (optional)" sau step 2 (check graph risk)
- Calls: find_referencing_symbols cho target files/symbols
- Kết quả được dùng để enrich approach comparison ở step 3

TDD:
- Behavior: analyze skill có Serena step
- RED command: `grep -c "Serena" plugins/supergraph/skills/analyze/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: thêm step 2b

Steps:
1. RED: `grep -c "Serena" plugins/supergraph/skills/analyze/SKILL.md` → 0
2. GREEN: thêm step 2b
3. REFACTOR: fit tự nhiên
4. VERIFY: `grep "find_referencing_symbols" plugins/supergraph/skills/analyze/SKILL.md`

Checkpoint:
- Files: `plugins/supergraph/skills/analyze/SKILL.md`
- Commit: `feat: add serena dependency mapping to analyze skill`

---

## Task 5: Enhance tdd — thêm Serena diagnostics
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/skills/tdd/SKILL.md

Blast radius:
- plugins/supergraph/skills/tdd/SKILL.md

Acceptance:
- Thêm Serena diagnostics check sau RED verify (step 2) và GREEN verify (step 4)
- Call: get_diagnostics_for_file để catch type errors ngay tại chỗ
- Optional — chỉ khi Serena available
- Evidence format cập nhật để include diagnostics status

TDD:
- Behavior: tdd skill có diagnostics check sau RED và GREEN
- RED command: `grep -c "diagnostics\|get_diagnostics" plugins/supergraph/skills/tdd/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: thêm Serena diagnostics call vào step 2 và step 4

Steps:
1. RED: `grep -c "diagnostics" plugins/supergraph/skills/tdd/SKILL.md` → 0
2. GREEN: thêm diagnostics calls
3. REFACTOR: đảm bảo evidence format consistent
4. VERIFY: `grep "get_diagnostics_for_file" plugins/supergraph/skills/tdd/SKILL.md`

Checkpoint:
- Files: `plugins/supergraph/skills/tdd/SKILL.md`
- Commit: `feat: add serena diagnostics to tdd skill`

---

## Task 6: Enhance execute — thêm Serena symbol surgery hints
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/skills/execute/SKILL.md

Blast radius:
- plugins/supergraph/skills/execute/SKILL.md

Acceptance:
- Trong executor dispatch prompt, mention Serena symbol tools như preferred approach
- replace_symbol_body preferred over raw text edits cho function bodies
- rename_symbol preferred over grep/replace cho renames
- Note trong rules section

TDD:
- Behavior: execute skill hints tới Serena symbol surgery
- RED command: `grep -c "replace_symbol_body\|rename_symbol" plugins/supergraph/skills/execute/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: thêm Serena tools hint vào dispatch prompts và rules

Steps:
1. RED: `grep -c "replace_symbol_body" plugins/supergraph/skills/execute/SKILL.md` → 0
2. GREEN: thêm Serena hints
3. REFACTOR: fit vào dispatch prompt format
4. VERIFY: `grep "Serena\|serena" plugins/supergraph/skills/execute/SKILL.md | wc -l` >= 3

Checkpoint:
- Files: `plugins/supergraph/skills/execute/SKILL.md`
- Commit: `feat: add serena symbol surgery hints to execute skill`

---

## Task 7: Enhance fix — thêm Serena pre-loop diagnostics
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/skills/fix/SKILL.md

Blast radius:
- plugins/supergraph/skills/fix/SKILL.md

Acceptance:
- Step "3b. Serena pre-loop diagnostics (optional)" trước loop bắt đầu
- Call get_diagnostics_for_file trên mỗi changed file
- Triage IDE-level errors TRƯỚC khi chạy test suite
- Giảm số iterations bằng cách fix type errors sớm

TDD:
- Behavior: fix skill có Serena pre-loop diagnostics triage
- RED command: `grep -c "get_diagnostics_for_file" plugins/supergraph/skills/fix/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: thêm step 3b

Steps:
1. RED: `grep -c "get_diagnostics_for_file" plugins/supergraph/skills/fix/SKILL.md` → 0
2. GREEN: thêm step 3b
3. REFACTOR: fit trước auto-fix loop
4. VERIFY: `grep "Serena\|serena" plugins/supergraph/skills/fix/SKILL.md | wc -l` >= 3

Checkpoint:
- Files: `plugins/supergraph/skills/fix/SKILL.md`
- Commit: `feat: add serena pre-loop diagnostics to fix skill`

---

## Task 8: Enhance review — thêm Serena reference + diagnostics
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/skills/review/SKILL.md

Blast radius:
- plugins/supergraph/skills/review/SKILL.md

Acceptance:
- Step "3b. Serena code intelligence (optional)" trong Graph Analysis section
- Calls: find_referencing_symbols cho changed symbols, get_diagnostics_for_file cho changed files
- Kết quả được pass vào code-reviewer agent prompt
- Trong checklist, thêm Serena diagnostics gate

TDD:
- Behavior: review skill có Serena intelligence step
- RED command: `grep -c "find_referencing_symbols" plugins/supergraph/skills/review/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: thêm step 3b và update reviewer prompt

Steps:
1. RED: `grep -c "find_referencing_symbols" plugins/supergraph/skills/review/SKILL.md` → 0
2. GREEN: thêm step 3b + update reviewer prompt
3. REFACTOR: fit vào existing flow
4. VERIFY: `grep "Serena\|get_diagnostics_for_file\|find_referencing_symbols" plugins/supergraph/skills/review/SKILL.md | wc -l` >= 4

Checkpoint:
- Files: `plugins/supergraph/skills/review/SKILL.md`
- Commit: `feat: add serena code intelligence to review skill`

---

## Task 9: Enhance flutter-dart-code-review — thêm Serena tools
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/skills/flutter-dart-code-review/SKILL.md

Blast radius:
- plugins/supergraph/skills/flutter-dart-code-review/SKILL.md

Acceptance:
- Thêm 3 Serena tools vào "MCP-Integrated Review" section (items 7, 8, 9)
- get_diagnostics_for_file: Dart analyzer diagnostics trên mỗi file được review
- find_referencing_symbols: tìm tất cả usages của changed public APIs
- find_implementations: tìm tất cả implementations của abstract classes
- Consistent với style của 6 items hiện tại trong section này

TDD:
- Behavior: flutter-dart-code-review có Serena tools trong MCP section
- RED command: `grep -c "get_diagnostics_for_file" plugins/supergraph/skills/flutter-dart-code-review/SKILL.md`
- Expected RED failure: 0
- Minimal GREEN change: thêm 3 items vào MCP-Integrated Review section

Steps:
1. RED: `grep -c "get_diagnostics_for_file" plugins/supergraph/skills/flutter-dart-code-review/SKILL.md` → 0
2. GREEN: thêm 3 items
3. REFACTOR: consistent với style hiện tại
4. VERIFY: `grep -c "Serena\|serena\|get_diagnostics" plugins/supergraph/skills/flutter-dart-code-review/SKILL.md` >= 3

Checkpoint:
- Files: `plugins/supergraph/skills/flutter-dart-code-review/SKILL.md`
- Commit: `feat: add serena tools to flutter-dart-code-review skill`

---

## Task 10: Update CLAUDE.md — thêm Serena vào skills table
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/CLAUDE.md

Blast radius:
- plugins/supergraph/CLAUDE.md

Acceptance:
- Thêm `/supergraph:serena` vào Skills table với mô tả rõ ràng
- Thêm note về Serena MCP trong Hard Rules section
- Thêm Serena tools vào MCP Tools table

TDD:
- Behavior: CLAUDE.md có reference đến serena skill
- RED command: `grep -c "serena\|Serena" plugins/supergraph/CLAUDE.md`
- Expected RED failure: 0
- Minimal GREEN change: thêm serena vào skills table và hard rules

Steps:
1. RED: `grep -c "serena" plugins/supergraph/CLAUDE.md` → 0
2. GREEN: thêm serena entries
3. REFACTOR: consistent với format hiện tại
4. VERIFY: `grep "serena\|Serena" plugins/supergraph/CLAUDE.md | wc -l` >= 3

Checkpoint:
- Files: `plugins/supergraph/CLAUDE.md`
- Commit: `feat: add serena to CLAUDE.md skill table and tools reference`

---

## Environment Context
- **Language:** Markdown
- **Test command:** manual review (cat + grep)
- **Linter command:** none
- **Formatter command:** none
- **Build command:** none
- **Branch:** master
- **Conventional commit style:** `feat:` for new features

**Codebase conventions:** SKILL.md files dùng frontmatter YAML, markdown headers `##`, optional steps dùng `(optional)` suffix, consistent use of code blocks cho commands

**Graph Context:**
- Blast radius: 10 files | Hub nodes: CLAUDE.md (referenced by all)
- Bridge nodes: none | Communities crossed: skills directory only

---

## Execution Notes
- Tasks 1-10 đều independent (khác files), có thể chạy parallel ngoại trừ Task 1 phải xong trước
- Task 1 là foundation — tasks 2-10 có thể chạy parallel sau Task 1
- Tất cả changes là markdown edits, không có code logic risk
- Branch: master — đây là plugin repo, user đã explicit approve task này
