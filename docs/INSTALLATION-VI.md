# Hướng dẫn cài đặt Supergraph

Hướng dẫn chi tiết từng nền tảng: Claude Code, OpenAI Codex CLI, Google Antigravity, OpenCode, và DeepSeek Harness (DSH).

---

## Cài đặt nhanh 1 dòng lệnh (Khuyến nghị)

macOS, Linux, hoặc WSL:
```bash
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh
```

Windows PowerShell 5.1+:
```powershell
irm https://raw.githubusercontent.com/datit309/supergraph/master/install.ps1 | iex
```

Cài đặt cho nền tảng cụ thể:
```bash
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform [claude|codex|antigravity|opencode|dsh|all]
```

---

## Chi tiết từng nền tảng

### 1. Claude Code
```bash
/plugin marketplace add https://github.com/datit309/supergraph.git
/plugin install supergraph
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
/supergraph:scan
```

### 2. OpenAI Codex CLI
```bash
codex plugin marketplace add datit309/supergraph
codex plugin add supergraph@supergraph
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
/supergraph:scan
```

### 3. Google Antigravity CLI
```bash
git clone https://github.com/datit309/supergraph.git
cd supergraph && plugins/supergraph/install.sh --platform antigravity
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
/supergraph:scan
```

### 4. OpenCode
```bash
git clone https://github.com/datit309/supergraph.git
cd supergraph && plugins/supergraph/install.sh --platform opencode
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
```
Gọi skill trên OpenCode bằng `/skills`.

### 5. DeepSeek Harness (DSH)
```bash
dsh plugin --profile web add github:datit309/supergraph
```
Hoặc cài qua giao diện web DSH (`http://127.0.0.1:3080`) → Settings → Plugins.
