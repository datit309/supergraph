# Privacy Policy — Supergraph Plugin

**Last updated:** 2026-06-10
**Plugin version:** 2.1.0
**Author:** datit309 (trantandat0919@gmail.com)

---

## Summary

Supergraph is a **local-first plugin**. It does not operate any remote servers, does not collect telemetry, and does not transmit your source code to any third-party service. All analysis runs on your machine.

---

## 1. Data Collected and Where It Lives

| Data | Where it lives | Who can access it |
|------|---------------|-------------------|
| Codebase knowledge graph | `~/.cache/codebase-memory-mcp` | You only |
| Plan files | `docs/supergraph/plans/` in your repo | Your team (git) |
| Session handoff files | Local project directory | You only |
| Serena LSP index | Local memory managed by Serena MCP | You only |
| `.supergraph-env` flags (e.g. `CAVEMAN`) | Local project root | You only |

None of the above is uploaded, synced, or shared by this plugin.

---

## 2. What the Plugin Does NOT Do

- Does **not** send your source code to any remote API operated by this plugin.
- Does **not** collect usage metrics, analytics, or crash reports.
- Does **not** store your code, prompts, or conversation history.
- Does **not** require account registration or authentication.
- Does **not** make network requests on its own.

---

## 3. Third-Party Components

Supergraph integrates with two optional MCP tools. Their own privacy policies apply.

### 3.1 Codebase Memory MCP

- **What it does:** Builds and queries a local AST dependency graph of your codebase.
- **Data scope:** Reads your source files locally to construct the graph. The graph is stored on disk in your project directory.
- **Network:** No network requests. Runs entirely on your machine.
- **Storage:** Local cache at `~/.cache/codebase-memory-mcp`; optional team artifact `.codebase-memory/graph.db.zst` is shared only if you commit it.
- **Source:** [github.com/DeusData/codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp)

### 3.2 Serena (LSP-powered intelligence)

- **What it does:** Provides IDE-level code intelligence (symbol navigation, diagnostics, rename, find-references) via a language server.
- **Data scope:** Reads your source files to build an in-memory LSP index. No data is written outside your project.
- **Network:** No network requests by default. The Serena process runs locally.
- **Source:** [github.com/oraios/serena](https://github.com/oraios/serena)

---

## 4. Claude Code and Anthropic

When you use this plugin inside Claude Code, your prompts and code snippets are processed by Claude (Anthropic). This plugin does not change how Claude handles your data — Anthropic's own privacy policy and data handling practices apply to everything sent to the model.

See: [anthropic.com/privacy](https://www.anthropic.com/privacy)

---

## 5. Plan Files and Team Use

Plan files saved to `docs/supergraph/plans/` are plain Markdown. If you commit them to a shared repository, they become visible to anyone with repository access. They may contain:

- File paths and symbol names from your codebase
- Task descriptions written by you or Claude
- Environment context (project type, language, tool versions)

They do **not** contain secrets, credentials, or raw source code unless you explicitly write them into the plan.

---

## 6. `.supergraph-env` File

This file stores persistent flags (e.g. `SUPERGRAPH_CAVEMAN=true`). It is a plain text file in your project root. Add it to `.gitignore` if you do not want these settings committed to your repository.

---

## 7. No Warranty

This plugin is provided under the MIT License, as-is, without warranty of any kind. See [LICENSE](LICENSE) or the MIT license text for full terms.

---

## 8. Contact

Questions about this privacy policy: trantandat0919@gmail.com
Plugin issues and contributions: [github.com/datit309/supergraph](https://github.com/datit309/supergraph)
