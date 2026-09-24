# Supergraph for DeepSeek Harness (DSH)

Standard Cordis plugin and bundle integration for DeepSeek Harness (DSH).

## Features

1. **Cordis Plugin Standard**: Implements `apply(ctx)` with `inject = ['skills']`. Dynamically discovers and registers all 38 Supergraph skills via `ctx.skills.registerProvider()`.
2. **MCP Integration**: Configures `codebase-memory-mcp` and `serena` MCP servers via `@deepseek-ai/dsh-mcp-client`.
3. **Workflow Rules**: Injects `AGENTS.md` guidelines via `ctx.systemPrompt.section()`.

## Installation

### Method 1: DSH Plugin Manager (CLI)

```bash
# Add as a bundle to your active profile (e.g. web, headless):
dsh plugin --profile web add /path/to/supergraph
# or from git:
dsh plugin --profile web add github:datit309/supergraph
```

### Method 2: DSH Web GUI

1. Open DSH Web (`http://127.0.0.1:3080`)
2. Go to **Settings** → **Plugins** (or open Plugin Manager sidebar)
3. Under **Install Bundle**, enter `/path/to/supergraph` or `github:datit309/supergraph`
4. Click **Install**

### Method 3: One-shot CLI Overlay

```bash
dsh --profile web --patch /path/to/supergraph/plugins/supergraph/cordis.patch.yml
```

### Method 4: Installer Script

```bash
plugins/supergraph/install.sh --platform dsh
```
