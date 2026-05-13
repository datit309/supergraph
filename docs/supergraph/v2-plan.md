# Supergraph v2.0 — Enhanced Skills Plan

## Goal

Build a superior set of Claude Code skills that replace the current supergraph skills, improving on every dimension over superpowers-main (v5.1.0):
- **Less token waste** — trim fat, keep muscle
- **Higher code correctness** — precise instructions, clearer contracts
- **Faster execution** — fewer ceremony steps, smarter gates
- **Smarter decisions** — adaptive heuristics for context over dogma
- **Better problem solving** — focused debugging, evidence-based verification

## Architecture Overview

Replace the bloated 16-skill/37-file superpowers approach with **9 lean skills** (~60% fewer files, ~40% fewer tokens per invocation):

```
supergraph:           Meta-orchestrator (replaces using-superpowers)
supergraph:context:   Project + graph context
supergraph:brainstorm: Ideation before planning
supergraph:plan:      Implementation plans
supergraph:execute:   Task dispatch with reviews
supergraph:tdd:       Test-driven development
supergraph:debug:     Systematic debugging
supergraph:verify:    Evidence gate
supergraph:branch:    Branch lifecycle
```

## Design Principles (Improvement Over Superpowers)

1.  **Token budget targets** — Each SKILL.md has a strict word limit
2.  **Shared conventions** — One file for shared patterns (Iron Law, Red Flags)
3.  **No narrative examples** — Replace story-like walkthroughs with compact tables
4.  **Adaptive gate** — Simple tasks skip ceremony; complex tasks get full rigor
5.  **Progressive disclosure** — Heavy supplementary files loaded on-demand, not auto-read
6.  **Compressed rationalization** — One-line rebuttals instead of 10-row tables
7.  **Decision tables over flowcharts** — Dot flowcharts are expensive; use compact tables
8.  **No platform adaptation** — Claude Code only; no Copilot/Codex/Gemini baggage
9.  **Test validation moved** — Test pressure files belong in tests/, not polluting skill dirs

## Detailed Skill Changes
### 1. supergraph: (meta orchestrator — replaces using-superpowers)

**Token Target:** ~350 words (vs superpowers ~600)
**Files:** 1 (vs 4 with references)

Improvements over superpowers:
- Remove platform references (copilot-tools.md, codex-tools.md, gemini-tools.md)
- Replace verbose Red Flags table (11 rows) with compact one-liner
- Replace Dot flowchart with numbered priority rules
- Add **adaptive dispatch heuristic**: "If the task is < 10 lines in 1 file, just do it"

### 2. supergraph:context (project detection + graph context)

**Token Target:** ~250 words (vs ~400)
**Files:** 1

Improvements over superpowers:
- Keep project detection but add auto-save to `.supergraph-env`
- Remove the 9 parallel graph tool calls — call only the minimal 3, fetch rest on demand
- Add "quick mode": skip graph entirely for simple 1-file changes

### 3. supergraph:brainstorm (ideation)

**Token Target:** ~300 words (vs ~800 with visual-companion.md)
**Files:** 1 (+ 1 spec-reviewer-prompt.md)

Improvements over superpowers:
- Remove visual-companion.md (287 lines of CSS templates nobody reads)
- Replace Dot flowchart with compact steps
- Keep the hard gate: no implementation before design approval
- Compress 9-step TodoWrite into 5 focused phases

### 4. supergraph:plan (implementation plans)

**Token Target:** ~400 words (vs ~550)
**Files:** 1

Improvements over superpowers:
- Keep mandatory frontmatter
- Keep "No Placeholders" but as a compact 6-sentence list instead of 6 bullet paragraphs
- Replace the large code example template with a compact skeleton
- Keep self-review as a 3-item checklist (was 3 items already, just tighten)

### 5. supergraph:execute (task dispatch — replaces subagent-driven-development + executing-plans)

**Token Target:** ~500 words (vs combined 800+)
**Files:** 1 (+ 3 prompt templates, but leaner)

Improvements over superpowers:
- Merge executing-plans into subagent-driven-development (they overlap heavily)
- Replace the massive 16-node Dot flowchart with a compact step table
- Trim the 80-line narrative example to a 15-line compressed table
- Add **parallel execution heuristic**: "If tasks have zero file overlap, dispatch in parallel"
- Prompt templates trimmed: remove redundant context setup, use inheritance pattern

### 6. supergraph:tdd (test-driven development)

**Token Target:** ~450 words (vs ~700)
**Files:** 1 (vs 2 — drop testing-anti-patterns.md to inline)

Improvements over superpowers:
- Compress the "Why Order Matters" 4 rebuttals into 1 compact paragraph
- Replace 10-row rationalization table with 5 one-liner "Quick Red Flags"
- Keep Good/Bad examples but inline them as compact before/after blocks
- Anti-patterns file merged inline (saves a whole file read)
- Keep Iron Law and core cycle — the essence is essential

### 7. supergraph:debug (systematic debugging)

**Token Target:** ~400 words (vs superpowers ~500 + 6 supplementary)
**Files:** 1 (vs 9 — massive consolidation)

Improvements over superpowers:
- Merge all 6 supplementary files into the main SKILL.md as collapsed sections
- Move test-pressure files — they are training material, not runtime skills
- Keep the 4-phase structure but trim phase descriptions by 40%
- Replace 8-row rationalization table with 3 quick checks
- Remove redundant Dot flowchart (use step table)

### 8. supergraph:verify (verification gate)

**Token Target:** ~300 words (vs ~400)
**Files:** 1

Improvements over superpowers:
- Replace 7-row rationalization table with 3-line "Evidence Rules"
- Keep the common failures table (it's useful) but trim descriptions
- Add **automatic evidence collection**: run the verification before the skill announces
- Keep Iron Law — this skill's essence is non-negotiable

### 9. supergraph:branch (lifecycle — replaces finishing-a-development-branch + using-git-worktrees)

**Token Target:** ~500 words (vs combined ~700)
**Files:** 1 (vs 2)

Improvements over superpowers:
- Merge finishing-a-development-branch + using-git-worktrees (they share 80% of context)
- Replace 16-row quick reference table with 4 essential rules
- Compress common mistakes from 7 items to 4 critical ones
- Keep the provenance-based cleanup logic (it's good)
- Keep the 4-options pattern (tested, works well)

## File Structure
```
.claude/
  skills/
    supergraph/SKILL.md              — Meta orchestrator
    supergraph/context/SKILL.md      — Project + graph context
    supergraph/brainstorm/SKILL.md   — Ideation
    supergraph/brainstorm/spec-reviewer-prompt.md
    supergraph/plan/SKILL.md         — Implementation plans
    supergraph/execute/SKILL.md      — Task dispatch
    supergraph/execute/implementer-prompt.md
    supergraph/execute/spec-reviewer-prompt.md
    supergraph/execute/code-quality-reviewer-prompt.md
    supergraph/tdd/SKILL.md          — Test-driven development
    supergraph/debug/SKILL.md        — Systematic debugging
    supergraph/verify/SKILL.md       — Evidence gate
    supergraph/branch/SKILL.md       — Branch lifecycle
```

Total: **12 files** (vs superpowers' 37 files)

Expected token reduction: **~40% per skill invocation**

## Expected Improvements

| Metric | superpowers | supergraph-v2 | Change |
|--------|-------------|---------------|--------|
| Skills | 16 skills | 9 skills | -44% |
| Files | 37 files | 12 files | -68% |
| Avg words/skill | ~650 | ~390 | -40% |
| Narrative examples | 3 long stories | 0 | -100% |
| Dot flowcharts | 8 diagrams | 0 diagrams | -100% |
| Rationalization tables | 6 tables (50+ rows) | 5 one-liners | -80% |
| Platform baggage | Copilot/Codex/Gemini refs | Claude Code only | -100% |
| Training/test files | 4 test-pressure files | 0 (moved out) | -100% |

## Risk Mitigation
- Keep "Iron Law" framing — proven to work for discipline skills
- Keep two-stage review in execute — spec then quality, not reversed
- Keep hard gate in brainstorm — design before implementation
- Keep hard gate in TDD — test before implementation
- Keep evidence gate in verify — this is the quality safety net
- Keep provenance checks in branch lifecycle — prevents accidental worktree removal
