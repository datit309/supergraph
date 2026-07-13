#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

create_remote() {
  local source_repo="$TMP/source" remote_repo="$TMP/remote.git"
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
  git -C "$source_repo" commit -qm 'test: seed installer fixture'
  git clone -q --bare "$source_repo" "$remote_repo"
  printf '%s\n' "$remote_repo"
}

test_clone_and_forward() {
  local remote checkout record
  remote="$(create_remote)"
  checkout="$TMP/checkout"
  record="$TMP/args"

  SUPERGRAPH_REPO_URL="$remote" \
    SUPERGRAPH_INSTALL_DIR="$checkout" \
    SUPERGRAPH_TEST_RECORD="$record" \
    bash "$ROOT/install.sh" --platform codex --dry-run

  test -d "$checkout/.git" || fail 'bootstrap did not create Git checkout'
  test -f "$record" || fail 'bootstrap did not delegate to plugin installer'
  test "$(sed -n '1p' "$record")" = '--platform' || fail 'bootstrap lost --platform'
  test "$(sed -n '2p' "$record")" = 'codex' || fail 'bootstrap lost platform value'
  test "$(sed -n '3p' "$record")" = '--dry-run' || fail 'bootstrap lost --dry-run'
}

test_clone_and_forward
printf 'PASS: POSIX bootstrap clones checkout and forwards arguments\n'
