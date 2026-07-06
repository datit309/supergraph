#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' \
    'Usage: install.sh [--platform claude|antigravity|codex|opencode] [--dry-run] [--help]' \
    '' \
    'Installs Supergraph plugin via symlink.' \
    '' \
    'Platforms:' \
    '  claude       -> ~/.claude/plugins/supergraph' \
    '  antigravity  -> ~/.gemini/antigravity-cli/plugins/supergraph' \
    '  codex        -> ./.codex-plugin' \
    '  opencode     -> ./.opencode/skills/<skill>/ (flat skill symlinks + prints opencode.json snippet)'
}

platform_arg=''
dry_run=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --platform)
      [ "$#" -ge 2 ] || { printf 'Missing value for --platform\n' >&2; exit 2; }
      platform_arg="$2"
      shift 2
      ;;
    --dry-run)
      dry_run=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown argument: %s\n\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

platform_detect() {
  if [ -n "$platform_arg" ]; then
    case "$platform_arg" in
      claude|antigravity|codex|opencode) printf '%s\n' "$platform_arg" ;;
      *) printf 'Unsupported platform: %s\n' "$platform_arg" >&2; exit 2 ;;
    esac
  elif command -v claude >/dev/null 2>&1; then
    printf 'claude\n'
  elif command -v agy >/dev/null 2>&1 || command -v antigravity >/dev/null 2>&1; then
    printf 'antigravity\n'
  elif command -v codex >/dev/null 2>&1; then
    printf 'codex\n'
  elif command -v opencode >/dev/null 2>&1; then
    printf 'opencode\n'
  else
    printf 'No supported CLI detected. Re-run with --platform claude|antigravity|codex|opencode.\n' >&2
    exit 1
  fi
}

next_steps() {
  case "$1" in
    claude) printf 'Next: run /supergraph:scan\n' ;;
    antigravity) printf 'Next: start Antigravity CLI in your project and ask it to use supergraph skills\n' ;;
    codex) printf 'Next: run codex and confirm plugin skills loaded\n' ;;
    opencode) printf 'Next: add the printed config snippet to your opencode.json, restart OpenCode, then ask it to use the scan skill\n' ;;
  esac
}

link_path() {
  src="$1"
  dst="$2"
  if [ -e "$dst" ] && [ ! -L "$dst" ]; then
    printf 'Refusing to overwrite non-symlink: %s\n' "$dst" >&2
    exit 1
  fi
  ln -sfn "$src" "$dst"
}

platform="$(platform_detect)"
source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$platform" in
  claude) target="$HOME/.claude/plugins/supergraph" ;;
  antigravity) target="$HOME/.gemini/antigravity-cli/plugins/supergraph" ;;
  codex) target="$PWD/.codex-plugin" ;;
  opencode) target="$PWD/.opencode/skills" ;;
esac

printf 'Platform: %s\n' "$platform"
printf 'Source: %s\n' "$source_dir"
printf 'Target: %s\n' "$target"

if [ "$dry_run" -eq 1 ]; then
  printf 'Dry run: no changes made\n'
  next_steps "$platform"
  exit 0
fi

case "$platform" in
  claude|antigravity)
    mkdir -p "$(dirname "$target")"
    link_path "$source_dir" "$target"
    ;;
  codex)
    mkdir -p "$target"
    link_path "$source_dir/.codex-plugin/plugin.json" "$target/plugin.json"
    link_path "$source_dir/.codex-plugin/.mcp.json" "$target/.mcp.json"
    link_path "$source_dir/skills" "$target/skills"
    link_path "$source_dir/agents" "$target/agents"
    link_path "$source_dir/hooks" "$target/hooks"
    ;;
  opencode)
    mkdir -p "$target"
    for skill_dir in "$source_dir"/skills/*; do
      [ -d "$skill_dir" ] || continue
      link_path "$skill_dir" "$target/$(basename "$skill_dir")"
    done
    cp "$source_dir/OPENCODE.md" "$PWD/OPENCODE.md" 2>/dev/null || true
    cat "$source_dir/.opencode-plugin/opencode.json"
    printf '\n\nAdd the above to your project opencode.json (or create it at project root), then restart OpenCode.\n'
    ;;
esac

printf 'Installed Supergraph plugin.\n'
next_steps "$platform"
