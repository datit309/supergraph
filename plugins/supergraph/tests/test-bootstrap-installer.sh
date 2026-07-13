#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

test_posix_contract() {
  test "$(sed -n '1p' "$ROOT/install.sh")" = '#!/bin/sh' || fail 'bootstrap must use POSIX sh shebang'
  ! grep -Fq 'pipefail' "$ROOT/install.sh" || fail 'bootstrap must not require Bash pipefail'
}

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
    sh "$ROOT/install.sh" --platform codex --dry-run

  test -d "$checkout/.git" || fail 'bootstrap did not create Git checkout'
  test -f "$record" || fail 'bootstrap did not delegate to plugin installer'
  test "$(sed -n '1p' "$record")" = '--platform' || fail 'bootstrap lost --platform'
  test "$(sed -n '2p' "$record")" = 'codex' || fail 'bootstrap lost platform value'
  test "$(sed -n '3p' "$record")" = '--dry-run' || fail 'bootstrap lost --dry-run'
}

test_safe_update_and_errors() {
  local source_repo="$TMP/source" remote_repo="$TMP/remote.git"
  local checkout="$TMP/checkout" record="$TMP/args" output before

  printf 'updated\n' >"$source_repo/version.txt"
  git -C "$source_repo" add version.txt
  git -C "$source_repo" commit -qm 'test: publish update'
  git -C "$source_repo" push -q "$remote_repo" HEAD

  SUPERGRAPH_REPO_URL="$remote_repo" \
    SUPERGRAPH_INSTALL_DIR="$checkout" \
    SUPERGRAPH_TEST_RECORD="$record" \
    sh "$ROOT/install.sh" --platform codex
  test "$(cat "$checkout/version.txt")" = 'updated' || fail 'clean checkout was not updated'

  printf '# local change\n' >>"$checkout/plugins/supergraph/install.sh"
  before="$(git -C "$checkout" diff -- plugins/supergraph/install.sh)"
  if output="$(SUPERGRAPH_REPO_URL="$remote_repo" \
    SUPERGRAPH_INSTALL_DIR="$checkout" \
    SUPERGRAPH_TEST_RECORD="$record" \
    sh "$ROOT/install.sh" --platform codex 2>&1)"; then
    fail 'dirty checkout update unexpectedly succeeded'
  fi
  case "$output" in
    *'uncommitted changes'*) ;;
    *) fail 'dirty checkout error is not actionable' ;;
  esac
  test "$(git -C "$checkout" diff -- plugins/supergraph/install.sh)" = "$before" || fail 'dirty checkout was modified'

  mkdir -p "$TMP/not-a-repo"
  if output="$(SUPERGRAPH_INSTALL_DIR="$TMP/not-a-repo" sh "$ROOT/install.sh" 2>&1)"; then
    fail 'malformed checkout unexpectedly succeeded'
  fi
  case "$output" in
    *'not a Git checkout'*) ;;
    *) fail 'malformed checkout error is not actionable' ;;
  esac

  if output="$(PATH="$TMP/missing-bin" SUPERGRAPH_INSTALL_DIR="$TMP/missing-git" /bin/sh "$ROOT/install.sh" 2>&1)"; then
    fail 'missing Git unexpectedly succeeded'
  fi
  case "$output" in
    *'requires Git'*) ;;
    *) fail 'missing Git error is not actionable' ;;
  esac
}

test_posix_contract
test_clone_and_forward
test_safe_update_and_errors
printf 'PASS: POSIX bootstrap clones, updates, forwards, and rejects unsafe states\n'
