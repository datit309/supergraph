# Supergraph for DeepSeek Harness (DSH)

This plugin integrates Supergraph's evidence-gated AI coding workflow into DeepSeek Harness.

## How it works

1. **Skills**: Symlinks Supergraph skills into `~/.dsh/skills/` (and `~/.agents/skills/`), which are automatically discovered by `@deepseek-ai/dsh-skill-filesystem`.
2. **MCP Integration**: Configures `codebase-memory-mcp` and `serena` MCP servers via `@deepseek-ai/dsh-mcp-client` in `~/.dsh/cordis.patch.yml`.
3. **Instructions**: Provides `AGENTS.md` guidelines loaded by `@deepseek-ai/dsh-agent-instructions`.

## Quick Start

```bash
# From supergraph root:
plugins/supergraph/install.sh --platform dsh

# Or via one-liner:
curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform dsh
```
