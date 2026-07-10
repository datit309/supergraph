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

legacy() {
  local out
  out=$(rg -n 'code-review-graph|code_review_graph|mcp__code-review-graph|mcp__code_review_graph|\.code-review-graph' "$ROOT" --hidden --glob '!.git/**' --glob '!docs/supergraph/plans/**' --glob '!plugins/supergraph/CHANGELOG.md' || true)
  [[ -z $out ]] || fail "active legacy references:\n$out"
}

case "${SECTION:-all}" in
  contract) contract ;;
  legacy) legacy ;;
  all) contract; legacy ;;
  *) fail "unknown section: $SECTION" ;;
esac
printf 'PASS: %s\n' "${SECTION:-all}"
