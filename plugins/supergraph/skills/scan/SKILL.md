---
name: scan
description: Scan project once per session. Run first — all other skills depend on this.
mcp: code-review-graph
---

# /supergraph:scan

Load minimal project context once. Other skills reuse the results.

Announce: "📡 /supergraph:scan — loading project context..."

## Steps

**1. Detect project type:**
```bash
git branch --show-current
```
Run project detection script if available:
```bash
eval "$(bash bin/detect-project.sh)"
```

If script missing, check config files:

| Config file | Type | Test | Lint | Format | Build |
|---|---|---|---|---|---|
| `package.json` | node | `npm test --` | `npx eslint .` | `npx prettier --write .` | `npm run build` |
| `Cargo.toml` | rust | `cargo test` | `cargo clippy` | `cargo fmt` | `cargo build` |
| `pyproject.toml` | python | `pytest` | `ruff check .` | `ruff format .` | `python -m build` |
| `go.mod` | go | `go test ./...` | `golangci-lint run` | `gofmt -w .` | `go build ./...` |
| `Gemfile` | ruby | `bundle exec rspec` | `rubocop` | `rubocop -A` | `bundle exec rake` |
| `pom.xml`, `build.gradle*` | java | `mvn test` | `mvn checkstyle:check` | `mvn spotless:apply` | `mvn compile` |
| `Package.swift` | swift | `swift test` | `swiftlint lint` | `swiftformat .` | `swift build` |
| `pubspec.yaml` | flutter | `flutter test` | `flutter analyze` | `dart format .` | `flutter build` |
| `CMakeLists.txt` | cpp | `ctest` | `cppcheck .` | `clang-format -i` | `cmake --build build` |
| `mix.exs` | elixir | `mix test` | `mix credo` | `mix format` | `mix compile` |

If none match → ASK user for commands.

**2. Load graph context (lazy, token-efficient):**
```
mcp__code-review-graph__get_minimal_context_tool()
mcp__code-review-graph__list_graph_stats_tool()
```
Only these 2 calls are enough for most tasks. Fetch communities, hubs, bridges only when the specific task needs them.

**2b. Serena context (optional — if Serena MCP available):**
```
mcp__plugin_serena_serena__activate_project()    # register project with Serena
mcp__plugin_serena_serena__get_symbols_overview() # fast top-level symbols map
```
Skip gracefully if Serena unavailable — log "Serena unavailable, skipping symbol overview".

**3. Save to `.supergraph-env`:**
```
PROJECT_TYPE=...
TEST_CMD=...
LINT_CMD=...
FORMAT_CMD=...
BUILD_CMD=...
BRANCH=...
```

**4. Report completion:**
```
## Graph Context
- Type: $PROJECT_TYPE | Test: $TEST_CMD | Lint: $LINT_CMD
- Files: N | Communities: N | Hub nodes: [list]
- Serena: active | symbols: N | skipped
```

## Rules
- Run once per session — other skills reuse results
- Never guess commands — ask if detection fails
- For 1-file trivial changes, skip graph tools after detecting project type
- Save to `.supergraph-env` for reuse across sessions
