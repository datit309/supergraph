#!/usr/bin/env bash
set -euo pipefail

# Speaks one line the same way a scene's `actor.say` does, so copy and
# heteronym respellings can be auditioned without standing up a browser and
# filming a whole scene to hear one sentence. The RMS normalisation has to
# match `studio/voice.ts` exactly, or an audition that sounds right here can
# still sound wrong once it is mixed into a corpus levelled to a different
# target.

if [ $# -lt 1 ]; then
  printf 'usage: say.sh "text" [voice] [speed]\n' >&2
  exit 1
fi

TEXT="$1"
VOICE="${2:-af_heart}"
SPEED="${3:-1}"
LANG="${DEMO_VOICE_LANG:-en-us}"
SENTENCE_PAUSE="${DEMO_VOICE_SENTENCE_PAUSE:-0.14}"
CLAUSE_PAUSE="${DEMO_VOICE_CLAUSE_PAUSE:-0.06}"
TARGET_RMS="${DEMO_VOICE_RMS:-0.12}"
VOICE_HOME="${DEMO_VOICE_HOME:-$HOME/.cache/demo-voice}"
PYTHON="$VOICE_HOME/.venv/bin/python"
MODEL="$VOICE_HOME/kokoro.onnx"
VOICES="$VOICE_HOME/voices.bin"

if [ ! -x "$PYTHON" ] || [ ! -f "$MODEL" ] || [ ! -f "$VOICES" ]; then
  printf 'say: no voice model at %s\n' "$VOICE_HOME" >&2
  printf '     install it: scripts/install-voice.sh (or set DEMO_VOICE_HOME)\n' >&2
  exit 1
fi

OUT_DIR="$VOICE_HOME/audition"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/$(date +%s)-$$.wav"

DURATION=$("$PYTHON" - "$TEXT" "$VOICE" "$SPEED" "$LANG" "$SENTENCE_PAUSE" "$CLAUSE_PAUSE" "$TARGET_RMS" "$MODEL" "$VOICES" "$OUT" <<'PY'
import sys

import numpy as np
import soundfile as sf

try:
    import espeakng_loader
    from phonemizer.backend.espeak.wrapper import EspeakWrapper

    EspeakWrapper.set_library(espeakng_loader.get_library_path())
    EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
except Exception:
    pass

from kokoro_onnx import Kokoro

text, voice, speed, lang, sentence_pause, clause_pause, target_rms, model, voices, out = (
    sys.argv[1:]
)

kokoro = Kokoro(model, voices)
samples, rate = kokoro.create(
    text,
    voice=voice,
    speed=float(speed),
    lang=lang,
    sentence_pause=float(sentence_pause),
    clause_pause=float(clause_pause),
)

rms = float(np.sqrt(np.mean(samples**2)))
if rms > 0:
    samples = samples * np.clip(float(target_rms) / rms, 0.55, 1.6)

sf.write(out, samples, rate)
print(f"{len(samples) / rate:.2f}")
PY
)

printf 'say: wrote %s (%ss)\n' "$OUT" "$DURATION"

if command -v afplay >/dev/null 2>&1; then
  afplay "$OUT"
fi
