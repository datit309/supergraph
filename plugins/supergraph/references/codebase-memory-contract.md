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
MATCH p=(a)-[:CALLS|IMPORTS*1..8]->(a) RETURN p LIMIT 100
```

### `hubs`

```cypher
MATCH (n)<-[r]-() WITH n, count(r) AS degree WHERE degree >= 10 RETURN n, degree ORDER BY degree DESC LIMIT 100
```

### `bridges`

```cypher
MATCH (a)-[r]->(b) WHERE a.file_path <> b.file_path RETURN a, r, b LIMIT 100
```

### `test-gaps`

```cypher
MATCH (n) WHERE coalesce(n.is_test, false) = false AND NOT (n)<-[:TESTS]-() RETURN n LIMIT 100
```

### `complexity`

```cypher
MATCH (n) WHERE coalesce(n.complexity, 0) > 10 OR coalesce(n.cognitive, 0) > 15 RETURN n ORDER BY n.complexity DESC LIMIT 100
```

### `dependencies`

```cypher
MATCH (a)-[r:CALLS|IMPORTS|DEPENDS_ON]->(b) RETURN a, r, b LIMIT 200
```

### `cross-boundary`

```cypher
MATCH (a)-[r]->(b) WHERE a.module <> b.module RETURN a, r, b LIMIT 100
```

If a recipe is incompatible with the reported schema, stop the mandatory gate
and report the schema mismatch. Do not fabricate equivalent findings.
