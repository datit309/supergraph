# Plan: OpenCode Platform Support

Created: 2026-07-06
Status: pending

## Analysis Decisions
- Approach: A (config-only) — opencode.json với instructions + MCP; symlink skills qua install.sh; docs
- Alternatives rejected: B (full JS npm plugin with hooks — different toolchain, YAGNI)
- Skills format identical across platforms — no changes needed
- Hooks skipped on OpenCode (uses JS/TS paradigm); docs note limitation

---

## Task 1: Create OpenCode .opencode-plugin config
Status: pending
Risk: low
Dependencies: none

Files:
- Create: plugins/supergraph/.opencode-plugin/opencode.json

Blast radius:
- plugins/supergraph/.codex-plugin/plugin.json (reference for MCP commands)

Acceptance:
- `plugins/supergraph/.opencode-plugin/opencode.json` exists and is valid JSON
- `instructions` array: `["./AGENTS.md"]`
- `mcp` key with code-review-graph (stdio) + serena (stdio, --context=opencode)
- MCP `enabled: true` for both servers

TDD:
- Behavior: OpenCode config JSON at plugin root with MCP + instructions
- Test file: plugins/supergraph/.opencode-plugin/opencode.json
- Test name: opencode-config-exists
- RED command: `test -f plugins/supergraph/.opencode-plugin/opencode.json && echo EXISTS || echo MISSING`
- Expected RED failure: file missing
- Minimal GREEN change: create opencode.json with instructions + MCP config
- Refactor candidates: none
- Mocking: none

Steps:
1. RED: verify file missing
   Command: `test -f plugins/supergraph/.opencode-plugin/opencode.json && echo EXISTS || echo MISSING`
   Expected: FAIL (MISSING)
2. GREEN: create file with instructions + MCP
   Command: `python3 -c "import json; d=json.load(open('plugins/supergraph/.opencode-plugin/opencode.json')); print(d['instructions'], list(d['mcp'].keys()))"`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `python3 -m json.tool plugins/supergraph/.opencode-plugin/opencode.json >/dev/null && echo valid`
   - `python3 -c "import json; d=json.load(open('plugins/supergraph/.opencode-plugin/opencode.json')); assert d['mcp']['serena']['command']=='serena'"`

Checkpoint:
- Files: `plugins/supergraph/.opencode-plugin/opencode.json`
- Commit: `feat: add OpenCode plugin config (instructions + MCP)`

---

## Task 2: Add opencode platform to install.sh
Status: pending
Risk: low
Dependencies: Task 1

Files:
- Modify: plugins/supergraph/install.sh

Blast radius:
- plugins/supergraph/.opencode-plugin/opencode.json

Acceptance:
- `--platform opencode` accepted in argument parser
- `platform_detect()` includes opencode case
- Target: `.opencode/plugins/supergraph`
- Install: symlink skills + AGENTS.md + opencode.json into target dir
- `next_steps()` prints OpenCode-specific instructions
- `usage()` updated: `claude|antigravity|codex|opencode`
- `bash -n` passes

TDD:
- Behavior: install.sh accepts --platform opencode and symlinks config
- Test file: plugins/supergraph/install.sh
- Test name: install-sh-opencode-platform
- RED command: `grep -c "opencode" plugins/supergraph/install.sh`
- Expected RED failure: 0 matches
- Minimal GREEN change: add opencode case to every switch block + usage
- Refactor candidates: none
- Mocking: none

Steps:
1. RED: verify opencode absent
   Command: `grep -c "opencode" plugins/supergraph/install.sh || true`
   Expected: FAIL (0)
2. GREEN: add opencode support
   Command: `bash plugins/supergraph/install.sh --dry-run --platform opencode`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `bash -n plugins/supergraph/install.sh && echo syntax OK`
   - `bash plugins/supergraph/install.sh --dry-run --platform opencode`

Checkpoint:
- Files: `plugins/supergraph/install.sh`
- Commit: `feat: add opencode platform to installer`

---

## Task 3: Multi-platform docs update
Status: pending
Risk: low
Dependencies: Task 1, Task 2

Files:
- Modify: README.md
- Modify: README-VI.md
- Modify: README-VI.html

Blast radius:
- plugins/supergraph/install.sh

Acceptance:
- README Supported Platforms table has OpenCode row: "OpenCode | Local installer | AGENTS.md"
- New "Option 4 — OpenCode" install section with marketplace + install commands
- README-VI.md matching Vietnamese version
- README-VI.html matching HTML version
- OpenCode docs note: hooks unavailable (JS paradigm different); skills + MCP work via manual invocation
- `install.sh --platform opencode` shown as primary method

TDD:
- Behavior: docs cover OpenCode install
- Test file: README.md
- Test name: docs-opencode-section
- RED command: `grep -c "OpenCode\|opencode" README.md README-VI.md README-VI.html || true`
- Expected RED failure: 0 matches
- Minimal GREEN change: add OpenCode row to Supported Platforms table + Option 4 section in all 3 docs
- Refactor candidates: none
- Mocking: none

Steps:
1. RED: verify OpenCode absent
   Command: `grep -c "OpenCode\|opencode" README.md README-VI.md README-VI.html || true`
   Expected: FAIL (all 0)
2. GREEN: add OpenCode sections
   Command: `grep -n "OpenCode\|opencode" README.md README-VI.md README-VI.html`
   Expected: PASS (matches in all 3)
3. REFACTOR: none
4. VERIFY:
   - `grep "install.sh --platform opencode" README.md README-VI.md README-VI.html`

Checkpoint:
- Files: `README.md README-VI.md README-VI.html`
- Commit: `docs: add OpenCode install docs`

---

## Environment Context
- **Language:** JSON + Bash + Markdown + HTML
- **Test command:** `python3 -m json.tool`, `bash -n`, `grep` assertions
- **Linter command:** none
- **Formatter command:** none
- **Build command:** none
- **Branch:** master
- **Conventional commit style:** `feat:` / `docs:`

**Codebase conventions:** JSON files use 2-space indent; installer uses `bash case` pattern for each platform; docs keep EN/VI sync.

**Graph Context:**
- Blast radius: 5 files | Hub nodes: none
- Bridge nodes: none | Communities crossed: docs/config only
