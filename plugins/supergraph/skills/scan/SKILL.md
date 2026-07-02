---
name: scan
description: Scan project once per session. Run first — all other skills depend on this.
mcp: code-review-graph
---

# /supergraph:scan

Load minimal project context once. Other skills reuse the results.

Announce: "📡 /supergraph:scan — loading project context..."

## Steps

**1. Detect project type + branch:**

```bash
CURRENT_BRANCH=$(git branch --show-current)
```

Run project detection script if available:

```bash
eval "$(bash bin/detect-project.sh)"
```

If script missing, check config files:

| Config file                | Type    | Test                | Lint                   | Format                   | Build                 |
| -------------------------- | ------- | ------------------- | ---------------------- | ------------------------ | --------------------- |
| `package.json`             | node    | `npm test --`       | `npx eslint .`         | `npx prettier --write .` | `npm run build`       |
| `Cargo.toml`               | rust    | `cargo test`        | `cargo clippy`         | `cargo fmt`              | `cargo build`         |
| `pyproject.toml`           | python  | `pytest`            | `ruff check .`         | `ruff format .`          | `python -m build`     |
| `go.mod`                   | go      | `go test ./...`     | `golangci-lint run`    | `gofmt -w .`             | `go build ./...`      |
| `Gemfile`                  | ruby    | `bundle exec rspec` | `rubocop`              | `rubocop -A`             | `bundle exec rake`    |
| `pom.xml`, `build.gradle*` | java    | `mvn test`          | `mvn checkstyle:check` | `mvn spotless:apply`     | `mvn compile`         |
| `Package.swift`            | swift   | `swift test`        | `swiftlint lint`       | `swiftformat .`          | `swift build`         |
| `pubspec.yaml`             | flutter | `flutter test`      | `flutter analyze`      | `dart format .`          | `flutter build`       |
| `CMakeLists.txt`           | cpp     | `ctest`             | `cppcheck .`           | `clang-format -i`        | `cmake --build build` |
| `mix.exs`                  | elixir  | `mix test`          | `mix credo`            | `mix format`             | `mix compile`         |

If none match → ASK user for commands.

**2. Check existing `.supergraph-env` (BEFORE any expensive calls):**

| Condition                                                    | Action                                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `.supergraph-env` missing                                    | Proceed to step 3 (full scan)                                          |
| `.supergraph-env` exists, `BRANCH` matches `$CURRENT_BRANCH` | Go to step 2b (reuse path)                                             |
| `.supergraph-env` exists, `BRANCH` differs                   | Proceed to step 3, log "Branch changed: $OLD_BRANCH → $CURRENT_BRANCH" |

**2b. Reuse path (branch matches) — skip graph calls:**
Log: "♻️ Reusing scan context from $SCAN_TIMESTAMP (branch: $BRANCH)"
Re-verify Serena only (never skip — MCP availability changes per session):

```
mcp__plugin_serena_serena__initial_instructions()
mcp__plugin_serena_serena__activate_project()
```

If Serena responds → update `SERENA_ACTIVE=true` in file. If not → update `SERENA_ACTIVE=false`.
Jump to step 5 (report).

**3. Full scan — build + load graph + Serena context:**

```
stats = mcp__code-review-graph__list_graph_stats_tool()
```

Check stats result:

| Condition | Action |
| --- | --- |
| `list_graph_stats_tool()` throws / returns error | `mcp__code-review-graph__index_directory(path=".")` (full build) |
| `stats.total_files == 0` | `mcp__code-review-graph__index_directory(path=".")` (full build) |
| `stats.total_files > 0` AND branch unchanged | `mcp__code-review-graph__index_incremental(path=".")` (fast reindex) |
| `stats.total_files > 0` AND **branch changed** | `mcp__code-review-graph__index_directory(path=".")` (full rebuild — old graph has stale nodes) |

**If `index_directory()` fails:** STOP. Log error. Do NOT write `.supergraph-env`. Ask user to check MCP connection.

Then load context:

```
mcp__code-review-graph__get_minimal_context_tool()
```

Only these calls are needed for most tasks. Fetch communities, hubs, bridges only when the specific task needs them.

**3b. Serena context (optional — if Serena MCP available):**

```
mcp__plugin_serena_serena__initial_instructions() # CRITICAL: load Serena Instructions Manual first
mcp__plugin_serena_serena__activate_project()     # activate_project requires plugin namespace
mcp__serena__get_symbols_overview()               # fast top-level symbols map
```

Note: `activate_project` is only in `mcp__plugin_serena_serena__`; all other Serena tools work with either `mcp__serena__` or `mcp__plugin_serena_serena__`.
Skip gracefully if Serena unavailable — log "Serena unavailable, skipping symbol overview".

**4. Write `.supergraph-env`:**

```
PROJECT_TYPE=...
TEST_CMD=...
LINT_CMD=...
FORMAT_CMD=...
BUILD_CMD=...
BRANCH=...
SERENA_ACTIVE=true|false
SCAN_TIMESTAMP=YYYY-MM-DDTHH:MM:SS
```

`SERENA_ACTIVE`: set based on step 3b result. `SCAN_TIMESTAMP`: current datetime.

**5. Report completion:**

```
## Graph Context
- Type: $PROJECT_TYPE | Test: $TEST_CMD | Lint: $LINT_CMD
- Files: N | Communities: N | Hub nodes: [list]
- Serena: active | symbols: loaded | skipped
- Scan: fresh | reused from $SCAN_TIMESTAMP
```

## Rules

- Full scan only when `.supergraph-env` is missing or branch changed
- Reuse existing context when branch matches — skip graph + Serena calls
- `SERENA_ACTIVE` is NEVER blindly reused — always re-verified each session
- `SCAN_TIMESTAMP` lets downstream skills know how fresh the context is
- Never guess commands — ask if detection fails
- For 1-file trivial changes, skip graph tools after detecting project type
