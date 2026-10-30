#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$REPO_ROOT/plugins/supergraph"

ROOT_PKG="$REPO_ROOT/package.json"
PLUGIN_PKG="$PLUGIN_DIR/package.json"

PLUGIN_JSON="$PLUGIN_DIR/.claude-plugin/plugin.json"
MARKET_JSON="$PLUGIN_DIR/.claude-plugin/marketplace.json"
ROOT_MARKET_JSON="$REPO_ROOT/.claude-plugin/marketplace.json"
ANTIGRAVITY_JSON="$PLUGIN_DIR/plugin.json"
CODEX_JSON="$PLUGIN_DIR/.codex-plugin/plugin.json"
DSH_JSON="$PLUGIN_DIR/.dsh-plugin/plugin.json"
ROOT_DSH_JSON="$REPO_ROOT/.dsh-plugin/plugin.json"

bump_json_version() {
  local target_file="$1"
  local new_ver="$2"
  if [[ -f "$target_file" ]]; then
    python3 - "$target_file" "$new_ver" <<'EOF'
import json, sys
path, ver = sys.argv[1], sys.argv[2]
with open(path, 'r', encoding='utf-8') as f:
    d = json.load(f)

if 'version' in d:
    d['version'] = ver
elif 'plugins' in d and isinstance(d['plugins'], list):
    for p in d['plugins']:
        if isinstance(p, dict) and 'version' in p:
            p['version'] = ver

with open(path, 'w', encoding='utf-8') as f:
    json.dump(d, f, indent=2, ensure_ascii=False)
    f.write('\n')
print(f"  {path}: {ver}")
EOF
  fi
}

current=$(python3 -c "import json; print(json.load(open('$PLUGIN_JSON'))['version'])")

if [[ -n "$1" ]]; then
  new_version="$1"
else
  IFS='.' read -r major minor patch <<< "$current"
  new_version="$major.$minor.$((patch + 1))"
fi

# validate semver
if ! [[ "$new_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Invalid version: $new_version (expected x.y.z)" >&2
  exit 1
fi

echo "Bumping version from $current to $new_version..."

bump_json_version "$ROOT_PKG" "$new_version"
bump_json_version "$PLUGIN_PKG" "$new_version"
bump_json_version "$PLUGIN_JSON" "$new_version"
bump_json_version "$MARKET_JSON" "$new_version"
bump_json_version "$ROOT_MARKET_JSON" "$new_version"
bump_json_version "$ANTIGRAVITY_JSON" "$new_version"
bump_json_version "$CODEX_JSON" "$new_version"
bump_json_version "$DSH_JSON" "$new_version"
bump_json_version "$ROOT_DSH_JSON" "$new_version"

echo "✅ $current → $new_version"
