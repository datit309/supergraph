# Supergraph cho AI Coding Agents

> [English](./README.md)

**Biến AI coding agent từ công cụ sinh code thành hệ thống workflow kỹ thuật phần mềm.**

> SuperGraph không làm coding agent của bạn thông minh hơn.
> Nó làm coding agent hành xử như một kỹ sư có kỷ luật.

SuperGraph áp đặt planning, TDD, verification, review, và ra quyết định có nhận thức về kiến trúc thông qua các workflow bắt buộc, graph intelligence, và phân tích code bằng LSP.

[![Version](https://img.shields.io/badge/version-2.2.3-blue)](./plugins/supergraph/CHANGELOG.md)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Privacy](https://img.shields.io/badge/privacy-local--first-success)](./plugins/supergraph/PRIVACY.md)

---

## Tại sao dùng Supergraph?

| Không có Supergraph               | Có Supergraph                                                             |
| --------------------------------- | ------------------------------------------------------------------------- |
| Claude đoán file nào bị ảnh hưởng | Đồ thị hiển thị blast radius chính xác trước khi gõ dòng code đầu tiên    |
| TDD tuỳ chọn                      | Test RED là bắt buộc — không có production code nếu chưa có test thất bại |
| "Chạy được trên máy tao"          | Vòng lặp diagnose 6 giai đoạn với phản hồi có tính xác định               |
| Review là chuyện phụ              | Agent reviewer độc lập + kiểm tra đồ thị trước mỗi lần merge              |
| Context mất giữa các session      | Skill handoff nén toàn bộ trạng thái session trong vài giây               |
| Refactor làm hỏng caller ẩn       | Serena LSP tìm mọi tham chiếu trước khi rename chạy                       |

---

## Nền tảng hỗ trợ

| Nền tảng        | Đường dẫn cài đặt                | Bộ nhớ project |
| --------------- | -------------------------------- | -------------- |
| Claude Code     | Marketplace hoặc plugin local    | `CLAUDE.md`    |
| Antigravity CLI | Installer local                  | `AGENTS.md`    |
| Codex CLI       | Marketplace hoặc installer local | `AGENTS.md`    |
| OpenCode        | Installer local                  | `OPENCODE.md`  |

Antigravity và Codex dùng `AGENTS.md`; OpenCode dùng `OPENCODE.md`. Không cần `CLAUDE.md` cho các nền tảng này.
Biến môi trường hook và tên event của Antigravity hiện là best-effort cho tới khi được verify bằng cài đặt thật.

---

## Yêu cầu

| Dependency                                                          | Bắt buộc | Cài đặt                                       |
| ------------------------------------------------------------------- | -------- | --------------------------------------------- |
| Claude Code, Antigravity CLI, Codex CLI, hoặc OpenCode              | ✅ Có    | Xem tài liệu nền tảng bạn dùng                |
| Python 3.10+                                                        | ✅ Có    | `brew install python` / `apt install python3` |
| [codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) | ✅ Có | `pip install codebase-memory-mcp==0.9.0` |
| [uv](https://docs.astral.sh/uv/)                                    | Tuỳ chọn | `brew install uv`                             |
| [Serena MCP](https://github.com/oraios/serena)                      | Tuỳ chọn | Xem [Cài đặt Serena](#cài-đặt-serena)         |
| Git                                                                 | ✅ Có    | Thường đã có sẵn                              |

---

## Cài đặt

### Cách 1 — Claude Code

```bash
# Cài từ Git marketplace (khuyến nghị)
/plugin marketplace add https://github.com/datit309/supergraph.git
/plugin install supergraph

# Hoặc cài từ checkout local
git clone https://github.com/datit309/supergraph.git
/plugin marketplace add ./supergraph
/plugin install supergraph

# Cài MCP
pip install codebase-memory-mcp==0.9.0

# Lần chạy đầu
/supergraph:scan

# Cập nhật sau này
/plugin marketplace update supergraph
```

### Cách 2 — Antigravity CLI

```bash
git clone https://github.com/datit309/supergraph.git
cd supergraph

# Cài file plugin cho Antigravity
plugins/supergraph/install.sh --platform antigravity

# Cài MCP
pip install codebase-memory-mcp==0.9.0

# Lần chạy đầu
/supergraph:scan
```

Dùng `AGENTS.md` cho project instructions; không cần `CLAUDE.md`.

### Cách 3 — Codex CLI

```bash
# Thêm marketplace + cài plugin (khuyến nghị)
codex plugin marketplace add datit309/supergraph
codex plugin add supergraph@supergraph

# Hoặc cài thủ công từ checkout local
git clone https://github.com/datit309/supergraph.git
cd supergraph
plugins/supergraph/install.sh --platform codex

# Cài MCP
pip install codebase-memory-mcp==0.9.0

# Lần chạy đầu
/supergraph:scan

# Cập nhật sau này
codex plugin marketplace upgrade supergraph
```

Dùng `AGENTS.md` cho project instructions; không cần `CLAUDE.md`.

### Cách 4 — OpenCode

```bash
git clone https://github.com/datit309/supergraph.git
cd supergraph

# Symlink skills + in snippet opencode.json
plugins/supergraph/install.sh --platform opencode

# Cài MCP
pip install codebase-memory-mcp==0.9.0

# Lần chạy đầu
/supergraph:scan
```

Installer symlink từng skill vào `.opencode/skills/<name>`, copy `OPENCODE.md` vào project root, và in snippet để thêm vào `opencode.json`:

```json
{
  "instructions": ["OPENCODE.md"],
  "mcp": {
    "codebase-memory-mcp": { "type": "stdio", "command": "codebase-memory-mcp", "args": [] },
    "serena": { "type": "stdio", "command": "serena", "args": ["start-mcp-server", "--context=opencode", "--project-from-cwd"] }
  }
}
```

OpenCode dùng `OPENCODE.md` cho project instructions. Skills và MCP chạy ngay. Hooks (SessionStart, caveman, v.v.) không có trên OpenCode — nền tảng này dùng mô hình plugin JS/TS.

**Cách gọi skill trên OpenCode:** dùng `/skills`, rồi chọn `scan`, `plan`, `tdd`, v.v. Không dùng `/supergraph:*` trong OpenCode.

---

## Cài đặt MCP

### Codebase Memory MCP >= 0.9.0 (bắt buộc)

```bash
pip install codebase-memory-mcp==0.9.0
codebase-memory-mcp --version
codebase-memory-mcp cli index_repository --repo-path "$(pwd)" --name supergraph --mode moderate
```

`/supergraph:scan` tự build đồ thị lần đầu và quản lý incremental update. Hook `PostToolUse` giữ đồ thị fresh sau mỗi lần ghi file.

### Cài đặt Serena

Serena bổ sung code intelligence cấp LSP: tìm tất cả caller, rename an toàn toàn codebase, type diagnostics. Tuỳ chọn nhưng khuyến nghị.

```bash
# 1. Cài uv (nếu chưa có)
brew install uv   # macOS
# hoặc: curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Cài Serena
uv tool install -p 3.13 serena-agent
```

`.mcp.json` của plugin đã đăng ký Serena với Claude Code — không cần config thêm.

Kiểm tra: chạy `/mcp` trong Claude Code và xác nhận `serena` xuất hiện.

Tất cả skill Supergraph tự dùng Serena khi có sẵn.

---

## Bắt đầu nhanh

```bash
# 1. Bắt đầu session — luôn chạy scan trước
/supergraph:scan

# 2. Analyze — frame vấn đề, đánh giá rủi ro, chọn hướng tiếp cận
#    (bao gồm grill làm rõ yêu cầu + debate 5 persona → GO/CAUTION/STOP)
/supergraph:analyze

# 3. Lên kế hoạch trước khi code
/supergraph:plan

# 4. Implement với TDD
/supergraph:tdd

# 5. Auto-fix sau khi code
/supergraph:fix

# 6. Verify trước khi báo xong
/supergraph:verify

# 7. Review trước khi merge
/supergraph:review
```

**Thay đổi nhỏ (1-2 file, <10 dòng)?** `/supergraph:tdd` → `/supergraph:fix` → `/supergraph:review`

**Yêu cầu mơ hồ hoặc đụng hub/bridge node?** Bắt đầu bằng `/supergraph:analyze` — nó lo phần grill làm rõ, đánh giá rủi ro, và chọn hướng trước khi lên kế hoạch.

---

## Luồng Workflow

```
BẮT ĐẦU SESSION
  → /supergraph:scan
  → Load đồ thị, detect ngôn ngữ, lưu .supergraph-env
         │
         ▼
GIAI ĐOẠN LẬP KẾ HOẠCH
  → /supergraph:analyze   (scope mơ hồ, có hub/bridge node)
  → /supergraph:plan      (blast radius, task breakdown, user duyệt)
  → Lưu vào docs/supergraph/plans/YYYY-MM-DD-*.md
         │
    ┌────┴────────────────────┐
    ▼                         ▼
THAY ĐỔI NHỎ             THAY ĐỔI LỚN
1-2 file, <10 dòng        Nhiều file, phức tạp
/supergraph:tdd           /supergraph:execute
    │                         │ (task song song)
    └────────┬────────────────┘
             ▼
  Mỗi task: RED → GREEN → REFACTOR → commit
             │
             ▼
  /supergraph:fix
  Test + lint + format + đồ thị (tối đa 3 vòng)
             │
             ▼
  /supergraph:integration   (nếu có e2e)
             │
             ▼
  /supergraph:verify        (cổng bằng chứng)
             │
             ▼
  /supergraph:review        (agent độc lập, có đồ thị)
  → APPROVED / NEEDS_CHANGES / BLOCKED
```

---

## Skills

Tất cả skill dùng prefix `/supergraph:` để tránh xung đột với lệnh built-in.

### Workflow Cốt lõi

| Skill                     | Mục đích                                                   | Khi nào dùng                                |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| `/supergraph:scan`        | Load đồ thị, detect ngôn ngữ, lưu env                      | **Việc đầu tiên mỗi session**               |
| `/supergraph:analyze`     | Phân tích rủi ro + grill có cấu trúc + chọn hướng tiếp cận | Scope mơ hồ, có hub/bridge node             |
| `/supergraph:plan`        | Scan đồ thị, blast radius, phân rã task kèm TDD mapping    | Trước khi viết bất kỳ code không tầm thường |
| `/supergraph:execute`     | Dispatch plan đã lưu, điều phối task song song/tuần tự     | Plan đã lưu và được duyệt                   |
| `/supergraph:tdd`         | RED → GREEN → REFACTOR cho từng task                       | Implement tính năng hoặc fix bug            |
| `/supergraph:fix`         | Vòng auto-fix: test + lint + format + kiểm tra đồ thị      | Sau khi code xong, trước khi báo xong       |
| `/supergraph:integration` | Chạy integration và e2e test                               | Sau khi unit test pass                      |
| `/supergraph:verify`      | Cổng bằng chứng — không báo xong nếu không có proof        | Trước done/ready/commit                     |
| `/supergraph:review`      | Agent reviewer độc lập + kiểm tra chéo đồ thị              | Trước khi merge hoặc tạo PR                 |

### Debug & Điều tra

| Skill                      | Mục đích                                                    | Khi nào dùng                                     |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------ |
| `/supergraph:diagnose`     | Debug 6 giai đoạn: tái hiện → giả thuyết → instrument → fix | Bug tồn tại, chưa biết nguyên nhân               |
| `/supergraph:zoom-out`     | Bản đồ module theo từ vựng domain, một lần duy nhất         | Lạc trong code lạ, cần định hướng lại            |
| `/supergraph:architecture` | Báo cáo kiến trúc HTML + Mermaid                            | Pre-refactor, onboarding, lập kế hoạch kiến trúc |

### Lập kế hoạch & Yêu cầu

| Skill                   | Mục đích                                                     | Khi nào dùng                                         |
| ----------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| `/supergraph:prd`       | Chuyển cuộc trò chuyện → PRD có cấu trúc + GitHub Issue      | Yêu cầu đến từ thảo luận, không phải spec chính thức |
| `/supergraph:triage`    | State machine issue → ready-for-agent / needs-info / wontfix | Xử lý backlog                                        |
| `/supergraph:prototype` | Code throwaway để validate hướng tiếp cận                    | Hướng tiếp cận chưa chắc chắn trước khi lập kế hoạch |

### Session & Năng suất

| Skill                 | Mục đích                                                | Khi nào dùng                            |
| --------------------- | ------------------------------------------------------- | --------------------------------------- |
| `/supergraph:handoff` | Nén trạng thái session thành file cho session tiếp theo | Context window cạn kiệt, chuyển session |
| `/supergraph:caveman` | Chế độ nén token ~75%                                   | Session dài, ngân sách token eo hẹp     |

### Chuyên biệt

| Skill                                  | Mục đích                                                                           | Khi nào dùng                             |
| -------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------- |
| `/supergraph:serena`                   | Setup LSP, tham chiếu tool, điều hướng symbol                                      | Refactor phức tạp, phân tích đa file     |
| `/supergraph:database-migrations`      | Schema changes, rollback, zero-downtime                                            | Bất kỳ công việc DB migration            |
| `/supergraph:flutter-ui`               | Dựng Flutter UI từ Figma MCP hoặc ảnh — scan design token, không hard-code giá trị | Dựng UI Flutter từ Figma hoặc screenshot |
| `/supergraph:flutter-dart-code-review` | Checklist review Flutter/Dart 15 mục                                               | Code review Flutter/Dart                 |
| `/supergraph:frontend-design`          | UI production-grade — không có aesthetics AI generic                               | Component và layout web UI               |
| `/supergraph:webapp-testing`           | Web testing dùng Playwright                                                        | E2E web testing                          |

---

## Hook Thông minh

Skill được gọi thủ công. Hook tự động inject context dựa trên tín hiệu quan sát được — không spam, chỉ kích hoạt khi có tín hiệu rõ ràng.

| Hook                     | Kích hoạt khi            | Làm gì                                                                                                     |
| ------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `SessionStart`           | Mỗi session              | Load từ vựng CONTEXT.md; nhắc về handoff gần đây; bật caveman nếu có flag; gợi ý zoom-out khi chưa có plan |
| `UserPromptSubmit`       | Mỗi tin nhắn             | Phát hiện từ khoá caveman → bật nén; phát hiện từ khoá triage → gợi ý triage                               |
| `PostToolUse Bash`       | Sau khi Bash chạy        | Phát hiện pattern test thất bại → inject gợi ý `/supergraph:diagnose`                                      |
| `PreCompact`             | Trước khi nén context    | Kích hoạt nhắc nhở handoff khẩn cấp kèm số lượng task đang active                                          |
| `PreToolUse Write/Edit`  | Trước khi ghi file nguồn | Kiểm tra plan tồn tại và đã được duyệt                                                                     |
| `PostToolUse Write/Edit` | Sau khi ghi file nguồn   | Codebase Memory `auto_watch=true` cập nhật bất đồng bộ                                                     |
| `Stop`                   | Khi Claude dừng          | Báo cáo tiến độ plan + thay đổi chưa commit                                                                |

**Bật caveman vĩnh viễn** (duy trì giữa các session):

```bash
echo "SUPERGRAPH_CAVEMAN=true" >> .supergraph-env
```

---

## Ví dụ Thực tế

**1. Thêm tính năng vào service phức tạp**

> "Thêm xử lý payment webhook vào API"

Scan phát hiện `PaymentService` là hub node kết nối tới 14 module. Plan hiển thị blast radius trước khi viết một dòng. TDD bắt buộc test thất bại trước. Review phát hiện circular dependency trước khi ship.

---

**2. Debug test flaky trên CI**

> "Test fail trên CI nhưng chạy được ở máy local"

`/supergraph:diagnose` — vòng lặp có cấu trúc 6 giai đoạn: tái hiện lỗi, map file liên quan qua graph traversal, kiểm tra race condition và sự khác biệt môi trường, đề xuất fix có bằng chứng.

---

**3. Refactor quy mô lớn an toàn**

> "Đổi tên `UserService` thành `AccountService` trên toàn codebase"

`rename_symbol` của Serena + phân tích impact đồ thị hiển thị mọi caller, test, và interface implementation trước khi rename chạy. Không có import nào bị gãy.

---

**4. Onboarding vào codebase lạ**

> "Tôi mới vào team. Bắt đầu từ đâu?"

`/supergraph:zoom-out` tạo bản đồ module theo từ vựng domain trong vài giây. `/supergraph:architecture` tạo báo cáo HTML + Mermaid có thể chia sẻ với cả team.

---

**5. Xử lý backlog issue lộn xộn**

> "Có 40 issue đang mở. Cái nào thực sự làm được?"

`/supergraph:triage` phân loại từng issue qua state machine — **ready-for-agent**, **needs-info**, hoặc **wontfix** — kèm lý do. Biến backlog hỗn loạn thành sprint queue.

---

**6. Context window sắp hết giữa task**

> "Code được 2 tiếng rồi, context đang dài dần"

`/supergraph:handoff` nén toàn bộ trạng thái session — task plan đang active, thay đổi chưa commit, quyết định đã đưa ra, bước tiếp theo — thành một file compact. Tiếp tục ở session mới trong 30 giây.

---

**7. Database migration không downtime**

> "Thêm cột NOT NULL vào bảng users có 2 triệu dòng"

`/supergraph:database-migrations` hướng dẫn pattern expand-contract: thêm nullable → backfill → thêm constraint → xoá cột cũ. Rollback script ở mỗi bước, chiến lược zero-downtime theo ORM của bạn.

---

## Ngôn ngữ Hỗ trợ

Tự detect từ config file lúc bắt đầu session:

| Config file                   | Stack                | Test                | Lint            | Format       |
| ----------------------------- | -------------------- | ------------------- | --------------- | ------------ |
| `pubspec.yaml`                | Flutter / Dart       | flutter test        | flutter analyze | dart format  |
| `package.json`                | Node.js / TypeScript | jest, vitest, mocha | eslint          | prettier     |
| `composer.json`               | PHP                  | phpunit, pest       | phpstan         | php-cs-fixer |
| `pyproject.toml` / `setup.py` | Python               | pytest              | ruff            | ruff format  |
| `go.mod`                      | Go                   | go test             | golangci-lint   | gofmt        |
| `Cargo.toml`                  | Rust                 | cargo test          | cargo clippy    | cargo fmt    |

---

## Cài đặt cho Team

### 1. Cài plugin

```
/plugin marketplace add https://github.com/datit309/supergraph.git
/plugin install supergraph
```

### 2. Cài MCP dependencies

```bash
pip install codebase-memory-mcp==0.9.0   # bắt buộc
uv tool install -p 3.13 serena-agent           # tuỳ chọn — xem Cài đặt Serena ở trên
```

### 3. Bắt đầu làm việc

Mở project bất kỳ trong Claude Code và chạy:

```
/supergraph:scan
```

Lần đầu sẽ tự build đồ thị. Xong.

---

### Tuỳ chọn: Chia sẻ workflow với cả team

Commit các file sau vào repo để mọi thành viên clone về là dùng được ngay:

**`.mcp.json`** — khai báo MCP server:

```json
{
  "mcpServers": {
    "codebase-memory-mcp": { "command": "codebase-memory-mcp", "args": [] },
    "serena": {
      "command": "serena",
      "args": [
        "start-mcp-server",
        "--context=claude-code",
        "--project-from-cwd"
      ]
    }
  }
}
```

**`CLAUDE.md`** — copy từ CLAUDE.md của plugin đã cài làm điểm khởi đầu, rồi tùy chỉnh cho project.

**`.githooks/pre-commit`** — chạy test/lint trước mỗi commit:

```bash
mkdir -p .githooks
# copy nội dung từ: ~/.claude/plugins/cache/supergraph/supergraph/<version>/.githooks/pre-commit
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

Thêm vào `.gitignore`:

```
.claude/settings.local.json
.supergraph-env
```

### Cái gì commit, cái gì để local

| Đường dẫn                     | Commit?  | Tại sao                                                    |
| ----------------------------- | -------- | ---------------------------------------------------------- |
| `.mcp.json`                   | ✅ Có    | Cấu hình MCP — cả team cần dùng chung                      |
| `CLAUDE.md`                   | ✅ Có    | Hướng dẫn workflow cấp project                             |
| `.codebase-memory/graph.db.zst` | Tuỳ chọn | Artifact bootstrap; index local ở `~/.cache/codebase-memory-mcp` |
| `docs/supergraph/plans/`      | ✅ Có    | Plan là hợp đồng — cả team cùng theo dõi                   |
| `.github/`                    | ✅ Có    | PR templates, CI workflows, issue templates                |
| `.githooks/pre-commit`        | ✅ Có    | Quality gate khi commit                                    |
| `.supergraph-env`             | ⚠️ Tuỳ   | Chứa flag cá nhân như `CAVEMAN` — gitignore nếu dùng riêng |
| `.claude/settings.local.json` | ❌ Không | Quyền hạn tool cá nhân                                     |

Xem [docs/TEAM-SETUP.md](./plugins/supergraph/docs/TEAM-SETUP.md) để có CI/CD pipelines, pre-commit hooks, PR templates, và hướng dẫn onboarding đầy đủ.

---

## Quy tắc Bắt buộc

Các quy tắc này được áp đặt bởi chuỗi skill và hook — không phải tuỳ chọn:

1. Không bao giờ viết code mà không có plan (bỏ qua chỉ với thay đổi tầm thường: <10 dòng, 1 file)
2. Không bao giờ implement mà không có test thất bại trước — TDD là bắt buộc
3. Không bao giờ đọc toàn bộ codebase — dùng blast radius đồ thị thay thế
4. Không bao giờ sửa hub node mà không có user duyệt rõ ràng
5. Không bao giờ bỏ qua vòng auto-fix sau khi code
6. Không bao giờ commit nếu test fail hoặc review trả về CRITICAL
7. Luôn dùng MCP tools đồ thị trước khi giả định quan hệ giữa các file
8. Luôn detect ngôn ngữ trước khi chạy lệnh test/lint
9. Luôn đọc file skill trước khi thực thi từng giai đoạn
10. Luôn lưu plan vào `docs/supergraph/plans/` cho công việc kéo dài nhiều session

---

## Bảng Leo thang

| Điều kiện                         | Hành động                                                 |
| --------------------------------- | --------------------------------------------------------- |
| TDD fail 3 lần trên cùng một task | Đánh dấu `stuck`, bỏ qua, tiếp tục task tiếp theo         |
| Vòng fix fail 3 lần liên tiếp     | DỪNG — báo cáo vấn đề — không bao giờ commit khi đang lỗi |
| Review trả về `NEEDS_CHANGES`     | Quay lại fix (tối đa 2 vòng review)                       |
| Review trả về `BLOCKED`           | Escalate lên người ngay lập tức                           |
| Blast radius > 20 file            | DỪNG — thảo luận với user trước khi tiếp tục              |
| Sửa hub node                      | Yêu cầu user duyệt rõ ràng                                |
| Surprise score > 0.7              | Yêu cầu điều tra và biện minh                             |
| Phát hiện circular dependency mới | Chặn — fix trước khi merge                                |

---

## Cấu trúc Project

```
plugins/supergraph/
├── .claude-plugin/
│   └── marketplace.json        # Plugin manifest (v2.2.0)
├── skills/
│   ├── scan/                   # Load context & build graph
│   ├── analyze/                # Phân tích rủi ro + chọn hướng
│   ├── plan/                   # Tạo plan hướng đồ thị
│   ├── execute/                # Dispatch & điều phối plan
│   ├── tdd/                    # RED → GREEN → REFACTOR
│   ├── fix/                    # Vòng auto-fix
│   ├── integration/            # E2E / integration test
│   ├── verify/                 # Cổng xác minh
│   ├── review/                 # Review cuối cùng
│   ├── diagnose/               # Debug có cấu trúc 6 giai đoạn
│   ├── zoom-out/               # Bản đồ module một lần
│   ├── architecture/           # Báo cáo kiến trúc HTML + Mermaid
│   ├── prd/                    # PRD → GitHub Issues
│   ├── triage/                 # State machine issue
│   ├── prototype/              # Validate hướng tiếp cận throwaway
│   ├── handoff/                # Nén session
│   ├── caveman/                # Chế độ nén token
│   ├── serena/                 # LSP integration
│   ├── database-migrations/    # DB migration patterns
│   ├── flutter-ui/             # Dựng Flutter UI từ Figma/ảnh
│   ├── flutter-dart-code-review/ # Checklist review Flutter/Dart
│   ├── frontend-design/        # UI production-grade
│   └── webapp-testing/         # Playwright web testing
├── agents/
│   ├── plan-writer.md          # Tạo plan, không bao giờ viết code
│   ├── plan-reviewer.md        # Review plan trước khi execute
│   ├── executor.md             # Execute plan, không bao giờ tạo plan
│   └── code-reviewer.md        # Agent review độc lập cuối cùng
├── hooks/
│   ├── session-start           # Load CONTEXT.md, nhắc handoff
│   ├── user-prompt-submit      # Bật/tắt caveman, gợi ý triage
│   ├── post-tool-use-bash      # Phát hiện test thất bại
│   ├── pre-compact             # Nhắc handoff trước khi nén
│   ├── pre-tool-use            # Guard kiểm tra plan
│   ├── post-tool-use           # Auto cập nhật đồ thị sau ghi file
│   ├── stop                    # Báo cáo tiến độ plan
│   └── hooks.json              # Event → script mapping
├── docs/
│   └── TEAM-SETUP.md           # Hướng dẫn onboarding team
├── PRIVACY.md                  # Chính sách bảo mật
├── CHANGELOG.md                # Lịch sử phiên bản
├── CLAUDE.md                   # Nguyên tắc kỹ thuật
└── settings.json               # Quyền hạn + lệnh được phép
```

---

## Bảo mật & Quyền riêng tư

Supergraph là **local-first** — không có server từ xa, không có telemetry, không upload code đi đâu.

Toàn bộ phân tích đồ thị chạy local. Codebase Memory lưu index tại `~/.cache/codebase-memory-mcp`; team có thể chia sẻ `.codebase-memory/graph.db.zst`. Serena cũng chạy local.

Xem [PRIVACY.md](./plugins/supergraph/PRIVACY.md) để đọc chính sách đầy đủ.

---

## Changelog

Xem [CHANGELOG.md](./plugins/supergraph/CHANGELOG.md) để xem lịch sử phiên bản đầy đủ.

**Hiện tại: v2.2.3** — Thêm skill `flutter-ui`, script `bump-version.sh`, cấu hình `.mcp.json` cho plugin, cải thiện GitHub issue templates và release workflow.

**v2.2.0** — Thêm 8 skill mới (diagnose, handoff, triage, caveman, prd, architecture, prototype, zoom-out), hệ thống từ vựng chung CONTEXT.md, 4 hook automation thông minh.

---

## Giấy phép

MIT — xem [LICENSE](./LICENSE) để biết chi tiết.

---

## Liên kết

- **GitHub**: https://github.com/datit309/supergraph
- **Issues & PR**: https://github.com/datit309/supergraph/issues
- **Bảo mật**: [PRIVACY.md](./plugins/supergraph/PRIVACY.md)
- **Cài đặt Team**: [docs/TEAM-SETUP.md](./plugins/supergraph/docs/TEAM-SETUP.md)
- **Changelog**: [CHANGELOG.md](./plugins/supergraph/CHANGELOG.md)
