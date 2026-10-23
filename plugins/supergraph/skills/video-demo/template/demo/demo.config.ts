import { defineDemo } from 'video-demo/define';
import { all, attribute, visible } from 'video-demo/ready';

/**
 * The one file that knows this app exists.
 *
 * Everything under `studio/` reads `demo` (this file's default export,
 * resolved with its defaults in `studio/config.ts`) and imports nothing of
 * yours directly. Get every required field right and the engine has no more
 * questions about your app; get one wrong and the failure usually shows up
 * two steps later, looking like a broken scene rather than a bad config.
 *
 * This file is loaded straight into Node under type stripping, not compiled
 * first — so it (and anything it imports for the config itself) cannot use
 * `enum`, a `namespace`/`module` block holding values, or a parameter
 * property (`constructor(private x: number)`). Plain object literals, arrow
 * functions, `as` casts and type-only imports are always safe.
 */
export default defineDemo({
  // TODO: your app's own name. Shows up in the manifest and in the run's own
  // output, and is how a corpus says which app it is of.
  name: 'TODO',

  // Filming a URL that is already live instead? Replace this whole `build`
  // block with one line — `site: 'https://example.com'` — and then delete
  // `mock` and `clock.anchor` below, along with `mock.ts` itself. See
  // references/config.md. Everything else in this file stays as it is.
  build: {
    // TODO: whatever your repo already runs for a production build — copy it
    // out of package.json rather than paraphrasing it. In a workspace with
    // more than one app, name yours: 'pnpm --filter your-app build', not
    // 'pnpm build'.
    command: 'TODO: pnpm build',
    // TODO: the directory the build writes into, relative to this app's own
    // root (one level up from wherever this demo/ folder sits in it). Usually
    // 'build/client' for a Vite/React-Router SPA, 'dist' for a plain Vite app
    // — run the build once by hand and see where it lands.
    output: 'TODO: build/client',
    // TODO: strings or RegExps that must never appear in the built bundle —
    // your production API's real hostname, above all. Find it by grepping
    // the built output for it once, by hand, to confirm it isn't already
    // there.
    forbid: [
      // 'api.your-app.com',
      // /https?:\/\/localhost:3000/,
    ],
  },

  // Leave this alone unless your layout genuinely breaks below 1920 wide.
  // Changing it moves where every locator's bounding box lands.
  stage: { width: 1920, height: 1080 },

  clock: {
    // TODO: an ISO datetime, in UTC. Pick a weekday with history behind it
    // and days still ahead in your seeded data — a Wednesday if you're
    // seeding a week. Never the start of an empty week; that reads as an
    // unused account rather than a lived-in one.
    anchor: 'TODO: 2026-09-16T09:00:00.000Z',
    // TODO: the IANA zone your seeded data is written in, e.g. 'Europe/London'.
    timezone: 'TODO',
    locale: 'en-US',
  },

  // Each scene films once per theme, so start with the one you actually
  // ship and widen it only once scenes are stable.
  themes: ['dark'],

  // TODO: every localStorage entry your app's own boot script reads
  // synchronously, before the framework mounts — so a themed scene never
  // opens on one frame of the wrong theme. Values are written exactly as
  // given, so serialize your own shape yourself. Find the key by reading
  // that boot script. Delete this field entirely if your app has no such
  // synchronous read.
  // `overrides` is whatever a scene passed as its own `preferences`, in your
  // app's shape. Spread it wherever that shape puts it, so a scene can start
  // somewhere other than the defaults without knowing how you serialize them.
  storage: (theme, overrides) => ({
    // 'your-app:preferences': JSON.stringify({ theme, ...overrides }),
  }),

  entries: {
    // Required, and conventionally the signed-in shell.
    app: {
      // TODO: where the app boots for a signed-in viewer.
      path: '/',
      // TODO: replace with real readiness checks — see studio/ready.ts.
      // "Visible" alone is rarely enough: prefer an attribute the app sets
      // itself once its data has actually landed.
      ready: all(
        visible('TODO: some-test-id'),
        attribute('TODO: some-test-id', 'data-loaded', 'true')
      ),
    },
    // TODO: one more entry per surface a scene opens that isn't `app` — a
    // credential-free public page is just another entry, not a special case:
    //
    // public: {
    //   path: '/some/public/route',
    //   signedIn: false,
    //   ready: networkIdle(),
    // },
  },

  /**
   * Implement it in `mock.ts` — every `page.route` handler your app needs.
   *
   * Reached through a dynamic import rather than a static one, and that is
   * load-bearing. This file is also read by plain Node, because
   * `pin-build.mjs` needs `build` before there is a browser to speak of, and
   * plain Node's resolver has none of the test runner's tolerance for an
   * extensionless import specifier. A static import here would pull your
   * mock's whole graph — its seed modules, and through them whatever app or
   * test-support code they reach — into that resolver, and pinning the build
   * would die on a module path that has nothing to do with building. Deferred,
   * only the runner ever evaluates it, so `mock.ts` may import anything
   * Playwright can load.
   */
  mock: (page, ctx) => import('./mock.ts').then((made) => made.mock(page, ctx)),

  // Optional. Uncomment once a line is actually mispronounced; never
  // speculatively.
  // voice: { name: 'af_heart', speed: 1, saidAs: [[/\bTODO\b/gi, 'TODO']] },

  // Optional. The order scenes appear in the manifest and in the stitched
  // tour. Editorial: left out, scenes sort by name, and a tour that opens on
  // whatever happens to start with 'a' shows the roof before the walls. A
  // scene not listed here falls to the end, so adding one costs nothing.
  // Whether to build the tour file at all is DEMO_TOUR=0, not this.
  // TODO: list your scenes in the order a newcomer should meet them.
  tour: ['smoke'],
});
