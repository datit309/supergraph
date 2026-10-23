#!/usr/bin/env bash
set -euo pipefail

# Installs the local Kokoro voice, once per machine. Not automatic from the
# studio itself: a script that silently pulls ~350MB the first time somebody
# films is a script that does something surprising on a metered connection, so
# the download only ever happens here, on purpose, after being told the size.
#
# One directory serves every demo on the machine. The model and its Python
# environment are identical whoever is filming, and the cut lines are named by
# a hash of the words and the voice settings that made them, so two apps share
# a file only when they wanted the same audio.

VOICE_HOME="${DEMO_VOICE_HOME:-$HOME/.cache/demo-voice}"
VENV="$VOICE_HOME/.venv"
PYTHON="$VENV/bin/python"
MODEL="$VOICE_HOME/kokoro.onnx"
VOICES="$VOICE_HOME/voices.bin"

RELEASE="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"

if ! command -v uv >/dev/null 2>&1; then
  printf 'install-voice: uv not found. Install it first:\n'
  printf '  curl -LsSf https://astral.sh/uv/install.sh | sh\n'
  exit 1
fi

mkdir -p "$VOICE_HOME"

if [ -x "$PYTHON" ]; then
  printf 'install-voice: venv already at %s\n' "$VENV"
else
  printf 'install-voice: creating venv at %s\n' "$VENV"
  uv venv --python 3.12 "$VENV"
fi

if "$PYTHON" -c "import kokoro_onnx, soundfile" >/dev/null 2>&1; then
  printf 'install-voice: kokoro-onnx already installed\n'
else
  printf 'install-voice: installing kokoro-onnx and soundfile\n'
  uv pip install --python "$PYTHON" kokoro-onnx soundfile
fi

if [ -f "$MODEL" ]; then
  printf 'install-voice: model already at %s\n' "$MODEL"
else
  printf 'install-voice: downloading the fp32 model (~325MB)\n'
  curl -L --fail -o "$MODEL.part" "$RELEASE/kokoro-v1.0.onnx"
  mv "$MODEL.part" "$MODEL"
fi

if [ -f "$VOICES" ]; then
  printf 'install-voice: voices already at %s\n' "$VOICES"
else
  printf 'install-voice: downloading the voice pack (~25MB)\n'
  curl -L --fail -o "$VOICES.part" "$RELEASE/voices-v1.0.bin"
  mv "$VOICES.part" "$VOICES"
fi

printf '\ninstall-voice: ready at %s\n' "$VOICE_HOME"
printf 'every demo on this machine reads it; nothing to configure.\n'
