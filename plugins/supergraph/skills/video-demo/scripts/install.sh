#!/usr/bin/env bash
set -euo pipefail

# Everything that has to happen once, on this machine, before anything can be
# filmed. Run it after cloning, and again after `git pull` if the engine's
# dependency changed.
#
SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILL"

# Node is checked and never installed. Not squeamishness: it cannot be missing
# (nothing here could have been fetched without it) so the only real case is a
# version too old, and upgrading it is a decision about somebody's toolchain.
# A machine whose node comes from nvm, fnm, volta or asdf would be actively
# damaged by `brew upgrade node`, and a script cannot know which is in charge
# from the outside. So it says what to run and stops.
if ! command -v node >/dev/null 2>&1; then
  printf 'install: node not found. Install Node 22.18 or newer, then run this again.\n'
  exit 1
fi

node_version="$(node --version | sed 's/^v//')"
node_major="${node_version%%.*}"
node_minor="$(printf '%s' "$node_version" | cut -d. -f2)"

if [ "$node_major" -lt 22 ] || { [ "$node_major" -eq 22 ] && [ "$node_minor" -lt 18 ]; }; then
  printf 'install: node %s is too old; the engine needs 22.18 or newer.\n' "$node_version"
  if [ -n "${NVM_DIR:-}" ] || [ -d "$HOME/.nvm" ]; then
    printf '  nvm install 22 && nvm alias default 22\n'
  elif command -v fnm >/dev/null 2>&1; then
    printf '  fnm install 22 && fnm default 22\n'
  elif command -v volta >/dev/null 2>&1; then
    printf '  volta install node@22\n'
  elif command -v asdf >/dev/null 2>&1; then
    printf '  asdf install nodejs latest:22\n'
  elif command -v brew >/dev/null 2>&1; then
    printf '  brew upgrade node\n'
  else
    printf '  see https://nodejs.org\n'
  fi
  exit 1
fi

# ffmpeg is installed here, because it is a leaf dependency with one obvious
# package name and no opinion about the rest of the machine. The one thing this
# will not do is ask for a password: a script run by an agent cannot answer a
# sudo prompt, so where root is needed and not already held, it prints the
# command instead of hanging on it.
install_ffmpeg() {
  if command -v brew >/dev/null 2>&1; then
    printf 'install: ffmpeg, via homebrew\n'
    brew install ffmpeg
    return $?
  fi

  as_root=''
  if [ "$(id -u)" = '0' ]; then
    as_root='env'
  elif sudo -n true 2>/dev/null; then
    as_root='sudo'
  fi

  for manager in apt-get dnf pacman zypper; do
    command -v "$manager" >/dev/null 2>&1 || continue

    case "$manager" in
      apt-get) args='install -y ffmpeg'; refresh='update' ;;
      dnf) args='install -y ffmpeg'; refresh='' ;;
      pacman) args='-S --noconfirm ffmpeg'; refresh='' ;;
      zypper) args='install -y ffmpeg'; refresh='' ;;
    esac

    if [ -z "$as_root" ]; then
      printf 'install: ffmpeg needs root here. Run:\n  sudo %s %s\n' "$manager" "$args"
      return 1
    fi

    printf 'install: ffmpeg, via %s\n' "$manager"
    [ -n "$refresh" ] && $as_root "$manager" $refresh
    $as_root "$manager" $args
    return $?
  done

  printf 'install: no package manager found for ffmpeg. Install it from\n'
  printf '  https://ffmpeg.org/download.html\n'
  return 1
}

if command -v ffmpeg >/dev/null 2>&1; then
  printf 'install: ffmpeg already here\n'
else
  install_ffmpeg || printf 'install: carrying on without ffmpeg; nothing can be encoded until it is there\n'
fi

printf 'install: the engine (about 100MB)\n'
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

# How a workspace resolves `video-demo/scene` and friends: its own
# `node_modules` symlink points here, and this points back at the skill root,
# where the `exports` map turns those specifiers into engine paths. One link,
# and nothing has to be installed into anybody's project.
mkdir -p node_modules
ln -sfn .. node_modules/video-demo

printf '\ninstall: chromium (about 150MB)\n'
if [ "$(uname -s)" = "Linux" ]; then
  npx playwright install --with-deps chromium
else
  npx playwright install chromium
fi

printf '\n'
exec "$SKILL/scripts/doctor.sh"
