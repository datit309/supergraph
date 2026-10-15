# Supergraph Workflow Examples

End-to-end walkthroughs demonstrating Supergraph engineering pipelines across common scenarios:
- **Scientific Debugging**: 6-phase root-cause isolation with Serena LSP and `diagnostician`.
- **Wave DAG Feature Implementation**: Multi-worker git worktree execution with `supergraph-team`.
- **Full-Stack QA & Anti-Bot Testing**: Native Rust CDP (`agent-browser`) with 5-dimension ISTQB matrix.
- **Architectural Refactoring**: System contracts, blast-radius mitigation, and independent review.

---

## 1. Fixing a Bug (`/supergraph:diagnose`)

```bash
# 1. Start session with graph context
/supergraph:scan

# 2. Bug cause unknown -> run scientific diagnosis
/supergraph:diagnose
# Output: Falsifiable hypotheses, Serena symbol trace, minimal reproduction

# 3. Create test reproducing failure
/supergraph:tdd
# 🔴 RED: run test -> fails

# 4. Implement minimal fix
# 🟢 GREEN: run test -> passes

# 5. Auto-fix loop + verification
/supergraph:fix
/supergraph:verify
```

---

## 2. Building a New Feature (Wave DAG Execution)

```bash
# 1. Analyze problem and blast radius
/supergraph:analyze

# 2. Create architecture-aware implementation plan
/supergraph:plan
# Output: docs/supergraph/plans/YYYY-MM-DD-feature.md

# 3. Execute plan via Supergraph Team
/supergraph:execute
# Initializes sg_team_init, spins up isolated worktrees, streams progress to http://127.0.0.1:3333

# 4. Auto-fix tests & lint
/supergraph:fix

# 5. Run E2E & Full-Stack QA (agent-browser)
/supergraph:browser-agent
# Generates docs/qa/test-matrix-<feature>.md and verifies 0 console errors

# 6. Verify and independent review
/supergraph:verify
/supergraph:review
```

---

## 3. Large Architecture Refactoring

```bash
# 1. Architectural inspection
/supergraph:architecture
/supergraph:zoom-out

# 2. Scope & plan with embedded contracts
/supergraph:sdd
/supergraph:plan

# 3. Wave execution with isolated git worktrees
/supergraph:execute

# 4. AppSec review before merge
/supergraph:vibesec
/supergraph:review
```
