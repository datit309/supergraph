---
name: analyze
description: Risk analysis and approach selection before planning. Use when requirements are ambiguous, approaches vary, or work touches hub/bridge nodes. Skip for typo fixes.
mcp: codebase-memory-mcp
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

**1b. Score ambiguity (before grilling):**

| Signal | +1 if... |
|---|---|
| Ambiguous scope | touches multiple modules without naming one |
| No explicit path | no file/package/feature named |
| Multiple intents | could be bug fix, feature, refactor, or question |
| First interaction | no established context this session |

| Score | Action |
|---|---|
| 0–1 | Skip grilling — proceed with best available info |
| 2 | Show 1-line routing summary, wait for confirm |
| 3–4 | Grill: ask focused questions with recommended options |

**Auto-skip grilling entirely if:** user said "go"/"just do it", trivial fix (<15 lines, 1 file), explicit mode command, or active plan already exists.

**Grilling rules:** ONE question at a time, offer recommended answer, max 3 questions. Stop when goal + constraints are clear enough that approach won't reverse on new info.

**2. Check graph risk:**
Reuse graph context from `/supergraph:scan`. Only call if targets are identified:
Use `CBM_PROJECT` from `.supergraph-env`. Call `detect_changes(project=CBM_PROJECT)`,
`search_graph` for likely symbols, `trace_path` inbound/outbound, and
`get_architecture` for boundaries/hotspots. Run the validated `hubs`, `bridges`,
and `cross-boundary` contract recipes. Empty results are evidence, not permission
to invent relationships. If files involve a hub/bridge node or cross a boundary,
flag risk; more than 20 affected files requires user discussion.

**2b. Serena dependency check (optional):**
If `/supergraph:scan` was not run this session, call `mcp__serena__initial_instructions()` first.
For each likely target symbol:
```
mcp__serena__find_referencing_symbols(symbol=<likely_target>)
mcp__serena__find_implementations(symbol=<likely_target>)
```
`find_referencing_symbols` — all callers/usages. `find_implementations` — all concrete impls of interfaces/abstract classes. Results enrich approach comparison in step 3.
Skip gracefully if Serena unavailable — log "Serena unavailable, skipping dependency check".

**3. Propose 2-3 approaches + persona debate:**
For each approach: pros, cons, risk level, effort. Prefer minimal viable.

Then run 5 quick persona checks on the **recommended** approach:

| Persona | Question |
|---|---|
| Architect | Does this fit the architecture? New coupling? |
| Security | What can be abused? Auth/data boundaries respected? |
| Performance | Latency impact? N+1 queries? Memory leaks? |
| UX | Error states handled? Intuitive? |
| Devil's Advocate | Simpler alternative? Which assumption could be wrong? |

Emit verdict: **GO** (no blockers) / **CAUTION** (manageable risks, note mitigations) / **STOP** (critical issue — redesign needed before planning).

STOP triggers: auth bypass with no mitigation, fundamental design incompatibility, N+1 with no workaround, false core assumption.

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
