---
name: analyze
description: Risk analysis and approach selection before planning. Use when requirements are ambiguous, approaches vary, or work touches hub/bridge nodes. Skip for typo fixes.
mcp: code-review-graph
---

# /supergraph:analyze

Analyze first, implement never. No code until approach is approved.

Announce: "🔍 /supergraph:analyze — framing problem, checking graph risk..."

## When

- Ambiguous requirements
- Multiple valid approaches
- Task spans modules
- Graph shows high blast-risk (hub/bridge nodes)
- User says "how should I..." or "what's the best way..."

Skip for: typo fixes, config changes, clear mechanical edits.

## Workflow

**1. Frame the problem:**
- Goal: [one sentence]
- Known constraints
- Open questions

**2. Check graph risk:**
Reuse graph context from `/supergraph:scan`. Only call if targets are identified:
```
mcp__code-review-graph__get_impact_radius_tool(files=[likely_targets], depth=2)
```
If files involve hub/bridge nodes → flag risk.

**2b. Serena dependency check (optional):**
For each likely target symbol:
```
mcp__serena__find_referencing_symbols(symbol=<likely_target>)
```
Adds symbol-level callers that graph may not surface. Results enrich approach comparison in step 3.
Skip if Serena unavailable.

**3. Propose 2-3 approaches:**
For each: pros, cons, risk level, effort. Prefer minimal viable.

**4. Ask focused questions (one at a time):**
Only if the answer changes direction.

**5. Recommend and hand off:**
Present recommendation. Once approved, summarize decisions into an analysis block in the plan file or prompt context:
```markdown
## Analysis Decisions
- Approach: [chosen] | Why: [reason]
- Alternatives considered: [list] | Risks: [list]
```
→ invoke `/supergraph:plan`

## Rules
- No implementation during analyze
- Don't over-analyze for hypothetical futures
- Always end with: "Shall I create the plan?" → invoke `/supergraph:plan`
