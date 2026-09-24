#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf '%s\n' \
    'Usage: install.sh [--platform claude|antigravity|codex|opencode|hermes|dsh|all] [--dry-run] [--help]' \
    '' \
    'Installs Supergraph plugin via symlink.' \
    '' \
    'Platforms:' \
    '  claude       -> ~/.claude/plugins/supergraph' \
    '  antigravity  -> ~/.gemini/antigravity-cli/plugins/supergraph + ~/.gemini/config/plugins/supergraph' \
    '  codex        -> ./.codex-plugin' \
    '  opencode     -> ~/.config/opencode/skills/<skill>/ + ~/.config/opencode/plugins/supergraph.ts (skills + hooks, flat symlinks + opencode.json)' \
    '  hermes       -> ~/.hermes/skills/supergraph/ (full skills category + orchestrator)' \
    '  dsh          -> ~/.dsh/skills/ + ~/.dsh/cordis.patch.yml (DeepSeek Harness)' \
    '  all          -> install for all platforms at once'
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
      claude|antigravity|codex|opencode|hermes|dsh|all) printf '%s\n' "$platform_arg" ;;
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
    opencode) printf 'Next: restart OpenCode and run /scan (skills via /skills, hooks active via plugins/supergraph.ts)\n' ;;
    hermes) printf 'Next: run /skills or use skill_view(name="supergraph:scan")\n' ;;
    dsh) printf 'Next: run dsh (dsh web or dsh) and use skills e.g. /scan or skill(name="scan")\n' ;;
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

link_path_soft() {
  src="$1"
  dst="$2"
  if [ -e "$dst" ] && [ ! -L "$dst" ]; then
    printf 'Skipping existing non-symlink: %s\n' "$dst"
    return 0
  fi
  ln -sfn "$src" "$dst"
}

install_one() {
  _platform="$1"
  case "$_platform" in
    claude) _target="$HOME/.claude/plugins/supergraph" ;;
    antigravity) _target="$HOME/.gemini/antigravity-cli/plugins/supergraph"
                 _target2="$HOME/.gemini/config/plugins/supergraph" ;;
    codex) _target="$PWD/.codex-plugin" ;;
    opencode) _target="${XDG_CONFIG_HOME:-$HOME/.config}/opencode/skills" ;;
    hermes) _target="$HOME/.hermes/skills/supergraph" ;;
    dsh) _target="${DSH_HOME:-$HOME/.dsh}/skills" ;;
  esac
  printf 'Platform: %s\n' "$_platform"
  printf 'Source: %s\n' "$source_dir"
  printf 'Target: %s\n' "$_target"
  if [ "$_platform" = "antigravity" ]; then
    printf 'Target2: %s\n' "$_target2"
  fi
  if [ "$dry_run" -eq 1 ]; then
    printf 'Dry run: no changes made\n'
    if [ "$_platform" = "opencode" ]; then
      cat "$source_dir/.opencode-plugin/opencode.json"
      printf '\n\n[DRY RUN] Would create ~/.config/opencode/opencode.json + install plugin to ~/.config/opencode/plugins/supergraph.ts, then restart OpenCode.\n'
      printf '[DRY RUN] Plugin source: %s/.opencode-plugin/plugin.ts\n' "$source_dir"
    fi
    if [ "$_platform" = "dsh" ]; then
      _dsh_home="${DSH_HOME:-$HOME/.dsh}"
      _agents_target="${DSH_AGENTS_HOME:-$HOME/.agents}/skills"
      printf '\n[DRY RUN] Would link Supergraph skills to %s and %s\n' "$_target" "$_agents_target"
      printf '[DRY RUN] Would configure MCP servers in %s/cordis.patch.yml:\n' "$_dsh_home"
      cat "$source_dir/.dsh-plugin/cordis.patch.yml"
      printf '\n'
    fi
    next_steps "$_platform"
    return 0
  fi
  case "$_platform" in
    claude)
      mkdir -p "$(dirname "$_target")"
      link_path "$source_dir" "$_target"
      ;;
    antigravity)
      mkdir -p "$(dirname "$_target")"
      link_path "$source_dir" "$_target"
      # Modern Antigravity also discovers plugins via ~/.gemini/config/plugins
      mkdir -p "$(dirname "$_target2")"
      link_path "$source_dir" "$_target2"
      printf 'Also linked: %s\n' "$_target2"
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
      # — Install hooks plugin for opencode (tool guards + system injection) —
      _plugin_src="$source_dir/.opencode-plugin/plugin.ts"
      if [ -f "$_plugin_src" ]; then
        _global_plugins="$_global_config/plugins"
        mkdir -p "$_global_plugins"
        link_path "$_plugin_src" "$_global_plugins/supergraph.ts"
        printf 'Linked plugin: %s -> %s\n' "$_plugin_src" "$_global_plugins/supergraph.ts"
        # Clean stale local plugin file if exists (avoid duplicate load with global)
        _local_plugin="$PWD/.opencode/plugins/supergraph.ts"
        if [ -L "$_local_plugin" ] || [ -f "$_local_plugin" ]; then
          rm -f "$_local_plugin"
          printf 'Removed stale local plugin (global is canonical): %s\n' "$_local_plugin"
        fi
        # Also ensure local skills (mirrors global) for offline portability
        _local_skills="$PWD/.opencode/skills"
        mkdir -p "$_local_skills"
        for skill_dir in "$source_dir"/skills/*; do
          [ -d "$skill_dir" ] || continue
          link_path "$skill_dir" "$_local_skills/$(basename "$skill_dir")"
        done
        for link in "$_local_skills"/*; do
          [ -L "$link" ] || continue
          base="$(basename "$link")"
          if [ ! -e "$source_dir/skills/$base" ]; then
            printf 'Removing stale local skill link: %s\n' "$link"
            rm "$link"
          fi
        done
      else
        printf 'Warning: plugin source not found: %s\n' "$_plugin_src" >&2
      fi
      ;;
    hermes)
      mkdir -p "$_target/supergraph"
      printf -- '---\ndescription: "Supergraph — Graph-driven development workflows, TDD, SDD, architecture, and code review tools."\n---\n' > "$_target/DESCRIPTION.md"
      cp -f "$source_dir/SKILL.md" "$_target/supergraph/SKILL.md"
      for skill_dir in "$source_dir"/skills/*; do
        [ -d "$skill_dir" ] || continue
        _sub_name="$(basename "$skill_dir")"
        mkdir -p "$_target/$_sub_name"
        cp -Rf "$skill_dir/"* "$_target/$_sub_name/"
      done
      printf 'Installed Supergraph skills into Hermes: %s\n' "$_target"
      ;;
    dsh)
      _dsh_home="${DSH_HOME:-$HOME/.dsh}"
      _agents_target="${DSH_AGENTS_HOME:-$HOME/.agents}/skills"
      mkdir -p "$_target" "$_agents_target" "$_dsh_home"
      for skill_dir in "$source_dir"/skills/*; do
        [ -d "$skill_dir" ] || continue
        link_path "$skill_dir" "$_target/$(basename "$skill_dir")"
        link_path_soft "$skill_dir" "$_agents_target/$(basename "$skill_dir")"
      done
      for link in "$_target"/*; do
        [ -L "$link" ] || continue
        base="$(basename "$link")"
        if [ ! -e "$source_dir/skills/$base" ]; then
          printf 'Removing stale skill link: %s\n' "$link"
          rm "$link"
        fi
      done
      for link in "$_agents_target"/*; do
        [ -L "$link" ] || continue
        base="$(basename "$link")"
        target_dest="$(readlink "$link" 2>/dev/null || true)"
        case "$target_dest" in
          *"$source_dir"*)
            if [ ! -e "$source_dir/skills/$base" ]; then
              printf 'Removing stale agent skill link: %s\n' "$link"
              rm "$link"
            fi
            ;;
        esac
      done

      _patch_file="$_dsh_home/cordis.patch.yml"
      _patch_template="$source_dir/.dsh-plugin/cordis.patch.yml"
      if [ ! -f "$_patch_file" ]; then
        cp "$_patch_template" "$_patch_file"
        printf 'Created %s with Supergraph MCP config.\n' "$_patch_file"
      else
        if ! grep -q 'mcp-codebase-memory' "$_patch_file"; then
          printf '\n# Added by Supergraph installer\n' >> "$_patch_file"
          cat "$_patch_template" >> "$_patch_file"
          printf 'Appended Supergraph MCP config to %s.\n' "$_patch_file"
        else
          printf 'Supergraph MCP config already present in %s.\n' "$_patch_file"
        fi
      fi

      if [ ! -f "$_dsh_home/AGENTS.md" ]; then
        cp "$source_dir/AGENTS.md" "$_dsh_home/AGENTS.md" 2>/dev/null || true
        printf 'Created %s/AGENTS.md\n' "$_dsh_home"
      fi
      ;;
  esac
  printf 'Installed Supergraph plugin for %s.\n' "$_platform"
  next_steps "$_platform"
}

platform="$(platform_detect)"
source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$platform" = "all" ]; then
  for p in claude antigravity codex opencode hermes dsh; do
    install_one "$p"
    printf '\n'
  done
  printf 'Installed Supergraph plugin for all platforms.\n'
else
  install_one "$platform"
fi
