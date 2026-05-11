# supergraph-codex Documentation Update Plan

> **Goal:** Add missing docs to supergraph-codex to match supergraph-claude structure

**Architecture:** Copy documentation files from supergraph-claude to supergraph-codex to ensure both plugins have consistent documentation.

---

## Task 1: Add docs/TEAM-SETUP.md

**Files:**
- Create: `plugins/supergraph-codex/docs/TEAM-SETUP.md`

Copy content from `plugins/supergraph-claude/docs/TEAM-SETUP.md`:
- Quick Start guide
- Git conventions (what's in git vs not)
- Team conventions (commit style, branch strategy, plan files)
- CI/CD Integration (GitHub Actions, Pre-commit hook, PR template)
- Settings (shared vs personal)
- Multi-developer coordination

---

## Task 2: Add CHANGELOG.md

**Files:**
- Create: `plugins/supergraph-codex/CHANGELOG.md`

Copy content from `plugins/supergraph-claude/CHANGELOG.md`:
- Version 1.0.0 features
- Skills list
- Agents list
- Supported languages

---

## Task 3: Add docs/SKILLS.md (bonus)

**Files:**
- Create: `plugins/supergraph-codex/docs/SKILLS.md`

Overview of all 11 skills with:
- Skill name
- Trigger condition
- Purpose
- Key steps

---

## Verification

After all tasks:
1. `ls plugins/supergraph-codex/docs/` should show TEAM-SETUP.md and SKILLS.md
2. `ls plugins/supergraph-codex/CHANGELOG.md` should exist
3. Compare structure with supergraph-claude docs