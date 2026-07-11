#!/usr/bin/env bash
set -euo pipefail

format_name() {
  printf 'hello %s\n' "$1"
}

main() {
  format_name "${1:-world}"
  if declare -F assert_greeting >/dev/null; then
    assert_greeting
  fi
}

if [[ ${BASH_SOURCE[0]} == "$0" ]]; then
  main "$@"
fi
