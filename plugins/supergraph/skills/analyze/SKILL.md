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

**0. Read CONTEXT.md (if exists):**
```bash
cat CONTEXT.md 2>/dev/null | head -60
```
Use existing domain vocabulary in all analysis — never invent new terms for concepts already named.

**1. Frame the problem:**
- Goal: [one sentence]
- Known constraints
- Open questions

**1b. Grill the user (if requirements are ambiguous):**
Ask ONE question at a time. After each answer, decide: enough info → continue, or another question needed.

For each question, offer a recommended answer:
> "What's the priority here — consistency or performance? (Recommended: consistency — easier to optimize later)"

Stop grilling when: goal is unambiguous AND constraints are clear AND approach won't reverse on new info.
Max 3 questions before proceeding with best available information.

**2. Check graph risk:**
Reuse graph context from `/supergraph:scan`. Only call if targets are identified:
```
mcp__code-review-graph__get_impact_radius_tool(files=[likely_targets], depth=2)
```
If files involve hub/bridge nodes → flag risk.

**2b. Serena dependency check (optional):**
If `/supergraph:scan` was not run this session, call `mcp__serena__initial_instructions()` first.
For each likely target symbol:
```
mcp__serena__find_referencing_symbols(symbol=<likely_target>)
mcp__serena__find_implementations(symbol=<likely_target>)
```
`find_referencing_symbols` — all callers/usages. `find_implementations` — all concrete impls of interfaces/abstract classes. Results enrich approach comparison in step 3.
Skip gracefully if Serena unavailable — log "Serena unavailable, skipping dependency check".

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

Update CONTEXT.md if analysis crystallized new domain terms:
```bash
printf '\n## <term>\n[definition]\n' >> CONTEXT.md
```

→ invoke `/supergraph:plan`

## Rules
- No implementation during analyze
- Don't over-analyze for hypothetical futures
- Ask ONE question at a time during grill — never dump multiple questions
- Always end with: "Shall I create the plan?" → invoke `/supergraph:plan`
