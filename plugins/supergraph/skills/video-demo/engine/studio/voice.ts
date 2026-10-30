import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { access, mkdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { VOICE_ENABLED, demo } from './config.ts';

/**
 * The voice-over, spoken locally by Kokoro or Edge TTS.
 *
 * Every line a scene narrates through `actor.say` comes here.
 */

export type Mark = { at: number; text: string };

function resolveVoiceHome(): string {
  if (process.env.DEMO_VOICE_HOME) {
    return process.env.DEMO_VOICE_HOME;
  }
  const defaultHome = join(homedir(), '.cache/demo-voice');
  try {
    mkdirSync(defaultHome, { recursive: true });
    const probe = join(defaultHome, `.probe_${process.pid}`);
    writeFileSync(probe, '');
    unlinkSync(probe);
    return defaultHome;
  } catch {
    return join('/tmp', 'demo-voice');
  }
}

const VOICE_HOME = resolveVoiceHome();
const PYTHON = join(VOICE_HOME, '.venv/bin/python');
const MODEL = join(VOICE_HOME, 'kokoro.onnx');
const VOICES = join(VOICE_HOME, 'voices.bin');
const LINES = join(VOICE_HOME, 'lines');

/**
 * The voice and pace, adopted from the settings `arikchakma/gpu-time`
 * narrates with, since they were already tuned and sound better than anything
 * arrived at here. `demo.config.ts`'s own `voice` commits an app to a choice;
 * `DEMO_VOICE_NAME`/`DEMO_VOICE_SPEED` override either one at film time, the
 * same way they'd override these defaults with no config at all.
 *
 * Not only the voice. The three numbers under it are the difference between
 * a model reading a string and something worth listening to: a shade under
 * full speed so the sentences are deliberate rather than clipped, and real
 * pauses at sentence and clause boundaries so the prose has joints. Kokoro
 * defaults to 0.25 and 0.1 there, which reads as slightly ponderous over a
 * demo; these are tighter.
 */
const VOICE = process.env.DEMO_VOICE_NAME ?? demo.voice?.name ?? 'af_heart';
const LANG = process.env.DEMO_VOICE_LANG ?? 'en-us';
/**
 * Full speed, with short joints.
 *
 * Not a taste call: a demo line is one sentence about one thing, and at less
 * than full speed the deliberateness reads as a recording rather than someone
 * talking. The pauses matter more than the rate. Kokoro defaults to a quarter
 * of a second between sentences and a tenth between clauses, which is
 * measured against prose being read aloud; over a demo it drags, so both are
 * tighter here. Every number is overridable per app and per run.
 */
const SPEED = Number(process.env.DEMO_VOICE_SPEED ?? demo.voice?.speed ?? 1);
const SENTENCE_PAUSE = Number(process.env.DEMO_VOICE_SENTENCE_PAUSE ?? 0.14);
const CLAUSE_PAUSE = Number(process.env.DEMO_VOICE_CLAUSE_PAUSE ?? 0.06);

/**
 * Every line levelled to the same loudness.
 *
 * Kokoro's output level drifts with the phonemes in a line, so a corpus of
 * raw synthesis has one sentence twice as loud as the next and no amount of
 * mixing hides it. Normalising each line to a target RMS fixes that at the
 * source; the clamp is there so a very quiet line is lifted rather than
 * amplified into its own noise floor.
 */
const TARGET_RMS = Number(process.env.DEMO_VOICE_RMS ?? 0.12);

const SKILL_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const LOCAL_EDGE_TTS = join(SKILL_ROOT, '.venv/bin/edge-tts');

export function isEdgeVoice(voiceName: string = VOICE): boolean {
  return (
    voiceName.includes('Neural') ||
    voiceName.startsWith('vi-') ||
    voiceName === 'HoaiMy' ||
    voiceName === 'NamMinh' ||
    voiceName === 'Linh' ||
    LANG.toLowerCase().startsWith('vi')
  );
}

export function resolveEdgeVoice(voiceName: string = VOICE): string {
  if (
    voiceName === 'Linh' ||
    voiceName === 'HoaiMy' ||
    voiceName === 'vi' ||
    voiceName === 'vi-VN' ||
    voiceName === 'af_heart' && LANG.toLowerCase().startsWith('vi')
  ) {
    return 'vi-VN-HoaiMyNeural';
  }
  if (voiceName === 'NamMinh') {
    return 'vi-VN-NamMinhNeural';
  }
  if (voiceName.includes('Neural')) {
    return voiceName;
  }
  if (LANG.toLowerCase().startsWith('vi')) {
    return 'vi-VN-HoaiMyNeural';
  }
  return voiceName;
}

async function findEdgePython(): Promise<string | null> {
  const localPy = join(SKILL_ROOT, '.venv/bin/python3');
  if (await exists(localPy)) {
    return localPy;
  }
  const cachePy = join(VOICE_HOME, '.venv/bin/python3');
  if (await exists(cachePy)) {
    return cachePy;
  }
  const tmpPy = '/tmp/test_env/bin/python3';
  if (await exists(tmpPy)) {
    return tmpPy;
  }
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const exec = promisify(execFile);
  for (const py of ['/Users/trantandat/miniconda3/bin/python3', 'python3']) {
    try {
      const { stdout } = await exec(py, ['-c', 'import edge_tts; print("ok")']);
      if (stdout.trim() === 'ok') {
        return py;
      }
    } catch {}
  }
  return null;
}

function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false
  );
}

/** Whether the voice engine is ready. Checked once, reported once. */
export async function voiceReady(): Promise<boolean> {
  if (!VOICE_ENABLED) {
    return false;
  }
  if (isEdgeVoice()) {
    const py = await findEdgePython();
    return py !== null;
  }
  const found = await Promise.all([
    exists(PYTHON),
    exists(MODEL),
    exists(VOICES),
  ]);
  return found.every(Boolean);
}

export function voiceMissingMessage(): string {
  if (isEdgeVoice()) {
    return (
      `  no voice-over: edge-tts is not installed.\n` +
      `  to install it for natural Vietnamese/Neural voice:\n` +
      `    ${join(SKILL_ROOT, '.venv/bin/pip')} install edge-tts\n` +
      `    or: pip install edge-tts\n` +
      `  or film silent with DEMO_VOICE=0.\n`
    );
  }
  return (
    `  no voice-over: ${VOICE_HOME} has no Kokoro model.\n` +
    `  to install it (about 250MB, once):\n` +
    `    uv venv --python 3.12 ${join(VOICE_HOME, '.venv')}\n` +
    `    uv pip install --python ${PYTHON} kokoro-onnx soundfile\n` +
    `    curl -L -o ${MODEL} https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx\n` +
    `    curl -L -o ${VOICES} https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin\n` +
    `  or film silent with DEMO_VOICE=0.\n`
  );
}

/**
 * Includes the model's own size, so swapping the int8 model for fp32 does not
 * quietly serve back lines the old one spoke. Everything that changes how a
 * line sounds belongs in its name.
 */
/**
 * Respellings for words the phonemiser guesses the wrong way.
 *
 * English heteronyms are spelled once and said two ways, and espeak has to
 * pick from the letters alone: it once read "your tasks live right here" as
 * the adjective, rhyming with hive, which is the sort of thing that makes a
 * demo sound machine-made in a single syllable. Handing it a respelling is
 * more reliable than hand-phonemising a whole line, and it keeps scene files
 * readable: the script says "live" and the model is told "liv".
 *
 * `demo.config.ts`'s own `voice.saidAs` is merged on top of this table, so an
 * app adds only the words its own scenes actually mispronounce — never
 * speculative entries for words that might theoretically be ambiguous.
 */
const BUILT_IN_SAID_AS: [RegExp, string][] = [
  // The verb. "Live stream" would want the other reading, so this is scoped
  // to the sense a narration line means, and a line that wants the adjective
  // has to be written around it.
  [/\blive\b/gi, 'liv'],
];

const SAID_AS: [RegExp, string][] = [
  ...BUILT_IN_SAID_AS,
  ...(demo.voice?.saidAs ?? []),
];

function speakable(text: string): string {
  return SAID_AS.reduce((said, [word, as_]) => said.replace(word, as_), text);
}

function keyFor(text: string, model: string): string {
  return createHash('sha1')
    .update(
      `${model}|${VOICE}|${LANG}|${SPEED}|${SENTENCE_PAUSE}|${CLAUSE_PAUSE}|${TARGET_RMS}|${text}`
    )
    .digest('hex')
    .slice(0, 16);
}

const SYNTH = `
import json, sys, os
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

job = json.load(sys.stdin)
kokoro = Kokoro(job["model"], job["voices"])

for line in job["lines"]:
    if os.path.exists(line["path"]):
        continue
    samples, rate = kokoro.create(
        line["text"],
        voice=job["voice"],
        speed=job["speed"],
        lang=job["lang"],
        sentence_pause=job["sentencePause"],
        clause_pause=job["clausePause"],
    )
    rms = float(np.sqrt(np.mean(samples ** 2)))
    if rms > 0:
        samples = samples * np.clip(job["targetRms"] / rms, 0.55, 1.6)
    sf.write(line["path"], samples, rate)

print(json.dumps({"ok": True}))
`;

const SYNTH_EDGE = `
import asyncio, json, os, subprocess, sys
import edge_tts

async def synth_batch():
    job = json.load(sys.stdin)
    voice = job.get("voice", "vi-VN-HoaiMyNeural")
    speed = float(job.get("speed", 1.0))
    rate_pct = int((speed - 1) * 100)
    rate_arg = f"+{rate_pct}%" if rate_pct >= 0 else f"{rate_pct}%"

    for line in job["lines"]:
        out_wav = line["path"]
        if os.path.exists(out_wav):
            continue
        tmp_mp3 = out_wav + ".mp3"
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(line["text"], voice, rate=rate_arg)
                await comm.save(tmp_mp3)
                break
            except Exception:
                if attempt == 2:
                    raise
                await asyncio.sleep(0.4 * (attempt + 1))

        subprocess.run(
            ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", tmp_mp3, "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", out_wav],
            check=True
        )
        if os.path.exists(tmp_mp3):
            os.remove(tmp_mp3)

    print(json.dumps({"ok": True}))

asyncio.run(synth_batch())
`;

function runPython(pythonBin: string, script: string, job: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, ['-c', script], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`voice synth exited ${code}\n${stderr.slice(-800)}`))
    );
    child.stdin.end(JSON.stringify(job));
  });
}

export type SpokenLine = Mark & { path: string; seconds: number };

/**
 * Speaks whatever is not already spoken, and answers with every line's file.
 *
 * The duration comes back from the wav header rather than from the model,
 * because it is what the mix needs: a line that runs past the end of the clip
 * has to be noticed, and the only way to notice is to know how long it
 * actually is.
 */
export async function speak(marks: Mark[]): Promise<SpokenLine[]> {
  if (marks.length === 0) {
    return [];
  }

  await mkdir(LINES, { recursive: true });

  let model = 'edge';
  if (!isEdgeVoice()) {
    const { stat } = await import('node:fs/promises');
    try {
      model = String((await stat(MODEL)).size);
    } catch {
      model = 'missing';
    }
  }

  // Keyed and synthesised on the respelling, so changing the table
  // invalidates only the lines it actually touches.
  const lines = marks.map((mark) => ({
    ...mark,
    said: speakable(mark.text),
    path: join(LINES, `${keyFor(speakable(mark.text), model)}.wav`),
  }));

  const wanted = lines.filter(
    (line, at) => lines.findIndex((other) => other.path === line.path) === at
  );
  const absent = await Promise.all(
    wanted.map(async (line) => ((await exists(line.path)) ? null : line))
  );
  const todo = absent.filter(
    (line): line is (typeof wanted)[number] => line !== null
  );

  if (todo.length > 0) {
    if (isEdgeVoice()) {
      const edgePy = await findEdgePython();
      if (!edgePy) {
        throw new Error('Python with edge-tts is not installed. Run `pip install edge-tts`');
      }
      const actualVoice = resolveEdgeVoice(VOICE);
      await runPython(edgePy, SYNTH_EDGE, {
        voice: actualVoice,
        speed: SPEED,
        lines: todo.map((line) => ({ text: line.said, path: line.path })),
      });
    } else {
      await runPython(PYTHON, SYNTH, {
        model: MODEL,
        voices: VOICES,
        voice: VOICE,
        lang: LANG,
        speed: SPEED,
        sentencePause: SENTENCE_PAUSE,
        clausePause: CLAUSE_PAUSE,
        targetRms: TARGET_RMS,
        lines: todo.map((line) => ({ text: line.said, path: line.path })),
      });
    }
  }

  return Promise.all(
    lines.map(async (line) => ({
      ...line,
      seconds: await wavSeconds(line.path),
    }))
  );
}

/**
 * Length straight out of the RIFF header.
 *
 * Shelling out to ffprobe for this would be three seconds of process startup
 * across a corpus to read a number that is at a known byte offset of a file
 * this module just wrote.
 */
async function wavSeconds(path: string): Promise<number> {
  const buffer = await readFile(path);
  const rate = buffer.readUInt32LE(24);
  const bytesPerSecond = buffer.readUInt32LE(28);

  for (let at = 12; at + 8 <= buffer.length;) {
    const id = buffer.toString('ascii', at, at + 4);
    const size = buffer.readUInt32LE(at + 4);
    if (id === 'data') {
      return bytesPerSecond > 0 ? size / bytesPerSecond : size / (rate * 2);
    }
    at += 8 + size + (size % 2);
  }

  return 0;
}

/**
 * The ffmpeg arguments that lay the narration over a silent clip.
 *
 * Each line is delayed to its own mark and the lot are mixed, rather than
 * concatenated with silence between: a mark is a moment in the choreography,
 * and the audio has to land there even if the line before it ran long.
 * `normalize=0` is what keeps `amix` from quietly ducking every line in
 * proportion to how many there are.
 */
export function mixArgs(
  silent: string,
  lines: SpokenLine[],
  out: string,
  videoSeconds: number,
  videoArgs: string[]
): { args: string[]; overrun: number } {
  const overrun = Math.max(
    0,
    ...lines.map((line) => line.at + line.seconds - videoSeconds)
  );

  const inputs = lines.flatMap((line) => ['-i', line.path]);
  const delays = lines
    .map(
      (line, at) =>
        `[${at + 1}:a]adelay=${Math.max(0, Math.round(line.at * 1000))}:all=1[d${at}]`
    )
    .join(';');
  const heads = lines.map((_, at) => `[d${at}]`).join('');
  const mix =
    lines.length === 1
      ? `${heads}anull[spoken]`
      : `${heads}amix=inputs=${lines.length}:normalize=0:dropout_transition=0[spoken]`;

  /**
   * A held last frame, rather than a last word cut in half — or bleeding
   * into the next clip.
   *
   * `actor.say` already holds long enough for its own line in the ordinary
   * case, so this is the safety net for the closing line of a scene, where
   * there is nothing after it to hold. Padding means filtering the video,
   * and filtering means the stream cannot be copied, so the encoder arguments
   * come back in here from the recorder rather than being guessed at: it is
   * the same encode the silent clip had, run once more with a longer tail.
   *
   * Any overrun pads, not just one past a tolerance. `stitchTour` concatenates
   * every clip in a theme with a stream copy, so a clip whose audio track runs
   * even slightly longer than its video track has narration that keeps
   * playing after the concat demuxer has already moved on to the next file's
   * timeline — heard as the tail of one scene's line overlapping the start of
   * the next one's. Padding the video to match the audio, however small the
   * gap, is what keeps a clip's own duration honest for concatenation.
   *
   * Without padding the video is copied untouched, which is the common path
   * and costs nothing.
   */
  const padding = overrun > 0;
  const video = padding
    ? [
        '-filter_complex',
        `${delays};${mix};[0:v]tpad=stop_mode=clone:stop_duration=${overrun.toFixed(3)}[v]`,
        '-map',
        '[v]',
        ...videoArgs,
      ]
    : ['-filter_complex', `${delays};${mix}`, '-map', '0:v', '-c:v', 'copy'];

  return {
    overrun,
    args: [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      silent,
      ...inputs,
      ...video,
      '-map',
      '[spoken]',
      '-c:a',
      'aac',
      '-b:a',
      '160k',
      '-ar',
      '48000',
      '-movflags',
      '+faststart',
      out,
    ],
  };
}

/**
 * Roughly how long Kokoro will take to say something, before it has said it.
 *
 * Needed because the hold has to be chosen while the scene is running and the
 * wav does not exist until afterwards. Measured at three words a second for
 * this voice at speed 1, which is close enough that the padding path above
 * almost never runs: the point is only that the pointer should not race ahead
 * of the narration, and half a second either way does not change that.
 */
export function spokenFor(text: string, minimum = 0): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const rate = isEdgeVoice() ? 3.0 : 3.7;
  const seconds = words / (rate * SPEED) + 0.5;
  return Math.max(minimum, Math.round(seconds * 1000));
}
