# Supergraph cho AI Coding Agents

> [English](./README.md) · [Hướng dẫn cài đặt](./docs/INSTALLATION-VI.md) · [Ví dụ thực tế](./docs/EXAMPLES-VI.md) · [Thiết lập nhóm](./plugins/supergraph/docs/TEAM-SETUP.md)

**Biến AI coding agents từ máy sinh code thành hệ thống quy trình kỹ thuật chuẩn mực.**

Supergraph bắt buộc lập kế hoạch, TDD, nghiệm thu bằng chứng, review độc lập và ra quyết định dựa trên đồ thị kiến trúc thông qua đồ thị tri thức và LSP trên Claude Code, OpenAI Codex CLI, Google Antigravity, OpenCode và DeepSeek Harness (DSH).

---

## Supergraph làm gì?

Mọi thay đổi code đều tuân thủ nghiêm ngặt vòng đời kỹ thuật:

`scan → analyze → plan → TDD → execute → fix → verify → review`

- **Đồ thị tri thức & Trí tuệ mã nguồn**: Vận hành bởi [Codebase Memory MCP](https://github.com/DeusData/codebase-memory-mcp) (`>= 0.10.8,<0.11.0`). Lập chỉ mục cục bộ vào `.codebase-memory/graph.db.zst` (cache tại `~/.cache/codebase-memory-mcp`) qua `index_repository`, cung cấp bán kính ảnh hưởng toán học (blast radius), cây gọi hàm, chu trình phụ thuộc và lỗ hổng kiểm thử. [Serena](https://github.com/oraios/serena) cung cấp điều hướng symbol và chẩn đoán LSP.
- **Kiến trúc 7 Subagents chuyên biệt**: Phân tách trách nhiệm độc lập — `plan-writer` (lập kế hoạch), `plan-reviewer` (kiểm tra spec), `executor` (thực thi TDD), `qa-tester` (kiểm thử E2E browser/API), `security-auditor` (kiểm toán bảo mật AppSec), `diagnostician` (gỡ lỗi khoa học), và `code-reviewer` (phán quyết merge độc lập).
- **Trình duyệt tự động hoá như người thật & QA Full-Stack (`browser-agent`)**: Nhân native Rust CDP (`agent-browser`, zero Playwright). Dùng cây trợ năng accessibility tree (`@ref`) siêu nhẹ token, vượt rào chống bot qua user profile thật, lập ma trận test ISTQB 5 chiều (UI + API + giả lập lỗi DB), xuất báo cáo sự cố chuyên nghiệp.
- **Điều phối Đa Agent Đẳng cấp (`supergraph-team`)**: Lập lịch nhiệm vụ DAG theo wave với git worktree cô lập tuyệt đối và dashboard giám sát thời gian thực (`:3333`).

### Hành vi Hook trên Windows
Trên Windows, `hooks/run-hook.cmd` tự tìm Git Bash động qua các đường dẫn chuẩn và user. Nếu không tìm thấy Git Bash, hooks skipped kèm cảnh báo nhẹ và không chặn thực thi của agent.

---

## Nền tảng hỗ trợ

| Nền tảng | Cấu hình | File chỉ dẫn |
|---|---|---|
| **Claude Code** | Marketplace / Plugin | `CLAUDE.md` |
| **OpenAI Codex CLI** | Marketplace / Cài đặt cục bộ | `AGENTS.md` |
| **Google Antigravity** | Cài đặt cục bộ | `AGENTS.md` |
| **OpenCode** | Cài đặt cục bộ (`/skills`) | `OPENCODE.md` |
| **DeepSeek Harness (DSH)** | Native Cordis Bundle (`cordis.patch.yml`) | `AGENTS.md` |

---

## Cài đặt nhanh (1 dòng lệnh)

macOS, Linux, hoặc WSL:
```bash
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh
```

Windows PowerShell 5.1+:
```powershell
irm https://raw.githubusercontent.com/datit309/supergraph/master/install.ps1 | iex
```

*Bảo mật: Luôn kiểm tra nội dung script cài đặt trước khi pipe vào shell.*

Cài đặt cho từng nền tảng cụ thể:
```bash
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform [claude|codex|antigravity|opencode|dsh|all]
```

### Thông báo cập nhật tự động
Supergraph kiểm tra bản mới tại SessionStart (tối đa 24h một lần). Lệnh cập nhật:
```text
Claude Code: /plugin marketplace update supergraph
Codex: codex plugin marketplace upgrade supergraph
Antigravity: curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform antigravity
OpenCode: curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform opencode
DSH: dsh plugin --profile web update supergraph
```
Đặt `SUPERGRAPH_UPDATE_CHECK=false` để tắt kiểm tra. Lưu ý: OpenCode hiện chưa cung cấp hook SessionStart.

👉 **Chi tiết cài đặt thủ công và từng nền tảng xem tại [docs/INSTALLATION-VI.md](./docs/INSTALLATION-VI.md).**

---

## Cấu hình MCP

```bash
# 1. Codebase Memory MCP (Bắt buộc)
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
codebase-memory-mcp cli index_repository --repo-path "$(pwd)" --name supergraph --mode moderate

# 2. Serena MCP (Tùy chọn, điều hướng symbol LSP)
uv tool install -p 3.13 serena-agent

# 3. Supergraph Team MCP & Browser Agent (Tích hợp sẵn)
# Tự động đóng gói trên mọi nền tảng với live dashboard (:3333).
```

---

## Khởi động nhanh

```bash
/supergraph:scan           # 1. Bắt đầu phiên — nạp ngữ cảnh đồ thị
/supergraph:analyze        # 2. Phân tích bài toán & bán kính rủi ro
/supergraph:plan           # 3. Tạo kế hoạch thực thi chi tiết
/supergraph:execute        # 4. Thực thi song song qua git worktree & TDD
/supergraph:fix            # 5. Vòng lặp tự sửa lỗi (test/lint)
/supergraph:browser-agent  # 6. Kiểm thử E2E Browser & API (Rust CDP)
/supergraph:verify         # 7. Thu thập bằng chứng nghiệm thu
/supergraph:review         # 8. Review độc lập trước khi merge
```

👉 **Xem các ví dụ thực tế chi tiết tại [docs/EXAMPLES-VI.md](./docs/EXAMPLES-VI.md).**

---

## Danh mục Skills

| Skill | Mục đích | Khi nào dùng |
|---|---|---|
| `/supergraph:scan` | Quét cấu trúc dự án, nạp đồ thị Codebase Memory | Đầu mỗi phiên làm việc |
| `/supergraph:explore` | Khám phá và nghiên cứu kiến trúc sâu | Khi cần tìm hiểu code, không sửa đổi |
| `/supergraph:analyze` | Phân tích rủi ro đồ thị, blast radius, chọn hướng | Yêu cầu mơ hồ, chạm hub/bridge |
| `/supergraph:sdd` | Tài liệu thiết kế hệ thống (SDD) kèm contract | Yêu cầu kiến trúc trang trọng |
| `/supergraph:plan` | Lập kế hoạch chi tiết gắn contract kiến trúc | Trước khi viết bất kỳ đoạn code nào |
| `/supergraph:tdd` | Quy trình TDD nghiêm ngặt (RED → GREEN) | Khi triển khai tính năng hoặc sửa bug |
| `/supergraph:execute` | Thực thi kế hoạch wave DAG đa worker qua worktree | Khi thực thi plan đã duyệt |
| `/supergraph:fix` | Vòng lặp tự động sửa lỗi (tests, lint, format) | Ngay sau khi code xong |
| `/supergraph:integration`| Kiểm thử tích hợp, contract API, cơ sở dữ liệu | Sau khi unit test đã pass |
| `/supergraph:browser-agent`| Kiểm thử QA ISTQB & lái browser như người thật | Test E2E web/API, vượt anti-bot |
| `/supergraph:vibesec` | Kiểm toán bảo mật chuyên sâu (OWASP, IDOR, SQLi) | Review bảo mật các endpoint nhạy cảm |
| `/supergraph:verify` | Cổng nghiệm thu bằng chứng tươi mới | Trước khi tuyên bố xong hoặc commit |
| `/supergraph:review` | Review code độc lập & đưa phán quyết merge | Trước khi merge |
| `/supergraph:diagnose` | Quy trình 6 pha gỡ lỗi khoa học | Bug phức tạp chưa rõ nguyên nhân |
| `/supergraph:serena` | Điều hướng symbol LSP và refactor an toàn | Refactor cross-file phức tạp |
| `/supergraph:zoom-out` | Bản đồ mô-đun và từ vựng nghiệp vụ | Khi bị lạc trong codebase lạ |
| `/supergraph:architecture`| Báo cáo kiến trúc HTML kèm sơ đồ Mermaid | Pre-refactor hoặc khi tiếp nhận dự án |
| `/supergraph:handoff` | Nén ngữ cảnh phiên làm việc | Khi chuyển phiên hoặc đổi context |
| `/supergraph:caveman` | Chế độ nén token (~75% dung lượng) | Phiên làm việc dài, tiết kiệm token |

---

## Bộ 7 Subagents chuyên biệt

1. **`plan-writer`:** Phân tích đồ thị và lập kế hoạch (không viết code).
2. **`plan-reviewer`:** Review độc lập kế hoạch về độ đầy đủ và đúng spec.
3. **`executor`:** Thực thi nhiệm vụ trong git worktree cô lập với TDD.
4. **`qa-tester`:** Sinh ma trận QA ISTQB và chạy test tự động hóa E2E & API.
5. **`security-auditor`:** Kiểm toán diff theo OWASP Top 10, IDOR, injection, secret.
6. **`diagnostician`:** Cô lập repro tối thiểu và chẩn đoán nguyên nhân gốc rễ bug.
7. **`code-reviewer`:** Review độc lập diff cuối cùng trước khi merge.

---

## Thiết lập nhóm & Cộng tác Đa Agent

Supergraph Team điều phối luồng DAG đa worker không xung đột file:
- **Worktree Isolation:** Mỗi task chạy trong git worktree riêng (`.supergraph/worktrees/`).
- **Live Monitor Dashboard:** Theo dõi DAG thời gian thực tại `http://127.0.0.1:3333`.

👉 **Xem hướng dẫn thiết lập nhóm tại [plugins/supergraph/docs/TEAM-SETUP.md](./plugins/supergraph/docs/TEAM-SETUP.md).**

---

## Luật Bất Di Bất Dịch (Hard Rules)

1. KHÔNG BAO GIỜ code khi chưa có plan được duyệt.
2. KHÔNG BAO GIỜ viết code triển khai khi chưa có test RED thất bại.
3. KHÔNG BAO GIỜ sửa node hub khi chưa có người dùng phê duyệt.
4. KHÔNG BAO GIỜ bỏ qua vòng lặp auto-fix.
5. KHÔNG BAO GIỜ commit khi test hỏng hoặc review có lỗi CRITICAL.
6. LUÔN LUÔN dùng công cụ đồ thị (`search_graph`, `trace_path`) trước khi suy đoán quan hệ.
7. LUÔN LUÔN kiểm thử giao diện/API bằng `browser-agent` (Rust CDP, zero Playwright).

---

## Giấy phép & Quyền riêng tư

- **Local-First & Bảo mật:** Đồ thị tri thức và session trình duyệt lưu trữ 100% cục bộ trên máy bạn. Không gửi code ra ngoài.
- **Giấy phép:** MIT License. © 2026 datit309.
