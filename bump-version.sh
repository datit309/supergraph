#!/usr/bin/env bash
set -e

PLUGIN_DIR="$(cd "$(dirname "$0")/plugins/supergraph" && pwd)"
PLUGIN_JSON="$PLUGIN_DIR/.claude-plugin/plugin.json"
MARKET_JSON="$PLUGIN_DIR/.claude-plugin/marketplace.json"

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

python3 - "$PLUGIN_JSON" "$new_version" <<'EOF'
import json, sys
path, ver = sys.argv[1], sys.argv[2]
d = json.load(open(path))
d['version'] = ver
json.dump(d, open(path, 'w'), indent=2, ensure_ascii=False)
print(f"  {path}: {ver}")
EOF

python3 - "$MARKET_JSON" "$new_version" <<'EOF'
import json, sys
path, ver = sys.argv[1], sys.argv[2]
d = json.load(open(path))
d['version'] = ver
json.dump(d, open(path, 'w'), indent=2, ensure_ascii=False)
print(f"  {path}: {ver}")
EOF

echo "✅ $current → $new_version"
