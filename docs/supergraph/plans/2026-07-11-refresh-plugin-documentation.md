# Refresh Supergraph documentation

## Task 1: Clarify provider, workflow, and hook behavior
Status: completed
Risk: low
Dependencies: none
Files:
- Modify: README.md
- Modify: README-VI.md
- Modify: README-VI.html
- Modify: plugins/supergraph/plugin.json
- Modify: plugins/supergraph/.claude-plugin/plugin.json
- Modify: plugins/supergraph/.claude-plugin/marketplace.json
- Modify: plugins/supergraph/.codex-plugin/plugin.json
- Modify: plugins/supergraph/docs/TEAM-SETUP.md
- Test: plugins/supergraph/tests/test-documentation-consistency.sh
- Create: plugins/supergraph/tests/test-documentation-consistency.sh
Blast radius:
- Public plugin descriptions and installation/setup guidance
Acceptance:
- Public descriptions explain Supergraph as a mandatory scan → analyze → plan → TDD → execute → fix → verify → review system, powered by Codebase Memory MCP and optional Serena.
- Documentation explains graph indexing/project identity, blast-radius/cycle/test-gap checks, evidence gates, and platform-specific instruction files.
- Documentation explicitly describes Windows Git Bash dynamic resolution and graceful hook skip when Git Bash is unavailable.
- English README, Vietnamese Markdown/HTML, all plugin metadata including marketplace metadata, and team setup agree on exact markers: `Codebase Memory MCP >= 0.9.0`, optional `Serena`, `scan → analyze → plan → TDD → execute → fix → verify → review`, project/index lifecycle, Windows dynamic Git Bash resolution, and graceful hook skip; stale old graph/hook wording is absent.
TDD:
- Behavior: users can understand what the plugin does, what it requires, and how Windows hooks behave from public docs.
- Test file: plugins/supergraph/tests/test-documentation-consistency.sh
- Test name: validates exact public documentation markers and consistency
- RED command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
- Expected RED failure: stale version/provider/hook markers and missing feature explanations.
- Minimal GREEN change: update docs/metadata and add marker consistency assertions.
- Refactor candidates: align repeated setup language between README and TEAM-SETUP.
- Mocking: none
Steps:
1. RED: add marker/version/provider/platform/hook assertions.
   Command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   Expected: FAIL
2. GREEN: update all listed public descriptions and setup docs.
   Command: `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   Expected: PASS
3. REFACTOR: keep English/Vietnamese structure aligned.
4. VERIFY:
   - `bash plugins/supergraph/tests/test-documentation-consistency.sh`
   - `python3 -m json.tool plugins/supergraph/plugin.json >/dev/null`
Checkpoint:
- Files: `README.md README-VI.md README-VI.html plugins/supergraph/plugin.json plugins/supergraph/.claude-plugin/plugin.json plugins/supergraph/.claude-plugin/marketplace.json plugins/supergraph/.codex-plugin/plugin.json plugins/supergraph/docs/TEAM-SETUP.md plugins/supergraph/tests/test-documentation-consistency.sh`
- Commit: `docs: clarify supergraph capabilities and hooks`

## Environment Context
- **Language:** Markdown, HTML, JSON, Bash
- **Test command:** none configured in `.supergraph-env`
- **Linter command:** none configured in `.supergraph-env`
- **Formatter command:** none configured in `.supergraph-env`
- **Build command:** none configured in `.supergraph-env`
- **Planned validation:** `bash plugins/supergraph/tests/test-documentation-consistency.sh`
- **Branch:** feat/codebase-memory-migration
- **Conventional commit style:** `docs:`

**Codebase conventions:** README English is source structure for Vietnamese docs; plugin metadata uses concise marketplace descriptions; setup docs include copy-paste commands and platform-specific instruction files.

**Graph Context:** documentation-only, low risk; no code hub modified.
