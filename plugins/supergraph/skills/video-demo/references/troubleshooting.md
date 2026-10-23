# Troubleshooting, by symptom

Everything here presents as something other than what it is: a positioning
bug that reads as a cursor teleporting, a scheduling bug that reads as a
mispronunciation, an isolation bug that reads as a corrupted manifest. Find
the symptom, read the cause, apply the fix. Cross-references point at
`capture.md` and `runs.md` for the fuller explanation where one exists.

### The cursor jumps toward a corner when it clicks

**Cause.** The cursor overlay is positioned with `transform:
translate3d(x, y, 0)` on an element that also animates `scale` (for the
press-down effect). CSS composites these as
`T(origin) · translate · rotate · scale · transform · T(-origin)`, and a
`transform`-based translation is applied *inside* the scale, so it gets
scaled too. The farther the cursor is from the transform origin, the bigger
the jump: fifty pixels near one edge of the screen, several hundred near
the other, in exact proportion to distance.

**Fix.** Position the cursor with the CSS `translate` property, not
`transform: translate3d(...)`. `translate` composites *before* `scale`, so
the cursor lands at `origin + (x, y)` regardless of the current scale. Set
`transform-origin` to the cursor's own hotspot and it shrinks around a fixed
point instead of sliding toward one.

### The cursor points slightly off from where it actually clicks

**Cause.** The visual tip of an arrow-shaped cursor asset usually isn't at
`(0, 0)` of its bounding box.

**Fix.** Set `transform-origin` to the pixel that is the arrow's actual tip,
and offset the element with a matching negative margin so that point, not
the box's corner, is what gets placed at the click coordinate.

### The demo zooms in and out constantly, even for beats that don't need it

**Cause.** The zoom is implemented by scaling *about the subject*, meaning
`transform-origin` moves every time the subject does. Moving the origin
while a transform is live makes the page visibly jump, so every camera
move has to return to 1x first before it can go anywhere else. That return
is the fidgeting a viewer notices as constant zooming.

**Fix.** Fix the transform origin at `0 0` permanently and express every
framing as a `translate + scale` pair computed from that fixed point. Any
two views can then glide directly into each other with no return to 1x in
between. See `capture.md`'s zoom notes for the coordinate math this enables.

### A zoom crops part of what it's meant to show

**Cause.** The scale chosen doesn't match how much of the frame the subject
actually needs, or the translation was clamped to keep the scaled page
covering the viewport and that clamp pulled the framing away from where you
aimed.

**Fix.** Scale to the subject's size, not a flat number: roughly 1.4 for a
panel, 1.7 for a row, 2 for a single control. If the subject sits near an
edge, expect the clamp to hold the frame slightly off-center rather than
opening dead space beside it. That's the clamp working, not a bug, but it
means very edge-hugging subjects need a smaller scale to stay fully framed.

### A zoom frames empty space next to the thing it's about

**Cause.** The push-in targeted a container's bounding box, not its
content. A full-height flex panel with four rows near the top has its
geometric center well below the rows, so aiming at that center frames half
rows and half nothing.

**Fix.** Target the content element (the rows, the specific control), not
its outer layout container.

### Clicks land where the target used to be, not where it is now

**Cause.** The pointer measured the target's position, spent several
hundred milliseconds traveling there, and pressed at the coordinate it
measured at the start of the trip. Anything that moved in the meantime (a
list re-rendering, a panel settling, a still-easing push-in) leaves the
press aimed at empty space.

**Fix.** Re-measure the target's position on arrival, immediately before
pressing, and correct the pointer if it's moved more than a couple of
pixels. Cheap, and it removes the entire class of "the click silently did
nothing" failures.

### A drag reads back as a click

**Cause.** The app's drag threshold is evaluated in the app's own,
unscaled pixels. If the camera is zoomed in (say 1.7x) when the drag
starts, a 6px on-screen nudge is only 3.5 real app pixels, which can sit
under the threshold that arms a drag, so the gesture never leaves "click"
territory as far as the app is concerned.

**Fix.** Zoom back out to 1x before any drag or scroll gesture starts, and
don't zoom back in until it's released. This can and should happen inside
the drag/scroll helper itself, so a scene never has to remember it.

### The video looks soft even though the capture is configured for retina

**Cause.** `deviceScaleFactor` on the Playwright context only affects
`page.screenshot`. CDP's live screencast ignores it completely and follows
the browser's own launch-time scale factor instead. Setting the context to
`2` and leaving the browser at its default gets you retina stills and a
video captured at 1x that was then upscaled somewhere downstream. See
`capture.md`.

**Fix.** Launch the browser with `--force-device-scale-factor` set to
whatever the video should actually be captured at (usually `1`, since video
resolution and frame rate trade against each other, per the throughput
table in `capture.md`). Set the context `deviceScaleFactor` separately for
stills. They are two different settings serving two different capture
paths.

### Zooms judder specifically, even though ordinary motion looks fine

**Cause.** Screencast throughput is a roughly fixed pixels-per-second
budget (see `capture.md`). A live-scaling transform is one of the most
expensive things you can ask the compositor to paint every frame: it means
re-rasterizing text at a new size, not just re-blitting a bitmap, so a
push-in is exactly the moment the capture is most likely to fall behind
the resolution's sustainable rate.

**Fix.** Film zooms at a resolution the hardware can actually sustain
smoothly (1080p rather than 4K, per the measured table in `capture.md`), or
promote the zooming element to its own compositor layer for the duration of
the transition with `will-change: transform`, dropped again on
`transitionend` so held frames aren't left showing an upscaled texture
instead of freshly rasterized type.

### The frame-rate number reads fine, but the motion is visibly stepped

**Cause.** A mean frame rate computed across the whole clip, or even
across only the "moving" portion using a coarse motion/stillness split,
averages away a stutter: half the clip running at a healthy rate and half
running at ten frames a second can average out to a number that looks
acceptable while a viewer can plainly see the stutter.

**Fix.** Look at the histogram of inter-frame gaps during motion, not the
mean (`DEMO_TRACE_FRAMES=1`; see `capture.md` for a worked example with
real numbers). A bimodal distribution, a cluster of fast gaps and a
separate cluster of slow ones, is jank that a single average will always
hide.

### The app renders its login page, or a blank shell, instead of what the scene expects

**Cause.** The build being served has the wrong API base baked into it,
usually because it was built without the same-origin API environment
variable set, or because a concurrent rebuild elsewhere in the repo
clobbered the pinned build with one that has the real external host in it.
Every request then goes cross-origin, gets blocked, and the app correctly
renders its signed-out state, which looks exactly like "the demo is
broken" rather than "the build is wrong." See `runs.md`.

**Fix.** Grep the built JS for the real external host before serving it,
and refuse to serve a build that contains it. Rebuild with the same-origin
API base explicitly set.

### Scenes fail immediately with `ERR_CONNECTION_REFUSED`

**Cause.** Two studio runs are sharing a port. The second run's static
server either failed to bind because the first one already holds the port,
or, if something forcibly killed whatever was on the port to "free" it,
the first run's server is now gone mid-flight too.

**Fix.** Give each concurrent run its own `DEMO_PORT` (and `DEMO_OUT`; see
`runs.md`). Never free a busy port by killing whatever's on it; take the
next one instead.

### The camera pulls out and pushes straight back in to the same place

**Cause.** Each beat is paying for its own exit. A scene ends a beat with
`unfocus`, or a `spotlight` without `stay: true`, the camera pulls all the way
out, and the next beat immediately pushes back in to within a few pixels of
where it was. On film it reads as a camera that cannot make up its mind, and
it is the flaw viewers name first. The scene cannot avoid it by itself: at the
moment it finishes a beat it has no idea where the next one looks.

**Fix.** Defer the release rather than performing it. `unfocus` records that
the scene is done with its subject; the engine pays at the first moment
something genuinely needs the view wide (a still, a plain `say`, a gesture, a
pointer reaching outside the current framing, the end of the scene), and
cancels it outright if the next call is another `focus`, which then glides
from one framing to the next in one movement. Two things have to be true for
this to be safe, and both are in `actor.ts`: a gesture must force the release
whether or not one was asked for, because a drag measures in the app's own
pixels; and `where` must force it when the target sits outside the viewport,
because at 2x most of the app does, and aiming at a coordinate out there
misses.

### `--grep` films the whole corpus instead of the one scene

**Cause.** Something forwarded the arguments through a shell `&&` chain. A
separator reaches Playwright's own CLI, which reads everything after it as
positional file filters rather than as options. It does not warn. It films
every scene, ten minutes and a gigabyte in place of a four-second check, and
the only evidence is a test count on a line nobody rereads.

**Fix.** Use `scripts/demo`, which execs `engine/run.mjs` with the arguments
as an array, drops any separator a package manager leaves behind, and passes
the rest to Playwright untouched. A shell `&&` cannot do this: it has no way
to look at what it is forwarding.

### The run dies with `ERR_MODULE_NOT_FOUND` before it films anything

**Cause.** `demo.config.ts` imports `mock.ts` statically, and something in
the mock's import graph uses an extensionless specifier — an app package, or
a test-support module that imports one. The config is read by plain Node
before any browser exists, because pinning the build needs `build.command`,
and plain Node's ESM resolver will not guess at a missing extension the way
the test runner's loader does. The message names a module in the middle of
that graph, so it reads as a broken dependency rather than a config that is
loaded twice in two different ways.

**Fix.** Reference the mock lazily, so only the runner ever evaluates it:

```ts
mock: (page, ctx) => import('./mock.ts').then((made) => made.mock(page, ctx)),
```

### A scene's `preferences` have no effect on what it films

**Cause.** They were written to `localStorage` as literal key/value entries.
That is right for an app that keeps one entry per preference and wrong for
every app that keeps a JSON blob under one key: `{ settledZone: 'America/
New_York' }` becomes a top-level `settledZone` entry nothing reads, the app
boots on its defaults, and the scene fails several steps later looking for a
dialog that had no reason to open.

**Fix.** Route them through `demo.storage(theme, overrides)`, the one
function that knows how the app spells its own state, and spread them where
that shape puts them. See `config.md`. An app with no `storage` should treat
a scene's `preferences` as an error rather than dropping them quietly.

### A timed affordance never fires: an undo does nothing, a toast has gone

**Cause.** The narration spent the window. An undo that lives for six
seconds is six seconds from the keystroke that caused it, and a scene that
pushes in on the toast, takes a still, and reads a line about it has spent
them all before pressing the keys. Nothing errors: the shortcut is simply
ignored, so the film shows an app whose Undo does not work, and the scene
fails much later waiting for something to come back.

**Fix.** Put the gesture inside the window and the words after it, over the
result. Same rule as every other scene — do the thing, then narrate it — but
here it is a hard constraint rather than a matter of pacing, so find the real
timeout in the app's own source and write the beat around it.

### A clip reports 0fps, or every gap in the slowest bucket

**Cause.** The clip barely moves. A rate is paints divided by the time they
spanned, and a scene that deliberately holds a frame — the template's own
`smoke` scene holds one for four seconds — divides a handful of paints by
almost nothing. The number is noise, and reading it as judder sends you
hunting a capture fault in the one scene the docs tell you to film first.

**Fix.** Nothing, if the clip is meant to hold. Both the end-of-run report
and `scripts/gaps.mjs` print `held` for a clip with under a second of
animation in it. A manifest filmed by an older studio has no
`motionSeconds`, so it shows the raw number instead; re-film to clear it.

### Scenes that type, or click through menus, are reported as juddering

**Cause.** The measurement was counting keystrokes as dropped frames. Typing
at a human rate is one paint every 58ms, which is slower than any sensible
motion threshold, so a scene whose only sin is a search box looks exactly
like a stalled animation to a rule based on gap length alone.

**Fix.** Measure over the stretches the actor reports as movement — its own
tweens, wheel sweeps and camera transitions — rather than over every gap
shorter than a threshold. See `capture.md`. If a scene is still flagged after
that, the app really is painting slowly while the pointer moves over it,
which is worth knowing: it is usually a large dialog or a list that
re-renders on hover.

### Running one scene with `--grep` wipes out the rest of the manifest

**Cause.** The manifest-writing step overwrote `manifest.json` wholesale
instead of merging the freshly filmed scene into what was already on disk.
A one-scene debugging run then produces a one-scene manifest, and the
twenty-plus other scenes' video and stills are still sitting on disk,
simply no longer listed anywhere.

**Fix.** Merge per scene and per theme: read the existing manifest, replace
only the entries for scenes (and themes within a scene) that were just
filmed, and write the union back out. See `runs.md` for the run-identity
mechanism that also has to exist for this to be safe under two concurrent
runs.

### A scene passes every assertion and still shows nothing useful

**Cause.** Passing means "nothing timed out and nothing threw," which is a
much weaker claim than "the still shows the thing the scene is about." A
list can be collapsed behind a "show more" affordance, a state can be one
scroll position away from the viewport, a value can be correct and simply
off-screen. None of that fails an assertion.

**Fix.** There is no substitute for looking at the actual still after
filming a new or changed scene. Film one scene, inspect every still it
produced, and only then trust the rest of the batch to follow the same
choreography correctly.

### Narration is cut off mid-word at the end of a clip

**Cause.** Spoken duration is estimated from word count before the audio
is actually synthesized, so the closing line of a scene (the one with
nothing after it to force a hold) can run slightly past the picture if
the estimate undershoots the real, synthesized length.

**Fix.** Pad the video's tail by cloning its last frame for however long
the audio overruns by, measured after synthesis against the real duration,
not the estimate. Reserve this for genuine overruns (a small threshold
avoids re-encoding a stream that could otherwise be copied untouched); if
words are still getting cut, check that the padding path is actually
triggering rather than the plain-copy path.

### A word is mispronounced

**Cause.** English heteronyms are spelled once and pronounced two ways
("live" as in *alive* versus "live" as in *broadcast*), and a
text-to-phoneme model has to guess from spelling alone with no sentence
context to disambiguate.

**Fix.** Maintain a small, scoped respelling table for words actually
encountered ("live" → "liv" for the verb sense), applied to the text before
synthesis and included in the cache key so a change to the table only
invalidates the lines it actually affects. Don't try to pre-empt every
heteronym in English; add entries as they come up.

### The cursor arrives at the subject before the narration mentions it

**Cause.** The camera and pointer moved first, and the line was only
spoken (and its timestamp only recorded) afterward, so the visual and the
audio are in the right order but too far apart in time.

**Fix.** Take the narration's timing mark *first*, then start the camera
and pointer moving toward the subject, and treat their travel time as
coming out of the line's own hold rather than being added before it. That
way the words and the motion toward what they describe start together.

### Narration talks about one thing while the screen shows another

**Cause.** Either the line was spoken before the gesture it describes had
happened (describing a result that isn't on screen yet), or the camera
pushed in silently on a payoff shot with no line explaining what changed.
Both are the same mismatch from opposite directions.

**Fix.** Do the gesture first, then narrate while pushed in on its result.
A silent push-in on something that matters is just as wrong as narrating
something that hasn't happened yet: both leave the words and the picture
talking about different moments.

### One line of narration seems to point the cursor at the wrong row

**Cause.** The line has two subjects ("this row is what you did today,
and that one is from yesterday"), but the camera can only travel to one
target on the line's first words. It ends up sitting on the first subject
for the full length of a line that spends its second half talking about
something else entirely.

**Fix.** One subject per line. Split a two-subject sentence into two
narrated beats so the camera has something to travel to for each one.

### The narration reads like marketing copy, not like someone talking

**Cause.** Literary or promotional word choices (inversions, aphorisms,
adjectives like "seamless" or "powerful") read as scripted the moment
they're spoken aloud, even though the same words look fine written down.

**Fix.** Write every line the way a person would say it while pointing at
their own screen: plain, contractions, "you"/"I", one plain sentence per
idea. Say "your tasks live right here," not "one home for everything that
has no place on the grid yet."

### The pointer visibly teleports instead of moving

**Cause.** Input was dispatched as a single batch of synthetic events with
no real time between them (e.g. requesting many intermediate "steps" from a
test framework's move helper, which fires them all within one frame rather
than pacing them against the clock).

**Fix.** Pace pointer movement as an eased tween sampled at the capture
frame rate, with one real input event dispatched per sample and a real wait
between samples, so the trip actually takes the time it appears to take.

### A held frame looks slightly blurred or upscaled right after a push-in

**Cause.** The element being scaled was left promoted to its own
compositor layer (`will-change: transform`) past the end of the
transition. Any frame held on that layer afterward, including one a scene
takes a still from, is showing a scaled bitmap rather than text
re-rasterized at its true final size.

**Fix.** Drop `will-change` on `transitionend`, once the transform has
actually finished, not before. Promoting the layer for the moving portion
only is what keeps the transition itself smooth without leaving every
subsequent still soft.

### A click leaves a visible flash where the cursor no longer is

**Cause.** A ripple or highlight effect added at the click point animates
open over some duration, but the cursor has usually already started moving
on to the next target by the time it's fully visible, so the effect reads
as a flash at a point nobody's pointing at anymore.

**Fix.** Skip click ripples and similar delayed feedback effects entirely.
The press/release state change on the cursor itself is enough signal; an
effect that outlives the moment it's attached to draws attention to the
wrong place.
