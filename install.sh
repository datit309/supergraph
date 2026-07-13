#!/bin/sh
set -eu

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
elif [ ! -d "$install_dir/.git" ]; then
  printf 'Refusing to update: %s is not a Git checkout.\n' "$install_dir" >&2
  exit 1
elif [ -n "$(git -C "$install_dir" status --porcelain)" ]; then
  printf 'Refusing to update: %s has uncommitted changes.\n' "$install_dir" >&2
  exit 1
else
  printf 'Updating Supergraph in %s\n' "$install_dir"
  git -C "$install_dir" pull --ff-only
fi

plugin_installer="$install_dir/plugins/supergraph/install.sh"
if [ ! -f "$plugin_installer" ]; then
  printf 'Supergraph plugin installer not found: %s\n' "$plugin_installer" >&2
  exit 1
fi

exec bash "$plugin_installer" "$@"
