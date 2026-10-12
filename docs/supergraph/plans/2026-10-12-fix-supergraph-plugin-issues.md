# Plan: Sửa toàn bộ lỗi & rủi ro Plugin Supergraph

## Architecture & Contracts
- CBM Contract: Hỗ trợ `codebase-memory-mcp >= 0.10.8, < 0.12.0` để tương thích v0.11.0.
- MCP Server Contract: `sg_task_create` tự fallback `title: args.title || args.id`.
- Client Contract: Dynamic host `window.location.hostname || '127.0.0.1'` cho iframe.
- Worktree Contract: Mutex lock bảo vệ `git merge` tuần tự trên repoRoot, tránh race condition.

## Environment Context
- PROJECT_TYPE: markdown/bash/nodejs
- TEST_CMD: node --test plugins/supergraph/tests/*.mjs && bash plugins/supergraph/tests/test-codebase-memory-migration.sh
- BRANCH: master

## Task 1: Nâng cấp ngưỡng phiên bản Codebase Memory MCP
Wave: 1
Status: completed
Risk: low
Dependencies: none
Model: inherit

Files:
- Modify: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Modify: plugins/supergraph/references/codebase-memory-contract.md

Blast radius:
- plugins/supergraph/tests/test-codebase-memory-migration.sh
- plugins/supergraph/references/codebase-memory-contract.md

Acceptance:
- `test-codebase-memory-migration.sh` pass với codebase-memory-mcp 0.11.0.
- `references/codebase-memory-contract.md` phản ánh `>= 0.10.8,<0.12.0`.

TDD:
- Behavior: script chấp nhận phiên bản 0.11.0
- Test file: plugins/supergraph/tests/test-codebase-memory-migration.sh
- Test name: version_supported
- 🔴 RED command: bash plugins/supergraph/tests/test-codebase-memory-migration.sh
- Expected 🔴 RED failure: FAIL: codebase-memory-mcp >= 0.10.8,<0.11.0 required (found: codebase-memory-mcp 0.11.0)
- Minimal 🟢 GREEN change: nới lỏng < (0, 12, 0)
- Mocking: none

Steps:
1. 🔴 RED: chạy `bash plugins/supergraph/tests/test-codebase-memory-migration.sh` xác nhận FAIL
2. 🟢 GREEN: cập nhật regex/logic trong `test-codebase-memory-migration.sh` và `codebase-memory-contract.md`
3. REFACTOR: giữ format gọn gàng
4. VERIFY: bash plugins/supergraph/tests/test-codebase-memory-migration.sh

Checkpoint:
- Files: plugins/supergraph/tests/test-codebase-memory-migration.sh plugins/supergraph/references/codebase-memory-contract.md
- Commit: fix(test): allow codebase-memory-mcp up to 0.12.0

## Task 2: Fallback title cho sg_task_create trong MCP Server
Wave: 1
Status: completed
Risk: low
Dependencies: none
Model: inherit

Files:
- Modify: plugins/supergraph/team/mcp-server.js
- Modify: plugins/supergraph/tests/test-team-mcp.mjs

Blast radius:
- plugins/supergraph/team/mcp-server.js
- plugins/supergraph/tests/test-team-mcp.mjs

Acceptance:
- `sg_task_create` khi thiếu title tự fallback về task id.
- Test trong `test-team-mcp.mjs` kiểm tra và pass.

TDD:
- Behavior: sg_task_create gán title = id khi args.title rỗng/undefined
- Test file: plugins/supergraph/tests/test-team-mcp.mjs
- Test name: sg_task_create fallback title
- 🔴 RED command: node --test plugins/supergraph/tests/test-team-mcp.mjs
- Expected 🔴 RED failure: AssertionError [ERR_ASSERTION]: expected task.title to equal task.id
- Minimal 🟢 GREEN change: `title: args.title || args.id`
- Mocking: none

Steps:
1. 🔴 RED: thêm test case vào `test-team-mcp.mjs` và chạy kiểm tra fail
2. 🟢 GREEN: sửa `title: args.title || args.id` trong `plugins/supergraph/team/mcp-server.js`
3. REFACTOR: kiểm tra schema required
4. VERIFY: node --test plugins/supergraph/tests/test-team-mcp.mjs

Checkpoint:
- Files: plugins/supergraph/team/mcp-server.js plugins/supergraph/tests/test-team-mcp.mjs
- Commit: fix(team): fallback task title to task id in sg_task_create

## Task 3: Dynamic hostname cho iframe trong client.js
Wave: 1
Status: completed
Risk: low
Dependencies: none
Model: inherit

Files:
- Modify: plugins/supergraph/client.js
- Modify: plugins/supergraph/tests/test-dsh-plugin.mjs

Blast radius:
- plugins/supergraph/client.js
- plugins/supergraph/tests/test-dsh-plugin.mjs

Acceptance:
- Client sử dụng hostname hiện tại của trình duyệt thay vì cứng 127.0.0.1.
- `test-dsh-plugin.mjs` xác thực không còn hardcode 127.0.0.1 cứng nhắc.

TDD:
- Behavior: src iframe trỏ đến `${window.location.hostname || '127.0.0.1'}:3333`
- Test file: plugins/supergraph/tests/test-dsh-plugin.mjs
- Test name: client dynamic host contract
- 🔴 RED command: node --test plugins/supergraph/tests/test-dsh-plugin.mjs
- Expected 🔴 RED failure: client.js does not use dynamic hostname
- Minimal 🟢 GREEN change: `const host = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : '127.0.0.1'`
- Mocking: none

Steps:
1. 🔴 RED: thêm assertion vào `test-dsh-plugin.mjs`
2. 🟢 GREEN: sửa `plugins/supergraph/client.js`
3. REFACTOR: giữ code gọn gàng
4. VERIFY: node --test plugins/supergraph/tests/test-dsh-plugin.mjs

Checkpoint:
- Files: plugins/supergraph/client.js plugins/supergraph/tests/test-dsh-plugin.mjs
- Commit: fix(client): dynamic hostname for Supergraph Team iframe

## Task 4: Mutex Lock chống Race Condition khi Merge Worktree
Wave: 1
Status: completed
Risk: medium
Dependencies: none
Model: inherit

Files:
- Modify: plugins/supergraph/team/worktree.js
- Modify: plugins/supergraph/tests/test-team-engine.mjs

Blast radius:
- plugins/supergraph/team/worktree.js
- plugins/supergraph/tests/test-team-engine.mjs

Acceptance:
- File lock hoặc synchronized execution đảm bảo 2 worktree merge không bị đè branch / conflict.
- Test `test-team-engine.mjs` pass.

TDD:
- Behavior: mergeWorktree thực hiện an toàn, kiểm tra working tree clean trước khi checkout & merge
- Test file: plugins/supergraph/tests/test-team-engine.mjs
- Test name: sequential merge lock
- 🔴 RED command: node --test plugins/supergraph/tests/test-team-engine.mjs
- Expected 🔴 RED failure: missing concurrency safeguard
- Minimal 🟢 GREEN change: lockfile mechanism trong WorktreeManager
- Mocking: none

Steps:
1. 🔴 RED: thêm test mô phỏng concurrency merge trong `test-team-engine.mjs`
2. 🟢 GREEN: bổ sung merge lock trong `plugins/supergraph/team/worktree.js`
3. REFACTOR: đảm bảo giải phóng lock trong `finally`
4. VERIFY: node --test plugins/supergraph/tests/test-team-engine.mjs

Checkpoint:
- Files: plugins/supergraph/team/worktree.js plugins/supergraph/tests/test-team-engine.mjs
- Commit: fix(worktree): add merge lock to prevent race conditions
