#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

test_dry_run() {
  local output
  output="$("$ROOT/install.sh" --platform dsh --dry-run)"
  case "$output" in
    *"[DRY RUN]"*"mcp-codebase-memory"*) ;;
    *) fail 'dry run output missing expected markers' ;;
  esac
  printf 'PASS: dsh installer dry-run contract\n'
}

test_real_install_and_idempotency() {
  local mock_dsh="$TMP/dsh_home"
  local mock_agents="$TMP/agents_home"
  mkdir -p "$mock_dsh" "$mock_agents"

  # Real install
  DSH_HOME="$mock_dsh" DSH_AGENTS_HOME="$mock_agents" "$ROOT/install.sh" --platform dsh >/dev/null

  # Verify skills linked in both DSH_HOME/skills and DSH_AGENTS_HOME/skills
  test -L "$mock_dsh/skills/scan" || fail 'scan skill symlink missing in DSH_HOME'
  test -L "$mock_agents/skills/scan" || fail 'scan skill symlink missing in DSH_AGENTS_HOME'
  test -f "$mock_dsh/skills/scan/SKILL.md" || fail 'scan/SKILL.md not accessible via symlink'

  # Verify cordis.patch.yml created and contains MCP config
  test -f "$mock_dsh/cordis.patch.yml" || fail 'cordis.patch.yml not created'
  grep -Fq 'mcp-codebase-memory' "$mock_dsh/cordis.patch.yml" || fail 'cordis.patch.yml missing mcp-codebase-memory'
  grep -Fq 'mcp-serena' "$mock_dsh/cordis.patch.yml" || fail 'cordis.patch.yml missing mcp-serena'

  # Verify AGENTS.md copied
  test -f "$mock_dsh/AGENTS.md" || fail 'DSH_HOME/AGENTS.md not created'

  # Add a stale link to verify cleanup
  ln -s "$ROOT/skills/scan" "$mock_dsh/skills/stale-skill"
  test -L "$mock_dsh/skills/stale-skill" || fail 'setup stale link failed'

  # Run second time for idempotency check
  DSH_HOME="$mock_dsh" DSH_AGENTS_HOME="$mock_agents" "$ROOT/install.sh" --platform dsh >/dev/null

  # Verify stale link removed
  test ! -e "$mock_dsh/skills/stale-skill" || fail 'stale skill link was not cleaned up'

  # Verify no duplicate entries in cordis.patch.yml
  local occurrences
  occurrences="$(grep -c 'mcp-codebase-memory' "$mock_dsh/cordis.patch.yml" || true)"
  test "$occurrences" -eq 1 || fail "cordis.patch.yml duplicated entries (found $occurrences)"

  printf 'PASS: dsh installer real execution and idempotency\n'
}

test_dry_run
test_real_install_and_idempotency
