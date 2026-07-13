#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
HOOK_DIR="$ROOT/plugins/supergraph/hooks"
SECTION=${1:-all}

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

assert_json() {
  local event=$1 output=$2 shape=$3
  [ -n "$output" ] || fail "$event emitted no JSON"
  printf '%s' "$output" | python3 -c '
import json, sys
event, shape = sys.argv[1:]
data = json.load(sys.stdin)
assert isinstance(data, dict), data
if shape == "system":
    assert isinstance(data.get("systemMessage"), str) and data["systemMessage"], data
elif shape == "context":
    hook = data.get("hookSpecificOutput")
    assert isinstance(hook, dict), data
    assert hook.get("hookEventName") == event, data
    assert isinstance(hook.get("additionalContext"), str) and hook["additionalContext"], data
elif shape == "deny":
    hook = data.get("hookSpecificOutput")
    assert isinstance(hook, dict), data
    assert hook.get("hookEventName") == event, data
    assert hook.get("permissionDecision") == "deny", data
    assert isinstance(hook.get("permissionDecisionReason"), str), data
' "$event" "$shape" || fail "$event emitted invalid $shape JSON"
}

lifecycle() {
  local output
  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"Stop","stop_hook_active":false}' | "$HOOK_DIR/stop")
  assert_json Stop "$output" system

  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"PreCompact","trigger":"auto"}' | "$HOOK_DIR/pre-compact")
  assert_json PreCompact "$output" system

  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"PostToolUse","tool_name":"Bash","tool_response":{"exit_code":1,"output":"1 failed"}}' | "$HOOK_DIR/post-tool-use-bash")
  assert_json PostToolUse "$output" context
  printf 'PASS: lifecycle message hooks follow Codex output contracts\n'
}

pre_tool() {
  local output
  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"PreToolUse","tool_name":"apply_patch","tool_input":{"file_path":"src/example.py"}}' | "$HOOK_DIR/pre-tool-use")
  assert_json PreToolUse "$output" context

  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git reset --hard"}}' | "$HOOK_DIR/bash-guard")
  assert_json PreToolUse "$output" deny

  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"git status"}}' | "$HOOK_DIR/bash-guard")
  [ -z "$output" ] || fail 'benign Bash command should emit no output'
  printf 'PASS: pre tool use hooks follow Codex input and decision contracts\n'
}

remaining() {
  local output
  python3 - "$HOOK_DIR/hooks.json" <<'PY'
import json, re, sys

data = json.load(open(sys.argv[1], encoding="utf-8"))["hooks"]
configured = set()
for groups in data.values():
    for group in groups:
        for hook in group.get("hooks", []):
            match = re.search(r"run-hook\.cmd\\?\"?\s+([a-z-]+)", hook["command"])
            assert match, hook
            configured.add(match.group(1))
expected = {
    "session-start", "user-prompt-submit", "pre-tool-use", "bash-guard",
    "post-tool-use", "post-tool-use-bash", "pre-compact", "stop",
}
assert configured == expected, (configured, expected)
PY

  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"SessionStart","source":"startup"}' | "$HOOK_DIR/session-start")
  assert_json SessionStart "$output" context

  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"UserPromptSubmit","prompt":"ordinary request"}' | "$HOOK_DIR/user-prompt-submit")
  assert_json UserPromptSubmit "$output" context

  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"PostToolUse","tool_name":"apply_patch","tool_response":{}}' | "$HOOK_DIR/post-tool-use")
  [ -z "$output" ] || fail 'PostToolUse Write/Edit no-op should emit no output'

  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"PostToolUse","tool_name":"Bash","tool_response":{"exit_code":0,"output":"ok"}}' | "$HOOK_DIR/post-tool-use-bash")
  [ -z "$output" ] || fail 'successful Bash PostToolUse should emit no output'

  output=$(cd "$ROOT" && printf '%s' '{"hook_event_name":"PreToolUse","tool_name":"apply_patch","tool_input":{"file_path":"README.md"}}' | "$HOOK_DIR/pre-tool-use")
  [ -z "$output" ] || fail 'non-source PreToolUse should emit no output'
  printf 'PASS: all configured Supergraph hooks satisfy Codex contracts\n'
}

all() {
  lifecycle
  pre_tool
  remaining
}

case "$SECTION" in
  lifecycle) lifecycle ;;
  pre-tool) pre_tool ;;
  all) all ;;
  *) fail "unknown section: $SECTION" ;;
esac
