# Codebase Memory graph contract

Supergraph requires `codebase-memory-mcp >= 0.9.0`. Every graph call is scoped by
the stable `CBM_PROJECT` recorded in `.supergraph-env`; indexing always uses the
absolute repository path and `CBM_INDEX_MODE` (`moderate` locally, `fast` in CI).

## Lifecycle and freshness

1. `list_projects` discovers the stable project identity.
2. `index_status(project=CBM_PROJECT)` verifies freshness. Missing, stale, failed,
   or `status: "degraded"` indexes must be repaired with `index_repository`.
3. `get_graph_schema(project=CBM_PROJECT)` runs before any `query_graph` recipe.
4. `get_architecture` supplies overview, layers, boundaries, clusters, and hotspots.
5. After edits, re-check status and explicitly reindex before quality gates.

Never write a fresh timestamp after a tool error or degraded index. Tool failures
are blocking for mandatory gates; optional discovery reports `unavailable` and
falls back to Serena or filesystem evidence. Empty `rows: []` is successful data,
not an error. Follow `next_cursor`/pagination until exhausted before drawing a
completeness conclusion.

## Native primitives

- Discovery: `search_graph`
- Callers, callees, dependencies, and data flow: `trace_path`
- Exact source: `get_code_snippet`
- Git impact and risk: `detect_changes`
- Architecture: `get_architecture`
- Structural checks: `query_graph` using the named recipes below

## Canonical Cypher recipes

Call `get_graph_schema` first. Recipes must return structured `{ "rows": [] }`
when no match exists.

### `cycles`

```cypher
MATCH (a)-[:CALLS|IMPORTS]->(b) RETURN a.qualified_name, b.qualified_name LIMIT 100000
```

Build a client-side adjacency map and run DFS to depth 8. A path returning to its
start is a cycle, including mixed `CALLS` → `IMPORTS` paths. Exactly 100,000 rows
means incomplete evidence and must fail the gate. `MATCH p=` path binding and a
relationship union combined with `*1..8` are unsupported and forbidden.

### `hubs`

```cypher
MATCH (n)<-[r]-() WITH n, count(r) AS degree WHERE degree >= 10 RETURN n, degree ORDER BY degree DESC LIMIT 100
```

### `bridges`

```cypher
MATCH (a)-[r]->(b) RETURN a.file_path, b.file_path LIMIT 100000
```

Filter client-side where both paths are nonempty and unequal. Exactly 100,000
rows means incomplete bridge evidence and must fail the gate.

### `test-gaps`

```cypher
MATCH (n) RETURN n.qualified_name, n.is_test LIMIT 100000
MATCH (t)-[:TESTS]->(n) RETURN n.qualified_name LIMIT 100000
```

Fail if either export reaches 100,000 rows. Client-side, subtract qualified names
covered by `TESTS` from nodes whose `is_test` value is not true.

### `complexity`

```cypher
MATCH (n) RETURN n.qualified_name, n.complexity, n.cognitive LIMIT 100000
```

Fail at 100,000 rows. Normalize missing values to zero, filter complexity greater
than 10 or cognitive complexity greater than 15, then sort client-side.

### `dependencies`

```cypher
MATCH (a)-[r:CALLS|IMPORTS|DEPENDS_ON]->(b) RETURN a, r, b LIMIT 200
```

### `cross-boundary`

```cypher
MATCH (a)-[r]->(b) RETURN a.module, b.module LIMIT 100000
```

Fail at 100,000 rows. Filter client-side where both module names are nonempty
and unequal.

If a recipe is incompatible with the reported schema, stop the mandatory gate
and report the schema mismatch. Do not fabricate equivalent findings.
