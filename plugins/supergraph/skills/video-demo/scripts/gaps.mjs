#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/**
 * The jank check a mean frame rate cannot make.
 *
 * `measured` in the manifest already excludes held stretches, which is right
 * for a caption and exactly wrong for a stepping zoom: a push-in painting at
 * nine frames a second produces gaps the headline figure never sees. The only
 * way to catch that is to look at the distribution itself, so this reads the
 * gap histogram `DEMO_TRACE_FRAMES=1` records per clip and fails the run when
 * a clip has more slow gaps than fast ones, which a frame-rate average alone
 * would call healthy.
 */

const OUT_DIR = resolve(
  process.argv[2] ?? process.env.DEMO_OUT ?? join(process.cwd(), 'demo-out')
);
/**
 * Either a corpus directory or the manifest itself.
 *
 * Both are things somebody will type, and appending a filename to a path that
 * already ends in one produces an `ENOTDIR` that reads like a broken script
 * rather than a wrong argument.
 */
const MANIFEST_PATH = OUT_DIR.endsWith('.json')
  ? OUT_DIR
  : join(OUT_DIR, 'manifest.json');

/**
 * How much of a clip may be slow before the motion reads as stepped. A
 * quarter is comfortably above the 5 per cent a smooth clip measured and
 * comfortably below the 36 per cent of one that juddered.
 */
const SLOW_SHARE = Number(process.env.DEMO_SLOW_SHARE ?? 0.25);

/**
 * Below this many seconds of animation, a clip has nothing to judge.
 *
 * A share is only meaningful over a sample, and a scene that deliberately
 * holds still has none: the template's own `smoke` scene sits on one frame
 * for four seconds and would come out 100 per cent "slow" — a verdict of
 * judder on a clip with no motion in it. The floor is on time rather than on
 * paints because a juddering clip paints *less*, so a paint floor excuses the
 * worst clips. Matches `MOTION_FLOOR` in `studio/stitch.ts`.
 */
const MOTION_FLOOR = Number(process.env.DEMO_MOTION_FLOOR ?? 1);

function bucketCeilingMs(label) {
  if (/slower/i.test(label)) {
    return Infinity;
  }
  const match = label.match(/(\d+(?:\.\d+)?)\s*ms/);
  return match ? Number(match[1]) : Infinity;
}

function summarize(histogram) {
  const under34 = histogram
    .filter((bucket) => bucketCeilingMs(bucket.label) <= 34)
    .reduce((total, bucket) => total + bucket.count, 0);
  const over50 = histogram
    .filter((bucket) => bucketCeilingMs(bucket.label) > 50)
    .reduce((total, bucket) => total + bucket.count, 0);
  const total = histogram.reduce((sum, bucket) => sum + bucket.count, 0);
  const share = total > 0 ? over50 / total : 0;

  /**
   * A share, not a ratio against the fast bucket.
   *
   * Comparing slow gaps to sub-34ms ones is blind to the target: a clip aiming
   * at 30fps spends most of its gaps between 34 and 50ms quite legitimately,
   * and the real 4K clip that visibly juddered scored 141 "fast" against 111
   * "slow" and passed. What actually correlated with the judder was the
   * proportion of gaps slower than 50ms, which is the point a held frame
   * becomes something a viewer notices: the juddering clip was 36 per cent,
   * the smooth one 5.
   */
  return { under34, over50, total, share, jank: share > SLOW_SHARE };
}

let manifest;
try {
  manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
} catch (error) {
  process.stderr.write(`gaps: can't read ${MANIFEST_PATH}: ${error.message}\n`);
  process.exit(1);
}

const rows = [];
for (const scene of manifest.scenes ?? []) {
  for (const [theme, asset] of Object.entries(scene.assets ?? {})) {
    rows.push({ scene: scene.scene, theme, asset });
  }
}

if (rows.length === 0) {
  process.stdout.write(`gaps: no clips in ${MANIFEST_PATH}\n`);
  process.exit(0);
}

let failed = false;
let missing = 0;

process.stdout.write(
  '  clip                          fps   histogram (label: count)\n'
);

for (const { scene, theme, asset } of rows) {
  const label = `${theme}/${scene}`.padEnd(30);
  const histogram = asset.gaps;

  if (!histogram || histogram.length === 0) {
    missing += 1;
    process.stdout.write(
      `  ${label} ${String(asset.fps ?? '?').padStart(4)}  no gap histogram (manifest predates it; re-film)\n`
    );
    continue;
  }

  /**
   * Absent from a manifest filmed before the count existed, which is judged
   * the old way rather than silently excused: an unknown sample is not the
   * same claim as a small one.
   */
  if (
    asset.motionSeconds !== undefined &&
    asset.motionSeconds < MOTION_FLOOR
  ) {
    process.stdout.write(
      `  ${label} ${'held'.padStart(4)}  ${asset.motionSeconds}s of motion, ` +
        'too little to rate\n'
    );
    continue;
  }

  const { under34, over50, total, share, jank } = summarize(histogram);
  const mark = jank ? '!' : ' ';
  const breakdown = histogram
    .map((bucket) => `${bucket.label}: ${bucket.count}`)
    .join('  ');

  process.stdout.write(
    `${mark} ${label} ${String(asset.fps).padStart(4)}  ${breakdown}\n`
  );
  process.stdout.write(
    `  ${''.padEnd(30)} ${''.padStart(4)}  under 34ms: ${under34}  ` +
      `over 50ms: ${over50} (${Math.round(share * 100)}% of ${total})` +
      `${jank ? '  JANK' : ''}\n`
  );

  if (jank) {
    failed = true;
  }
}

if (missing > 0) {
  process.stdout.write(
    `\n  ${missing} clip(s) carry no gap histogram, so they were filmed by an older studio. Re-film to check them.\n`
  );
}

if (failed) {
  process.stdout.write(
    `\n  one or more clips spend over ${Math.round(SLOW_SHARE * 100)}% of their
` +
      '  gaps slower than 50ms, which reads as stepped motion rather than a\n' +
      '  lower frame rate. Usually the capture resolution: film the video at\n' +
      '  1x and keep the stills at 2x. See references/capture.md.\n'
  );
  process.exit(1);
}

process.stdout.write('\n  no clip has more slow gaps than fast ones.\n');
