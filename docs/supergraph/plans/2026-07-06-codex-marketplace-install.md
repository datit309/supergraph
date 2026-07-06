# Plan: Codex Marketplace Install Support

Created: 2026-07-06
Status: pending

## Analysis Decisions
- Approach: Add `.agents/plugins/marketplace.json` as Codex marketplace registry with git-subdir source pointing to `plugins/supergraph`; enrich `.codex-plugin/plugin.json` interface metadata; update docs to use Codex marketplace install.
- Alternatives rejected: keep `install.sh --platform codex` only (worse UX than official Codex marketplace flow).
- Risks: Codex marketplace is early and docs may evolve; keep `install.sh --platform codex` as manual fallback.

---

## Task 1: Add Codex marketplace registry
Status: pending
Risk: low
Dependencies: none

Files:
- Create: .agents/plugins/marketplace.json

Blast radius:
- plugins/supergraph/.codex-plugin/plugin.json

Acceptance:
- `.agents/plugins/marketplace.json` exists and is valid JSON
- File matches exact structure:
  ```json
  {
    "plugins": [
      {
        "name": "supergraph",
        "source": {
          "source": "git-subdir",
          "url": "https://github.com/datit309/supergraph",
          "path": "plugins/supergraph"
        },
        "policy": { "installation": "AVAILABLE" },
        "category": "Productivity"
      }
    ]
  }
  ```
- `plugins[0].source.source` == `"git-subdir"`, `plugins[0].policy.installation` == `"AVAILABLE"`

TDD:
- Behavior: Codex marketplace registry exists with supergraph git-subdir source
- Test file: .agents/plugins/marketplace.json
- Test name: codex-marketplace-registry
- RED command: `test -f .agents/plugins/marketplace.json && echo EXISTS || echo MISSING`
- Expected RED failure: file missing
- Minimal GREEN change: create marketplace.json matching Codex plugin docs
- Refactor candidates: none
- Mocking: none

Steps:
1. RED: verify registry missing
   Command: `test -f .agents/plugins/marketplace.json && echo EXISTS || echo MISSING`
   Expected: FAIL (MISSING)
2. GREEN: create Codex marketplace registry JSON
   Command: `python3 -c "import json; d=json.load(open('.agents/plugins/marketplace.json')); print(d['plugins'][0]['name'], d['plugins'][0]['source']['source'])"`
   Expected: PASS (`supergraph git-subdir`)
3. REFACTOR: none
4. VERIFY:
   - `python3 -m json.tool .agents/plugins/marketplace.json >/dev/null`

Checkpoint:
- Files: `.agents/plugins/marketplace.json`
- Commit: `feat: add Codex marketplace registry`

---

## Task 2: Enrich Codex plugin interface metadata
Status: pending
Risk: low
Dependencies: none

Files:
- Modify: plugins/supergraph/.codex-plugin/plugin.json

Blast radius:
- .agents/plugins/marketplace.json

Acceptance:
- `.codex-plugin/plugin.json` remains valid JSON
- `interface` block has exact additions:
  ```json
  "interface": {
    "displayName": "Supergraph — Graph-Driven AI Workflows",
    "shortDescription": "Evidence-based coding pipeline: scan → plan → TDD → fix → verify → review.",
    "category": "workflow",
    "capabilities": ["skills", "mcp", "hooks"],
    "brandColor": "#6C63FF"
  }
  ```
- Existing `skills`, `agents`, `hooks`, and `mcpServers` fields unchanged

TDD:
- Behavior: Codex plugin manifest exposes install-surface metadata
- Test file: plugins/supergraph/.codex-plugin/plugin.json
- Test name: codex-interface-metadata
- RED command: `python3 -c "import json; d=json.load(open('plugins/supergraph/.codex-plugin/plugin.json')); print('shortDescription' in d.get('interface', {}))"`
- Expected RED failure: prints `False`
- Minimal GREEN change: add interface metadata fields only
- Refactor candidates: none
- Mocking: none

Steps:
1. RED: verify `shortDescription` missing
   Command: `python3 -c "import json; d=json.load(open('plugins/supergraph/.codex-plugin/plugin.json')); print('shortDescription' in d.get('interface', {}))"`
   Expected: FAIL (`False`)
2. GREEN: add interface metadata
   Command: `python3 -c "import json; d=json.load(open('plugins/supergraph/.codex-plugin/plugin.json')); print(d['interface']['shortDescription'])"`
   Expected: PASS
3. REFACTOR: none
4. VERIFY:
   - `python3 -m json.tool plugins/supergraph/.codex-plugin/plugin.json >/dev/null`

Checkpoint:
- Files: `plugins/supergraph/.codex-plugin/plugin.json`
- Commit: `feat: enrich Codex plugin interface metadata`

---

## Task 3: Update Codex install docs to marketplace flow
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
- README Codex section uses `codex plugin marketplace add datit309/supergraph` as primary install command
- README-VI.md Codex section uses Vietnamese equivalent with same command
- README-VI.html Codex section uses same marketplace command
- Manual fallback mentions `plugins/supergraph/install.sh --platform codex`
- `install.sh --platform codex` is not removed

TDD:
- Behavior: docs present Codex marketplace install as primary path
- Test file: README.md
- Test name: codex-marketplace-docs
- RED command: `grep -c "codex plugin marketplace add" README.md README-VI.md README-VI.html || true`
- Expected RED failure: count is 0
- Minimal GREEN change: replace Codex install snippets in docs with marketplace flow and keep manual fallback line
- Refactor candidates: none
- Mocking: none

Steps:
1. RED: verify marketplace command absent
   Command: `grep -c "codex plugin marketplace add" README.md README-VI.md README-VI.html || true`
   Expected: FAIL (0 total matches)
2. GREEN: update Codex install docs
   Command: `grep -n "codex plugin marketplace add" README.md README-VI.md README-VI.html`
   Expected: PASS (3 matches)
3. REFACTOR: none
4. VERIFY:
   - `grep -n "install.sh --platform codex" README.md README-VI.md README-VI.html`

Checkpoint:
- Files: `README.md README-VI.md README-VI.html`
- Commit: `docs: switch Codex install docs to marketplace flow`

---

## Environment Context
- **Language:** JSON + Markdown + HTML
- **Test command:** `python3 -m json.tool` and `grep` assertions
- **Linter command:** none
- **Formatter command:** none
- **Build command:** none
- **Branch:** master
- **Conventional commit style:** `feat:` / `docs:`

**Codebase conventions:** JSON uses 2-space indentation; docs keep English and Vietnamese versions in sync; README-VI.html is a hand-authored styled HTML guide, not generated during this task.

**Graph Context:**
- Blast radius: 5 files | Hub nodes: none
- Bridge nodes: none | Communities crossed: docs/config only
