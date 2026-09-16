#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
SECTION=${1:-all}

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
assert_doc() {
  local file=$1 marker=$2
  grep -Fq -- "$marker" "$ROOT/$file" || fail "missing marker '$marker' in $file"
}

test_writing_good_tests() {
  assert_doc plugins/supergraph/skills/tdd/SKILL.md 'writing-good-tests.md'
  assert_doc plugins/supergraph/skills/tdd/writing-good-tests.md 'independent expected values'
  assert_doc plugins/supergraph/skills/tdd/writing-good-tests.md 'behavior over implementation text'
  assert_doc plugins/supergraph/skills/tdd/writing-good-tests.md 'mock level'
  assert_doc plugins/supergraph/skills/tdd/writing-good-tests.md 'mutation'
  printf 'PASS: falsifiable test-writing guidance contract\n'
}

analyze() {
  assert_doc plugins/supergraph/skills/analyze/SKILL.md 'spike'
  assert_doc plugins/supergraph/skills/analyze/SKILL.md 'bounded'
  assert_doc plugins/supergraph/skills/analyze/SKILL.md 'architectural'
  assert_doc plugins/supergraph/skills/analyze/SKILL.md 'Approval required before implementation'
  assert_doc plugins/supergraph/skills/analyze/SKILL.md 'upgrade'
  printf 'PASS: analyze ceremony routing contract\n'
}

all() {
  test_writing_good_tests
  analyze
}

case "$SECTION" in
  writing) test_writing_good_tests ;;
  analyze) analyze ;;
  all) all ;;
  *) fail "unknown section: $SECTION" ;;
esac
