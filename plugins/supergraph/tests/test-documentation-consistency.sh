#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
fail() { printf 'FAIL: %s\n' "$*" >&2; exit 1; }

python3 - "$ROOT" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1]).parent.parent
artifacts = [
    root / "README.md",
    root / "README-VI.md",
    root / "README-VI.html",
    root / "plugins/supergraph/plugin.json",
    root / "plugins/supergraph/.claude-plugin/plugin.json",
    root / "plugins/supergraph/.claude-plugin/marketplace.json",
    root / "plugins/supergraph/.codex-plugin/plugin.json",
    root / "plugins/supergraph/docs/TEAM-SETUP.md",
]
workflow = "scan → analyze → plan → TDD → execute → fix → verify → review"
for path in artifacts:
    text = path.read_text(encoding="utf-8")
    for marker in ("codebase-memory-mcp", "0.9.0", "Serena", workflow):
        assert marker in text, f"{path} missing {marker!r}"

for path in artifacts[:1] + [artifacts[-1]] + [artifacts[5]]:
    text = path.read_text(encoding="utf-8")
    for marker in ("dynamic", "Git Bash", "hooks skipped"):
        assert marker.lower() in text.lower(), f"{path} missing Windows hook marker {marker!r}"
for path in artifacts[1:3]:
    text = path.read_text(encoding="utf-8")
    for marker in ("tự tìm", "Git Bash", "hooks skipped"):
        assert marker.lower() in text.lower(), f"{path} missing Windows hook marker {marker!r}"

for path in artifacts[3:7]:
    data = json.loads(path.read_text(encoding="utf-8"))
    description = json.dumps(data, ensure_ascii=False)
    assert "codebase-memory-mcp" in description
    assert "Serena" in description
    assert "scan" in description and "review" in description
    assert "code-review" + "-graph" not in description
PY

printf 'PASS: documentation consistency\n'
