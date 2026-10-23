# Runs: the environment a recording needs

Everything in `capture.md` assumes the browser is pointed at the right
thing and nothing else is touching the files a run writes to. Both of those
turned out to need real engineering, because both failed silently: a run
that read the wrong app, or that collided with another run, does not throw.
It films 4K video of the wrong page, cleanly, and the scenes that depended on
what should have been there fail one by one, later, in a way that looks like
a broken app rather than a broken setup.

## Two modes, and only one of them has a server

`build` compiles the app here and serves a private copy; `site` opens a URL
that is already live. Everything below about pinning, serving and verifying
the bundle is the `build` mode. In `site` mode there is no build step (the
runner skips it, and `pin-build.mjs` exits saying so), no `webServer` block in
the Playwright config, and no mocks: the site is the server. The isolation
knobs still matter, except `DEMO_PORT`, which nothing is listening on.

## Film a pinned build, never a dev server

A studio does not attach to `pnpm dev` or whatever your dev server is
called. It builds the app, copies the build somewhere the rest of the repo
cannot touch, and serves that copy. This looks like extra ceremony until you
have lost a run to skipping it, and this project lost two.

The first was a sibling process editing the app's own source mid-run. A dev
server's module graph belongs to whoever is currently editing it; a save
elsewhere invalidates modules the running page had already loaded, and the
scenes that touched those modules started failing on locators that should
have existed. The second was `pnpm install` (or the equivalent for your
package manager) rewriting `node_modules` underneath the bundler while a
recording was in flight, which produces the same symptom for a different
reason: the module resolution the dev server was relying on stopped being
true out from under it. Both times, the failing scenes looked like the app
was broken. It wasn't; the ground had moved.

A build cannot be invalidated by a keystroke. It is also what actually ships,
so filming it is filming the real thing rather than a development
approximation of it. The studio's own static file server resolves paths the
way a production web server does and in the same order: a real file first,
then a directory's own `index.html` (what a prerendered route looks like on
disk), and only then the SPA shell as a last resort. Reversing the last two
would serve the client-rendered shell over a page your deployment actually
serves pre-rendered, and the corpus would be demonstrating a load behavior
nobody's users see.

## Verify the build's API base by reading the bundle, not by trusting the env

A build with the wrong API base looks completely fine. It builds without
error, the file exists, the size is reasonable, and it fails only once a
scene tries to talk to the app and the app can't reach anything it expects.

This happened for a specific, structural reason: a concurrent rebuild ran
without the same-origin API environment variable set, so it baked a real
external API host into the bundle instead of a same-origin `/api` path.
Every request the app made then went cross-origin, hit CORS, and the app did
exactly the right thing with no reachable backend, which was to render its
own signed-out home page. Fifty-four scenes failed in a row, each one
timing out waiting for calendar UI that was never going to appear, and
nothing in any individual failure pointed at a build config problem twenty
steps upstream. Debugging it meant working backward from "the app is stuck
on its login screen" through the network log to "these requests aren't even
same-origin" before the actual cause showed up.

The fix that holds is to check the built assets, not the environment used to
build them: after building, grep the emitted JS for the real external host
your app should never be calling from a demo build. If it's in there, the
build is wrong regardless of what you intended to set, and the pipeline
should refuse to serve it and say why, in one message, rather than let it
surface as a wall of unrelated scene failures. That is the whole job of the
pin-and-verify step between "build" and "serve": build fresh, copy the
output somewhere private, scan it for whatever patterns would mean "this
build can see the real world," and stop before filming a single frame if one
matches.

## Two isolation knobs: a port and an output directory

Running two studio instances at once, deliberately or by accident (a CI job
and a local iteration, two people on the same machine), needs exactly two
things to not interfere with each other: a port and an output directory.
Without them, four distinct kinds of collision happened, each with a
different symptom:

- **Port.** Two runs both default to the same port. The first one to bind
  wins; the second either fails outright or, worse, silently talks to the
  first run's server. Set an explicit, different port per run, and configure
  the runner to refuse to reuse a server it did not start itself, since an
  inherited server is one the run cannot vouch for.
- **Manifest.** Two runs both write `manifest.json` in the same place. Last
  writer wins, and whichever run finishes second erases what the first one
  filmed.
- **Stills.** Two runs both write screenshots into the same theme
  directories. Filenames collide; one run's still silently becomes the
  other's.
- **Frames.** Two runs both stage in-flight JPEG frames in one shared
  location, and a run cleaning up its own scratch space on exit deletes
  frames a still-running sibling hasn't encoded yet. The victim then fails
  on a missing file with an error that points nowhere near the real cause.

One environment variable for the port and one for the output directory fix
all four, because frames, stills, and the manifest all live inside the
output directory: moving that one path moves everything a run writes.
Running two corpora side by side is then just two different values for two
variables.

The corollary: if a port is already in use, take a different one. Killing
whatever is bound to it by matching a process name or pattern is how one run
ended another mid-flight, taking a browser down mid-scene rather than
leaving it to finish. `pkill`-by-pattern has no way to know that the process
matching its pattern is someone else's in-progress recording.

## Manifest merging, and why "only mine" needs a place to live

`--grep some-scene` is the ordinary way to iterate on one scene without
re-filming the whole corpus. For that to be useful rather than destructive,
the step that writes the manifest at the end of a run has to **merge** its
freshly filmed scenes into whatever manifest is already on disk, keyed by
scene name and, within a scene, by theme independently: a re-film of the
light pass must not evict the dark pass sitting next to it. Overwrite
instead of merge, and a one-scene debugging run silently replaces a
27-scene corpus with a 1-scene one; the manifest file looks completely
valid and is wrong.

Merging safely needs each run to know which entries are its own, and this
took two attempts to get right. The first version had every run write into
one shared entries directory and sweep the whole thing clean once it
finished, which meant a run that finished while a sibling was still filming
deleted that sibling's in-flight results. The second version tried to sweep
"only its own" entries, but decided which ones were its own by reading the
shared directory and guessing, which is the identical bug with a different
face: you cannot tell your own work apart from someone else's by inspecting
a place you both write to.

The fix is a run identity minted once, before any scene runs, in the test
runner's global setup phase (which executes once in the parent process
before any worker is forked), and passed down to every worker through the
environment they inherit from it. Each run then files its per-scene results
under a subdirectory named for its own id, nobody else's, so "which entries
are mine" is answered by which directory you were handed rather than by
reading the room. A worker that somehow starts without an id mints its own
rather than colliding with another run's id: the resulting manifest comes up
short, which is loud and immediately visible, and far better than two runs
quietly deleting entries out of each other's output.

## The manifest is the interface; nothing else is

Once a run finishes, the only file a consuming website (or anything else)
should ever read is `manifest.json`. It lists every scene, its title and
blurb, and per theme the stills, the clip, a poster frame, the measured
frame rate, and how much narration is spoken over it: everything a page
needs to swap a screenshot for a video on hover, or light for dark on a
theme toggle, without knowing anything about screencasts, ffmpeg, or how any
of this was produced.

The way to keep that contract honest is to build a page that proves it: a
preview page generated from the manifest alone, with no special knowledge of
the pipeline behind it. If the preview page can do the two things a real
product page needs (swap still for video, swap theme) using nothing but the
JSON, then any website can. If the preview page is missing something it
needs, that gap shows up immediately, in a file this project owns, rather
than three weeks later in someone else's.

## Nothing real behind the browser

The studio answers every request the app makes from inside the test
process: a mocked API layer intercepts network calls, the system clock is
pinned to a fixed instant rather than read from the machine, and all data
comes from a checked-in seed rather than a live account. This is not only
about determinism, though a corpus that changes shape every time it's
re-filmed is its own kind of bug. It is about what a corpus is: something
that gets published. A demo filmed against a real account bakes real
meetings, real names, and real addresses into an asset that ships to a
website, and the fact that it looked convincing while filming is exactly
the problem.

Mocking has to model writes, not just answer reads. A scene doesn't end the
moment it sends a request: the panel it just edited reads its own change
back, a list rehydrates by id, a sweep re-fetches what it thinks changed. A
mock that answers every write with a bare "ok" and every subsequent read
with the original, unmodified data shows the viewer's own change being
quietly undone on camera, which is a worse failure than an outright error
because it plays back looking like a real bug in the app.

## One entry point, because a shell `&&` cannot read its own arguments

`scripts/demo` is the only command, and it is a script rather than the two
commands it runs.

The obvious spelling is `"demo": "node demo/pin-build.mjs && playwright test
--config=demo/playwright.demo.ts"`, and it quietly breaks the first command
anybody types: a separator reaches Playwright's CLI, which reads everything
after it as positional file filters rather than as options, and does not
complain. Every scene films. That is ten minutes and a gigabyte in place of
the four-second check that was asked for, and the only evidence is a test
count on a line nobody rereads.

`engine/run.mjs`, which it execs, is handed the arguments as an array, so it
can drop any separator a package manager leaves behind and pass the rest
through untouched. It also owns the two steps of a run, which is where
`DEMO_BUILD=0` lives: skipping the rebuild is the difference between a
twenty-second iteration and a four-minute one while writing a scene, and the
default is still to build, because a corpus of the code in the tree is the
point.

It is also the only thing that knows where a workspace is. Every workspace
records the repo it belongs to in `.origin`, so running `scripts/demo` from
anywhere inside that repo finds it again with no flag, and `--project` names
one explicitly.

## Environment variable reference

Everything the studio reads from the environment, grouped by what it
touches, with the default it falls back to when unset.

**Stage and encode**

| variable | default | controls |
| --- | --- | --- |
| `DEMO_WIDTH` | `1920` | stage CSS width |
| `DEMO_HEIGHT` | `1080` | stage CSS height |
| `DEMO_VIDEO_SCALE` | `1` | browser's real device scale factor; drives the screencast |
| `DEMO_STILL_SCALE` | `2` | Playwright context `deviceScaleFactor`; drives `page.screenshot` |
| `DEMO_FPS` | `60` below 4K, `30` at or above `3840` wide | encode frame rate |
| `DEMO_FPS_FLOOR` | `DEMO_FPS * 0.75` | measured rate below which a clip is flagged as judder-prone |
| `DEMO_MOTION_FLOOR` | `1` | seconds of animation a clip needs before its rate is judged at all |
| `DEMO_SLOW_SHARE` | `0.25` | share of motion gaps slower than 50ms that `scripts/gaps.mjs` fails on |
| `DEMO_FRAME_QUALITY` | `80` | JPEG quality the screencast asks Chrome to encode at |
| `DEMO_ENCODER` | hardware (`h264_videotoolbox`) | set to `x264` for software `libx264 -crf` |
| `DEMO_BITRATE` | `36M` | hardware encoder target bitrate |
| `DEMO_WEBM` | off | also encode a VP9 `.webm` alongside the `.mp4` |
| `DEMO_WORKERS` | `1` at or above 4K, else `2` | parallel browser workers |
| `DEMO_TRACE_FRAMES` | off | print the inter-frame gap histogram per clip |
| `DEMO_TRACE_NAV` | off | print every main-frame navigation and page error per scene |

**Voice-over**

| variable | default | controls |
| --- | --- | --- |
| `DEMO_VOICE` | on | set to `0` to film silent |
| `DEMO_VOICE_NAME` | `af_heart` | Kokoro voice |
| `DEMO_VOICE_LANG` | `en-us` | phonemiser language |
| `DEMO_VOICE_SPEED` | `1` | speech rate |
| `DEMO_VOICE_SENTENCE_PAUSE` | `0.14` | seconds of pause between sentences |
| `DEMO_VOICE_CLAUSE_PAUSE` | `0.06` | seconds of pause between clauses |
| `DEMO_VOICE_RMS` | `0.12` | target loudness each line is normalized to |
| `DEMO_VOICE_HOME` | `~/.cache/demo-voice` | where the model and cached lines live; one directory for every demo on the machine |

**Run and corpus**

| variable | default | controls |
| --- | --- | --- |
| `DEMO_BUILD` | on | set to `0` to film the build already pinned instead of making a new one |
| `DEMO_PORT` | `5499` | the static server's port; give a second run its own |
| `DEMO_OUT` | `<repo>/demo-out` | the whole output directory: manifest, stills, clips, in-flight frames |
| `DEMO_THEMES` | `dark` | comma-separated list, e.g. `light,dark` |
| `DEMO_TOUR` | on | set to `0` to skip stitching the end-to-end tour per theme |
| `DEMO_RUN_ID` | minted per run | internal: do not set by hand, it identifies which entries belong to which concurrent run |

None of these should be read from the machine for anything that affects
what gets filmed (the clock, the timezone, the window size are all pinned
explicitly rather than defaulted from the host). The whole point of a demo
pipeline is that the same command produces the same file next month, on a
different laptop.
