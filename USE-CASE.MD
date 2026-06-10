Example Use Cases

1. Starting a new feature safely

▎ "I need to add payment webhook handling to our API"

Supergraph automatically loads your codebase graph, identifies that PaymentService is a hub node (connected to 14 other modules), flags the blast radius before you write a single line, and guides you through a plan → TDD → review pipeline. You catch the circular dependency risk before it ships.

---

2. Debugging a flaky test

▎ "Tests keep failing intermittently on CI but pass locally"

Run /supergraph:diagnose — it runs a structured 6-phase debug loop: reproduces the failure, maps which files are involved via graph traversal, checks for race conditions and environment differences, then proposes a targeted fix with evidence. No more "works on my machine."

---

3. Safe large-scale refactor

▎ "Rename UserService to AccountService across the entire codebase"

Serena's LSP-powered rename_symbol + graph impact analysis shows every caller, every test, every interface implementation before the rename runs. Graph confirms no community boundary violations. Review agent gives a merge verdict. Zero broken imports.

---

4. Onboarding to an unfamiliar codebase

/supergraph:zoom-out generates a domain-vocabulary module map in seconds — clusters, hub nodes, bridge points, and plain-English labels for each module. /supergraph:architecture produces an HTML + Mermaid report you can share

---

5. Processing a messy backlog

▎ "We have 40 open GitHub issues. Which ones are actually ready to work

/supergraph:triage classifies each issue through a state machine: ready-tfix — with reasoning. Outputs a prioritized, agent-ready list. Turns achaotic backlog into a sprint queue.

---

6. Context window running out mid-task

▎ "I've been working on this for 2 hours and the context is getting long"

/supergraph:handoff compresses the entire session state — active plan tasks, uncommitted changes, decisions made, next steps — into a compact handoff file. Resume in a fresh session with full context restored in under 30 seconds.

---

7. Pre-merge code review

▎ "Is this PR safe to merge?"

/supergraph:review spawns an independent code-reviewer agent that cross-references the diff against the graph: checks hub node modifications, surprise connections, untested
hotspots, and security patterns. Returns APPROVE / REQUEST CHANGES / BLO

---

8. Database schema migration

▎ "Add a NOT NULL column to our 2M-row users table without downtime"

/supergraph:database-migrations guides the expand-contract pattern: add straint → drop old column — with rollback scripts at each step andzero-downtime strategies per your ORM (Prisma, TypeORM, Django, etc.).

---

9. Validating an approach before committing

▎ "Should I use event sourcing or a simple audit log for this feature?"

/supergraph:prototype generates throwaway code for both approaches — no plan, no TDD, just fast validation. You pick the winner, then run /supergraph:plan to turn it into a
real implementation.

---

10. Long sessions, tight token budget

▎ "My responses are getting slow and expensive"

Say "caveman" or set SUPERGRAPH_CAVEMAN=true in .supergraph-env. Activates ~75% output compression across all skills — terse, structured, no prose. Persistent across sessions until disabled.
