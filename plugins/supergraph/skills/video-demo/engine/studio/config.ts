import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { DemoConfig, Theme } from './define.ts';

/**
 * The app's own config, found by absolute path rather than by a relative
 * import.
 *
 * This used to be `import demo from '../demo.config.ts'`, which is only
 * correct while the engine and the app's config are neighbours — that is, while
 * the engine is copied into the app's repo. It is not, any more: one clone of
 * the skill films every project on the machine, and each project's config lives
 * in its own workspace. A relative import cannot reach that, and the
 * alternative of symlinking the engine beside the config fails silently in
 * the worst way: Node resolves a symlinked module against its real path, so
 * `../demo.config.ts` would resolve next to the engine, find the template's
 * own stub, and film the wrong app while passing every check.
 *
 * So the path arrives in the environment, set by `scripts/demo`, and is
 * awaited at the top level — which keeps every derived constant below
 * synchronous for the dozen modules that read them.
 */
const CONFIG_PATH = process.env.DEMO_CONFIG;

if (!CONFIG_PATH) {
  throw new Error(
    'DEMO_CONFIG is unset, so there is no app to film. Start a run with ' +
      "the skill's own entry point (`scripts/demo`) rather than by calling " +
      'playwright directly.'
  );
}

const loaded = (await import(pathToFileURL(CONFIG_PATH).href)) as {
  default: DemoConfig;
};

const demo = loaded.default;

/**
 * The workspace: where this project's config, scenes and corpus live. Its own
 * directory by default (`~/.video-demo/<key>`), or wherever `--project` put
 * it, including inside the app's repo for a team that commits scenes.
 */
export const PROJECT =
  process.env.DEMO_PROJECT ?? CONFIG_PATH.replace(/\/[^/]+$/, '');

/**
 * Every number the studio is allowed to have an opinion about, in one place.
 *
 * `demo` (below) is the whole of what this file trusts about the app being
 * filmed; everything else here is either a literal from `demo.config.ts`, a
 * derivation of one, or an env override layered on top of it. A demo asset is
 * only worth automating if the same command produces the same file next
 * month, so nothing here may be read from the machine beyond that: not the
 * clock, not the zone, not the window size unless a `DEMO_*` variable asked
 * for it explicitly.
 *
 * `VIDEO_SCALE`/`STILL_SCALE` are the one pair with a real trade-off behind
 * them. The screencast encoder inside Chrome shares a thread with
 * compositing, so asking for retina frames at 60fps is asking the browser to
 * choose between painting and encoding — and it chooses painting, silently,
 * by handing back fewer frames. `recorder.ts` measures what it actually got
 * and says so, rather than letting a soft clip pass as a smooth one.
 */

export { demo };

/**
 * What `demo.mock` actually returns, inferred rather than hardcoded.
 *
 * There is no `DemoServer` type here: the server shape is whatever the app's
 * own `mock` produces, and every module that needs to type a scene's `server`
 * reads it off `demo.mock` itself instead of naming a type this file would
 * otherwise have to import from somewhere app-specific.
 */
export type ConfigServer = Awaited<ReturnType<NonNullable<typeof demo.mock>>>;

/**
 * Which of the two things a run is filming, decided once here.
 *
 * `build` compiles the app in this repo, serves the result from a private
 * copy and answers every request in-process: reproducible, private, and the
 * mode everything else in this skill is written for. `site` opens a URL that
 * is already live and films what is there: nothing to build, nothing to mock,
 * and neither of those guarantees. Exactly one, because a config that names
 * both has not decided what it is filming.
 */
const SITE_URL = demo.site?.trim();

if (SITE_URL && demo.build) {
  throw new Error(
    'demo.config.ts: name either `site` (film a live URL) or `build` ' +
      '(build and serve this repo), not both.'
  );
}

if (!SITE_URL && !demo.build) {
  throw new Error(
    'demo.config.ts: needs either `site` (film a live URL) or `build` ' +
      '(build and serve this repo).'
  );
}

if (SITE_URL && !/^https?:\/\//.test(SITE_URL)) {
  throw new Error(
    `demo.config.ts: site must be an absolute http(s) URL, got "${SITE_URL}"`
  );
}

/**
 * An origin, not a page. Playwright resolves each entry's `path` against the
 * origin of `baseURL` and drops anything after it, so a site of
 * `https://example.com/pricing` with an entry at `/` silently films the home
 * page instead — a wrong film that passes every check, which is the worst
 * kind. Refused here, where the message can say where the path belongs.
 */
if (SITE_URL) {
  const { pathname, search, hash } = new URL(SITE_URL);
  if (pathname !== '/' || search || hash) {
    throw new Error(
      `demo.config.ts: site must be an origin, got "${SITE_URL}".\n` +
        `  Use site: "${new URL(SITE_URL).origin}" and put the rest in an ` +
        `entry:\n` +
        `    entries: { app: { path: "${pathname}${search}${hash}", ready: networkIdle() } }`
    );
  }
}

/** The live URL being filmed, or null when this run builds and serves. */
export const SITE = SITE_URL ?? null;

function must<T>(value: T | undefined, field: string): T {
  if (value === undefined) {
    throw new Error(`demo.config.ts: ${field} is required`);
  }
  return value;
}

must(demo.name, 'name');
must(demo.clock?.timezone, 'clock.timezone');
must(demo.entries?.app, 'entries.app');

/**
 * What `build` mode needs and `site` mode does not. A live URL has nothing to
 * compile, nothing to serve, no network of ours to answer and no instant to
 * be pinned to, so asking for any of it would be asking for a lie.
 */
if (!SITE) {
  must(demo.build?.command, 'build.command');
  must(demo.build?.output, 'build.output');
  must(demo.clock?.anchor, 'clock.anchor');
  must(demo.mock, 'mock');
}

/**
 * The app's own root — one level above wherever `demo/` sits inside it — and
 * every filesystem path below is resolved from here, never `process.cwd()`.
 * `pnpm demo`, `pnpm --filter <app> demo` and a bare `playwright test` run
 * from inside `demo/` are all normal ways to start a run and they have three
 * different working directories between them; a path relative to whichever
 * one was typed is a path nobody can find twice.
 */
/** Where the engine itself lives, for the one place that has to spawn a sibling. */
export const ENGINE_DIR = fileURLToPath(new URL('../', import.meta.url));

/**
 * The repo being filmed, in `build` mode. `scripts/demo` reads it from the
 * workspace's `.origin`; in `site` mode there is no repo and it falls back to
 * the workspace so that nothing downstream has to special-case it.
 */
export const APP_ROOT = process.env.DEMO_APP_ROOT ?? PROJECT;

export const STAGE = {
  width: Number(process.env.DEMO_WIDTH ?? demo.stage?.width ?? 1920),
  height: Number(process.env.DEMO_HEIGHT ?? demo.stage?.height ?? 1080),
} as const;

/**
 * The video and the stills are captured at different scales, on purpose.
 *
 * These used to be one number and it forced a choice nobody should have to
 * make. Measured on this machine, same scene, same choreography: at 1080p the
 * motion runs 760 of 793 inter-frame gaps inside 34ms, and at 4K a hundred and
 * sixty of three hundred fall slower than 20fps. That is not a bug to fix, it
 * is a fixed pixels-per-second budget, and a push-in is exactly when it runs
 * out — so 4K video zooms visibly stepped.
 *
 * They can be separated because the two capture paths read different things.
 * CDP's screencast follows the *browser's* device scale factor, while
 * `page.screenshot` follows the context's own. So the browser runs at 1x for
 * smooth 60fps video and the context at 2x for retina stills, and the corpus
 * gets both instead of trading one for the other.
 */
export const VIDEO_SCALE = Number(process.env.DEMO_VIDEO_SCALE ?? 1);
export const STILL_SCALE = Number(process.env.DEMO_STILL_SCALE ?? 2);

/** The zone every seeded instant is stated in, and the page is pinned to. */
export const TZ = demo.clock?.timezone ?? 'UTC';

export const LOCALE = demo.clock?.locale ?? 'en-US';

/**
 * Whether the page's own clock is frozen.
 *
 * A fixed instant is what makes a built corpus reproducible, so `build` mode
 * requires one. A live site gets the real clock unless its config asks
 * otherwise, because freezing time under a page that fetches relative to
 * "now", or hydrates against a server that did not, breaks the page rather
 * than steadying it.
 */
export const PINNED = Boolean(demo.clock?.anchor);

/**
 * The instant the corpus is filmed at. A literal in `build` mode (see
 * `demo.config.ts`'s own `clock.anchor` comment); the real now in `site`
 * mode, where there is nothing to seed around and nothing to reproduce.
 */
export const ANCHOR = demo.clock?.anchor
  ? new Date(demo.clock.anchor)
  : new Date();

/**
 * The rate the capture can actually sustain at this resolution, not a wish.
 *
 * Screencast throughput on this hardware is roughly constant in pixels per
 * second, so the frame rate is a consequence of the frame size: measured at
 * about 84fps for 1080p, 52 for 1440p and 30 for 4K. Encoding 4K at 60 would
 * mean duplicating every second frame, which is not smoother than 30 — it is
 * 30 with a longer file and a number that flatters it. So the default follows
 * the stage, and `DEMO_FPS` overrides for anyone who has measured otherwise.
 */
export const FPS = Number(
  process.env.DEMO_FPS ?? (STAGE.width * VIDEO_SCALE >= 3840 ? 30 : 60)
);

/**
 * The capture at 1:1 rather than a downscale of it.
 *
 * A stage at `VIDEO_SCALE: 2` is a surface twice its width and height, so
 * this encodes what the compositor drew with no resampling in between. That
 * is the whole of the quality argument: any output smaller than the capture
 * is a filter, and any output larger is an invention.
 */
export const VIDEO = {
  width: STAGE.width * VIDEO_SCALE,
  height: STAGE.height * VIDEO_SCALE,
  crf: 18,
  webmCrf: 32,
} as const;

/** VP9 at 4K costs more time than it is worth unless somebody asks. */
export const WEBM = process.env.DEMO_WEBM === '1';

/**
 * Whether to stitch the tour at all. Purely a run-time choice: the tour is a
 * quarter of a gigabyte per theme at length, and a run iterating on one scene
 * does not want to rebuild it.
 */
export const TOUR = process.env.DEMO_TOUR
  ? process.env.DEMO_TOUR !== '0'
  : true;

/**
 * The editorial order, and where an unlisted scene goes.
 *
 * Returns a sort index, so a scene the config never mentions lands after every
 * scene it does. That way adding a scene is not a config edit, and a corpus
 * mid-build still tells a coherent story.
 */
export function tourIndex(scene: string): number {
  const order = demo.tour ?? [];
  const at = order.indexOf(scene);
  return at === -1 ? order.length : at;
}

/**
 * Kept as a list rather than collapsed to a constant: the manifest keys assets
 * by theme and the preview page switches on it, so a corpus that wants light
 * back is `DEMO_THEMES=light,dark` (or `themes: ['light', 'dark']` in
 * `demo.config.ts`) and nothing else has to change.
 */
export const THEMES = (
  process.env.DEMO_THEMES ?? (demo.themes ?? ['dark']).join(',')
)
  .split(',')
  .map((theme) => theme.trim())
  .filter(Boolean) as Theme[];

/**
 * Overridable so two studio runs can coexist. The default is owned by the run
 * rather than shared: see `reuseExistingServer` in `playwright.demo.ts`.
 */
export const PORT = Number(process.env.DEMO_PORT ?? 5499);

/**
 * Where the browser points. The private copy this run serves, or the live URL
 * it was told to film — in which case no server of ours is involved at all
 * and `DEMO_PORT` is moot.
 */
export const BASE_URL = SITE ?? `http://localhost:${PORT}`;

/**
 * Where the corpus lands, and where frames wait to be encoded. Both are
 * absolute, resolved from `APP_ROOT` rather than `process.cwd()` — see the
 * comment on `APP_ROOT` for why that distinction is load-bearing.
 */
export const OUT_DIR = process.env.DEMO_OUT ?? join(PROJECT, 'demo-out');

/**
 * Inside the output directory, so `DEMO_OUT` isolates a whole run.
 *
 * Frames used to live in one fixed place beside the corpus, which made them a
 * third shared resource after the port and the manifest: a run sweeping its
 * own leftovers deleted the in-flight frames of a run filming next to it, and
 * the victim reported a missing-file error that pointed nowhere near the
 * cause. One knob now moves everything a run writes.
 */
export const FRAME_DIR = join(OUT_DIR, '.frames');

/**
 * One worker at 4K, two below it.
 *
 * Screencast throughput is roughly a fixed number of pixels per second on
 * this machine, and two browsers filming 3840x2160 at once split it: each
 * clip then lands under its own frame-rate floor and the whole corpus gets
 * flagged for a reason that has nothing to do with the app. At 1080p there is
 * headroom for two, and the run is half as long. Not a `demo.config.ts`
 * field: it is a consequence of the stage, not a fact about the app.
 */
export const WORKERS = Number(
  process.env.DEMO_WORKERS ?? (STAGE.width * VIDEO_SCALE >= 3840 ? 1 : 2)
);

/** Prints every main-frame navigation and page error — see `stage.ts`. */
export const TRACE_NAV = Boolean(process.env.DEMO_TRACE_NAV);

/** Prints the gap histogram for every clip — see `recorder.ts`. */
export const TRACE_FRAMES = Boolean(process.env.DEMO_TRACE_FRAMES);

/** Off films silent rather than downloading the voice model behind anyone's back. */
export const VOICE_ENABLED = process.env.DEMO_VOICE !== '0';
