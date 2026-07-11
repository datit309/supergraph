---
name: scan
description: Scan project once per session. Run first — all other skills depend on this.
mcp: codebase-memory-mcp
---

# /supergraph:scan

Load verified, project-scoped graph context once. Follow the shared
`references/codebase-memory-contract.md`.

Announce: "📡 /supergraph:scan — loading project context..."

## 1. Detect project and branch

Use `git branch --show-current`, resolve the repository to an **absolute** path,
and run `bin/detect-project.sh` when present. Otherwise detect commands from:

| File | Type | Test | Lint | Format | Build |
|---|---|---|---|---|---|
| `package.json` | node | `npm test --` | `npx eslint .` | `npx prettier --write .` | `npm run build` |
| `Cargo.toml` | rust | `cargo test` | `cargo clippy` | `cargo fmt` | `cargo build` |
| `pyproject.toml` | python | `pytest` | `ruff check .` | `ruff format .` | `python -m build` |
| `go.mod` | go | `go test ./...` | `golangci-lint run` | `gofmt -w .` | `go build ./...` |
| `pubspec.yaml` | flutter | `flutter test` | `flutter analyze` | `dart format .` | `flutter build` |

Ask when none match; never guess commands. Derive one stable `CBM_PROJECT` from
the repository root name and retain it across branches. Default
`CBM_INDEX_MODE=moderate`.

## 2. Verify provider and freshness

1. Call `list_projects` and find `CBM_PROJECT`.
2. If found, call `index_status(project=CBM_PROJECT)`.
3. Treat missing project, changed branch, stale state, tool error, failed state,
   or `status: "degraded"` as requiring a new index.
4. Call `index_repository(repo_path=<absolute repo path>, name=CBM_PROJECT,
   mode=CBM_INDEX_MODE)` when required. Require `status: "indexed"`.
5. Re-run `index_status`; never claim reuse without a healthy response.
6. Call `get_graph_schema(project=CBM_PROJECT)` before structural queries.
7. Load `get_architecture(project=CBM_PROJECT,
   aspects=["overview","layers","boundaries","clusters","hotspots"])`.

On any mandatory provider/index/schema error: STOP, show the exact error and the
recovery command (`codebase-memory-mcp cli index_repository --repo-path
<absolute> --name <project> --mode moderate`). Do not write freshness state.

## 3. Reverify Serena

Always call Serena initial instructions and activate project when available, then
load a top-level symbols overview. Set `SERENA_ACTIVE=true` only after success;
otherwise set it false and report Serena unavailable.

## 4. Write `.supergraph-env`

Only after healthy `index_status`, schema, and architecture responses:

```dotenv
PROJECT_TYPE=...
TEST_CMD=...
LINT_CMD=...
FORMAT_CMD=...
BUILD_CMD=...
BRANCH=...
GRAPH_PROVIDER=codebase-memory-mcp
CBM_PROJECT=...
CBM_INDEX_MODE=moderate
CBM_INDEXED_AT=YYYY-MM-DDTHH:MM:SS
SERENA_ACTIVE=true|false
SCAN_TIMESTAMP=YYYY-MM-DDTHH:MM:SS
```

Branch-matched reuse still requires `index_status` and Serena revalidation.

## 5. Report

Report project/type/commands, provider/project/index status, architecture counts
available from the response, Serena status, and whether scan was fresh or reused.

## Rules

- Never record false freshness after errors or degraded state.
- All graph calls include `project=CBM_PROJECT` where supported.
- Respect pagination and failure semantics in the shared contract.
- For a trivial one-file change, graph discovery may stop after verified status.
