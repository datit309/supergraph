import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { platform } from 'node:os';
import { join } from 'node:path';

import type { CDPSession, Page } from '@playwright/test';

import {
  FPS,
  STAGE,
  TRACE_FRAMES,
  VIDEO,
  VIDEO_SCALE,
  WEBM,
} from './config.ts';
import type { Mark } from './voice.ts';
import { mixArgs, speak, voiceReady } from './voice.ts';

/**
 * How a browser is filmed without a screen recorder.
 *
 * Playwright's own `recordVideo` is the obvious answer and the wrong one: it
 * writes VP8 at whatever rate the compositor felt like, with no handle on
 * quality, resolution or where a clip starts — fine for a failure artifact,
 * which is what it is for, and not something to put on a landing page.
 *
 * So this drives `Page.startScreencast` over CDP instead, which hands back a
 * JPEG *per paint*. That is the important word. Frames do not arrive on a
 * clock; they arrive when something changed, which means their spacing is the
 * real spacing of the animation and a still moment costs nothing. Encoding
 * them as though they were evenly spaced would play the whole clip back at
 * the wrong speed, so every frame's own timestamp is kept and handed to
 * ffmpeg's concat demuxer as an explicit duration. ffmpeg then resamples that
 * uneven sequence onto a constant 60fps grid, which is the one place in this
 * pipeline where a frame is allowed to be invented.
 *
 * What cannot be fixed downstream is a paint that never happened. If Chrome
 * hands back 34 frames for a second of animation, no amount of resampling
 * makes it smooth — it makes it evenly judder. `measured` is therefore
 * reported on every clip and asserted against by `studio/stitch.ts`, because
 * a 60fps file that is really 34fps is the exact failure this whole approach
 * exists to avoid, and it is invisible unless something counts.
 */

type Frame = { at: number; file: string };

function now(): number {
  return Date.now() / 1000;
}

/** One bucket of the gap histogram — see `Clip.gapHistogram`. */
export type GapBucket = { label: string; count: number };

export type Clip = {
  /** Frames the browser actually handed back. */
  frames: number;
  /** Wall-clock length of the capture, in seconds. */
  seconds: number;
  /**
   * The paint rate while something was actually moving.
   *
   * Frames over seconds is the obvious figure and it measures the wrong
   * thing: a screencast emits nothing at all while the screen is still, so a
   * scene that holds a caption for two seconds scores half marks however
   * perfectly it captured the animation either side of the hold. Since a hold
   * is a thing scenes do deliberately and often, that number would condemn
   * every well-paced clip in the corpus and there would be no way to tell it
   * apart from a genuinely dropped frame.
   *
   * So the still stretches are excluded, and which stretches those are is
   * something the actor says rather than something this guesses: it brackets
   * its own pointer tweens, wheel sweeps and camera transitions, and the rate
   * is computed only across the gaps inside them. That is the only interval
   * where a dropped frame is something a viewer could see.
   */
  measured: number;
  /** Longest gap between consecutive paints during motion, in ms. */
  worstGapMs: number;
  /**
   * Seconds of animation this clip contains, which is what decides whether
   * `measured` may be judged at all.
   *
   * The count of paints was the first answer and it is exactly backwards for
   * the case that matters most. A clip juddering badly paints *less*, so at
   * 4K a scene of push-ins produced fewer than sixty paints across eight
   * seconds of camera movement and a paint-count floor excused the worst clip
   * in the corpus as "barely moves". Time is the honest denominator: eight
   * seconds of animation is eight seconds a viewer watched, however few
   * frames arrived, and ten paints inside it is a finding rather than a
   * sample too small to mention.
   */
  motionSeconds: number;
  /**
   * How many paints `measured` was computed from. Informational, not a gate:
   * see `motionSeconds` for why.
   *
   * A rate is a claim about motion, and a clip that barely moves gives it
   * almost nothing to stand on: the `smoke` scene holds a still frame for
   * four seconds, paints a handful of times, and comes out at 0fps with
   * every gap in the slowest bucket. Nothing is wrong with it. The measure
   * simply has no sample, and a verdict drawn from no sample reads as a
   * broken capture and sends whoever is reading it looking for a fault in
   * the one scene the docs tell them to run first.
   *
   * So the count travels with the rate, and both consumers of it — the
   * end-of-run report and `scripts/gaps.mjs` — decline to judge a clip that
   * never had enough motion to judge.
   */
  motionGaps: number;
  /** The distribution behind `measured` — see the docblock above `stop()`. */
  gapHistogram: GapBucket[];
  mp4: string;
  webm: string | null;
  poster: string;
  /** Lines of narration spoken over this clip. */
  spoken: number;
  /** Seconds the closing line ran past the picture, which is padded out. */
  overrunSeconds: number;
};

function encoderArgs(kind: 'videotoolbox' | 'x264'): string[] {
  if (kind === 'videotoolbox') {
    return [
      '-c:v',
      'h264_videotoolbox',
      '-b:v',
      process.env.DEMO_BITRATE ?? '36M',
      '-profile:v',
      'high',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
    ];
  }

  return [
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    String(VIDEO.crf),
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
  ];
}

/** Whether ffmpeg on this machine actually has the encoder asked for. */
function probeEncoders(): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn('ffmpeg', ['-hide_banner', '-encoders'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    let out = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      out += chunk.toString();
    });
    child.on('error', () => resolve(''));
    child.on('close', () => resolve(out));
  });
}

let encoderKind: Promise<'videotoolbox' | 'x264'> | null = null;

/**
 * `h264_videotoolbox` only exists on macOS, and asking ffmpeg to use an
 * encoder it does not have fails with a message about the codec name, not
 * about the platform — which reads as a broken pipeline rather than an
 * unsupported OS. Detecting it is therefore not optional on anything but a
 * known-macOS box, and it is shelling out to `ffmpeg -encoders` to find out,
 * so it happens once per process and is cached rather than once per clip.
 * `DEMO_ENCODER=x264|videotoolbox` skips detection for whichever side of
 * this you already know you're on.
 */
function detectEncoder(): Promise<'videotoolbox' | 'x264'> {
  const forced = process.env.DEMO_ENCODER;
  if (forced === 'x264' || forced === 'videotoolbox') {
    return Promise.resolve(forced);
  }
  if (platform() !== 'darwin') {
    return Promise.resolve('x264');
  }
  return probeEncoders().then((encoders) =>
    encoders.includes('h264_videotoolbox') ? 'videotoolbox' : 'x264'
  );
}

/**
 * 4K60 is where a software encoder stops being free.
 *
 * `libx264 -preset medium` at 1080p comfortably keeps up with filming. At
 * 3840x2160 it falls several times behind real time, and a multi-scene
 * corpus turns into an afternoon. VideoToolbox does the same work on Apple's
 * media engine at roughly the speed of playback and leaves the cores for the
 * browser, which matters here because another worker is filming while this
 * one encodes — so it's preferred whenever the machine actually has it.
 * Everywhere else (Linux, or a Mac without it) falls back to the slower,
 * portable route rather than failing outright.
 */
async function videoArgs(): Promise<string[]> {
  encoderKind ??= detectEncoder();
  return encoderArgs(await encoderKind);
}

/**
 * The old way of deciding what counted as motion, kept only as a fallback.
 *
 * Three frames' worth at 60fps. Where the actor reports no spans at all —
 * a scene that never asks it to move, or one written before it did — this is
 * what the rate falls back to, because reporting nothing is worse than
 * reporting something approximate. It is a poor rule and that is the point of
 * the spans: typing at 58ms a character sits just the wrong side of it, and a
 * stalled push-in sits well past it.
 */
const MOTION_GAP = 0.05;

/**
 * How hard Chrome is asked to compress each frame before sending it.
 *
 * This is a throughput dial, not a quality one. The screencast encodes every
 * frame on the browser's own thread, and at 3840x2160 that cost competes with
 * painting the next one: the frames are an intermediate that ffmpeg re-encodes
 * anyway, so the only question is how much of the paint budget to spend
 * getting them out of the browser.
 */
const FRAME_QUALITY = Number(process.env.DEMO_FRAME_QUALITY ?? 80);

/** Whether this machine even has `nice` — not a given off macOS/Linux. */
function probeNice(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('nice', ['-n', '0', 'true'], { stdio: 'ignore' });
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
  });
}

let niced: Promise<boolean> | null = null;

/**
 * Encoding yields to filming.
 *
 * Scenes run in parallel, so one worker's ffmpeg is competing for cores with
 * another worker's browser — and the browser losing that fight is exactly the
 * dropped-paint failure `measured` exists to catch. Worse, it would be caught
 * *inconsistently*, since which scene gets starved depends on who happened to
 * finish first, so the corpus would come out slightly different every run for
 * no reason anybody could see. Lowering the encoder's priority costs nothing
 * (raising it would need privileges; lowering it never does) and makes the
 * frame rate a property of the app rather than of the scheduler.
 *
 * `nice` itself is assumed nowhere: a platform without it (Windows, some
 * minimal containers) runs the encoder unniced rather than failing to spawn
 * it at all, which would take the whole run down over a priority hint.
 */
async function run(bin: string, args: string[]): Promise<void> {
  niced ??= probeNice();
  const canNice = await niced;

  return new Promise((resolve, reject) => {
    const child = canNice
      ? spawn('nice', ['-n', '12', bin, ...args], {
          stdio: ['ignore', 'ignore', 'pipe'],
        })
      : spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${bin} exited ${code}\n${stderr.split('\n').slice(-24).join('\n')}`
        )
      );
    });
  });
}

export class Recorder {
  private session: CDPSession | null = null;
  private frames: Frame[] = [];
  private writes: Promise<unknown>[] = [];
  private index = 0;
  private startedAt = 0;
  private offset = 0;
  private pausedAt = 0;
  private marks: Mark[] = [];
  private spans: { from: number; to: number }[] = [];
  private openedAt: number | null = null;
  private depth = 0;

  constructor(
    private readonly page: Page,
    private readonly frameDir: string
  ) {}

  /** Seconds into the finished clip, with paused stretches taken out. */
  elapsed(): number {
    const paused = this.pausedAt ? now() - this.pausedAt : 0;
    return Math.max(0, now() - this.startedAt - this.offset - paused);
  }

  /** Records a line of narration against the clip's own timeline. */
  mark(text: string): void {
    this.marks.push({ at: this.elapsed(), text });
  }

  /**
   * Brackets a stretch the actor is animating through — see `stop()`.
   *
   * Counted rather than flagged, because these nest: `spotlight` pushes the
   * camera in and walks the pointer at the same time, which is two spans
   * describing one movement, and treating the inner one's end as the end of
   * the outer would leave the rest of the push-in outside any span at all.
   */
  motion(state: 'start' | 'end'): void {
    if (state === 'start') {
      this.openedAt ??= now() - this.offset;
      this.depth += 1;
      return;
    }

    this.depth = Math.max(0, this.depth - 1);
    if (this.depth > 0 || this.openedAt === null) {
      return;
    }

    this.spans.push({ from: this.openedAt, to: now() - this.offset });
    this.openedAt = null;
  }

  async start(): Promise<void> {
    await mkdir(this.frameDir, { recursive: true });
    const session = await this.page.context().newCDPSession(this.page);
    this.session = session;

    session.on('Page.screencastFrame', (event) => {
      const payload = event as unknown as {
        data: string;
        sessionId: number;
        metadata?: { timestamp?: number };
      };

      void session
        .send('Page.screencastFrameAck', { sessionId: payload.sessionId })
        .catch(() => undefined);

      const at = (payload.metadata?.timestamp ?? now()) - this.offset;
      const file = `f-${String(this.index++).padStart(6, '0')}.jpg`;
      this.frames.push({ at, file });
      this.writes.push(
        writeFile(
          join(this.frameDir, file),
          Buffer.from(payload.data, 'base64')
        )
      );
    });

    this.startedAt = now();
    await session.send('Page.startScreencast', {
      format: 'jpeg',
      quality: FRAME_QUALITY,
      everyNthFrame: 1,
    });
  }

  /**
   * Lifts the capture for as long as a still is being taken, and closes the
   * hole afterwards.
   *
   * A screenshot wants the cursor and the caption out of the way, and the film
   * wants them in it — one pass has to serve both, so the overlay is hidden and
   * the capture suspended around each still. Simply stopping the screencast
   * would leave the elapsed time in the timeline, and because every frame here
   * carries its own duration that gap plays back as a freeze on whatever was
   * last on screen. So the paused interval is subtracted from every timestamp
   * that follows it: the film runs continuously through a still it cannot see.
   */
  async pause(): Promise<void> {
    if (!this.session || this.pausedAt) {
      return;
    }
    await this.session.send('Page.stopScreencast').catch(() => undefined);
    this.pausedAt = now();
  }

  async resume(): Promise<void> {
    if (!this.session || !this.pausedAt) {
      return;
    }
    this.offset += now() - this.pausedAt;
    this.pausedAt = 0;
    await this.session
      .send('Page.startScreencast', {
        format: 'jpeg',
        quality: 95,
        everyNthFrame: 1,
      })
      .catch(() => undefined);
  }

  /**
   * Stops the capture and encodes what it collected.
   *
   * The concat demuxer needs the final file named twice — the last `duration`
   * applies to the entry before it, so without the repeat the closing frame
   * is dropped and every clip ends a frame early on whatever it was showing.
   */
  async stop(basePath: string): Promise<Clip> {
    const session = this.session;
    if (!session) {
      throw new Error('Recorder.stop before start');
    }

    await session.send('Page.stopScreencast').catch(() => undefined);
    await session.detach().catch(() => undefined);
    this.session = null;
    await Promise.all(this.writes);

    const frames = this.frames;
    if (frames.length < 2) {
      throw new Error(`Nothing to encode: ${frames.length} frame(s) captured`);
    }

    const span = frames[frames.length - 1]!.at - frames[0]!.at;
    const seconds = span > 0 ? span : now() - this.startedAt;
    const hold = 1 / FPS;

    /**
     * The gaps between consecutive paints *within* one stretch of movement.
     *
     * Which stretches those are is something the actor says rather than
     * something this guesses. It used to be a threshold — any gap under 50ms
     * was motion, anything longer was a hold — and that is wrong in both
     * directions. Typing at a human 58ms a character sits just the wrong side
     * of the line, so four scenes whose only sin was a search box were
     * reported as juddering; and a scene that holds a dialog open for twenty
     * seconds while a line is read emits the occasional paint through it,
     * which is not motion at all and dominated the distribution. The actor is
     * the thing doing the moving, so it brackets its own pointer tweens,
     * wheel sweeps and camera transitions, and the question stops being a
     * guess.
     *
     * Gaps are taken *inside* each span rather than filtered by where they
     * start, and that distinction is the whole of it. A span's last paint
     * lands a few milliseconds before the span closes, and the next paint
     * comes whenever the scene next changes — two seconds later, if a line is
     * being read over a still frame. Attributing that gap to the movement
     * because it began during it is how a smooth 67fps clip reported 44fps
     * with a 2.2-second worst gap, which is a measurement of the hold that
     * followed the animation rather than of the animation.
     */
    const spans = this.spans;
    const withinSpans = spans.flatMap((span) => {
      const inside = frames.filter(
        (frame) => frame.at >= span.from && frame.at <= span.to
      );
      return inside
        .slice(1)
        .map((frame, at) => ({
          at: inside[at]!.at,
          gap: frame.at - inside[at]!.at,
        }))
        .filter((entry) => entry.gap > 0);
    });

    /**
     * With no spans at all, fall back to the old threshold rather than
     * declaring the clip unmeasurable: a scene that never asks the actor to
     * move, or one written before it reported any of this, should still say
     * something about itself.
     */
    const inMotion =
      spans.length > 0
        ? withinSpans
        : frames
            .slice(1)
            .map((frame, at) => ({
              at: frames[at]!.at,
              gap: frame.at - frames[at]!.at,
            }))
            .filter((entry) => entry.gap > 0 && entry.gap <= MOTION_GAP);

    const gaps = inMotion.map((entry) => entry.gap);

    /**
     * The gap histogram, because the headline figure cannot see a stutter.
     *
     * A rate is one number over a stretch that may be smooth for most of its
     * length and stepped for the rest, and the mean lands between the two
     * with no sign either happened: a 4K clip that visibly juddered reported
     * a respectable 34fps while 160 of its 300 gaps were slower than 20fps.
     * The shape is the only thing that shows that.
     *
     * Over the motion gaps, so a held second cannot pad it. Carried into the
     * returned `Clip`, so
     * `scripts/gaps.mjs` can read the shape of every clip straight off the
     * manifest rather than only whatever a run happened to print live.
     * `DEMO_TRACE_FRAMES=1` additionally prints it as the run goes.
     */
    const bucketTops: [string, number][] = [
      ['<=17ms (60fps)', 0.017],
      ['<=34ms (30fps)', 0.034],
      ['<=50ms (20fps)', 0.05],
      ['<=100ms (10fps)', 0.1],
      ['<=250ms', 0.25],
      ['slower', Infinity],
    ];
    let bucketFloor = 0;
    const gapHistogram: GapBucket[] = bucketTops.map(([label, top]) => {
      const count = gaps.filter(
        (gap) => gap > bucketFloor && gap <= top
      ).length;
      bucketFloor = top;
      return { label, count };
    });

    if (TRACE_FRAMES) {
      const line = gapHistogram
        .map((bucket) => `${bucket.label}: ${bucket.count}`)
        .join('  ');
      process.stdout.write(`    gaps  ${line}\n`);
    }

    const movingFor = gaps.reduce((total, gap) => total + gap, 0);
    const measured = movingFor > 0 ? gaps.length / movingFor : 0;
    const worstGapMs = gaps.length > 0 ? Math.max(...gaps) * 1000 : 0;
    const motionGaps = gaps.length;
    const motionSeconds =
      spans.length > 0
        ? spans.reduce((total, span) => total + (span.to - span.from), 0)
        : movingFor;

    const lines = ['ffconcat version 1.0'];
    frames.forEach((frame, at) => {
      const next = frames[at + 1];
      const gap = next ? Math.max(next.at - frame.at, hold / 4) : hold;
      lines.push(`file '${frame.file}'`, `duration ${gap.toFixed(6)}`);
    });
    lines.push(`file '${frames[frames.length - 1]!.file}'`);

    const listPath = join(this.frameDir, 'clip.ffconcat');
    await writeFile(listPath, `${lines.join('\n')}\n`);

    /**
     * No resampling when the capture already is the output.
     *
     * A scale filter to the size something already is still costs a full
     * filter pass per frame, and at 4K that is not free. It stays in the
     * pipeline only for a stage that was deliberately stepped down with
     * `DEMO_SCALE`, where the frames really do need fitting to the box.
     */
    const captured = {
      width: STAGE.width * VIDEO_SCALE,
      height: STAGE.height * VIDEO_SCALE,
    };
    const resample =
      captured.width === VIDEO.width && captured.height === VIDEO.height
        ? ''
        : `scale=${VIDEO.width}:${VIDEO.height}:force_original_aspect_ratio=decrease:flags=lanczos,` +
          `pad=${VIDEO.width}:${VIDEO.height}:(ow-iw)/2:(oh-ih)/2:color=black,`;

    const mp4 = `${basePath}.mp4`;
    const webm = `${basePath}.webm`;
    const poster = `${basePath}.poster.jpg`;
    const silent = `${basePath}.silent.mp4`;
    const encode = await videoArgs();

    const spoken = (await voiceReady()) ? await speak(this.marks) : [];
    const target = spoken.length > 0 ? silent : mp4;

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
      '-vf',
      `${resample}fps=${FPS}`,
      ...encode,
      '-r',
      String(FPS),
      target,
    ]);

    let overrunSeconds = 0;

    if (spoken.length > 0) {
      const mixed = mixArgs(silent, spoken, mp4, seconds, encode);
      overrunSeconds = mixed.overrun;
      await run('ffmpeg', mixed.args);
      await rm(silent, { force: true });
    }

    if (WEBM) {
      await run('ffmpeg', [
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        mp4,
        '-c:v',
        'libvpx-vp9',
        '-crf',
        String(VIDEO.webmCrf),
        '-b:v',
        '0',
        '-row-mt',
        '1',
        '-deadline',
        'good',
        '-cpu-used',
        '4',
        ...(spoken.length > 0 ? ['-c:a', 'libopus', '-b:a', '128k'] : ['-an']),
        webm,
      ]);
    }

    await run('ffmpeg', [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      mp4,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      poster,
    ]);

    await rm(this.frameDir, { recursive: true, force: true });

    return {
      frames: frames.length,
      seconds,
      measured,
      worstGapMs,
      motionSeconds,
      motionGaps,
      gapHistogram,
      mp4,
      webm: WEBM ? webm : null,
      poster,
      spoken: spoken.length,
      overrunSeconds,
    };
  }

  async discard(): Promise<void> {
    await this.session?.send('Page.stopScreencast').catch(() => undefined);
    await this.session?.detach().catch(() => undefined);
    this.session = null;
    await rm(this.frameDir, { recursive: true, force: true });
  }
}
