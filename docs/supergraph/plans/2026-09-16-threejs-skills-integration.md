# Plan: Integrate Three.js 3D Skills
Date: 2026-09-16
Status: completed
Owner: Codex
Review: Approved by plan reviewer; user authorization from request "update thêm skills 3D"

## Environment Context

- Project: `supergraph`
- Root: `/Users/trantandat/GIC/Freelancer/supergraph`
- Branch: `master` (user explicitly authorized implementation)
- Type: Markdown/Bash plugin assets
- Language: Markdown/Bash
- TEST_CMD: `status=0; for test_file in plugins/supergraph/tests/test-*.sh; do bash "$test_file" || status=1; done; exit "$status"`
- LINT_CMD: `status=0; bash -n install.sh || status=1; bash -n plugins/supergraph/install.sh || status=1; for test_file in plugins/supergraph/tests/test-*.sh; do bash -n "$test_file" || status=1; done; exit "$status"`
- FORMAT_CMD: `none`
- BUILD_CMD: `none`
- Graph: `codebase-memory-mcp`, generation `2026-09-16T04:44:29Z`, ready, 1478 nodes / 1978 edges
- Serena: active (`bash` language server)
- SDD: `docs/supergraph/sdd/2026-09-16-sdd-threejs-skills-integration.md`
- Upstream: `https://github.com/cloudai-x/threejs-skills`, ref `main`, commit `b1c623076c661fc9b03dac19292e825a5d106823`

## Analysis Decisions

- Approach: Vendor all ten upstream `SKILL.md` snapshots under `plugins/supergraph/skills/threejs-*` and enforce exact SHA-256 hashes.
- Why: Uses the plugin's existing cross-platform `skills/` discovery contract, works offline after install, and avoids runtime/network coupling.
- Alternatives considered: runtime downloader (rejected: nondeterministic and adds runtime dependency); curated subset (rejected: loses upstream cross-references and coverage); submodule (rejected: unnecessary repository coupling).
- Risks: Upstream `main` can drift; mitigated by commit pin and contract hashes. Imported files are Markdown only; no executable assets or dependencies.
- Graph risk: no runtime hub/bridge modification; `plugin.ts` and hooks remain unchanged.

## Task 1: Add Three.js snapshot contract test
Wave: 1
Status: completed
Risk: low
Dependencies: none
Model: inherit
Spec: `docs/supergraph/sdd/2026-09-16-sdd-threejs-skills-integration.md#31-skill-discovery-contract`

Files:
- Create: `plugins/supergraph/tests/test-threejs-skills-integration.sh`
- Modify: none
- Test: `plugins/supergraph/tests/test-threejs-skills-integration.sh`

Blast radius:
- Test-only; validates ten skill paths, frontmatter names/descriptions, no symlinks, no wrapper README, and pinned SHA-256 values.

Acceptance:
- Test enumerates exactly ten expected `threejs-*` skill directories.
- After the test file is written, test fails because the skill directories do not exist.
- Test exposes source commit and precise hash mismatch diagnostics.
- Test rejects symlinks and any directory entries other than `SKILL.md`.

TDD:
- Behavior: Reject missing, malformed, symlinked, or drifted Three.js skill snapshots.
- Test file: `plugins/supergraph/tests/test-threejs-skills-integration.sh`
- Test name: `Three.js canonical registration contract`
- 🔴 RED command: `bash plugins/supergraph/tests/test-threejs-skills-integration.sh`
- Expected 🔴 RED failure: `FAIL: missing imported skill: plugins/supergraph/skills/threejs-animation/SKILL.md`
- Minimal 🟢 GREEN change: Add the shell contract test with upstream commit and ten SHA-256 expectations.
- Refactor candidates: Reuse the existing Taste contract shape without sharing mutable test helpers.
- Mocking: None.

Steps:
1. 🟡 WRITE TEST — add the contract test with ten expected paths, names, hashes, and extra-entry checks.
   Command: `apply_patch`
   Expected: Test file exists; no skill assets are created.
2. 🔴 RED — run the contract against the current plugin.
   Command: `bash plugins/supergraph/tests/test-threejs-skills-integration.sh`
   Expected: Fails on the first missing imported skill.
3. 🟢 GREEN — not applicable to production assets; validate the test shell syntax before Task 2.
   Command: `bash -n plugins/supergraph/tests/test-threejs-skills-integration.sh`
   Expected: Exit 0.
4. 🔵 REFACTOR — keep assertions deterministic and diagnostics path-specific.
   Command: `bash -n plugins/supergraph/tests/test-threejs-skills-integration.sh`
   Expected: Exit 0.

Checkpoint:
- Files: `plugins/supergraph/tests/test-threejs-skills-integration.sh`
- Commit: `test: add Three.js skill snapshot contract`

## Task 2: Vendor pinned Three.js skill snapshots
Wave: 2
Status: completed
Risk: low
Dependencies: Task 1
Model: inherit
Spec: `docs/supergraph/sdd/2026-09-16-sdd-threejs-skills-integration.md#32-snapshot-integrity-contract`

Files:
- Create:
  - `plugins/supergraph/skills/threejs-animation/SKILL.md`
  - `plugins/supergraph/skills/threejs-fundamentals/SKILL.md`
  - `plugins/supergraph/skills/threejs-geometry/SKILL.md`
  - `plugins/supergraph/skills/threejs-interaction/SKILL.md`
  - `plugins/supergraph/skills/threejs-lighting/SKILL.md`
  - `plugins/supergraph/skills/threejs-loaders/SKILL.md`
  - `plugins/supergraph/skills/threejs-materials/SKILL.md`
  - `plugins/supergraph/skills/threejs-postprocessing/SKILL.md`
  - `plugins/supergraph/skills/threejs-shaders/SKILL.md`
  - `plugins/supergraph/skills/threejs-textures/SKILL.md`
- Modify: none
- Test: `plugins/supergraph/tests/test-threejs-skills-integration.sh`

Blast radius:
- Existing skill discovery on Claude Code, Antigravity, OpenCode, and Codex; no hooks, MCP, or runtime code changes.

Acceptance:
- All ten directories contain the upstream `SKILL.md` at commit `b1c623076c661fc9b03dac19292e825a5d106823`.
- Contract test passes all frontmatter, path, symlink, wrapper, and hash checks.
- Existing plugin manifest `skills: "./skills/"` remains sufficient; no manifest edits are needed.

TDD:
- Behavior: Plugin exposes ten deterministic Three.js skills through its existing skills root.
- Test file: `plugins/supergraph/tests/test-threejs-skills-integration.sh`
- Test name: `Three.js canonical registration contract`
- 🔴 RED command: `bash plugins/supergraph/tests/test-threejs-skills-integration.sh`
- Expected 🔴 RED failure: Missing `threejs-animation/SKILL.md` before import.
- Minimal 🟢 GREEN change: Run the approved skill-installer helper against the pinned upstream commit and destination `plugins/supergraph/skills`.
- Refactor candidates: None; preserve upstream Markdown content byte-for-byte.
- Mocking: None; network fetch happens once at the pinned commit, then tests run locally.

Steps:
1. 🔴 RED — confirm Task 1 detects absent assets.
   Command: `bash plugins/supergraph/tests/test-threejs-skills-integration.sh`
   Expected: Missing-skill failure.
2. 🟢 GREEN — install all ten selected paths at the pinned commit.
   Command: `rtk proxy python3 /Users/trantandat/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo cloudai-x/threejs-skills --ref b1c623076c661fc9b03dac19292e825a5d106823 --path skills/threejs-animation skills/threejs-fundamentals skills/threejs-geometry skills/threejs-interaction skills/threejs-lighting skills/threejs-loaders skills/threejs-materials skills/threejs-postprocessing skills/threejs-shaders skills/threejs-textures --dest plugins/supergraph/skills --method download`
   Expected: Ten skill directories created; no overwrite of existing directories.
3. 🔵 REFACTOR — run the full focused contract and shell syntax checks.
   Command: `bash plugins/supergraph/tests/test-threejs-skills-integration.sh`
   Expected: `PASS: Three.js canonical registration contract`.
4. 🔵 REFACTOR — inspect diff for scope and upstream-only content.
   Command: `git status --short --untracked-files=all -- plugins/supergraph/skills/threejs-* plugins/supergraph/tests/test-threejs-skills-integration.sh`
   Expected: All ten skill files and the contract test are visible, including untracked paths.

Checkpoint:
- Files: ten `plugins/supergraph/skills/threejs-*/SKILL.md` snapshots
- Commit: `feat: add Three.js 3D skills`

## Verification Gate

- Run full test loop from `.supergraph-env`.
- Run `bash -n install.sh plugins/supergraph/install.sh plugins/supergraph/tests/test-*.sh`.
- Run `rtk proxy python3 /Users/trantandat/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/supergraph` after the validator's `yaml` dependency is available.
- Check index coverage for all changed tracked code/test paths; reindex after changes if graph freshness requires it.
- Run `/supergraph:fix`, `/supergraph:integration` (no integration config expected), `/supergraph:verify`, and `/supergraph:review` before claiming completion.

## Execution Log

- Task 1 RED: failed as expected with zero imported Three.js directories.
- Task 2 GREEN: ten snapshots imported from `cloudai-x/threejs-skills@b1c623076c661fc9b03dac19292e825a5d106823`.
- Focused contract: PASS; full test loop: PASS with cache filesystem permission enabled; shell syntax: PASS.
- Integration: no Jest/Vitest/pytest/Cypress/Playwright/Docker integration configuration found; skipped by policy.
- Plugin validator: pre-existing failure in `.codex-plugin/plugin.json` (legacy `agents`/`hooks`, missing required interface metadata); not caused by this plan and intentionally left unchanged.

## Review Log

- Final independent reviewer: `PASS` (Critical 0, Important 0, Minor 0).
- Graph: ready, 1813 nodes / 2325 edges, `cycles_total: 0`.
- Serena diagnostics: empty for the integration test.
