#!/usr/bin/env bash
set -uo pipefail

# Checks what a studio run actually depends on, and for each miss prints the
# one command that fixes it, rather than a stack trace three steps into
# filming. Voice (uv + the Kokoro model) is advisory: a missing model films
# silent by design, so only the capture path is fatal here.

SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FATAL=0

ok()   { printf '  ok    %s\n' "$1"; }
warn() { printf '  warn  %s\n' "$1"; printf '        fix: %s\n' "$2"; }
fail() { printf '  fail  %s\n' "$1"; printf '        fix: %s\n' "$2"; FATAL=1; }

NODE_VERSION=$(node --version 2>/dev/null || true)
if [ -z "$NODE_VERSION" ]; then
  fail "node not found" "install Node >= 22.18"
else
  ver="${NODE_VERSION#v}"
  major="${ver%%.*}"
  minor="${ver#*.}"; minor="${minor%%.*}"
  if [ "$major" -gt 22 ] || { [ "$major" -eq 22 ] && [ "$minor" -ge 18 ]; }; then
    ok "node $NODE_VERSION"
  else
    fail "node $NODE_VERSION is older than 22.18 (the config files are loaded as TypeScript directly, via Node's own type stripping)" "install Node >= 22.18, e.g. nvm install 22.18"
  fi
fi

PLATFORM="$(uname -s)"
case "$PLATFORM" in
  Darwin)
    ok "platform macOS (tested platform)"
    ;;
  Linux)
    ok "platform Linux (supported: encodes with libx264, no hardware encoder path)"
    ;;
  *)
    warn "platform $PLATFORM is not supported" "nice, VideoToolbox, uv and the path handling here all assume a POSIX shell; use macOS or Linux"
    ;;
esac

if command -v ffmpeg >/dev/null 2>&1; then
  ok "ffmpeg $(ffmpeg -version 2>/dev/null | head -n1 | awk '{print $3}')"
  ENCODERS=$(ffmpeg -hide_banner -encoders 2>/dev/null)
else
  fail "ffmpeg not found" "$SKILL/scripts/install.sh installs it"
  ENCODERS=""
fi

HAS_VT=0; HAS_X264=0
printf '%s' "$ENCODERS" | grep -q "h264_videotoolbox" && HAS_VT=1
printf '%s' "$ENCODERS" | grep -q "libx264" && HAS_X264=1

# What the recorder will actually pick: VideoToolbox on macOS when it's there,
# libx264 everywhere else. Reported as one conclusion, not two encoder checks,
# so a mismatch between "installed" and "the one this run will use" can't hide.
if [ "$PLATFORM" = "Darwin" ] && [ "$HAS_VT" -eq 1 ]; then
  ok "will encode with h264_videotoolbox (hardware)"
elif [ "$HAS_X264" -eq 1 ]; then
  if [ "$PLATFORM" = "Darwin" ]; then
    warn "no h264_videotoolbox; will fall back to libx264 (slower at 4K)" "reinstall ffmpeg with VideoToolbox support, or accept DEMO_ENCODER=x264"
  else
    ok "will encode with libx264"
  fi
else
  fail "no h264 encoder ffmpeg can use (need h264_videotoolbox or libx264)" "$SKILL/scripts/install.sh, or reinstall ffmpeg with h264 support"
fi

if command -v nice >/dev/null 2>&1; then
  ok "nice available (the encoder runs niced below the browser during a film)"
else
  warn "nice not found; the encoder will run at normal priority, competing with the browser for CPU while filming" "POSIX systems ship nice; this is expected only on an unsupported platform"
fi

PLAYWRIGHT_CACHES=("$HOME/Library/Caches/ms-playwright" "$HOME/.cache/ms-playwright")
if [ -n "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
  PLAYWRIGHT_CACHES=("$PLAYWRIGHT_BROWSERS_PATH" "${PLAYWRIGHT_CACHES[@]}")
fi
CHROMIUM_DIR=""
for dir in "${PLAYWRIGHT_CACHES[@]}"; do
  if [ -d "$dir" ] && find "$dir" -maxdepth 1 -type d -name "chromium-*" 2>/dev/null | grep -q .; then
    CHROMIUM_DIR="$dir"
    break
  fi
done
if [ -n "$CHROMIUM_DIR" ]; then
  ok "playwright chromium installed ($CHROMIUM_DIR)"
else
  fail "playwright chromium not installed" "npx playwright install chromium"
fi

if command -v uv >/dev/null 2>&1; then
  ok "uv $(uv --version 2>/dev/null)"
else
  warn "uv not found (only needed to install the local voice)" "curl -LsSf https://astral.sh/uv/install.sh | sh"
fi


# The engine's own runtime, which install.sh puts here. Nothing about the app
# being filmed is checked: that is discovery, not a dependency.
if [ -d "$SKILL/node_modules/@playwright/test" ]; then
  ok 'engine installed'
else
  fail 'engine not installed' "$SKILL/scripts/install.sh"
fi

if [ -L "$SKILL/node_modules/video-demo" ]; then
  ok 'workspaces can resolve video-demo/*'
else
  fail 'the video-demo self-link is missing' "$SKILL/scripts/install.sh"
fi

VOICE_HOME="${DEMO_VOICE_HOME:-$HOME/.cache/demo-voice}"
if [ -f "$VOICE_HOME/.venv/bin/python" ] && [ -f "$VOICE_HOME/kokoro.onnx" ] && [ -f "$VOICE_HOME/voices.bin" ]; then
  ok "kokoro voice model installed ($VOICE_HOME)"
else
  warn "no voice model at $VOICE_HOME (films silent until installed)" "scripts/install-voice.sh"
fi

if [ "$FATAL" -ne 0 ]; then
  printf '\n  fatal checks failed above; fix them before filming.\n'
  exit 1
fi

printf '\n  every fatal check passed.\n'
exit 0
