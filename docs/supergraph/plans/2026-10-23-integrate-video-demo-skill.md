# Plan: Tích hợp bộ skill video-demo vào Supergraph

> Objective: Tích hợp hoàn chỉnh bộ skill `video-demo` (từ repo https://github.com/nilbuild/video-demo của Kamran Ahmed) vào Supergraph, biến Supergraph thành nền tảng tự động quay video demo web app có thuyết minh giọng nói (voice-over local với Kokoro TTS), zoom camera mượt mà, chuyển động chuột tự nhiên, và chụp ảnh Retina screenshots cho landing page / tài liệu tiếp thị.

---

## 1. Kiến trúc & Hợp đồng (Architecture & Contracts)

### Vị trí lưu trữ trong Supergraph
- Skill folder: `plugins/supergraph/skills/video-demo/`
  - `SKILL.md`: Đặc tả skill chuẩn Supergraph (hỗ trợ `/supergraph:video-demo` trên Claude/Codex và `/video-demo` trên DSH).
  - `engine/`: Bộ engine chạy Playwright headless, render video 1080p60 bằng ffmpeg (VideoToolbox trên macOS, libx264 trên Linux), voice synthesizer (`voice.ts`), camera coordinator (`stage.ts`), zoom/spotlight actor (`actor.ts`), video stitcher (`stitch.ts`).
  - `scripts/`:
    - `scripts/demo`: Executable script khởi chạy engine.
    - `scripts/doctor.sh`: Kiểm tra môi trường (Node >= 22.18, ffmpeg, nice, playwright chromium, uv, Kokoro model).
    - `scripts/install.sh`: Cài đặt engine runtime và Playwright Chromium.
    - `scripts/install-voice.sh`: Tải và cài đặt Kokoro ONNX model voice local (~350MB).
    - `scripts/scaffold.mjs`: Khởi tạo workspace quay demo độc lập cho web app mà không chạm vào source code gốc của app.
    - `scripts/say.sh`, `scripts/gaps.mjs`, `scripts/probe-fps.mjs`.
  - `references/`: Toàn bộ 7 tài liệu tham chiếu (`capture.md`, `config.md`, `mocking.md`, `narration.md`, `runs.md`, `scenes.md`, `troubleshooting.md`).
  - `template/`: Template cấu hình và code kịch bản quay demo (`demo.config.ts`, `mock.ts`, `ui.ts`, `scenes/`).
  - `package.json`: Khai báo exports cho `./define`, `./ready`, `./scene`, `./actor`, `./config`.

### CLI & Binary Integration
- Root `package.json` & `plugins/supergraph/package.json`:
  - Thêm `bin`: `"sg-video-demo": "./plugins/supergraph/skills/video-demo/scripts/demo"` (hoặc `"./skills/video-demo/scripts/demo"`).

### DSH & Ecosystem Integration
- Symlink vào `~/.dsh/skills/video-demo` để DSH phát hiện tức thì.
- Cập nhật tài liệu: `AGENTS.md`, `CLAUDE.md`, `README.md`, `README-VI.md`, `DSH.md`, `docs/EXAMPLES.md`, `docs/EXAMPLES-VI.md`, `plugins/supergraph/SKILL.md`.

---

## 2. Các Task Thực Thi (Wave DAG)

### Wave 1: TDD Contract Test
- **Task ID**: `task-1-video-demo-contract-test`
- **File**: `plugins/supergraph/tests/test-video-demo-skill.mjs`
- **Criteria**: Kiểm tra file `SKILL.md` tồn tại, đúng frontmatter, scripts có quyền thực thi (`chmod +x`), engine và templates đầy đủ, bin được khai báo trong package.json.

### Wave 2: Copy & Hoàn Thiện Bộ Skill video-demo
- **Task ID**: `task-2-integrate-video-demo-files`
- **File**: `plugins/supergraph/skills/video-demo/*`
- **Criteria**: Sao chép toàn bộ source từ `/tmp/video-demo`, chuẩn hóa `SKILL.md` theo format Supergraph, bảo toàn 100% logic engine và template.

### Wave 3: Khai Báo Binary & Symlink DSH
- **Task ID**: `task-3-cli-bin-and-dsh-symlink`
- **Files**: `package.json`, `plugins/supergraph/package.json`, `~/.dsh/skills/video-demo`
- **Criteria**: Thêm binary `sg-video-demo`, tạo symlink trong `~/.dsh/skills/`, chạy `npm test`.

### Wave 4: Cập Nhật Tài Liệu Toàn Diện
- **Task ID**: `task-4-update-documentation`
- **Files**: `AGENTS.md`, `CLAUDE.md`, `README.md`, `README-VI.md`, `DSH.md`, `docs/EXAMPLES.md`, `plugins/supergraph/SKILL.md`
- **Criteria**: Bổ sung bảng skills, mô tả công dụng, cách sử dụng lệnh và ví dụ thực tế.

### Wave 5: Kiểm Thử & Nghiệm Thu
- **Task ID**: `task-5-verify-and-doctor`
- **Criteria**: Chạy `npm test` (toàn bộ 37+ tests pass), chạy `doctor.sh`, cập nhật plugin trong profile web DSH.
