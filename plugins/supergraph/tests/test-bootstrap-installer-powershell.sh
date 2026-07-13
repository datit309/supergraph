#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SCRIPT="$ROOT/install.ps1"
WORKFLOW="$ROOT/.github/workflows/installer-tests.yml"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }
contains() { grep -Fq -- "$2" "$1" || fail "$1 missing marker: $2"; }

test_contract() {
  test -f "$SCRIPT" || fail 'install.ps1 missing'
  for marker in 'pull --ff-only' 'status --porcelain' 'SUPERGRAPH_REPO_URL' 'SUPERGRAPH_INSTALL_DIR' 'uncommitted changes' 'not a Git checkout' 'Get-Command git' 'Get-Command bash'; do
    contains "$SCRIPT" "$marker"
  done
  test -f "$WORKFLOW" || fail 'Windows installer workflow missing'
  contains "$WORKFLOW" 'windows-latest'
  contains "$WORKFLOW" 'powershell.exe'
  contains "$WORKFLOW" 'test-bootstrap-installer-powershell.sh'
}

find_powershell() {
  if command -v pwsh >/dev/null 2>&1; then
    command -v pwsh
  elif command -v powershell.exe >/dev/null 2>&1; then
    command -v powershell.exe
  fi
}

to_powershell_path() {
  if command -v cygpath >/dev/null 2>&1; then
    cygpath -m "$1"
  else
    printf '%s\n' "$1"
  fi
}

test_behavior_when_available() {
  local powershell source_repo remote_repo checkout record output before
  local ps_script ps_remote ps_checkout ps_record ps_help_dir
  powershell="$(find_powershell || true)"
  [ -n "$powershell" ] || return 0

  source_repo="$TMP/source"
  remote_repo="$TMP/remote.git"
  checkout="$TMP/checkout"
  record="$TMP/args"
  mkdir -p "$source_repo/plugins/supergraph"
  git -C "$source_repo" init -q
  git -C "$source_repo" config user.name 'Supergraph Test'
  git -C "$source_repo" config user.email 'test@example.com'
  cat >"$source_repo/plugins/supergraph/install.sh" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
printf '%s\n' "$@" >"$SUPERGRAPH_TEST_RECORD"
STUB
  chmod +x "$source_repo/plugins/supergraph/install.sh"
  git -C "$source_repo" add plugins/supergraph/install.sh
  git -C "$source_repo" commit -qm 'test: seed PowerShell fixture'
  git clone -q --bare "$source_repo" "$remote_repo"

  ps_script="$(to_powershell_path "$SCRIPT")"
  ps_remote="$(to_powershell_path "$remote_repo")"
  ps_checkout="$(to_powershell_path "$checkout")"
  ps_record="$(to_powershell_path "$record")"
  ps_help_dir="$(to_powershell_path "$TMP/help-must-not-exist")"

  SUPERGRAPH_REPO_URL="$ps_remote" \
    SUPERGRAPH_INSTALL_DIR="$ps_checkout" \
    SUPERGRAPH_TEST_RECORD="$ps_record" \
    "$powershell" -NoProfile -File "$ps_script" -Platform codex -DryRun
  test -d "$checkout/.git" || fail 'PowerShell bootstrap did not clone checkout'
  test "$(sed -n '1p' "$record")" = '--platform' || fail 'PowerShell bootstrap lost --platform'
  test "$(sed -n '2p' "$record")" = 'codex' || fail 'PowerShell bootstrap lost platform value'
  test "$(sed -n '3p' "$record")" = '--dry-run' || fail 'PowerShell bootstrap lost --dry-run'

  printf 'updated\n' >"$source_repo/version.txt"
  git -C "$source_repo" add version.txt
  git -C "$source_repo" commit -qm 'test: publish PowerShell update'
  git -C "$source_repo" push -q "$remote_repo" HEAD
  SUPERGRAPH_REPO_URL="$ps_remote" \
    SUPERGRAPH_INSTALL_DIR="$ps_checkout" \
    SUPERGRAPH_TEST_RECORD="$ps_record" \
    "$powershell" -NoProfile -File "$ps_script" -Platform codex
  test "$(cat "$checkout/version.txt")" = 'updated' || fail 'PowerShell clean checkout was not updated'

  printf '# local change\n' >>"$checkout/plugins/supergraph/install.sh"
  before="$(git -C "$checkout" diff -- plugins/supergraph/install.sh)"
  if output="$(SUPERGRAPH_REPO_URL="$ps_remote" \
    SUPERGRAPH_INSTALL_DIR="$ps_checkout" \
    SUPERGRAPH_TEST_RECORD="$ps_record" \
    "$powershell" -NoProfile -File "$ps_script" -Platform codex 2>&1)"; then
    fail 'PowerShell dirty checkout update unexpectedly succeeded'
  fi
  case "$output" in
    *'uncommitted changes'*) ;;
    *) fail 'PowerShell dirty checkout error is not actionable' ;;
  esac
  test "$(git -C "$checkout" diff -- plugins/supergraph/install.sh)" = "$before" || fail 'PowerShell dirty checkout was modified'

  SUPERGRAPH_INSTALL_DIR="$ps_help_dir" \
    "$powershell" -NoProfile -File "$ps_script" -Help >/dev/null
  test ! -e "$TMP/help-must-not-exist" || fail 'PowerShell -Help mutated filesystem'
}

test_contract
test_behavior_when_available
printf 'PASS: PowerShell bootstrap contract and available runtime behavior\n'
