# Plan: Multi-Platform Plugin Support (Antigravity CLI + Codex CLI)

Created: 2026-07-05
Status: pending

## Analysis Decisions
- Approach: A (Adapter Layer) — giữ nguyên skills/agents/hooks scripts, thêm platform manifests + adapter files
- Alternatives rejected: B (platforms/ dirs — drift risk), C (build gen — overengineering)
- Skills layer (skills/*.md) portable 100% — không thay đổi
- Risks: Antigravity hooks event names best-effort (docs stub), verify on real install

---

## Task 1: Create AGENTS.md — shared rules file for Antigravity + Codex
Status: completed
Risk: low
Dependencies: none

Files:
- Create: plugins/supergraph/AGENTS.md

Blast radius:
- plugins/supergraph/CLAUDE.md (source to distill from)

Acceptance:
- AGENTS.md tồn tại ở plugin root
- Nội dung platform-neutral (không mention "Claude", dùng "agent" thay thế)
- Bao gồm: mandatory workflow, skill dispatch table, tiered workflow, hard rules
- Antigravity và Codex CLI đều tìm file này ở repo root hoặc global ~/.agents/AGENTS.md

TDD:
- Behavior: AGENTS.md present at plugin root with platform-neutral content
- Test file: plugins/supergraph/AGENTS.md
- Test name: agents-md-exists-and-neutral
- RED command: `test -f plugins/supergraph/AGENTS.md && grep -v "Claude Code" plugins/supergraph/AGENTS.md | head -5`
- Expected RED failure: file not found
- Minimal GREEN change: create file distilled from CLAUDE.md, replace "Claude Code" → "agent", "/supergraph:" skill prefix kept
- Refactor candidates: none

Steps:
1. RED: verify file missing
   Command: `test -f plugins/supergraph/AGENTS.md && echo EXISTS || echo MISSING`
   Expected: FAIL (MISSING)
2. GREEN: create AGENTS.md distilled from CLAUDE.md
   Command: `test -f plugins/supergraph/AGENTS.md && echo EXISTS`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `test -f plugins/supergraph/AGENTS.md && echo OK`
   - `grep -c "Claude Code" plugins/supergraph/AGENTS.md || echo "no Claude-specific refs"`

Checkpoint:
- Files: `plugins/supergraph/AGENTS.md`
- Commit: `feat: add AGENTS.md for Antigravity + Codex platform support`

---

## Task 2: Create Antigravity plugin.json manifest
Status: completed
Risk: low
Dependencies: none

Files:
- Create: plugins/supergraph/plugin.json

Blast radius:
- plugins/supergraph/.claude-plugin/plugin.json (reference for field values)

Acceptance:
- plugin.json exists at plugin root (not inside .claude-plugin/)
- Contains: name, version, description, skills path, agents path, hooks path
- mcp field points to mcp_config.json
- Compatible với Antigravity plugin format (plugin.json at root)

TDD:
- Behavior: plugin.json present at root with required Antigravity fields
- Test file: plugins/supergraph/plugin.json
- Test name: antigravity-plugin-manifest-exists
- RED command: `test -f plugins/supergraph/plugin.json && echo EXISTS || echo MISSING`
- Expected RED failure: file not found
- Minimal GREEN change: create plugin.json adapting fields from .claude-plugin/plugin.json to Antigravity format
- Refactor candidates: none

Steps:
1. RED: verify file missing
   Command: `test -f plugins/supergraph/plugin.json && echo EXISTS || echo MISSING`
   Expected: FAIL (MISSING)
2. GREEN: create plugin.json
   Command: `python3 -c "import json; json.load(open('plugins/supergraph/plugin.json')); print('valid JSON')"`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `python3 -c "import json; d=json.load(open('plugins/supergraph/plugin.json')); print(d['name'], d['version'])"`

Checkpoint:
- Files: `plugins/supergraph/plugin.json`
- Commit: `feat: add Antigravity plugin.json manifest`

---

## Task 3: Create Antigravity hooks.json + mcp_config.json
Status: completed
Risk: medium
Dependencies: Task 2

Files:
- Create: plugins/supergraph/hooks.json
- Create: plugins/supergraph/mcp_config.json

Blast radius:
- plugins/supergraph/hooks/hooks.json (Claude format — reference only)
- plugins/supergraph/.mcp.json (MCP servers — source for mcp_config.json)

Acceptance:
- hooks.json at plugin root (not inside hooks/) — Antigravity reads root-level
- Hook events mapped: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop
- Each hook command references ${ANTIGRAVITY_PLUGIN_ROOT} env var — **UNCONFIRMED** (docs stub; may be ${AGY_PLUGIN_ROOT} or ${GEMINI_PLUGIN_ROOT}). Add `# UNCONFIRMED: verify env var on real install` comment in generated file
- mcp_config.json has code-review-graph + serena servers using Antigravity format (serverUrl or command field)

TDD:
- Behavior: hooks.json and mcp_config.json valid JSON at plugin root
- Test file: plugins/supergraph/hooks.json
- Test name: antigravity-hooks-valid-json
- RED command: `test -f plugins/supergraph/hooks.json && echo EXISTS || echo MISSING`
- Expected RED failure: file not found
- Minimal GREEN change: create hooks.json mapping Claude events → Antigravity event names, with ${ANTIGRAVITY_PLUGIN_ROOT} path
- Refactor candidates: extract shared hook command template if repetitive
- Mocking: none

Steps:
1. RED: verify files missing
   Command: `test -f plugins/supergraph/hooks.json && echo EXISTS || echo MISSING`
   Expected: FAIL (MISSING)
2. GREEN: create hooks.json + mcp_config.json
   Command: `python3 -c "import json; json.load(open('plugins/supergraph/hooks.json')); json.load(open('plugins/supergraph/mcp_config.json')); print('both valid')"`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `python3 -c "import json; d=json.load(open('plugins/supergraph/hooks.json')); print(list(d.get('hooks',d).keys()))"`
   - `python3 -c "import json; d=json.load(open('plugins/supergraph/mcp_config.json')); print(list(d.get('mcpServers',{}).keys()))"`

Checkpoint:
- Files: `plugins/supergraph/hooks.json plugins/supergraph/mcp_config.json`
- Commit: `feat: add Antigravity hooks.json and mcp_config.json`

---

## Task 4: Create Codex .codex-plugin/plugin.json manifest
Status: completed
Risk: low
Dependencies: none

Files:
- Create: plugins/supergraph/.codex-plugin/plugin.json

Blast radius:
- plugins/supergraph/.claude-plugin/plugin.json (reference)

Acceptance:
- .codex-plugin/plugin.json exists
- Contains Codex-required fields: name, version, description, skills (→ ./skills/), hooks (→ ./hooks/), mcpServers (→ ./.mcp.json or inline)
- skills path points to shared skills/ dir (no duplication)
- agents path points to shared agents/ dir

TDD:
- Behavior: .codex-plugin/plugin.json exists with valid Codex manifest structure
- Test file: plugins/supergraph/.codex-plugin/plugin.json
- Test name: codex-plugin-manifest-exists
- RED command: `test -f plugins/supergraph/.codex-plugin/plugin.json && echo EXISTS || echo MISSING`
- Expected RED failure: file not found
- Minimal GREEN change: create .codex-plugin/plugin.json with Codex manifest format
- Refactor candidates: none

Steps:
1. RED: verify missing
   Command: `test -f plugins/supergraph/.codex-plugin/plugin.json && echo EXISTS || echo MISSING`
   Expected: FAIL (MISSING)
2. GREEN: create manifest
   Command: `python3 -c "import json; json.load(open('plugins/supergraph/.codex-plugin/plugin.json')); print('valid')"`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `python3 -c "import json; d=json.load(open('plugins/supergraph/.codex-plugin/plugin.json')); print(d['name'], d['version'])"`

Checkpoint:
- Files: `plugins/supergraph/.codex-plugin/plugin.json`
- Commit: `feat: add Codex .codex-plugin/plugin.json manifest`

---

## Task 5: Create install.sh — multi-platform installer
Status: completed
Risk: medium
Dependencies: Task 1, Task 2, Task 3, Task 4

Files:
- Create: plugins/supergraph/install.sh

Blast radius:
- plugins/supergraph/.claude-plugin/plugin.json
- plugins/supergraph/plugin.json
- plugins/supergraph/.codex-plugin/plugin.json

Acceptance:
- install.sh executable (chmod +x)
- Detects platform: `claude` CLI → install to ~/.claude/plugins/supergraph/; `antigravity`/`agy` CLI → install to ~/.gemini/antigravity-cli/plugins/supergraph/; `codex` CLI → install to .codex-plugin/ in current dir
- Falls back to asking user if no CLI detected
- Symlink-based install (ln -sf) so updates are instant — no copy needed
- Prints clear success message with next steps per platform

TDD:
- Behavior: install.sh detects platform and prints correct install path
- Test file: plugins/supergraph/install.sh
- Test name: install-sh-platform-detection
- RED command: `bash plugins/supergraph/install.sh --dry-run 2>&1 | head -5`
- Expected RED failure: file not found
- Minimal GREEN change: create install.sh with platform detection logic + --dry-run flag that prints target path without writing
- Refactor candidates: extract platform_detect() function

Steps:
1. RED: verify missing
   Command: `test -f plugins/supergraph/install.sh && echo EXISTS || echo MISSING`
   Expected: FAIL (MISSING)
2. GREEN: create install.sh
   Command: `bash plugins/supergraph/install.sh --dry-run`
   Expected: PASS (prints detected platform + target path)
3. REFACTOR: extract platform_detect() if > 40 lines
4. VERIFY:
   - `bash -n plugins/supergraph/install.sh && echo "syntax OK"`
   - `bash plugins/supergraph/install.sh --dry-run`

Checkpoint:
- Files: `plugins/supergraph/install.sh`
- Commit: `feat: add multi-platform install.sh`

---

## Task 6: Update README.md — multi-platform install docs
Status: pending
Risk: low
Dependencies: Task 1, Task 2, Task 3, Task 4, Task 5

Files:
- Modify: README.md

Blast radius:
- README-VI.md (Vietnamese version — sync manually after)

Acceptance:
- README has new "Supported Platforms" section above Prerequisites
- Installation section has 3 tabs/options: Claude Code, Antigravity CLI, Codex CLI
- Each platform shows: install command, MCP setup, first-run command
- Antigravity install: `agy plugin install` or manual path
- Codex install: `codex plugin install` or copy .codex-plugin/
- Note about AGENTS.md for Antigravity + Codex (no CLAUDE.md needed)

TDD:
- Behavior: README contains multi-platform install instructions
- Test file: README.md
- Test name: readme-multiplatform-section
- RED command: `grep -c "Antigravity\|Codex CLI" README.md || echo 0`
- Expected RED failure: 0 matches
- Minimal GREEN change: add Supported Platforms section + expand Installation section
- Refactor candidates: none

Steps:
1. RED: verify section missing
   Command: `grep -c "Antigravity" README.md || echo 0`
   Expected: FAIL (0)
2. GREEN: add multi-platform sections to README.md
   Command: `grep -c "Antigravity" README.md`
   Expected: PASS (> 0)
3. REFACTOR: none
4. VERIFY:
   - `grep -n "Antigravity\|Codex CLI" README.md | head -10`

Checkpoint:
- Files: `README.md`
- Commit: `docs: add multi-platform install docs (Antigravity + Codex CLI)`

---

## Task 7: Update bump-version.sh — include new platform manifests
Status: completed
Risk: low
Dependencies: Task 2, Task 4

Files:
- Modify: bump-version.sh

Blast radius:
- plugins/supergraph/plugin.json (Antigravity manifest)
- plugins/supergraph/.codex-plugin/plugin.json (Codex manifest)

Acceptance:
- bump-version.sh updates 4 files on each run: .claude-plugin/plugin.json, .claude-plugin/marketplace.json, plugin.json, .codex-plugin/plugin.json
- All 4 files end up at the same version after running bump-version.sh
- Script prints updated path for each file

TDD:
- Behavior: bump-version.sh updates Antigravity + Codex manifests alongside Claude manifest
- Test file: bump-version.sh
- Test name: bump-version-updates-all-manifests
- RED command: `grep -c "codex-plugin\|plugin.json" bump-version.sh || echo 0`
- Expected RED failure: 0 (new manifests not referenced)
- Minimal GREEN change: add 2 python3 blocks to bump-version.sh for plugin.json and .codex-plugin/plugin.json
- Refactor candidates: extract bump_json_version() function to avoid 4x repeated python3 block

Steps:
1. RED: verify new manifests not in script
   Command: `grep -c "plugin.json" bump-version.sh`
   Expected: FAIL (only 1 match — .claude-plugin/plugin.json, not new ones)
2. GREEN: add bump blocks for plugin.json + .codex-plugin/plugin.json
   Command: `grep -c "plugin.json" bump-version.sh`
   Expected: PASS (3+ matches)
3. REFACTOR: extract bump_json_version() function if > 50 lines total
4. VERIFY:
   - `bash -n bump-version.sh && echo "syntax OK"`
   - `grep "plugin.json\|codex-plugin" bump-version.sh`

Checkpoint:
- Files: `bump-version.sh`
- Commit: `feat: update bump-version.sh to include Antigravity + Codex manifests`

---

## Environment Context
- **Language:** Bash + JSON + Markdown
- **Test command:** (bash -n / test / grep assertions)
- **Linter command:** none
- **Formatter command:** none
- **Build command:** none
- **Branch:** master
- **Conventional commit style:** feat: / docs: / fix:

**Codebase conventions:**
- JSON files use 2-space indent
- Shell scripts: `#!/usr/bin/env bash`, `set -euo pipefail`
- Hooks use `${CLAUDE_PLUGIN_ROOT}` env var for portable paths
- Plugin manifest fields match `.claude-plugin/plugin.json` names where possible

**Graph Context:**
- Blast radius: 6 files (new files mostly) | Hub nodes: none
- Bridge nodes: none | Communities crossed: plugin infrastructure only
