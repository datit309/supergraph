#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' \
    'Usage: install.sh [--platform claude|antigravity|codex|opencode|all] [--dry-run] [--help]' \
    '' \
    'Installs Supergraph plugin via symlink.' \
    '' \
    'Platforms:' \
    '  claude       -> ~/.claude/plugins/supergraph' \
    '  antigravity  -> ~/.gemini/antigravity-cli/plugins/supergraph' \
    '  codex        -> ./.codex-plugin' \
    '  opencode     -> ~/.config/opencode/skills/<skill>/ (global, flat symlinks + opencode.json)' \
    '  all          -> install for all 4 platforms at once'
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
      claude|antigravity|codex|opencode|all) printf '%s\n' "$platform_arg" ;;
      *) printf 'Unsupported platform: %s\n' "$platform_arg" >&2; exit 2 ;;
    esac
  else
    printf 'all\n'
  fi
}

next_steps() {
  case "$1" in
    claude) printf 'Next: run /supergraph:scan\n' ;;
    antigravity) printf 'Next: start Antigravity CLI in your project and ask it to use supergraph skills\n' ;;
    codex) printf 'Next: run codex and confirm plugin skills loaded\n' ;;
    opencode) printf 'Next: restart OpenCode and run /scan (global config at ~/.config/opencode/opencode.json)\n' ;;
    all) printf 'Next: run /supergraph:scan on each platform\n' ;;
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

install_one() {
  _platform="$1"
  case "$_platform" in
    claude) _target="$HOME/.claude/plugins/supergraph" ;;
    antigravity) _target="$HOME/.gemini/antigravity-cli/plugins/supergraph" ;;
    codex) _target="$PWD/.codex-plugin" ;;
    opencode) _target="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills" ;;
  esac
  printf 'Platform: %s\n' "$_platform"
  printf 'Source: %s\n' "$source_dir"
  printf 'Target: %s\n' "$_target"
  if [ "$dry_run" -eq 1 ]; then
    printf 'Dry run: no changes made\n'
    if [ "$_platform" = "opencode" ]; then
      cat "$source_dir/.opencode-plugin/opencode.json"
      printf '\n\n[DRY RUN] Would create ~/.config/opencode/opencode.json, then restart OpenCode.\n'
    fi
    next_steps "$_platform"
    return 0
  fi
  case "$_platform" in
    claude|antigravity)
      mkdir -p "$(dirname "$_target")"
      link_path "$source_dir" "$_target"
      ;;
    codex)
      mkdir -p "$_target"
      link_path "$source_dir/.codex-plugin/plugin.json" "$_target/plugin.json"
      link_path "$source_dir/.codex-plugin/.mcp.json" "$_target/.mcp.json"
      link_path "$source_dir/skills" "$_target/skills"
      link_path "$source_dir/agents" "$_target/agents"
      link_path "$source_dir/hooks" "$_target/hooks"
      ;;
    opencode)
      mkdir -p "$_target"
      for skill_dir in "$source_dir"/skills/*; do
        [ -d "$skill_dir" ] || continue
        link_path "$skill_dir" "$_target/$(basename "$skill_dir")"
      done
      for link in "$_target"/*; do
        [ -L "$link" ] || continue
        base="$(basename "$link")"
        if [ ! -e "$source_dir/skills/$base" ]; then
          printf 'Removing stale skill link: %s\n' "$link"
          rm "$link"
        fi
      done
      _global_config="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
      mkdir -p "$_global_config"
      if [ -e "$_global_config/OPENCODE.md" ] && [ ! -L "$_global_config/OPENCODE.md" ]; then
        printf 'Refusing to overwrite non-symlink: %s (keep your custom OPENCODE.md)\n' "$_global_config/OPENCODE.md" >&2
      else
        cp "$source_dir/OPENCODE.md" "$_global_config/OPENCODE.md" 2>/dev/null || true
      fi
      if [ ! -f "$_global_config/opencode.json" ]; then
        cat "$source_dir/.opencode-plugin/opencode.json" > "$_global_config/opencode.json"
        printf 'Created %s/opencode.json — restart OpenCode.\n' "$_global_config"
      else
        printf 'Global config exists at %s/opencode.json — ensure it contains instructions and mcp entries from:\n' "$_global_config"
        cat "$source_dir/.opencode-plugin/opencode.json"
        printf '\n'
      fi
      ;;
  esac
  printf 'Installed Supergraph plugin for %s.\n' "$_platform"
  next_steps "$_platform"
}

platform="$(platform_detect)"
source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$platform" = "all" ]; then
  for p in claude antigravity codex opencode; do
    install_one "$p"
    printf '\n'
  done
  printf 'Installed Supergraph plugin for all platforms.\n'
else
  install_one "$platform"
fi
