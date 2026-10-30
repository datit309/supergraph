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
if [ -z "${DEMO_VOICE_HOME:-}" ]; then
  DEFAULT_HOME="$HOME/.cache/demo-voice"
  if mkdir -p "$DEFAULT_HOME" 2>/dev/null && touch "$DEFAULT_HOME/.probe_$$" 2>/dev/null; then
    rm -f "$DEFAULT_HOME/.probe_$$"
    VOICE_HOME="$DEFAULT_HOME"
  else
    VOICE_HOME="/tmp/demo-voice"
  fi
else
  VOICE_HOME="$DEMO_VOICE_HOME"
fi
PYTHON="$VOICE_HOME/.venv/bin/python"
MODEL="$VOICE_HOME/kokoro.onnx"
VOICES="$VOICE_HOME/voices.bin"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if Edge voice (Neural, vi-, HoaiMy, NamMinh, Linh, or LANG=vi*)
IS_EDGE=0
if [[ "$VOICE" == *"Neural"* ]] || [[ "$VOICE" == vi* ]] || [[ "$VOICE" == "HoaiMy" ]] || [[ "$VOICE" == "NamMinh" ]] || [[ "$VOICE" == "Linh" ]] || [[ "$LANG" == vi* ]]; then
  IS_EDGE=1
fi

OUT_DIR="$VOICE_HOME/audition"
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/$(date +%s)-$$.wav"

if [ "$IS_EDGE" -eq 1 ]; then
  ACTUAL_VOICE="$VOICE"
  if [ "$VOICE" = "Linh" ] || [ "$VOICE" = "HoaiMy" ] || [ "$VOICE" = "vi" ] || [ "$VOICE" = "vi-VN" ] || ([ "$VOICE" = "af_heart" ] && [[ "$LANG" == vi* ]]); then
    ACTUAL_VOICE="vi-VN-HoaiMyNeural"
  elif [ "$VOICE" = "NamMinh" ]; then
    ACTUAL_VOICE="vi-VN-NamMinhNeural"
  fi

  EDGE_BIN=""
  if [ -x "$SKILL_ROOT/.venv/bin/edge-tts" ]; then
    EDGE_BIN="$SKILL_ROOT/.venv/bin/edge-tts"
  elif [ -x "$VOICE_HOME/.venv/bin/edge-tts" ]; then
    EDGE_BIN="$VOICE_HOME/.venv/bin/edge-tts"
  elif command -v edge-tts >/dev/null 2>&1; then
    EDGE_BIN="$(command -v edge-tts)"
  fi

  if [ -z "$EDGE_BIN" ]; then
    printf 'say: edge-tts not found. Install it: pip install edge-tts\n' >&2
    exit 1
  fi

  SPEED_PCT=$(awk -v s="$SPEED" 'BEGIN { pct=int((s-1)*100); if (pct>=0) printf("+%d%%", pct); else printf("%d%%", pct) }')
  TMP_MP3="$OUT.mp3"
  "$EDGE_BIN" --voice "$ACTUAL_VOICE" --rate "$SPEED_PCT" --text "$TEXT" --write-media "$TMP_MP3"
  ffmpeg -y -hide_banner -loglevel error -i "$TMP_MP3" -ar 24000 -ac 1 -c:a pcm_s16le "$OUT"
  rm -f "$TMP_MP3"
  DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT")
else
  if [ ! -x "$PYTHON" ] || [ ! -f "$MODEL" ] || [ ! -f "$VOICES" ]; then
    printf 'say: no voice model at %s\n' "$VOICE_HOME" >&2
    printf '     install it: scripts/install-voice.sh (or set DEMO_VOICE_HOME)\n' >&2
    exit 1
  fi

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
fi

printf 'say: wrote %s (%ss)\n' "$OUT" "$DURATION"

if command -v afplay >/dev/null 2>&1; then
  afplay "$OUT"
fi
