# Brainstorming Guide

Use after context loading for ambiguous, non-trivial, risky, or multi-step work.

## When to Apply

Apply when:

- User request is ambiguous
- Multiple implementation approaches exist
- Task touches multiple modules
- Requirements are incomplete
- Graph context shows hub/bridge/high blast-radius risk

Skip for simple typo fixes or clear mechanical edits.

## Workflow

1. Restate goal:
   - Goal
   - Known constraints
   - Unknowns

2. Load minimal graph context:
   - `get_minimal_context_tool()`
   - `semantic_search_nodes_tool(query="task keywords")`
   - `get_architecture_overview_tool()`

3. Identify 2-3 viable approaches:
   - Pros
   - Cons
   - Risk

4. Check graph risk:
   - `get_impact_radius_tool(files=[likely_targets], depth=2)`
   - `get_hub_nodes_tool()`
   - `get_bridge_nodes_tool()`
   - `get_affected_flows_tool(files=[likely_targets])`

5. Ask focused questions only if answers change implementation direction.

6. Recommend direction and hand off to `/supergraph:plan`.

## Rules

- Do not code during brainstorming
- Ask before assuming ambiguous requirements
- Prefer minimal viable approach
- Use graph context before recommending architecture
- Do not over-design for hypothetical future needs
