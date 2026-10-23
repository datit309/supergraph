import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import {
  ANCHOR,
  FPS,
  OUT_DIR,
  STAGE,
  STILL_SCALE,
  THEMES,
  TOUR,
  VIDEO,
  tourIndex,
} from './config.ts';
import { previewPage } from './preview.ts';
import type { GapBucket } from './recorder.ts';
import { entryDir } from './run-id.ts';
import type { SceneEntry } from './scene.ts';
import { voiceMissingMessage, voiceReady } from './voice.ts';

/**
 * What happens once every scene is in the can.
 *
 * Three jobs, and the first is the one with teeth. Every clip carries the
 * frame rate the browser actually sustained while it was filmed, and this is
 * where that number is read rather than filed: a clip encoded at 60fps out of
 * 30fps of real paints is smooth nowhere and looks like a cheap capture, and
 * the failure is completely invisible unless something checks. So it is
 * checked, printed per scene, and a corpus whose worst clip falls under the
 * floor says so loudly at the end of the run instead of quietly shipping.
 *
 * Then the tour: every clip for a theme, end to end, so there is one file to
 * hand somebody who asks what the thing does. The clips are encoded to
 * identical parameters by `recorder.ts`, which is what makes a stream copy
 * legal here — no second generation of h264, no hour of re-encoding.
 *
 * Then the manifest, which is the whole interface between this directory and
 * a website. A page that wants to swap a screenshot for a video, or light for
 * dark, reads one JSON file and never learns how any of this worked.
 */

/**
 * Three quarters of the target, rather than a fixed number.
 *
 * The floor is about the gap between what was encoded and what was painted,
 * so it has to move with the target: 45 was the right line when every clip
 * was 60fps, and would condemn a 4K corpus that is honestly 30. A clip within
 * a quarter of its own target reads as continuous motion; below that the
 * duplicated frames start to show as judder.
 */
const FPS_FLOOR = Number(process.env.DEMO_FPS_FLOOR ?? FPS * 0.75);

/**
 * A second of animation, below which there is no rate worth reporting.
 *
 * Some scenes hold still on purpose — the `smoke` scene sits on one frame for
 * four seconds — and a rate computed over a handful of paints lands wherever
 * the noise puts it. Flagging that as judder sends somebody hunting a capture
 * fault in the one scene the docs tell them to film first.
 *
 * The floor is on *time*, deliberately, and not on the number of paints: a
 * clip that judders badly paints less, so a paint-count floor excuses exactly
 * the clips that most deserve flagging. One second of the actor actually
 * animating is enough to judge, however few frames came back.
 */
const MOTION_FLOOR = Number(process.env.DEMO_MOTION_FLOOR ?? 1);

/** Whether this clip moved enough, for long enough, to have a rate at all. */
function judgeable(clip: { motionSeconds: number }): boolean {
  return clip.motionSeconds >= MOTION_FLOOR;
}

function run(bin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${bin} exited ${code}\n${stderr.slice(-1200)}`))
    );
  });
}

async function readEntries(): Promise<SceneEntry[]> {
  const dir = entryDir();
  const names = await readdir(dir).catch(() => [] as string[]);
  const entries = await Promise.all(
    names
      .filter((name) => name.endsWith('.json'))
      .map(
        async (name) =>
          JSON.parse(await readFile(join(dir, name), 'utf8')) as SceneEntry
      )
  );

  return entries.sort(
    (left, right) =>
      tourIndex(left.scene) - tourIndex(right.scene) ||
      left.scene.localeCompare(right.scene)
  );
}

async function stitchTour(
  theme: string,
  clips: string[]
): Promise<string | null> {
  if (clips.length < 2) {
    return null;
  }

  const listPath = join(OUT_DIR, `.tour-${theme}.txt`);
  await writeFile(
    listPath,
    `${clips.map((clip) => `file '${join(OUT_DIR, clip)}'`).join('\n')}\n`
  );

  const out = join(OUT_DIR, theme, 'full-tour.mp4');
  await run('ffmpeg', [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    listPath,
    '-c',
    'copy',
    '-movflags',
    '+faststart',
    out,
  ]);
  await rm(listPath, { force: true });

  return `${theme}/full-tour.mp4`;
}

type Asset = {
  stills: string[];
  mp4: string;
  /** Null unless `DEMO_WEBM=1`: VP9 at 4K costs more than it returns. */
  webm: string | null;
  poster: string;
  seconds: number;
  fps: number;
  worstGapMs: number;
  /** So `scripts/gaps.mjs` can read the shape behind `fps`/`worstGapMs` from the manifest alone. */
  gaps: GapBucket[];
  spoken: number;
};

type ManifestScene = {
  scene: string;
  title: string;
  blurb: string;
  ref: string | null;
  assets: Record<string, Asset>;
};

/**
 * What a run adds to what is already there, rather than what it replaces.
 *
 * `--grep tasks` is the normal way to iterate on one scene, and without this
 * that run would publish a manifest containing exactly one scene and a
 * preview page showing one card, having silently dropped twenty-six scenes
 * whose video and stills are still sitting on disk beside it. The same
 * arithmetic is what makes a partly failed run recoverable: film the clips
 * that failed and the corpus completes, instead of starting the whole thing
 * again.
 *
 * Merging is per scene *and* per theme, because a run can be filmed one theme
 * at a time and the light and dark halves of a scene are independent assets.
 * A re-film of a scene in one theme must not evict the other.
 */
async function merge(fresh: ManifestScene[]): Promise<ManifestScene[]> {
  const held = await readFile(join(OUT_DIR, 'manifest.json'), 'utf8')
    .then(
      (raw) => (JSON.parse(raw) as { scenes?: ManifestScene[] }).scenes ?? []
    )
    .catch(() => [] as ManifestScene[]);

  const byScene = new Map<string, ManifestScene>();
  for (const scene of held) {
    byScene.set(scene.scene, scene);
  }

  for (const scene of fresh) {
    const previous = byScene.get(scene.scene);
    byScene.set(scene.scene, {
      ...scene,
      assets: { ...previous?.assets, ...scene.assets },
    });
  }

  return [...byScene.values()].sort(
    (left, right) =>
      tourIndex(left.scene) - tourIndex(right.scene) ||
      left.scene.localeCompare(right.scene)
  );
}

export default async function stitch(): Promise<void> {
  const entries = await readEntries();
  if (entries.length === 0) {
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  const slow = entries.filter(
    (entry) => judgeable(entry.clip) && entry.clip.measured < FPS_FLOOR
  );

  process.stdout.write('\n  captured\n');
  for (const entry of entries) {
    const judged = judgeable(entry.clip);
    const mark = judged && entry.clip.measured < FPS_FLOOR ? '!' : ' ';
    const rate = judged
      ? `${entry.clip.measured.toFixed(1).padStart(5)}fps in motion  ` +
        `worst gap ${entry.clip.worstGapMs.toFixed(0).padStart(3)}ms  `
      : `${'held'.padStart(8)}, barely moves  `;
    process.stdout.write(
      `  ${mark} ${entry.theme.padEnd(5)} ${entry.scene.padEnd(16)} ` +
        rate +
        `${entry.clip.seconds.toFixed(1).padStart(5)}s  ` +
        `${String(entry.clip.frames).padStart(5)} frames  ` +
        `${entry.stills.length} still(s)  ` +
        `${String(entry.clip.spoken).padStart(2)} spoken` +
        `${entry.clip.overrunSeconds > 0.08 ? ` (+${entry.clip.overrunSeconds.toFixed(1)}s held)` : ''}\n`
    );
  }

  const filmed: ManifestScene[] = [
    ...new Set(entries.map((entry) => entry.scene)),
  ]
    .sort(
      (left, right) =>
        tourIndex(left) - tourIndex(right) || left.localeCompare(right)
    )
    .map((name) => {
      const shared = entries.find((entry) => entry.scene === name)!;
      return {
        scene: name,
        title: shared.title,
        blurb: shared.blurb,
        ref: shared.ref ?? null,
        assets: Object.fromEntries(
          entries
            .filter((entry) => entry.scene === name)
            .map((entry) => [
              entry.theme,
              {
                stills: entry.stills,
                mp4: entry.clip.mp4,
                webm: entry.clip.webm,
                poster: entry.clip.poster,
                seconds: Number(entry.clip.seconds.toFixed(2)),
                fps: Number(entry.clip.measured.toFixed(1)),
                worstGapMs: Number(entry.clip.worstGapMs.toFixed(0)),
                /** Under `MOTION_FLOOR` seconds, `fps` is noise — see `judgeable`. */
                motionSeconds: Number(entry.clip.motionSeconds.toFixed(2)),
                motionGaps: entry.clip.motionGaps,
                gaps: entry.clip.gapHistogram,
                spoken: entry.clip.spoken,
              },
            ])
        ),
      };
    });

  const scenes = await merge(filmed);

  // Rebuilt from the merged corpus, not from this run: a tour of only the one
  // scene somebody happened to re-film is not a tour.
  const tours: Record<string, string | null> = {};
  for (const theme of TOUR ? THEMES : []) {
    const clips = scenes
      .map((scene) => scene.assets[theme]?.mp4)
      .filter((clip): clip is string => Boolean(clip));
    tours[theme] = await stitchTour(theme, clips);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    filmedAt: ANCHOR.toISOString(),
    stage: { ...STAGE, fps: FPS, stillScale: STILL_SCALE, video: VIDEO },
    themes: THEMES,
    tours,
    scenes,
  };

  await writeFile(
    join(OUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  await writeFile(join(OUT_DIR, 'index.html'), previewPage());

  // This run's directory, which nothing else can see. Not the frame root
  // either: each recorder sweeps its own subdirectory as it finishes, and a
  // blanket delete here would take the frames of a concurrent run with it.
  await rm(entryDir(), { recursive: true, force: true });

  const clipCount = scenes.reduce(
    (total, scene) => total + Object.keys(scene.assets).length,
    0
  );

  process.stdout.write(
    `\n  ${OUT_DIR}/manifest.json  (${manifest.scenes.length} scenes, ${clipCount} clips; ${entries.length} filmed this run)\n` +
      `  ${OUT_DIR}/index.html     open this to look at the corpus\n`
  );

  if (!(await voiceReady())) {
    process.stdout.write(`\n${voiceMissingMessage()}`);
  }

  if (slow.length > 0) {
    process.stdout.write(
      `\n  ${slow.length} clip(s) under ${FPS_FLOOR}fps of real paints — ` +
        `encoded at ${FPS} regardless, so they will read as judder:\n` +
        slow
          .map(
            (entry) =>
              `    ${entry.theme}/${entry.scene} at ${entry.clip.measured.toFixed(1)}fps\n`
          )
          .join('')
    );
  }
}
