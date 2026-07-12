#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
HOOK="$ROOT/plugins/supergraph/hooks/user-prompt-submit"

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

output=$(cd "$ROOT" && printf '%s' '{"prompt":"ordinary request"}' | "$HOOK")

printf '%s' "$output" | python3 -c '
import json, sys

data = json.load(sys.stdin)
hook = data.get("hookSpecificOutput")
assert isinstance(hook, dict), data
assert hook.get("hookEventName") == "UserPromptSubmit", data
assert isinstance(hook.get("additionalContext"), str), data
assert "Always reply in the same language" in hook["additionalContext"], data
assert "additionalContext" not in data, data
' || fail 'user prompt submit output does not follow hook contract'

printf 'PASS: user prompt submit output follows hook contract\n'
