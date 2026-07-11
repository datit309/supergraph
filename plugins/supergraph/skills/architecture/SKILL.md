---
name: architecture
description: Proactive architecture review — explore codebase structure, generate a self-contained HTML report with Mermaid diagrams and candidate improvements, then grill the findings. Use when planning a large refactor, onboarding to an unfamiliar codebase, or before a major architectural change.
---

# /supergraph:architecture

Three phases: explore → HTML report → grilling loop.

Announce: "🏛️ /supergraph:architecture — mapping codebase structure..."

## Phase 1 — Explore

**1a. Read CONTEXT.md:**
```bash
cat CONTEXT.md 2>/dev/null || echo "No CONTEXT.md"
```

**1b. Codebase Memory overview (optional):**
Use `CBM_PROJECT` with `get_architecture` aspects `overview`, `layers`,
`boundaries`, `clusters`, and `hotspots`. After `get_graph_schema`, run shared
contract recipes `hubs`, `bridges`, `cross-boundary`, and `test-gaps`.
If codebase-memory-mcp is unavailable, label graph evidence `unavailable`, use
Serena/filesystem evidence, and generate Mermaid diagrams from imports.

**1c. Serena structure (optional):**
```
mcp__serena__get_symbols_overview()
```

**1d. Read 3-5 hub node files** — understand actual structure, naming, patterns.

## Phase 2 — Generate HTML Report

Write a self-contained HTML file to `docs/supergraph/architecture-review-<YYYY-MM-DD>.html`.

Structure:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Architecture Review — [Project] — [Date]</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body class="bg-gray-50 p-8 font-sans">

  <!-- Header -->
  <h1>Architecture Review: [Project]</h1>
  <p>[Date] | [N communities] | [N hub nodes] | [N bridge nodes]</p>

  <!-- Current Architecture Diagram -->
  <h2>Current Architecture</h2>
  <div class="mermaid">
    graph TD
      [community nodes and edges from graph data]
  </div>

  <!-- Candidate Improvements -->
  <!-- One card per candidate -->
  <div class="candidate-card">
    <h3>[Candidate N]: [Short name]</h3>
    <span class="badge">[Strong / Worth exploring / Speculative]</span>

    <p><strong>Problem:</strong> [what's wrong now]</p>
    <p><strong>Proposal:</strong> [what to change]</p>

    <h4>Before</h4>
    <div class="mermaid">graph TD; [before state]</div>

    <h4>After</h4>
    <div class="mermaid">graph TD; [after state]</div>

    <p><strong>Impact:</strong> [blast radius, effort, risk]</p>
    <p><strong>Trade-offs:</strong> [pros / cons]</p>
  </div>

  <!-- Knowledge Gaps -->
  <h2>Test Coverage Gaps</h2>
  [table of untested hotspot files]

  <!-- Surprising Connections -->
  <h2>Unexpected Coupling</h2>
  [list of surprise connections with scores]

</body>
</html>
```

**Recommendation strength badges:**
- `Strong` — clear problem, low risk, high ROI
- `Worth exploring` — plausible improvement, some uncertainty
- `Speculative` — possible but needs investigation

Open report automatically:
```bash
open docs/supergraph/architecture-review-<date>.html \
  || xdg-open docs/supergraph/architecture-review-<date>.html \
  || echo "Report saved: docs/supergraph/architecture-review-<date>.html"
```

## Phase 3 — Grilling Loop

For each Strong candidate, ask one focused question:

> "Candidate N proposes [X]. Is this consistent with [constraint from CONTEXT.md / known business rule]?"

Incorporate answers to refine the candidate cards. Mark dismissed candidates as `Rejected — [reason]`.

After grilling, present final prioritized list:
```
Strong candidates (ready for /supergraph:plan):
  1. [Name] — [one-line rationale]

Worth exploring (needs spike first):
  2. [Name] — [open question to resolve]

Speculative (park for later):
  3. [Name] — [what would need to be true]
```

## Report

```
✅ /supergraph:architecture complete
- Report: docs/supergraph/architecture-review-<date>.html
- Communities: N | Hub nodes: N | Bridge nodes: N
- Candidates: N Strong, N Worth exploring, N Speculative
- Next: /supergraph:plan (for Strong candidates) or /supergraph:prototype (for uncertain ones)
```

## Rules

- Always open the HTML file automatically
- Mermaid diagrams must reflect actual graph data, not invented structure
- Speculative candidates must be labeled — never present guesses as strong recommendations
- Update CONTEXT.md if review revealed undocumented architectural invariants:
  ```bash
  printf '\n## <invariant>\n[description]\n' >> CONTEXT.md
  ```
- If graph was empty or unavailable, note "Diagram generated from filesystem structure" in the HTML report header
