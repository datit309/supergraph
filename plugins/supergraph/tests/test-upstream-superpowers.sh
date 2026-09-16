#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
SCRIPT_DIR="$ROOT/plugins/supergraph/skills/execute/scripts"
SECTION=${1:-all}

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
contains() { grep -Fq -- "$1" "$2"; }

assert_doc() {
  local file=$1 marker=$2
  contains "$marker" "$ROOT/$file" || fail "missing documentation marker '$marker' in $file"
}

scripts() {
  local fixture plan workspace brief package base head
  fixture=$(mktemp -d "${TMPDIR:-/tmp}/supergraph-upstream.XXXXXX")
  trap 'rm -rf "${fixture:-}"' RETURN

  git -C "$fixture" init -q
  git -C "$fixture" config user.email test@example.com
  git -C "$fixture" config user.name "Supergraph Test"
  plan="$fixture/plan.md"
  printf '%s\n' \
    '# Fixture plan' \
    '## Task 1: Extract this task' \
    'Task one body.' \
    '~~~bash' \
    '```' \
    '## Task 2: Fake heading inside code' \
    '~~~' \
    '## Task 2: Exclude this task' \
    'Task two body.' > "$plan"
  git -C "$fixture" add plan.md
  git -C "$fixture" commit -qm 'fixture base'
  base=$(git -C "$fixture" rev-parse HEAD)
  printf '%s\n' 'Added implementation line.' > "$fixture/implementation.txt"
  printf '%s\n' 'Keep this unrelated untracked file.' > "$fixture/untracked.txt"
  git -C "$fixture" add implementation.txt
  git -C "$fixture" commit -qm 'fixture change'
  head=$(git -C "$fixture" rev-parse HEAD)

  workspace=$(cd "$fixture" && "$SCRIPT_DIR/sdd-workspace" "$plan")
  fixture_root=$(git -C "$fixture" rev-parse --show-toplevel)
  [ "$workspace" = "$fixture_root/.supergraph/sdd/plan" ] || fail "unexpected workspace: $workspace"
  [ -f "$workspace/.gitignore" ] || fail 'workspace .gitignore missing'
  grep -Fxq '*' "$workspace/.gitignore" || fail 'workspace .gitignore is not protective'

  brief=$(cd "$fixture" && "$SCRIPT_DIR/task-brief" "$plan" 1)
  [ -f "$brief" ] || fail 'task brief missing'
  contains '## Task 1: Extract this task' "$brief" || fail 'task heading missing'
  contains 'Task one body.' "$brief" || fail 'task body missing'
  contains '## Task 2: Fake heading inside code' "$brief" || fail 'mixed fence content leaked out of brief'
  contains 'Task two body.' "$brief" && fail 'neighbor task leaked into brief'
  custom_brief=$(cd "$fixture" && "$SCRIPT_DIR/task-brief" "$plan" 1 custom-brief.md)
  [ "$custom_brief" = "$workspace/custom-brief.md" ] || fail 'custom task brief path not honored'

  package=$(cd "$fixture" && "$SCRIPT_DIR/review-package" "$plan" "$base" "$head")
  [ -f "$package" ] || fail 'review package missing'
  contains 'fixture change' "$package" || fail 'commit list missing'
  contains 'implementation.txt' "$package" || fail 'review stat missing'
  contains 'Added implementation line.' "$package" || fail 'review diff missing'
  [ -f "$fixture/untracked.txt" ] || fail 'unrelated untracked file was removed'
  printf '%s\n' 'must not be overwritten' > "$fixture/escape.diff"
  if (cd "$fixture" && "$SCRIPT_DIR/review-package" "$plan" "$base" "$head" "$fixture/escape.diff" >/dev/null 2>&1); then
    fail 'review package accepted output outside workspace'
  fi
  contains 'must not be overwritten' "$fixture/escape.diff" || fail 'outside output was overwritten'
  symlink_workspace="$fixture/.supergraph/sdd/symlink-plan"
  symlink_plan="$fixture/symlink-plan.md"
  printf '%s\n' '# Symlink plan' '## Task 1: Safe task' 'Safe body.' > "$symlink_plan"
  mkdir -p "$(dirname "$symlink_workspace")"
  ln -s "$fixture/escape.diff" "$symlink_workspace"
  if (cd "$fixture" && "$SCRIPT_DIR/sdd-workspace" "$symlink_plan" >/dev/null 2>&1); then
    fail 'sdd workspace accepted a symlinked workspace'
  fi
  brief_link="$workspace/brief-link.md"
  ln -s "$fixture/escape.diff" "$brief_link"
  if (cd "$fixture" && "$SCRIPT_DIR/task-brief" "$plan" 1 brief-link.md >/dev/null 2>&1); then
    fail 'task brief accepted a symlinked output'
  fi
  mkdir "$workspace/brief-directory"
  if (cd "$fixture" && "$SCRIPT_DIR/task-brief" "$plan" 1 brief-directory >/dev/null 2>&1); then
    fail 'task brief accepted a directory output'
  fi
  review_link="$workspace/review-link.diff"
  ln -s "$fixture/escape.diff" "$review_link"
  if (cd "$fixture" && "$SCRIPT_DIR/review-package" "$plan" "$base" "$head" review-link.diff >/dev/null 2>&1); then
    fail 'review package accepted a symlinked output'
  fi
  contains 'must not be overwritten' "$fixture/escape.diff" || fail 'symlink output was overwritten'

  if (cd "$fixture" && "$SCRIPT_DIR/task-brief" "$plan" 9 >/dev/null 2>&1); then
    fail 'invalid task number unexpectedly succeeded'
  else
    task_status=$?
    [ "$task_status" -eq 3 ] || fail "invalid task exit status: $task_status"
  fi
  if (cd "$fixture" && "$SCRIPT_DIR/review-package" "$plan" bad-ref "$head" >/dev/null 2>&1); then
    fail 'invalid base ref unexpectedly succeeded'
  fi
  if (cd "$fixture" && "$SCRIPT_DIR/sdd-workspace" "$fixture/missing-plan.md" >/dev/null 2>&1); then
    fail 'missing plan unexpectedly succeeded'
  fi

  printf 'PASS: upstream SDD helper lifecycle\n'
}

docs() {
  assert_doc plugins/supergraph/skills/sdd/SKILL.md '.supergraph/sdd/'
  assert_doc plugins/supergraph/skills/sdd/SKILL.md 'ledger.md'
  assert_doc plugins/supergraph/skills/sdd/SKILL.md 'task-brief'
  assert_doc plugins/supergraph/skills/plan/SKILL.md 'Spec:'
  assert_doc plugins/supergraph/skills/execute/SKILL.md 'Pre-dispatch conflict scan'
  assert_doc plugins/supergraph/skills/execute/SKILL.md 'batch'
  assert_doc plugins/supergraph/skills/execute/SKILL.md 'must not spawn subagents'
  assert_doc plugins/supergraph/skills/fix/SKILL.md 'rounds 1-3'
  assert_doc plugins/supergraph/skills/fix/SKILL.md 'rounds 4-5'
  assert_doc plugins/supergraph/skills/fix/SKILL.md 'circuit-breaker'
  assert_doc plugins/supergraph/skills/review/SKILL.md 're-review only changed scope'
  assert_doc plugins/supergraph/skills/review/SKILL.md 'circuit-breaker'
  assert_doc plugins/supergraph/agents/executor.md 'must not spawn subagents'
  assert_doc plugins/supergraph/agents/code-reviewer.md 'must not spawn subagents'
  printf 'PASS: upstream workflow documentation contracts\n'
}

all() {
  scripts
  docs
}

case "$SECTION" in
  scripts) scripts ;;
  docs) docs ;;
  all) all ;;
  *) fail "unknown section: $SECTION" ;;
esac
