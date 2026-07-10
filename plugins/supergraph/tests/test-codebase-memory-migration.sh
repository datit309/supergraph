#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
SECTION=${2:-${1#--section=}}
if [[ ${1:-} == --section ]]; then SECTION=${2:-}; fi

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
contains() { grep -Fq -- "$2" "$1" || fail "$1 missing marker: $2"; }

contract() {
  local f="$ROOT/plugins/supergraph/references/codebase-memory-contract.md"
  test -f "$f" || fail "graph contract absent"
  for marker in '>= 0.9.0' CBM_PROJECT index_repository index_status get_graph_schema pagination degraded unavailable cycles hubs bridges test-gaps complexity dependencies cross-boundary; do
    contains "$f" "$marker"
  done
}

json_assert() {
  python3 -c 'import json,sys; data=json.load(sys.stdin); assert data is not None' \
    || fail "invalid JSON response"
}

cbm() {
  local tool=$1 args=$2 output args_file
  args_file="$TMP/${tool}.args.json"
  printf '%s' "$args" >"$args_file"
  if ! output=$(codebase-memory-mcp cli "$tool" --args-file "$args_file" 2>"$TMP/cbm.err"); then
    cat "$TMP/cbm.err" >&2
    fail "Codebase Memory tool failed: $tool"
  fi
  printf '%s' "$output" | json_assert
  printf '%s' "$output"
}

recipes() {
  test "$(codebase-memory-mcp --version 2>/dev/null)" = 'codebase-memory-mcp 0.9.0' \
    || fail 'codebase-memory-mcp 0.9.0 required'
  TMP=$(mktemp -d); trap 'rm -rf "$TMP"' RETURN
  cp -R "$ROOT/plugins/supergraph/tests/fixtures/codebase-memory" "$TMP/repo"
  git -C "$TMP/repo" init -q
  git -C "$TMP/repo" config user.email fixture@example.invalid
  git -C "$TMP/repo" config user.name Fixture
  git -C "$TMP/repo" add app.sh app_test.sh
  git -C "$TMP/repo" commit -qm base
  printf '\n# tracked change\n' >>"$TMP/repo/app.sh"
  git -C "$TMP/repo" add app.sh
  git -C "$TMP/repo" commit -qm change

  local project=supergraph-cbm-contract-fixture repo index status schema changes query
  repo=$(cd "$TMP/repo" && pwd)
  index=$(cbm index_repository "{\"repo_path\":\"$repo\",\"name\":\"$project\",\"mode\":\"fast\"}")
  printf '%s' "$index" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d.get("status") == "indexed", d'
  status=$(cbm index_status "{\"project\":\"$project\"}")
  printf '%s' "$status" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d.get("project"); assert any(k in d for k in ("nodes","node_count","total_nodes")); assert any(k in d for k in ("edges","edge_count","total_edges"))'
  schema=$(cbm get_graph_schema "{\"project\":\"$project\"}")
  printf '%s' "$schema" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert isinstance(d,dict) and d'
  changes=$(cbm detect_changes "{\"project\":\"$project\",\"since\":\"HEAD~1\"}")
  printf '%s' "$changes" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert isinstance(d.get("changed_files"),list); assert isinstance(d.get("changed_count"),int); assert isinstance(d.get("impacted_symbols"),list); assert isinstance(d.get("depth"),int)'

  while IFS='|' read -r name query; do
    [[ -n $name ]] || continue
    printf 'recipe: %s\n' "$name" >&2
    query=$(cbm query_graph "$(python3 -c 'import json,sys; print(json.dumps({"project":sys.argv[1],"query":sys.argv[2]}))' "$project" "$query")")
    if [[ $name == cycles ]]; then
      printf '%s' "$query" | python3 -c '
import json,sys
d=json.load(sys.stdin); rows=d.get("rows")
assert isinstance(rows,list), d
assert len(rows) < 100000, "cycle evidence truncated"
adj={}
for start,end in rows: adj.setdefault(start,[]).append(end)
def cycle(start,node,depth):
    return depth < 8 and any(n == start or cycle(start,n,depth+1) for n in adj.get(node,()))
cycles=[n for n in adj if cycle(n,n,0)]
# Synthetic mixed CALLS -> IMPORTS graph locks the client DFS semantics.
adj={"a":["b"],"b":["a"]}
assert cycle("a","a",0)
' || fail 'cycle DFS validation failed'
    elif [[ $name == bridges ]]; then
      printf '%s' "$query" | python3 -c '
import json,sys
d=json.load(sys.stdin); rows=d.get("rows")
assert isinstance(rows,list), d
assert len(rows) < 100000, "bridge evidence truncated"
bridges=[(a,b) for a,b in rows if a and b and a != b]
' || fail 'bridge validation failed'
    elif [[ $name == test-gaps ]]; then
      local coverage
      coverage=$(cbm query_graph "$(python3 -c 'import json,sys; print(json.dumps({"project":sys.argv[1],"query":sys.argv[2]}))' "$project" 'MATCH (t)-[:TESTS]->(n) RETURN n.qualified_name LIMIT 100000')")
      printf '%s' "$query" >"$TMP/nodes.json"
      printf '%s' "$coverage" >"$TMP/coverage.json"
      python3 - "$TMP/nodes.json" "$TMP/coverage.json" <<'PY'
import json,sys
nodes=json.load(open(sys.argv[1]))["rows"]
covered=json.load(open(sys.argv[2]))["rows"]
assert len(nodes) < 100000 and len(covered) < 100000, "test-gap evidence truncated"
covered_names={row[0] for row in covered}
gaps=[name for name,is_test in nodes if name and is_test is not True and name not in covered_names]
PY
    elif [[ $name == complexity ]]; then
      printf '%s' "$query" | python3 -c '
import json,sys
rows=json.load(sys.stdin)["rows"]
assert len(rows) < 100000, "complexity evidence truncated"
def number(value):
    try: return float(value or 0)
    except (TypeError, ValueError): return 0
findings=sorted(((name, number(complexity), number(cognitive)) for name,complexity,cognitive in rows if number(complexity) > 10 or number(cognitive) > 15), key=lambda row: row[1], reverse=True)
' || fail 'complexity validation failed'
    elif [[ $name == cross-boundary ]]; then
      printf '%s' "$query" | python3 -c '
import json,sys
rows=json.load(sys.stdin)["rows"]
assert len(rows) < 100000, "cross-boundary evidence truncated"
findings=[(a,b) for a,b in rows if a and b and a != b]
' || fail 'cross-boundary validation failed'
    else
      printf '%s' "$query" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert isinstance(d.get("rows"),list), d'
    fi
  done <<'RECIPES'
cycles|MATCH (a)-[:CALLS|IMPORTS]->(b) RETURN a.qualified_name, b.qualified_name LIMIT 100000
hubs|MATCH (n)<-[r]-() WITH n, count(r) AS degree WHERE degree >= 10 RETURN n, degree ORDER BY degree DESC LIMIT 100
bridges|MATCH (a)-[r]->(b) RETURN a.file_path, b.file_path LIMIT 100000
test-gaps|MATCH (n) RETURN n.qualified_name, n.is_test LIMIT 100000
complexity|MATCH (n) RETURN n.qualified_name, n.complexity, n.cognitive LIMIT 100000
dependencies|MATCH (a)-[r:CALLS|IMPORTS|DEPENDS_ON]->(b) RETURN a, r, b LIMIT 200
cross-boundary|MATCH (a)-[r]->(b) RETURN a.module, b.module LIMIT 100000
RECIPES
}

legacy() {
  local out
  out=$(rg -n 'code-review-graph|code_review_graph|mcp__code-review-graph|mcp__code_review_graph|\.code-review-graph' "$ROOT" --hidden --glob '!.git/**' --glob '!docs/supergraph/plans/**' --glob '!plugins/supergraph/CHANGELOG.md' || true)
  [[ -z $out ]] || fail "active legacy references:\n$out"
}

claude() {
  python3 - "$ROOT" <<'PY'
import json,sys
from pathlib import Path
r=Path(sys.argv[1]); m=json.load(open(r/'plugins/supergraph/.mcp.json'))
servers=m['mcpServers']; assert servers['codebase-memory-mcp']=={'command':'codebase-memory-mcp','args':[]}; assert 'serena' in servers; assert 'code-review-graph' not in servers
s=json.load(open(r/'plugins/supergraph/settings.json'))['permissions']['allow']; assert 'mcp__codebase-memory-mcp__*' in s; assert not any('code-review-graph' in x for x in s)
p=json.load(open(r/'plugins/supergraph/.claude-plugin/plugin.json')); assert 'codebase-memory-mcp' in p['keywords']; assert 'code-review-graph' not in p['keywords']
PY
}

codex_opencode() {
  python3 - "$ROOT" <<'PY'
import json,sys
from pathlib import Path
r=Path(sys.argv[1]); c=json.load(open(r/'plugins/supergraph/.codex-plugin/.mcp.json'))['mcp_servers']
assert c['codebase-memory-mcp']=={'command':'codebase-memory-mcp','args':[]}; assert 'serena' in c
p=json.load(open(r/'plugins/supergraph/.codex-plugin/plugin.json')); assert 'codebase-memory-mcp' in p['keywords']
o=json.load(open(r/'plugins/supergraph/.opencode-plugin/opencode.json'))['mcp']; cbm=o['codebase-memory-mcp']; assert cbm['command']=='codebase-memory-mcp' and cbm['args']==[] and cbm['enabled']; assert 'serena' in o
PY
}

scan() {
  local f="$ROOT/plugins/supergraph/skills/scan/SKILL.md"
  for marker in codebase-memory-mcp CBM_PROJECT CBM_INDEX_MODE CBM_INDEXED_AT list_projects index_status index_repository get_graph_schema get_architecture repo_path absolute degraded stale SERENA_ACTIVE; do contains "$f" "$marker"; done
  ! grep -Eq 'code-review-graph|list_graph_stats_tool|get_minimal_context_tool' "$f" || fail 'scan contains legacy provider calls'
}

analyze_plan() {
  local files=("$ROOT/plugins/supergraph/skills/analyze/SKILL.md" "$ROOT/plugins/supergraph/skills/plan/SKILL.md" "$ROOT/plugins/supergraph/agents/plan-writer.md") f
  for f in "${files[@]}"; do
    contains "$f" CBM_PROJECT; contains "$f" codebase-memory-mcp
    ! grep -Eq 'code-review-graph|mcp__code-review' "$f" || fail "$f contains legacy provider"
  done
  for marker in detect_changes search_graph trace_path get_architecture hubs bridges cross-boundary; do grep -Rq "$marker" "${files[@]}" || fail "analyze-plan missing $marker"; done
  grep -Rq '>20\|> 20\|20 files' "${files[@]}" || fail 'missing >20 escalation'
}

architecture() {
  local files=("$ROOT/plugins/supergraph/SKILL.md" "$ROOT/plugins/supergraph/skills/architecture/SKILL.md" "$ROOT/plugins/supergraph/skills/zoom-out/SKILL.md") f
  for f in "${files[@]}"; do contains "$f" codebase-memory-mcp; ! grep -Eq 'code-review-graph|mcp__code-review' "$f" || fail "$f contains legacy provider"; done
  for marker in get_architecture overview hotspots boundaries layers clusters hubs bridges test-gaps unavailable Serena; do grep -Rq "$marker" "${files[@]}" || fail "architecture missing $marker"; done
}

execute_fix() {
  local files=("$ROOT/plugins/supergraph/skills/execute/SKILL.md" "$ROOT/plugins/supergraph/skills/fix/SKILL.md" "$ROOT/plugins/supergraph/agents/executor.md") f
  for f in "${files[@]}"; do contains "$f" CBM_PROJECT; contains "$f" index_status; contains "$f" index_repository; ! grep -Eq 'code-review-graph|mcp__code-review|index_incremental' "$f" || fail "$f contains legacy graph calls"; done
  for marker in detect_changes trace_path cycles test-gaps complexity cross-boundary 'max 3'; do grep -Rq "$marker" "${files[@]}" || fail "execute-fix missing $marker"; done
}

verify_review() {
  local files=("$ROOT/plugins/supergraph/skills/tdd/SKILL.md" "$ROOT/plugins/supergraph/skills/verify/SKILL.md" "$ROOT/plugins/supergraph/skills/review/SKILL.md") f
  for f in "${files[@]}"; do contains "$f" CBM_PROJECT; contains "$f" index_status; ! grep -Eq 'code-review-graph|mcp__code-review|index_incremental' "$f" || fail "$f contains legacy graph calls"; done
  for marker in detect_changes trace_path cycles hubs bridges test-gaps degraded Critical; do grep -Rq "$marker" "${files[@]}" || fail "verify-review missing $marker"; done
}

database_integration() {
  local files=("$ROOT/plugins/supergraph/skills/database-migrations/SKILL.md" "$ROOT/plugins/supergraph/skills/integration/SKILL.md") f
  for f in "${files[@]}"; do contains "$f" CBM_PROJECT; contains "$f" trace_path; ! grep -Eq 'code-review-graph|mcp__code-review' "$f" || fail "$f contains legacy calls"; done
  grep -Rq 'dependencies\|test-gaps' "${files[@]}"; grep -Rq '> 20 files' "${files[@]}"
}

diagnose_web() {
  local files=("$ROOT/plugins/supergraph/skills/diagnose/SKILL.md" "$ROOT/plugins/supergraph/skills/webapp-testing/SKILL.md") f
  for f in "${files[@]}"; do contains "$f" CBM_PROJECT; contains "$f" search_graph; contains "$f" trace_path; contains "$f" unavailable; ! grep -Eq 'code-review-graph|mcp__code-review' "$f" || fail "$f contains legacy calls"; done
  grep -Rq 'test-gaps' "${files[@]}"
}

hooks() {
  bash -n "$ROOT/plugins/supergraph/hooks/post-tool-use" "$ROOT/plugins/supergraph/.githooks/pre-commit"
  contains "$ROOT/plugins/supergraph/hooks/post-tool-use" auto_watch=true
  ! grep -Eq 'code-review-graph|codebase-memory-mcp[[:space:]]+cli' "$ROOT/plugins/supergraph/hooks/post-tool-use" || fail 'post-tool invokes graph executable'
  contains "$ROOT/plugins/supergraph/.githooks/pre-commit" test-codebase-memory-migration.sh
}

ci() {
  local f="$ROOT/plugins/supergraph/.github/workflows/graph-review.yml"
  for marker in 'codebase-memory-mcp==0.9.0' supergraph-ci index_repository detect_changes query_graph changed_count impacted_symbols depth 'Cycle count' 'exit 1'; do contains "$f" "$marker"; done
  ! grep -Eq 'code-review-graph|risk_level|risk_summary|\| true' "$f" || fail 'CI contains legacy/nonexistent/swallowed checks'
}

gemini_metadata() {
  python3 - "$ROOT" <<'PY'
import json,sys
from pathlib import Path
r=Path(sys.argv[1]); m=json.load(open(r/'plugins/supergraph/mcp_config.json'))['mcpServers']; assert m['codebase-memory-mcp']=={'command':'codebase-memory-mcp','args':[]}; assert 'serena' in m
for p in (r/'plugins/supergraph/plugin.json',r/'plugins/supergraph/.claude-plugin/marketplace.json'):
 d=json.load(open(p)); assert 'codebase-memory-mcp' in d['keywords']; assert d['graphProvider']=='Codebase Memory'
PY
}

flutter() {
  local f="$ROOT/plugins/supergraph/skills/flutter-dart-code-review/SKILL.md"
  for marker in codebase-memory-mcp CBM_PROJECT hotspots cycles complexity cross-boundary test-gaps; do contains "$f" "$marker"; done
  ! grep -Eq 'code-review-graph|mcp__code-review' "$f" || fail 'Flutter skill contains legacy calls'
}

docs_en() {
  local files=("$ROOT/README.md" "$ROOT/PRIVACY.md" "$ROOT/plugins/supergraph/docs/TEAM-SETUP.md" "$ROOT/plugins/supergraph/.github/pull_request_template.md" "$ROOT/.gitignore") f
  for f in "${files[@]}"; do grep -Eqi 'codebase.memory' "$f" || fail "$f missing Codebase Memory"; ! grep -Eq 'code-review-graph|\.code-review-graph' "$f" || fail "$f contains legacy docs"; done
  for marker in '0.9.0' '~/.cache/codebase-memory-mcp' '.codebase-memory/graph.db.zst' index_repository; do grep -Rq "$marker" "${files[@]}" || fail "English docs missing $marker"; done
}

case "${SECTION:-all}" in
  contract) contract ;;
  recipes) recipes ;;
  claude) claude ;;
  codex-opencode) codex_opencode ;;
  scan) scan ;;
  analyze-plan) analyze_plan ;;
  architecture) architecture ;;
  execute-fix) execute_fix ;;
  verify-review) verify_review ;;
  database-integration) database_integration ;;
  diagnose-web) diagnose_web ;;
  hooks) hooks ;;
  ci) ci ;;
  gemini-metadata) gemini_metadata ;;
  flutter) flutter ;;
  docs-en) docs_en ;;
  legacy) legacy ;;
  all) contract; legacy ;;
  *) fail "unknown section: $SECTION" ;;
esac
printf 'PASS: %s\n' "${SECTION:-all}"
