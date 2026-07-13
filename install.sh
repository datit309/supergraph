#!/usr/bin/env bash
set -euo pipefail

repo_url="${SUPERGRAPH_REPO_URL:-https://github.com/datit309/supergraph.git}"
install_dir="${SUPERGRAPH_INSTALL_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/supergraph}"

if ! command -v git >/dev/null 2>&1; then
  printf 'Supergraph installer requires Git. Install Git and retry.\n' >&2
  exit 1
fi

if [ ! -e "$install_dir" ]; then
  mkdir -p "$(dirname "$install_dir")"
  printf 'Cloning Supergraph into %s\n' "$install_dir"
  git clone -- "$repo_url" "$install_dir"
fi

plugin_installer="$install_dir/plugins/supergraph/install.sh"
if [ ! -f "$plugin_installer" ]; then
  printf 'Supergraph plugin installer not found: %s\n' "$plugin_installer" >&2
  exit 1
fi

exec bash "$plugin_installer" "$@"
