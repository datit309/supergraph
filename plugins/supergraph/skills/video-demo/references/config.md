# The config seam

`demo/demo.config.ts` is the one file that knows your app exists. Everything
under `studio/` is app-agnostic; it reads `defineDemo()`'s return value and
never imports anything of yours directly. Get this file right and the engine
has no more questions. Get one field wrong and the failure shows up two steps
later, looking like a broken scene rather than a bad config.

This is the config the reference demo films from, trimmed:

```ts
import { defineDemo } from './studio/define.ts';
import { all, attribute, networkIdle, tallerThan, visible } from './studio/ready.ts';

export default defineDemo({
  name: 'calendar',
  build: {
    command: 'VITE_API_URL=/api pnpm run build',
    output: 'build/client',
    forbid: [/https?:\/\/localhost:8585/, 'api.example.com'],
  },
  stage: { width: 1920, height: 1080 },
  clock: {
    anchor: '2026-09-16T09:00:00.000Z',
    timezone: 'Europe/London',
    locale: 'en-US',
  },
  themes: ['dark'],
  storage: (theme, overrides) => ({
    'calendar:preferences': JSON.stringify({
      theme,
      weekStartsOn: 1,
      hourCycle: '12',
      accountMenuSeen: true,
      ...overrides,
    }),
  }),
  entries: {
    app: {
      path: '/',
      ready: all(
        visible('time-grid'),
        attribute('time-grid', 'data-loaded', 'true'),
        attribute('calendars-button', 'data-loaded', 'true'),
        tallerThan('time-grid', 900)
      ),
    },
    public: {
      path: '/@pat',
      signedIn: false,
      ready: networkIdle(),
    },
  },
  mock: (page, ctx) => import('./mock.ts').then((made) => made.mock(page, ctx)),
  voice: { name: 'af_heart', speed: 1, saidAs: [[/\blive\b/gi, 'liv']] },
  tour: ['week', 'views', 'create', 'editor', 'tasks', 'assistant'],
});
```

Every field below, in the order a first pass through discovery finds them.

## `name` — required, `string`

Names the corpus, and shows up in the manifest and any per-run temp paths
the engine mints. Pick the app's own name; there's no default because
there's no safe guess.

## `site` — a URL, instead of `build`

One of `site` and `build` is required, and naming both is an error: a config
that does not know whether it is filming this repo or a live address has not
decided what it is.

```ts
site: 'https://time.fyi',
clock: { timezone: 'Europe/London' },
```

An absolute http(s) URL. With it, three of the otherwise-required fields go
away: `build` (nothing to compile), `mock` (the site answers for itself, and
`mock.ts` need not exist), and `clock.anchor` (the page keeps the real clock,
because freezing time under a page that fetches relative to "now" or hydrates
against a server that did not breaks it rather than steadying it). `timezone`
and `locale` still apply, since those are the browser's, not the page's.

Scene `path`s resolve against it, so `path: '/'` and `path: '/timezones'` mean
what they look like. No server of ours is started and `DEMO_PORT` is moot.

What you give up is precisely what the build mode was for. The film is of
whatever was served that minute, so the corpus is not reproducible and a
scene pointing at a word somebody rewrites fails on the next run. And nothing
intercepts the network, so whatever the page shows its visitor is filmed,
including real data if the browser is signed in. Public pages, or a staging
URL with invented data behind it.

## `build` — required unless `site` is set

The corpus has to be reproducible, and a dev server's module graph belongs to
whoever is editing source — a keystroke in another terminal invalidates the
very pages a run is filming. So the engine always builds first and serves the
output as static files, never a dev server.

- `command: string` — required. Whatever your repo already runs to produce a
  production build, copied out of `package.json` rather than paraphrased —
  `pnpm --filter @calendar/web build`, not `pnpm build`, in a workspace with
  more than one app.
- `output: string` — required. The directory the build writes into, relative
  to `demo.config.ts` itself. Usually `build/client` for a Vite/React-Router
  SPA, `dist` for a plain Vite app.
- `forbid?: (string | RegExp)[]` — strings or patterns that must not appear in the built
  output. This exists because of a real failure: a build picked up a sibling
  `.env` with a real API host baked into it, every request went cross-origin,
  CORS blocked all of them, and the app sat on its login screen through 54
  scenes before anyone noticed the *bundle*, not the scenes, was the problem.
  Put your production API's hostname here, never `localhost`, and the engine
  greps the built output for it before filming anything. Confirm it actually
  isn't there once, by hand, before trusting `forbid` to keep catching it.

## `stage` — optional, defaults to `{ width: 1920, height: 1080 }`

The CSS viewport a scene is filmed at, not the output resolution — video is
encoded at this size times `DEMO_VIDEO_SCALE` (1x by default, for frame-rate
headroom), stills at `DEMO_STILL_SCALE` (2x, for retina). Leave it alone
unless the app's layout genuinely breaks below 1920 wide; every locator's
bounding box moves with it.

## `clock` — required, `anchor` only in `build` mode

A demo asset is only worth automating if the same command produces the same
file next month, so every field here is a literal, never read from the
machine: not `Date.now()`, not the runner's local zone, not `Intl`'s default
locale.

- `anchor: string` — an ISO datetime, in UTC. Pick a weekday with room either
  side of it in your seeded data — a Wednesday if you're seeding a week, so
  there's history to scroll back into and days still ahead. A corpus anchored
  at the start of an empty week looks unfinished rather than lived-in.
- `timezone: string` — an IANA zone, e.g. `Europe/London`. What the page is
  pinned to, independent of the machine actually filming it. Match whichever
  zone your seeded data is written in.
- `locale: string` — e.g. `en-US`. Everything that goes through `Intl` — date
  headings, number formatting — reads through this. A machine defaulting to
  `en-GB` renders "16 Sep" where a scene assumes "Sep 16"; pin it so the
  corpus doesn't quietly change with whoever's laptop runs it.

## `themes` — optional, defaults to `['dark']`

Which color schemes to film; each scene runs once per theme, so `['light',
'dark']` doubles every run from here on. Start with the one you're actually
shipping and widen once scenes are stable.

## `storage(theme, overrides)` — optional

A function from the theme being filmed to the `localStorage` entries the app
needs seeded before its first paint — `Record<string, string>`, already
serialized. The engine writes each value as given; it does not
`JSON.stringify` for you, because it doesn't know your key's shape.

`overrides` is whatever a scene passed as its own `preferences`, and this
function is the only place it can be applied, because only your app knows
that "start this scene in another time zone" means one field inside a JSON
blob under one key rather than a `localStorage` entry of its own. Spread it
where that shape puts it — `...overrides` above — or a scene asking to start
somewhere other than the defaults gets a stray entry nothing reads, boots on
the defaults anyway, and fails several steps later looking for a dialog that
had no reason to open. An app with no `storage` at all makes a scene's
`preferences` an error rather than a silent no-op.

Most apps read a theme preference from `localStorage` synchronously in a
boot script, before the framework mounts, specifically so a dark-theme user
never sees one white frame. That means the *engine* has to seed the same key
before the page's very first script runs — an `addInitScript`, not a
post-load `page.evaluate` — or every themed scene opens on a flash of the
wrong theme, which a recorder catches on every run. Find the key by reading
your app's own theme-boot script (here, `app/root.tsx`'s inline script and
the `calendar:preferences` key it reads). Omit `storage` only if your app has
no such synchronous read — most do.

## `entries` — required, `Record<string, Entry>`

The named pages a demo needs to open, each with its own idea of "loaded".
`app` is required and is conventionally the signed-in shell; add more named
entries for every other surface a scene touches.

```ts
type Entry = {
  path: string;
  ready: Ready;       // from ready.ts — see below
  signedIn?: boolean; // default true
};
```

**"Visible" is never enough on its own**, which is why `ready` is a
composable predicate rather than a single `waitForSelector`. Two failures
hide behind "the element is on screen": *data still in flight* (the shell
painted, the week's events are still an in-flight fetch, and a scene
reaching for a chip races the read and fails roughly a third of the time —
too rarely to catch in one run, often enough to be a flake) and *geometry
that hasn't settled* (anything sized by a `ResizeObserver` reports a height
of zero, or mid-transition, for a frame or two after mounting, so a scene
measuring a slot in that window aims at the wrong pixel).

`ready.ts` gives you predicates to compose with `all(...)`:

| predicate | for |
| --- | --- |
| `visible(testId)` | on screen — the floor, rarely enough alone |
| `attribute(testId, name, value)` | the app telling you directly (`data-loaded="true"`) — prefer this over guessing |
| `tallerThan(testId, px)` / `widerThan(testId, px)` | geometry that settles a `ResizeObserver` tick late |
| `text(testId, pattern)` | content that only exists once a fetch lands |
| `networkIdle()` | last resort — see below |

If your app has no `data-loaded`-style attribute, add one — cheaper and more
honest than a suite of timing heuristics, usually a one-line change to the
component that already knows when its data arrived. `networkIdle()` is for
an entry with no app shell to interrogate at all; avoid it on the signed-in
app, where it's slower and goes quiet (falsely reporting "ready") during a
long poll or an open stream.

**A public page is not a special case, it's just another entry**: `path` set
to its own route, `signedIn: false`, and a `ready` built from whatever it
actually renders — usually `networkIdle()`, since a guest booking page has
no grid and no attribute to poll. Nothing in the engine branches on
"public"; it only ever asks an entry for its own `ready`.

## `mock(page, ctx)` — required in `build` mode, unused in `site` mode

Where every `page.route` handler your app needs gets registered — see
[mocking.md](mocking.md) for the how and why; this is just the signature.

**Reach it with a dynamic import inside the arrow**, as the example above
does, not a static `import { mock } from './mock.ts'` at the top of the file.
This config is read by plain Node as well as by the test runner — pinning the
build needs `build` before a browser exists — and plain Node's resolver has
none of the runner's tolerance for an extensionless specifier. A static import
pulls your mock's whole graph (its seed modules, and through them whatever app
or test-support code they reach) into that resolver, and the run dies before
it films anything with an `ERR_MODULE_NOT_FOUND` naming a module that has
nothing to do with building. Deferred, only the runner ever evaluates
`mock.ts`, which may then import anything Playwright can load.
`ctx` carries what a handler needs to answer consistently: `reference: Date`
(the resolved `clock.anchor`), `entry: string` (which `entries[]` key is
being opened), `signedIn: boolean` (that entry's `signedIn`, resolved).
There's no default, because there's no safe one — an app with no mock hits a
real network from a filmed browser, the one thing this engine exists to
prevent.

## `voice` — optional

`{ name?: string; speed?: number; saidAs?: [RegExp, string][] }`, defaulting
to `{ name: 'af_heart', speed: 1, saidAs: [] }`. Sets the corpus's committed
defaults; `DEMO_VOICE_NAME` / `DEMO_VOICE_SPEED` still override at film time
for a quick audition without editing the config. `saidAs` is your app's own
heteronym table (see [narration.md](narration.md)) — start it empty and add
an entry only once a line is actually mispronounced, never speculatively.

## `tour` — optional, defaults to scene-name order

The order scenes appear in, both in the manifest and in the stitched
`full-tour.mp4`. A list of scene names:

```ts
tour: ['week', 'views', 'create', 'editor', 'tasks', 'assistant'],
```

This is editorial, which is why it lives in the config rather than being
derived from anything. Left out, scenes sort by name, and a tour that opens on
whichever scene happens to start with "a" shows somebody the roof before the
walls. A scene missing from the list falls to the end, so adding one costs
nothing and a corpus half-built still tells a coherent story.

Whether to build the tour file **at all** is a different question and not a
config one: `DEMO_TOUR=0`. The tour is real disk space at length, roughly
500MB per theme for a 27-scene corpus, so a run iterating on a single scene
turns it off. That is a property of the run, not of the demo.

## Two things about how this file is loaded

**It's loaded straight into Node under type stripping, not compiled by a
bundler.** That erases *type annotations* only — it doesn't transform syntax
with runtime meaning beyond its type. So this file (and anything it imports
for the config) cannot use `enum` (compiles to a runtime object),
`namespace`/`module` blocks holding values, or parameter properties
(`constructor(private x: number)`, since the parameter has to become an
assignment, which is code generation, not erasure). Plain object literals,
arrow functions, `as` casts, and type-only imports are always safe — a
cryptic syntax error on ordinary-looking TypeScript is usually one of these
three.

**Every filesystem path resolves from the app root, never `process.cwd()`.**
The app root is the repo being filmed. It reaches the engine as
`DEMO_APP_ROOT`, set by `scripts/demo` from the `appRoot` your workspace
recorded in `.origin` when it was scaffolded, rather than from where the
command was typed. `scripts/demo`,
`pnpm --filter <pkg> demo`, and a bare `playwright test` from inside `demo/`
are all normal ways to start a run, with three different working directories
between them, and a `cwd`-relative `build.output` would land somewhere
different depending on which one was used.

So `build.output` is relative to the app root: `build/client`, `dist`, `.next`
— whatever the app's own build writes, spelled the way the app spells it.
