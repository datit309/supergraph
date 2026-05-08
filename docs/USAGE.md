# Supergraph — Hướng dẫn sử dụng

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ thống)
3. [Cài đặt](#3-cài-đặt)
4. [Cấu trúc plugin](#4-cấu-trúc-plugin)
5. [Cách hoạt động](#5-cách-hoạt-động)
6. [Skills chi tiết](#6-skills-chi-tiết)
7. [Agents chi tiết](#7-agents-chi-tiết)
8. [Hooks](#8-hooks)
9. [Ví dụ thực tế](#9-ví-dụ-thực-tế)
10. [Tùy chỉnh](#10-tùy-chỉnh)
11. [Xử lý lỗi](#11-xử-lý-lỗi)
12. [FAQ](#12-faq)

---

## 1. Giới thiệu

Supergraph là plugin cho Claude Code, kết hợp hai phương pháp:

- **Superpowers** (obra): Bắt buộc AI tuân theo quy trình làm việc có kỷ luật — brainstorm, plan, TDD, review.
- **Code-review-graph** (tirth8205): Phân tích cấu trúc code bằng AST graph — blast radius, hub nodes, community detection, surprise scoring.

### Vấn đề supergraph giải quyết

**Không có supergraph:**

    User: "Thêm authentication cho API"
    AI: *đọc toàn bộ 27,700 file*
        *viết code không có kế hoạch*
        *không viết test*
        *gửi PR*
    Tokens: ~443,200
    Chất lượng: không đảm bảo

**Có supergraph:**

    User: "Thêm authentication cho API"
    AI: 1. get_stats() → "Repo: 27,700 file, 12 communities, 8 languages"
        2. Brainstorm → "JWT hay session? Endpoint nào?"
        3. blast_radius(["src/auth/"]) → "15 file bị ảnh hưởng, 2 hub nodes"
        4. Plan → 6 task, mỗi task 2-5 phút, có bước verify
        5. TDD → viết test trước, implement sau, refactor
        6. Auto-fix → chạy test + lint + review, tự sửa nếu lỗi
        7. Review → blast_radius xác nhận tất cả file đã xử lý
    Tokens: ~4,260
    Chất lượng: production-ready
    Tiết kiệm: 104x tokens

### Ngôn ngữ hỗ trợ

| Ngôn ngữ             | Test                          | Lint            | Trạng thái |
| -------------------- | ----------------------------- | --------------- | ---------- |
| Node.js / TypeScript | npm test, jest, vitest, mocha | eslint          | Đầy đủ     |
| Flutter / Dart       | flutter test                  | flutter analyze | Đầy đủ     |
| PHP                  | phpunit, pest                 | phpstan, phpcs  | Đầy đủ     |

---

## 2. Yêu cầu hệ thống

### Bắt buộc

| Tool              | Phiên bản | Kiểm tra                      | Cài đặt                                    |
| ----------------- | --------- | ----------------------------- | ------------------------------------------ |
| Claude Code CLI   | mới nhất  | `claude --version`            | `npm install -g @anthropic-ai/claude-code` |
| Python            | >= 3.8    | `python3 --version`           | https://python.org                         |
| pip               | bất kỳ    | `pip3 --version`              | đi kèm Python                              |
| Git               | >= 2.0    | `git --version`               | https://git-scm.com                        |
| code-review-graph | mới nhất  | `code-review-graph --version` | `pip install code-review-graph`            |

### Tùy theo dự án

| Dự án   | Tool cần thêm         |
| ------- | --------------------- |
| Node.js | npm/yarn/pnpm         |
| Flutter | Flutter SDK, Dart SDK |
| PHP     | Composer              |

### Kiểm tra tất cả

    # Chạy lệnh này — nếu tất cả in ✓ là được
    claude --version && \
    python3 --version && \
    pip3 --version && \
    git --version && \
    code-review-graph --version

---

## 3. Cài đặt

### Cách 1: Cài từ thư mục local

    # Clone hoặc copy plugin vào máy
    git clone https://github.com/datit309/supergraph.git

    # Thêm local marketplace của claude code
    /plugin marketplace add ./supergraph

    # Cài plugin
    /plugin install supergraph

### Cách 2: Copy trực tiếp

    # Copy folder supergraph vào .claude/plugins/
    cd your-project
    mkdir -p .claude/plugins
    cp -r /path/to/supergraph .claude/plugins/

### Cách 3: Cài từ git (nếu đã push lên GitHub)

    claude plugins install github-user/supergraph

### Sau khi cài

    # 1. Cài code-review-graph (nếu chưa có)
    pip install code-review-graph

    # 2. Index codebase
    code-review-graph index .

    # 3. Mở Claude Code
    claude

    # 4. Agent sẽ tự động chạy context skill
    #    Không cần gõ lệnh gì thêm

### Kiểm tra cài đặt

    # Mở Claude Code, agent sẽ tự hiện:
    ## Supergraph Context
    - Type: [Node.js | Flutter | PHP]
    - Files: N
    - Communities: N
    - Hub nodes: [list]
    ...

Nếu hiện thông tin trên → cài thành công.

Nếu hiện lỗi MCP → chạy lại `code-review-graph index .`

---

## 4. Cấu trúc plugin

    supergraph/
    ├── .claude-plugin/
    │   └── plugin.json              # Manifest: tên, version, skills, agents
    ├── skills/                      # 9 skills — agent tự đọc
    │   ├── context/SKILL.md         # Load codebase graph
    │   ├── brainstorm/SKILL.md      # Hiểu yêu cầu trước khi code
    │   ├── plan/SKILL.md            # Lập kế hoạch với blast_radius
    │   ├── tdd/SKILL.md             # Test-Driven Development
    │   ├── review/SKILL.md          # Code review với graph
    │   ├── blast/SKILL.md           # Phân tích blast radius
    │   ├── fix/SKILL.md             # Auto-fix loop
    │   ├── refactor/SKILL.md        # Refactor an toàn
    │   └── inspect/SKILL.md         # Deep inspection
    ├── agents/                      # 2 agents chuyên biệt
    │   ├── code-reviewer.md         # Agent review code
    │   └── auto-fixer.md            # Agent fix lỗi tự động
    ├── hooks/
    │   └── hooks.json               # Hook trước/sau khi ghi code
    ├── scripts/
    │   └── detect-project.sh        # Script detect loại project
    ├── settings.json                # Permissions cho MCP tools
    ├── .mcp.json                    # MCP server config
    ├── LICENSE
    ├── CHANGELOG.md
    ├── README.md
    └── docs/
        └── USAGE_GUIDE.md           # File này

### Mỗi phần làm gì

| Thư mục                      | Vai trò                                          |
| ---------------------------- | ------------------------------------------------ |
| `.claude-plugin/plugin.json` | Khai báo plugin cho Claude Code biết             |
| `skills/`                    | Agent tự đọc và tuân theo — không cần user gọi   |
| `agents/`                    | Agent chuyên biệt được delegate công việc cụ thể |
| `hooks/`                     | Chạy script trước/sau khi agent ghi code         |
| `scripts/`                   | Script utility cho hooks và skills               |
| `settings.json`              | Quyền truy cập MCP tools                         |
| `.mcp.json`                  | Cấu hình MCP server (code-review-graph)          |

---

## 5. Cách hoạt động

### Flow tổng quan

    ┌─────────────────────────────────────────────────┐
    │                  USER GIAO TASK                  │
    └──────────────────────┬──────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  STEP 0: CONTEXT (tự động mỗi session)           │
    │  • Detect Node.js / Flutter / PHP                │
    │  • Load graph: stats, communities, hubs, cycles  │
    │  • Hiện thông tin codebase cho user              │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  STEP 1: BRAINSTORM (task không đơn giản)        │
    │  • Dùng find_symbol, find_callers khám phá       │
    │  • Hỏi câu hỏi dựa trên graph data               │
    │  • Tóm tắt hiểu biết + ước tính blast radius     │
    │  • Xác nhận với user                             │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  STEP 2: PLAN (trước khi viết code)              │
    │  • blast_radius → xác định file bị ảnh hưởng     │
    │  • Kiểm tra hub nodes, communities, surprise      │
    │  • Chia task 2-5 phút mỗi task                    │
    │  • Trình bày plan → chờ user approve             │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  STEP 3: TDD (mỗi task trong plan)               │
    │  • RED: viết test thất bại                       │
    │  • GREEN: viết code tối thiểu cho test pass      │
    │  • REFACTOR: cải thiện code, giữ test xanh       │
    │  • Verify: chạy test cho toàn bộ blast_radius    │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  STEP 4: AUTO-FIX (sau khi code xong)            │
    │  • Chạy test → nếu fail: phân tích + sửa        │
    │  • Chạy lint → nếu lỗi: sửa                     │
    │  • Graph review → nếu critical: sửa              │
    │  • Lặp tối đa 3 lần                              │
    │  • Nếu vẫn lỗi sau 3 lần → dừng, hỏi user       │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  STEP 5: REVIEW (trước khi merge)                 │
    │  • blast_radius toàn bộ thay đổi                 │
    │  • Kiểm tra hub, community, cycles, surprise      │
    │  • Chạy test + lint lần cuối                     │
    │  • Verdict: PASS / BLOCKED / NEEDS_CHANGES       │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │                    MERGE / DONE                   │
    └──────────────────────────────────────────────────┘

### Skill triggers

Agent tự động đọc skill file tương ứng:

| Khi nào                  | Đọc skill nào |
| ------------------------ | ------------- |
| Bắt đầu session          | `context`     |
| Nhận task không đơn giản | `brainstorm`  |
| Chuẩn bị viết code       | `plan`        |
| Đang viết code           | `tdd`         |
| Viết code xong           | `fix`         |
| Chuẩn bị merge           | `review`      |
| Cần phân tích impact     | `blast`       |
| Đang refactor            | `refactor`    |
| Cần hiểu sâu file/symbol | `inspect`     |

---

## 6. Skills chi tiết

### 6.1 Context

**Trigger:** Tự động mỗi session.

**Làm gì:**

- Detect loại project (Node.js/Flutter/PHP)
- Gọi MCP tools để load toàn bộ graph context
- Hiện cho user: file count, communities, hub nodes, bridge nodes, cycles, untested files

**MCP tools dùng:**

- `get_stats()`
- `find_communities()`
- `find_hub_nodes(threshold=5)`
- `find_bridge_nodes()`
- `find_cycles()`
- `find_untested_files()`

**Output mẫu:**

    ## Supergraph Context
    - Type: nodejs
    - Test: npm test
    - Lint: npx eslint .
    - Files: 342
    - Languages: typescript, javascript
    - Communities: 8
      - api: 45 files
      - auth: 23 files
      - database: 31 files
      - utils: 18 files
      - frontend: 120 files
      - tests: 89 files
      - config: 12 files
      - scripts: 4 files
    - Hub nodes: src/utils/logger.ts, src/db/connection.ts
    - Bridge nodes: src/api/middleware/auth.ts
    - Circular deps: none
    - Untested: 34 files

---

### 6.2 Brainstorm

**Trigger:** Task không đơn giản (feature mới, fix bug phức tạp, refactor).

**Làm gì:**

- Dùng graph data khám phá codebase liên quan
- Hỏi câu hỏi thông minh dựa trên dữ liệu thực
- Không đoán — hỏi

**Ví dụ câu hỏi agent hỏi:**

    "Function authenticateUser() được gọi bởi 15 file khác.
     Nếu thay đổi signature, cần backward compat không?"

    "File src/db/connection.ts là hub node — thay đổi ở đây
     sẽ ảnh hưởng toàn bộ hệ thống. Bạn muốn proceed?"

    "Graph cho thấy module auth tightly coupled với module user.
     Refactor cả hai cùng lúc không?"

**Kết quả:** User xác nhận → chuyển sang plan.

---

### 6.3 Plan

**Trigger:** Trước khi viết bất kỳ code nào.

**Làm gì:**

- Gọi `blast_radius` để biết chính xác file nào bị ảnh hưởng
- Kiểm tra hub nodes, communities, surprise scores
- Chia task 2-5 phút mỗi task
- Mỗi task có: file paths, blast radius, test cần viết, risk level, cách verify

**Output mẫu:**

    ## Plan: Thêm JWT Authentication

    ### Graph Context
    - Files in repo: 342
    - Blast radius: 15 files
    - Hub nodes affected: src/utils/logger.ts
    - Communities crossed: api → auth
    - Token savings: reading 15 files instead of 342 (23x)

    ### Tasks

    #### Task 1: Tạo JWT utility
    - Files: src/auth/jwt.ts (new)
    - Blast radius: 1 file
    - Test: src/auth/jwt.test.ts — test sign/verify/expire
    - Risk: low
    - Verify: test pass, no import errors
    - Dependencies: none

    #### Task 2: Tạo auth middleware
    - Files: src/api/middleware/auth.ts (new)
    - Blast radius: 3 files (routes that use middleware)
    - Test: auth middleware test — valid token, invalid token, expired
    - Risk: medium (bridge node)
    - Verify: test pass, existing routes unaffected
    - Dependencies: Task 1

    #### Task 3: Thêm auth vào user routes
    - Files: src/api/routes/users.ts (modify)
    - Blast radius: 5 files
    - Test: user route test — authenticated access, unauthenticated 401
    - Risk: medium
    - Verify: existing user tests still pass
    - Dependencies: Task 2

    ### Risks
    - src/utils/logger.ts là hub node → chỉ thêm log, không đổi API
    - auth middleware là bridge node → cần test kỹ

---

### 6.4 TDD

**Trigger:** Khi implement bất kỳ feature hay fix nào.

**Làm gì:**

- RED: Viết test thất bại trước
- GREEN: Viết code tối thiểu cho test pass
- REFACTOR: Cải thiện, giữ test xanh
- Verify: Chạy test cho toàn bộ blast_radius

**Luật:**

- Test phải fail TRƯỚC khi viết code
- Code phải đơn giản nhất có thể
- Không thêm tính năng ngoài scope
- Không commit nếu test fail

---

### 6.5 Review

**Trigger:** Trước merge, sau khi hoàn thành task.

**Làm gì:**

- Chạy `blast_radius` trên tất cả file thay đổi
- Kiểm tra hub nodes, communities, cycles, surprise scores
- Chạy test + lint
- Đánh giá theo 3 mức: CRITICAL (block), WARNING (fix first), INFO (note)

**Checklist tự động:**

    Blast radius:
    - [ ] Tất cả file trong blast_radius đã được xử lý
    - [ ] Không có file bất ngờ

    Hub safety:
    - [ ] Hub node đã sửa → callers đã test
    - [ ] Hub API không thay đổi hoặc dependents đã update

    Community:
    - [ ] Cross-community import có lý do
    - [ ] Không có circular dependency mới

    Surprise:
    - [ ] File có surprise_score > 0.5 đã được kiểm tra

    Ngôn ngữ:
    - [ ] Node.js: no unhandled rejections, no console.log in prod
    - [ ] Flutter: const constructors, no unnecessary rebuilds
    - [ ] PHP: type hints, parameterized queries, PSR-12

---

### 6.6 Blast

**Trigger:** Khi cần phân tích impact của thay đổi.

**Làm gì:**

- Nhận danh sách file → gọi `blast_radius(depth=3)`
- Enrich kết quả với surprise_score, find_tests_for
- Kiểm tra hub status
- Đánh giá risk

**Khi nào dùng:**

- Trước khi refactor lớn
- Khi không chắc file nào bị ảnh hưởng
- Khi review PR
- Khi debug bug không rõ nguyên nhân

---

### 6.7 Fix (Auto-Fix Loop)

**Trigger:** Tự động sau khi tất cả code đã viết xong.

**Làm gì:**

- Lặp tối đa 3 lần:
  1. Chạy test → nếu fail: phân tích blast_radius, sửa source
  2. Chạy lint → nếu lỗi: sửa
  3. Graph review → nếu critical: sửa
- Nếu hết 3 lần vẫn lỗi → dừng, hiện vấn đề cho user

**Luật:**

- KHÔNG sửa test để test pass (trừ khi test sai)
- KHÔNG commit nếu bất kỳ check nào fail sau 3 lần
- LUÔN dùng blast_radius trước khi sửa
- LUÔN chạy lại full check sau mỗi lần sửa

**Output mẫu:**

    ## Auto-Fix Report
    - Iterations used: 2/3
    - Iteration 1:
      - Tests: FAIL (2 failures in auth.test.ts)
      - Fixed: import path in auth/middleware.ts
    - Iteration 2:
      - Tests: PASS
      - Lint: PASS
      - Graph review: PASS
    - Result: All checks passed

---

### 6.8 Refactor

**Trigger:** Khi refactor code.

**Làm gì:**

- Impact assessment với depth=5 (sâu hơn bình thường)
- Baseline: chạy test trước khi refactor
- Incremental: bắt đầu từ leaf nodes, dần đến hub nodes
- Community-aware: refactor trong community trước, bridge nodes cuối
- Verify: không có cycle mới, blast_radius khớp plan

**Luật:**

- KHÔNG refactor hub nodes nếu user chưa approve
- KHÔNG cross community boundaries trong 1 bước
- LUÔN test sau mỗi bước
- LUÔN check cycle mới

---

### 6.9 Inspect

**Trigger:** Khi cần hiểu sâu 1 file, symbol, hoặc module.

**Làm gì:**

- Nếu là file: blast_radius + dependencies + dependents + surprise + tests
- Nếu là symbol: find_symbol + callers + callees
- Nếu là module: find_communities + blast_radius + bridge_nodes

**Khi nào dùng:**

- Debug bug lạ
- Hiểu code cũ trước khi sửa
- Đánh giá risk trước khi refactor

---

## 7. Agents chi tiết

### 7.1 Code Reviewer Agent

**Vai trò:** Chuyên review code, KHÔNG viết code.

**Khi nào được dùng:**

- Khi main agent cần review chuyên sâu
- Khi user yêu cầu review riêng
- Khi auto-fix loop cần đánh giá

**Cách làm:**

1. Lấy danh sách file thay đổi
2. Chạy full graph analysis
3. Kiểm tra từng file với surprise_score + find_tests_for
4. Đánh giá structural + quality + tests
5. Output verdict: PASS / BLOCKED / NEEDS_CHANGES

**Quy tắc:**

- KHÔNG approve nếu có CRITICAL
- LUÔN dùng graph data để support findings
- LUÔN cite file cụ thể và dòng cụ thể

---

### 7.2 Auto-Fixer Agent

**Vai trò:** Chuyên fix lỗi tự động, lặp lại cho đến khi sạch.

**Khi nào được dùng:**

- Sau khi code xong
- Khi test fail
- Khi lint error
- Khi graph review có CRITICAL

**Cách làm:**

1. Setup: detect language, set test/lint commands
2. Loop: test → lint → graph review → fix
3. Report: iterations used, remaining issues

**Quy tắc:**

- KHÔNG sửa test (trừ khi test sai)
- KHÔNG commit nếu fail sau 3 lần
- LUÔN dùng blast_radius trước khi fix
- LUÔN chạy lại full check sau mỗi fix

---

## 8. Hooks

### hooks.json

    {
      "preToolCall": [
        {
          "matcher": "Write|Edit",
          "description": "Trước khi ghi code — đảm bảo plan và blast_radius đã hoàn thành"
        }
      ],
      "postToolCall": [
        {
          "matcher": "Write|Edit",
          "description": "Sau khi ghi code — theo dõi file đã thay đổi cho auto-fix loop"
        }
      ],
      "preResponse": [
        {
          "description": "Trước khi trả lời — kiểm tra auto-fix loop đã chạy"
        }
      ]
    }

### Tùy chỉnh hooks

Bạn có thể thêm hook script:

    {
      "hooks": {
        "preToolCall": [
          {
            "matcher": "Write|Edit",
            "description": "Run security scan before code write",
            "script": "scripts/security-scan.sh"
          }
        ]
      }
    }

---

## 9. Ví dụ thực tế

### 9.1 Node.js — Thêm REST API endpoint

    # Bước 0: Mở Claude Code
    claude

    # Agent tự động chạy context skill
    # → Hiện: "Node.js project, 342 files, 8 communities"

    # Bước 1: Giao task
    User: "Thêm endpoint GET /api/users/:id với authentication"

    # Agent tự chạy brainstorm skill
    # → Hỏi: "Dùng JWT hay session auth? Có middleware auth sẵn chưa?"

    User: "JWT, dùng middleware có sẵn ở src/middleware/auth.ts"

    # Agent tự chạy plan skill
    # → blast_radius: 7 file bị ảnh hưởng
    # → Plan: 3 tasks, mỗi task 3 phút
    # → "Plan có ổn không?"

    User: "OK, proceed"

    # Agent tự chạy TDD skill cho mỗi task
    # Task 1: RED → viết test fail → GREEN → viết code → REFACTOR
    # Task 2: RED → viết test fail → GREEN → viết code → REFACTOR
    # Task 3: RED → viết test fail → GREEN → viết code → REFACTOR

    # Agent tự chạy fix skill
    # → Iteration 1: Tests PASS, Lint PASS, Review PASS
    # → "Auto-fix complete"

    # Agent tự chạy review skill
    # → Changed: 7 files, Blast radius: 12 files
    # → Tests: PASS, Lint: PASS
    # → CRITICAL: 0, WARNING: 1 (untested util file)
    # → Verdict: NEEDS_CHANGES

    # Agent tự fix WARNING
    # → Thêm test cho util file

    # Review lại → PASS
    User: "Merge"

---

### 9.2 Flutter — Thêm màn hình mới

    claude

    # Agent: "Flutter project, 156 files, 6 communities"

    User: "Thêm màn hình Profile với avatar, name, email, logout button"

    # Brainstorm
    # → "Dùng state management gì? Provider, Riverpod, hay Bloc?"
    # → "Có shared_preferences cho logout không?"

    User: "Riverpod, có shared_preferences rồi"

    # Plan
    # → blast_radius: 11 file
    # → 4 tasks: model, provider, screen, navigation

    # TDD cho mỗi task
    # Task 1: test ProfileModel → implement → refactor
    # Task 2: test ProfileProvider → implement → refactor
    # Task 3: test ProfileScreen widget → implement → refactor
    # Task 4: test navigation → implement → refactor

    # Auto-fix
    # → flutter test: PASS
    # → flutter analyze: PASS
    # → Review: PASS

---

### 9.3 PHP — Thêm API authentication

    claude

    # Agent: "PHP project (Laravel), 234 files, 10 communities"

    User: "Thêm API token authentication cho /api/v1/users"

    # Brainstorm
    # → "Sanctum hay Passport? Có cài sẵn chưa?"
    # → "User model ở đâu? Có migration nào cần chạy không?"

    User: "Sanctum, đã cài rồi"

    # Plan
    # → blast_radius: 9 file
    # → 3 tasks: middleware, controller update, routes

    # TDD
    # Task 1: test TokenMiddleware → implement → refactor
    # Task 2: test UserController auth → implement → refactor
    # Task 3: test routes → implement → refactor

    # Auto-fix
    # → vendor/bin/pest: PASS
    # → vendor/bin/phpstan analyse: PASS
    # → Review: PASS

---

### 9.4 Refactor an toàn

    claude

    User: "Refactor module auth — tách logic từ controller sang service"

    # Brainstorm
    # → "Module auth có 23 file, 2 hub nodes"
    # → "Controller gọi trực tiếp DB — cần tách sang AuthService"

    # Plan
    # → blast_radius(depth=5): 31 file bị ảnh hưởng
    # → Hub node: AuthController — 15 callers
    # → Plan: 5 tasks incremental

    # Refactor skill
    # Step 1: Tạo AuthService (leaf node, không có dependent)
    #   → blast_radius: 1 file → tests pass → OK
    # Step 2: Di chuyển logic từ controller sang service
    #   → blast_radius: 8 file → tests pass → OK
    # Step 3: Update controller gọi service
    #   → blast_radius: 12 file → tests pass → OK
    # Step 4: Update routes nếu cần
    #   → blast_radius: 3 file → tests pass → OK
    # Step 5: Cleanup
    #   → blast_radius: 2 file → tests pass → OK

    # Auto-fix → PASS
    # Review → PASS

---

## 10. Tùy chỉnh

### 10.1 Thêm ngôn ngữ mới

Chỉnh `scripts/detect-project.sh`:

    # Ví dụ: thêm Go
    elif [ -f "go.mod" ]; then
        echo "PROJECT_TYPE=go"
        echo "TEST_CMD=go test ./..."
        echo "LINT_CMD=golangci-lint run"

Chỉnh `skills/review/SKILL.md` — thêm checklist cho Go:

    **Go specific:**
    - Error handling: no ignored errors
    - No goroutine leaks
    - Context propagation correct

### 10.2 Thay đổi blast_radius depth

Mặc định là 3. Muốn sâu hơn:

Trong `skills/plan/SKILL.md`:

    mcp__code-review-graph__blast_radius(files=[targets], depth=5, direction="both")

### 10.3 Thay đổi max fix iterations

Mặc định là 3. Trong `skills/fix/SKILL.md`:

    MAX = 5  # tăng lên 5

### 10.4 Thay đổi hub threshold

Mặc định là 5 connections. Trong các skill:

    mcp__code-review-graph__find_hub_nodes(threshold=10)  # chỉ hub thực sự lớn

### 10.5 Tắt auto-trigger skill

Nếu muốn skill chỉ chạy khi user yêu cầu, sửa frontmatter:

    ---
    name: supergraph-brainstorm
    description: Understand requirement before coding.
    autoTrigger: manual   # thay vì pre_task
    ---

### 10.6 Thêm skill mới

Tạo thư mục mới trong `skills/`:

    skills/
    └── my-custom-skill/
        └── SKILL.md

    ---
    name: supergraph-my-custom
    description: Mô tả skill
    autoTrigger: manual
    ---

    # Skill: My Custom

    ...nội dung...

Rồi thêm vào `plugin.json`:

    "skills": [
      ...
      "skills/my-custom-skill/SKILL.md"
    ]

### 10.7 Thêm agent mới

Tạo file mới trong `agents/`:

    agents/
    └── my-agent.md

    ---
    name: supergraph-my-agent
    description: Mô tả agent
    ---

    # My Agent

    ...nội dung...

Rồi thêm vào `plugin.json`:

    "agents": [
      ...
      "agents/my-agent.md"
    ]

---

## 11. Xử lý lỗi

### Lỗi: "MCP server not available"

    # Nguyên nhân: code-review-graph chưa cài hoặc chưa index
    # Giải pháp:
    pip install code-review-graph
    code-review-graph index .

    # Kiểm tra:
    code-review-graph --version
    ls .code-review-graph/  # thư mục index phải tồn tại

### Lỗi: "code-review-graph: command not found"

    # Nguyên nhân: pip install không đưa vào PATH
    # Giải pháp:
    pip3 install code-review-graph
    # hoặc
    python3 -m pip install code-review-graph

    # Nếu vẫn lỗi:
    export PATH="$HOME/.local/bin:$PATH"
    # Thêm dòng trên vào ~/.bashrc hoặc ~/.zshrc

### Lỗi: Agent không đọc skill

    # Nguyên nhân: plugin không được cài đúng
    # Giải pháp:
    # Kiểm tra file tồn tại:
    ls .claude/plugins/supergraph/.claude-plugin/plugin.json
    ls .claude/plugins/supergraph/skills/context/SKILL.md

    # Nếu không tồn tại → cài lại:
    claude plugins install ./path/to/supergraph

### Lỗi: blast_radius trả về rỗng

    # Nguyên nhân: codebase chưa được index
    # Giải pháp:
    code-review-graph index .

    # Nếu đã index mà vẫn rỗng:
    code-review-graph index . --force  # reindex toàn bộ

### Lỗi: Auto-fix loop chạy mãi

    # Nguyên nhân: fix không giải quyết được root cause
    # Giải pháp: dừng loop, xem output còn lại
    # Agent sẽ hiện: "Remaining issues: [list]"
    # Fix thủ công những issue còn lại

### Lỗi: "Permission denied" khi chạy test

    # Nguyên nhân: thiếu quyền execute
    # Giải pháp:
    chmod +x vendor/bin/phpunit    # PHP
    chmod +x node_modules/.bin/jest  # Node.js

### Lỗi: Plugin không tương thích Claude Code version

    # Nguyên nhân: Claude Code version cũ
    # Giải pháp:
    npm install -g @anthropic-ai/claude-code@latest
    claude --version  # kiểm tra

---

## 12. FAQ

### Q: Supergraph có bắt buộc dùng TDD không?

A: Có. TDD là hard rule. Agent sẽ không implement nếu chưa có failing test. Nếu muốn tắt, sửa `autoTrigger: manual` trong `skills/tdd/SKILL.md`.

### Q: Auto-fix loop có thể sửa test không?

A: Không. Auto-fix chỉ sửa source code. Nếu test sai, agent sẽ dừng và hỏi user.

### Q: Blast radius tính chính xác đến đâu?

A: Theo benchmark của code-review-graph:

- Recall: 100% (không bỏ sót file bị ảnh hưởng thực sự)
- Precision: ~38% (có thể báo thừa một số file)
- Token savings: trung bình 8.2x

### Q: Hub node là gì?

A: File có nhiều connections (>=5 theo mặc định). Ví dụ: logger, database connection, shared utility. Thay đổi hub node ảnh hưởng rộng → cần user approve.

### Q: Surprise score là gì?

A: Đo lường file có dependency bất ngờ hay không. Score > 0.5 nghĩa là file này có mối liên hệ mà bạn có thể không ngờ tới → cần kiểm tra trước khi proceed.

### Q: Community là gì?

A: Nhóm file liên kết chặt với nhau, ít liên kết với nhóm khác. Ví dụ: module auth, module user, module payment. Cross-community change cần lý do rõ ràng.

### Q: Tôi muốn dùng supergraph với monorepo được không?

A: Được. Chạy `code-review-graph index .` ở root. Communities sẽ tự detect các packages/services. Blast_radius sẽ trace cross-package dependencies.

### Q: Supergraph có chậm không?

A: Không. blast_radius chạy rất nhanh (<2s cho incremental update). Graph đã được index sẵn, chỉ query. So với đọc toàn bộ codebase, supergraph nhanh hơn nhiều vì đọc ít file hơn.

### Q: Tôi có thể dùng supergraph với Cursor, Copilot không?

A: Supergraph được thiết kế cho Claude Code. Các tool khác có thể dùng skills dưới dạng prompt template nhưng không có auto-trigger và MCP integration.

### Q: code-review-graph hỗ trợ ngôn ngữ nào?

A: 23 ngôn ngữ: Python, JavaScript, TypeScript, Java, C, C++, Go, Rust, Ruby, PHP, C#, Swift, Kotlin, Scala, Dart, Lua, R, Julia, Elixir, Erlang, Haskell, OCaml, Zig, và Jupyter notebooks.

### Q: Tôi muốn đóng góp thêm skill/agent?

A: Tạo PR với skill/agent mới, thêm vào `plugin.json`, viết docs trong USAGE_GUIDE.md.

---

## Liên kết

- Superpowers: https://github.com/obra/superpowers
- Code-review-graph: https://github.com/tirth8205/code-review-graph
- Claude Code: https://docs.anthropic.com/claude-code
