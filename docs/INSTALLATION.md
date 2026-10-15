# Supergraph Installation Guide

Complete platform-by-platform setup guide for Claude Code, OpenAI Codex CLI, Google Antigravity, OpenCode, and DeepSeek Harness (DSH).

---

## One-Command Quick Install (Recommended)

macOS, Linux, or WSL:
```bash
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh
```

Windows PowerShell 5.1+:
```powershell
irm https://raw.githubusercontent.com/datit309/supergraph/master/install.ps1 | iex
```

To install for a specific platform:
```bash
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform [claude|codex|antigravity|opencode|dsh|all]
```

---

## Detailed Platform Setup

### 1. Claude Code

```bash
# Install from Git marketplace (recommended)
/plugin marketplace add https://github.com/datit309/supergraph.git
/plugin install supergraph

# Or install from local checkout
git clone https://github.com/datit309/supergraph.git
/plugin marketplace add ./supergraph
/plugin install supergraph

# Setup MCP & verify
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
/supergraph:scan
```

### 2. OpenAI Codex CLI

```bash
# Add marketplace & install plugin
codex plugin marketplace add datit309/supergraph
codex plugin add supergraph@supergraph

# Or manual install from checkout
git clone https://github.com/datit309/supergraph.git
cd supergraph
plugins/supergraph/install.sh --platform codex

# Setup MCP & verify
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
/supergraph:scan
```

### 3. Google Antigravity CLI

```bash
git clone https://github.com/datit309/supergraph.git
cd supergraph
plugins/supergraph/install.sh --platform antigravity

# Setup MCP & verify
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
/supergraph:scan
```

### 4. OpenCode

```bash
git clone https://github.com/datit309/supergraph.git
cd supergraph
plugins/supergraph/install.sh --platform opencode

# Setup MCP & verify
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
```
Skills are symlinked to `~/.config/opencode/skills/`. OpenCode uses `OPENCODE.md`. Invoke skills via `/skills`.

### 5. DeepSeek Harness (DSH)

#### Option A: Native Bundle via CLI or GUI (Recommended)
```bash
dsh plugin --profile web add github:datit309/supergraph
```
Or in DSH Web GUI (`http://127.0.0.1:3080`):
1. Navigate to **Settings** → **Plugins**.
2. Under **Install Bundle**, enter `github:datit309/supergraph`.
3. Click **Install**. Activates immediately via HMR.

#### Option B: Symlink Setup
```bash
plugins/supergraph/install.sh --platform dsh
```

---

## MCP Services Configuration

### 1. Codebase Memory MCP
```bash
pip install 'codebase-memory-mcp>=0.10.8,<0.11.0'
codebase-memory-mcp cli index_repository --repo-path "$(pwd)" --name supergraph --mode moderate
```

### 2. Serena MCP (LSP Intelligence)
```bash
uv tool install -p 3.13 serena-agent
```

### 3. Supergraph Team MCP (Built-in)
Automatically configured via stdio in all platform manifests. Launch UI at `http://127.0.0.1:3333` via `sg_team_ui`.
