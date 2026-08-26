# Token Trim SAFE — prose deduplication without workflow change

## Task 1: Trim plan/review checkpoint prose
Status: completed
Risk: low
Dependencies: none
Files:
- Modify: plugins/supergraph/skills/plan/SKILL.md
- Modify: plugins/supergraph/skills/review/SKILL.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/skills/plan/SKILL.md
- plugins/supergraph/skills/review/SKILL.md
Acceptance:
- `wc -c` plan+review giảm >=15% so với baseline, vẫn giữ 8 field bắt buộc per task: Status,Risk,Dependencies,Files,Acceptance,TDD,Steps,Checkpoint
- `bash plugins/supergraph/tests/test-hook-contracts.sh all` PASS
- `bash plugins/supergraph/tests/test-documentation-consistency.sh` PASS
TDD:
- Behavior: plan/review skills remain machine-parseable with less verbose prose
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: plan-review parseability (existing hook contracts)
- RED command: `bash plugins/supergraph/tests/test-hook-contracts.sh all`
- Expected RED failure: FAIL if checkpoint heading `## Task N:` regex broken or `Status:` field missing
- Minimal GREEN change: delete verbose examples, keep exact headings and field names
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: capture baseline `wc -c` and run contracts to prove gate exists
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   Expected: PASS (baseline)
2. GREEN: trim prose in plan:68-112 checkpoint example and review:34-46 recipe list to `see references/codebase-memory-contract.md`
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   Expected: PASS
3. REFACTOR: ensure no extra blank lines between fields within task (plan:123-124 rule)
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   - `bash plugins/supergraph/tests/test-documentation-consistency.sh`
Checkpoint:
- Files: `plugins/supergraph/skills/plan/SKILL.md plugins/supergraph/skills/review/SKILL.md`
- Commit: `refactor: trim plan/review prose, reference contract`

## Task 2: Deduplicate Serena and graph lifecycle boilerplate
Status: completed
Risk: low
Dependencies: Task 1
Files:
- Modify: plugins/supergraph/skills/plan/SKILL.md
- Modify: plugins/supergraph/skills/analyze/SKILL.md
- Modify: plugins/supergraph/skills/tdd/SKILL.md
- Modify: plugins/supergraph/skills/execute/SKILL.md
- Modify: plugins/supergraph/skills/fix/SKILL.md
- Modify: plugins/supergraph/skills/verify/SKILL.md
- Modify: plugins/supergraph/skills/review/SKILL.md
- Modify: plugins/supergraph/skills/integration/SKILL.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- 8 skills sharing Serena block `if /supergraph:scan was not run...initial_instructions`
- 7 skills sharing graph block `Require CBM_PROJECT + index_status else index_repository`
Acceptance:
- Each skill replaces duplicated 4-5 line block bằng 1 dòng `see serena/SKILL.md:Setup` và `see references/codebase-memory-contract.md#Lifecycle`
- Tổng `grep -c mcp__serena__initial_instructions` giảm từ 8 xuống 1 definition, các skill chỉ reference
- All hooks/tests PASS
TDD:
- Behavior: Serena/graph lifecycle reference is not duplicated but still discoverable
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: serena reference integrity
- RED command: `grep -r "mcp__serena__initial_instructions" plugins/supergraph/skills/ | wc -l`
- Expected RED failure: count 8 (baseline duplication)
- Minimal GREEN change: replace block with single reference line per skill
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: count duplication `grep -r mcp__serena plugins/supergraph/skills/ | wc -l` → 8
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   Expected: PASS
2. GREEN: edit each skill to replace block with `See serena/SKILL.md:Setup — call initial_instructions first, skip if SERENA_ACTIVE=false`
   Command: `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   Expected: PASS
3. REFACTOR: verify `grep` count drops, no broken markdown
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   - `bash plugins/supergraph/tests/test-documentation-consistency.sh`
Checkpoint:
- Files: `plugins/supergraph/skills/plan/SKILL.md plugins/supergraph/skills/analyze/SKILL.md plugins/supergraph/skills/tdd/SKILL.md plugins/supergraph/skills/execute/SKILL.md plugins/supergraph/skills/fix/SKILL.md plugins/supergraph/skills/verify/SKILL.md plugins/supergraph/skills/review/SKILL.md plugins/supergraph/skills/integration/SKILL.md`
- Commit: `refactor: deduplicate Serena/graph boilerplate to references`

## Task 3: Trim architecture and frontend HTML boilerplate
Status: completed
Risk: low
Dependencies: Task 2
Files:
- Modify: plugins/supergraph/skills/architecture/SKILL.md
- Modify: plugins/supergraph/skills/frontend-design/SKILL.md
- Modify: plugins/supergraph/skills/flutter-ui/SKILL.md
- Test: plugins/supergraph/tests/test-hook-contracts.sh
Blast radius:
- plugins/supergraph/skills/architecture/SKILL.md:34-90 HTML template
- plugins/supergraph/skills/frontend-design/SKILL.md
Acceptance:
- `wc -c` architecture+frontend+flutter-ui giảm >=20%, vẫn giữ required sections: Current Architecture Mermaid, Candidate Improvements, Knowledge Gaps, Surprising Connections
- No change to hooks/hooks.json or plugin.json skills registration
TDD:
- Behavior: architecture HTML template remains self-contained but shorter
- Test file: plugins/supergraph/tests/test-hook-contracts.sh
- Test name: doc consistency
- RED command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
- Expected RED failure: none (baseline PASS) — trim must keep PASS
- Minimal GREEN change: remove Tailwind CDN verbose example, keep structure comments
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: record baseline `wc -c` architecture+frontend
   Command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   Expected: PASS
2. GREEN: replace HTML example 40 lines with 10-line skeleton + comment `see full template in repo`
   Command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   Expected: PASS
3. REFACTOR: ensure Mermaid placeholders still present
4. VERIFY:
   - `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   - `bash plugins/supergraph/tests/test-documentation-consistency.sh`
Checkpoint:
- Files: `plugins/supergraph/skills/architecture/SKILL.md plugins/supergraph/skills/frontend-design/SKILL.md plugins/supergraph/skills/flutter-ui/SKILL.md`
- Commit: `refactor: trim architecture/frontend boilerplate`

## Task 4: Optimize user-prompt-submit unconditional injection
Status: completed
Risk: medium
Dependencies: Task 3
Files:
- Modify: plugins/supergraph/hooks/user-prompt-submit
- Test: plugins/supergraph/tests/test-user-prompt-submit-hook.sh
Blast radius:
- plugins/supergraph/hooks/user-prompt-submit:14 LANG_CTX unconditional
- plugins/supergraph/hooks/user-prompt-submit:72 emit "" every prompt
Acceptance:
- When prompt matches no keyword, hook emits `{}` (no additionalContext) instead of `🌐 Always reply...` — saves ~50 chars/prompt
- When prompt matches caveman/triage/bug/frontend, behavior unchanged
- `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh` PASS (test expects PASS for ordinary request with lang hint — update test to allow empty emit)
- `bash plugins/supergraph/tests/test-hook-contracts.sh` UserPromptSubmit contract still PASS (allows empty additionalContext if no hint needed)
TDD:
- Behavior: unconditional lang hint is removed, keyword hints preserved
- Test file: plugins/supergraph/tests/test-user-prompt-submit-hook.sh
- Test name: ordinary request emits no context
- RED command: `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
- Expected RED failure: PASS currently because test expects lang hint — will update assertion to allow empty
- Minimal GREEN change: change `emit ""` at line 72 to exit 0 with `{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":""}}` filtered to not inject when empty, or return `{}` as hooks do for no-op
- Refactor candidates: none
- Mocking: none
Steps:
1. RED: run current `printf '{"prompt":"ordinary request"}' | bash plugins/supergraph/hooks/user-prompt-submit` and capture output → has LANG_CTX
   Command: `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
   Expected: PASS (baseline)
2. GREEN: modify `user-prompt-submit:72-73` to `printf '{}\n'; exit 0` when no keyword matched, matching `post-tool-use:8` no-op pattern
   Command: `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
   Expected: PASS after test updated to expect empty
3. REFACTOR: ensure caveman activation still appends `SUPERGRAPH_CAVEMAN=true` to .supergraph-env
4. VERIFY:
   - `bash plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
   - `bash plugins/supergraph/tests/test-hook-contracts.sh all`
   - Manual: `echo '{"prompt":"fix bug"}' | bash plugins/supergraph/hooks/user-prompt-submit` still contains diagnose hint
Checkpoint:
- Files: `plugins/supergraph/hooks/user-prompt-submit plugins/supergraph/tests/test-user-prompt-submit-hook.sh`
- Commit: `perf: skip unconditional lang injection when no keyword matched`

## Environment Context
- **Language:** Bash 3.2 + Markdown (project type markdown/bash per .supergraph-env)
- **Test command:** `for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file"; done`
- **Linter command:** `bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/hooks/* plugins/supergraph/tests/test-*.sh`
- **Formatter command:** not configured
- **Build command:** not configured
- **Branch:** chore/token-trim-safe (new, master is protected per AGENTS.md:48)
- **Conventional commit style:** `refactor:`, `perf:`, `feat:`, `fix:`

**Codebase conventions:** Hooks emit one valid JSON object on stdout; failures stay silent non-blocking; tests use Bash functions + explicit `fail`; macOS/Linux/WSL/Git Bash supported; skills keep `## Task N:` heading and 8 fields for executor parsing.

**Graph Context:**
- Blast radius: 11 files | Hub nodes: none (docs/skills, not code) | Bridge nodes: none
- Communities crossed: none — pure docs/hooks, no cross-module coupling

## Analysis Decisions
- Approach: SAFE prose dedup only, no hook removal, no gate removal — validated by 4 existing test suites
- Alternatives rejected: removing hooks or merging fix+verify+review saves more tokens but breaks `test-hook-contracts.sh:83` and independent review gate; deferred to separate plan with platform approval
