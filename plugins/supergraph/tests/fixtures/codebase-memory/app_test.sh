#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source "$ROOT/app.sh"

assert_greeting() {
  test "$(format_name Codex)" = 'hello Codex'
}

output=$(format_name Codex)
test "$output" = 'hello Codex'
main Codex >/dev/null
