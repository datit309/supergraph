#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)
HOOK_DIR="$ROOT/plugins/supergraph/hooks"
SECTION=${1:-all}

fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

contains() {
  case "$1" in *"$2"*) return 0 ;; *) return 1 ;; esac
}

not_contains() {
  ! contains "$1" "$2"
}

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

update_notice() {
  local tmp fake_bin output count_file current
  tmp=$(mktemp -d)
  fake_bin="$tmp/bin"
  count_file="$tmp/curl-count"
  mkdir -p "$fake_bin"
  trap "rm -rf '$tmp'" EXIT
  current=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$ROOT/plugins/supergraph/plugin.json" | head -1)

  cat >"$fake_bin/curl" <<'SH'
#!/usr/bin/env bash
printf 'fetch\n' >>"$FAKE_CURL_COUNT"
case " $* " in
  *' --connect-timeout 1 --max-time 2 https://raw.githubusercontent.com/datit309/supergraph/master/plugins/supergraph/plugin.json '*) ;;
  *) exit 64 ;;
esac
[ "${FAKE_CURL_FAIL:-false}" != true ] || exit 28
printf '{"version":"%s"}\n' "$FAKE_LATEST_VERSION"
SH
  chmod +x "$fake_bin/curl"

  run_update_hook() {
    local platform=$1 latest=$2 cache_name=$3
    printf '%s' '{"hook_event_name":"SessionStart","source":"startup"}' |
      env PATH="$fake_bin:$PATH" XDG_CACHE_HOME="$tmp/$cache_name" \
        SUPERGRAPH_PLATFORM="$platform" FAKE_LATEST_VERSION="$latest" \
        FAKE_CURL_COUNT="$count_file" "$HOOK_DIR/session-start"
  }

  output=$(run_update_hook claude 999.0.0 claude)
  assert_json SessionStart "$output" context
  contains "$output" 'SUPERGRAPH UPDATE AVAILABLE' || fail 'newer version should emit SUPERGRAPH UPDATE AVAILABLE'
  contains "$output" '/plugin marketplace update supergraph' || fail 'Claude update command missing'
  contains "$output" "Current: $current" || fail 'current version missing'
  contains "$output" 'Latest: 999.0.0' || fail 'latest version missing'
  output=$(run_update_hook codex 999.0.0 codex)
  contains "$output" 'codex plugin marketplace upgrade supergraph' || fail 'Codex update command missing'
  output=$(run_update_hook antigravity 999.0.0 antigravity)
  contains "$output" 'sh -s -- --platform antigravity' || fail 'Antigravity update command missing'
  output=$(run_update_hook opencode v999.0.0 opencode)
  contains "$output" 'sh -s -- --platform opencode' || fail 'OpenCode update command missing'
  output=$(run_update_hook claude 1000000000.0.0 large-semver)
  contains "$output" 'SUPERGRAPH UPDATE AVAILABLE' || fail 'large numeric semver should emit update notice'
  output=$(run_update_hook claude "$current" equal)
  not_contains "$output" 'SUPERGRAPH UPDATE AVAILABLE' || fail 'equal version should not emit update notice'
  output=$(run_update_hook claude 0.0.1 older)
  not_contains "$output" 'SUPERGRAPH UPDATE AVAILABLE' || fail 'older version should not emit update notice'
  output=$(run_update_hook claude 2.3.0-beta.1 prerelease)
  not_contains "$output" 'SUPERGRAPH UPDATE AVAILABLE' || fail 'prerelease version should be ignored'
  output=$(run_update_hook claude invalid malformed)
  not_contains "$output" 'SUPERGRAPH UPDATE AVAILABLE' || fail 'malformed version should be ignored'

  for corrupt_timestamp in 08 999999999999999999999999999999999999999999999999; do
    mkdir -p "$tmp/corrupt/supergraph"
    printf '%s\t999.0.0\n' "$corrupt_timestamp" >"$tmp/corrupt/supergraph/update-check"
    if ! output=$(run_update_hook claude 999.0.0 corrupt); then
      fail "corrupt cache timestamp should not fail SessionStart: $corrupt_timestamp"
    fi
    assert_json SessionStart "$output" context
  done
  mkdir -p "$tmp/truncated/supergraph"
  printf 'broken-cache' >"$tmp/truncated/supergraph/update-check"
  output=$(run_update_hook claude 999.0.0 truncated)
  assert_json SessionStart "$output" context

  rm -f "$count_file"
  output=$(printf '%s' '{"hook_event_name":"SessionStart"}' |
    env PATH="$fake_bin:$PATH" XDG_CACHE_HOME="$tmp/disabled" SUPERGRAPH_UPDATE_CHECK=false \
      SUPERGRAPH_PLATFORM=claude FAKE_LATEST_VERSION=999.0.0 FAKE_CURL_COUNT="$count_file" "$HOOK_DIR/session-start")
  not_contains "$output" 'SUPERGRAPH UPDATE AVAILABLE' || fail 'disabled check should not emit update notice'
  [ ! -e "$count_file" ] || fail 'disabled check should not fetch'
  output=$(printf '%s' '{"hook_event_name":"SessionStart"}' |
    env PATH="$fake_bin:$PATH" XDG_CACHE_HOME="$tmp/offline" SUPERGRAPH_PLATFORM=claude \
      FAKE_LATEST_VERSION=999.0.0 FAKE_CURL_FAIL=true FAKE_CURL_COUNT="$count_file" "$HOOK_DIR/session-start")
  assert_json SessionStart "$output" context
  not_contains "$output" 'SUPERGRAPH UPDATE AVAILABLE' || fail 'offline check should not emit update notice'

  rm -f "$count_file"
  output=$(run_update_hook codex 999.0.0 cached)
  output=$(run_update_hook codex 999.0.0 cached)
  [ "$(wc -l <"$count_file" | tr -d ' ')" -eq 1 ] || fail 'fresh cache should prevent second fetch'
  contains "$output" 'SUPERGRAPH UPDATE AVAILABLE' || fail 'fresh cache should retain update notice'
  printf 'PASS: SessionStart emits cached platform update notices safely\n'
}

update_docs() {
  local english vietnamese antigravity_command opencode_command
  english=$(cat "$ROOT/README.md")
  vietnamese=$(cat "$ROOT/README-VI.md")
  antigravity_command='curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform antigravity'
  opencode_command='curl -fsSL https://raw.githubusercontent.com/datit309/supergraph/master/install.sh | sh -s -- --platform opencode'

  contains "$english" 'Automatic update notifications' || fail 'README missing automatic update notice documentation'
  contains "$vietnamese" 'Thông báo cập nhật tự động' || fail 'README-VI missing automatic update notice documentation'
  for content in "$english" "$vietnamese"; do
    contains "$content" 'SUPERGRAPH_UPDATE_CHECK=false' || fail 'update opt-out documentation missing'
    contains "$content" '/plugin marketplace update supergraph' || fail 'Claude documentation command missing'
    contains "$content" 'codex plugin marketplace upgrade supergraph' || fail 'Codex documentation command missing'
    contains "$content" "$antigravity_command" || fail 'Antigravity documentation command missing'
    contains "$content" "$opencode_command" || fail 'OpenCode documentation command missing'
  done
  contains "$english" 'OpenCode does not currently expose a SessionStart hook' || fail 'README missing OpenCode hook limitation'
  contains "$vietnamese" 'OpenCode hiện chưa cung cấp hook SessionStart' || fail 'README-VI missing OpenCode hook limitation'
  printf 'PASS: bilingual update documentation matches platform commands\n'
}

all() {
  lifecycle
  pre_tool
  remaining
  update_notice
  update_docs
}

case "$SECTION" in
  lifecycle) lifecycle ;;
  pre-tool) pre_tool ;;
  update-notice) update_notice ;;
  update-docs) update_docs ;;
  all) all ;;
  *) fail "unknown section: $SECTION" ;;
esac
