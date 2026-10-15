# Ví dụ thực tế quy trình Supergraph

Các kịch bản thực tế khi áp dụng pipeline Supergraph trong phát triển phần mềm.

---

## 1. Sửa lỗi phần mềm (`/supergraph:diagnose`)

```bash
/supergraph:scan
/supergraph:diagnose   # Lập giả thuyết khoa học, dò lỗi bằng Serena & Codebase Memory
/supergraph:tdd        # Tạo test tái hiện lỗi (RED) -> sửa code tối thiểu (GREEN)
/supergraph:fix        # Chạy auto-fix loop tự động sửa lint/test
/supergraph:verify     # Thu thập bằng chứng xác minh trước khi commit
```

---

## 2. Phát triển tính năng mới (Wave DAG Execution)

```bash
/supergraph:analyze        # Phân tích rủi ro và phạm vi ảnh hưởng
/supergraph:plan           # Lập kế hoạch kèm contract kiến trúc
/supergraph:execute        # Kích hoạt Supergraph Team, cô lập worktree, chạy song song theo wave
/supergraph:fix            # Kiểm tra và sửa lỗi tự động
/supergraph:browser-agent  # Sinh ma trận QA ISTQB, chạy test E2E/API với agent-browser
/supergraph:verify         # Nghiệm thu bằng chứng
/supergraph:review         # Code review độc lập trước khi merge
```

---

## 3. Refactor kiến trúc lớn

```bash
/supergraph:architecture   # Báo cáo kiến trúc Mermaid, hotspots, chu trình phụ thuộc
/supergraph:plan           # Lập kế hoạch di chuyển kiến trúc
/supergraph:execute        # Thực thi song song qua worktree
/supergraph:vibesec        # Kiểm toán an toàn bảo mật
/supergraph:review         # Phán quyết merge
```
