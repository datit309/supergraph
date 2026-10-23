# Capture: getting frames out of a browser

A demo studio is not a screen recorder with a nicer API. It drives Chrome
over CDP, and CDP has its own physics: what it will hand you, how fast, and
on what schedule. Get any of the three wrong and the result still looks like
a video, it just isn't the one you asked for. This is what governs
`studio/recorder.ts`, and why.

## The screencast ignores emulated retina

Playwright's `deviceScaleFactor` is an emulation: the page is told it is on
a retina display, and CSS pixels get drawn at 2x internally so
`page.screenshot()` comes back sharp. `Page.startScreencast`, the CDP call
behind live capture, does not go through that emulation. It hands back
frames at the CSS viewport size, full stop, whatever `deviceScaleFactor`
says. The only thing that changes what the compositor actually paints is the
browser's own scale factor, set at launch with
`--force-device-scale-factor`.

Miss this and you get a corpus that quietly lies about itself. A 1440x900
capture at `deviceScaleFactor: 2` looks, on paper, like a 2880x1800 retina
recording. What actually left the browser was 1440x900, and whatever turned
it into a bigger file downstream (ffmpeg's scale filter, most likely) was an
upscale, not a capture. It plays back plausibly and it is not what it claims
to be.

## Video and stills are separable, and should be

Because the two paths read different settings, the resolution of your video
and the resolution of your stills are not the same knob. The screencast
follows the browser's real scale factor; `page.screenshot` follows the
Playwright context's `deviceScaleFactor`. That means you can ask for a large
retina still and a browser painting at native 1x for the video, in the same
run, with no trade-off between them.

The recommended split is **video at 1x, stills at 2x**: launch Chrome with
`--force-device-scale-factor=1`, and set the context's `deviceScaleFactor`
to `2`. The video gets a frame rate the compositor can actually sustain (see
below); the stills come out retina because nothing about a still cares how
fast the browser can produce it. Setting both to 2 is the mistake that
produces the upscale-that-looks-retina failure above; setting both to 1
produces a video that is fine and stills that look soft on any modern
display. There is no reason to couple them.

One trap on the way: `deviceScaleFactor` set at the top level of a
Playwright config can be silently overridden by a device preset spread in
under it (`...devices['Desktop Chrome']` carries its own `1`), because
project-level `use` wins over top-level `use`. If your stills come out soft
despite the setting being there, check that nothing later in the config is
re-asserting `1` after your `2`.

## Frame rate is a pixel budget, not a setting

Screencast throughput is, on a given machine, roughly constant in pixels
encoded per second. That means frame rate is downstream of frame size, not
an independent dial:

| capture resolution | sustained frame rate |
| ------------------- | --------------------- |
| 1920x1080            | ~84fps |
| 2560x1440            | ~52fps |
| 3840x2160 (4K)        | ~30fps |

Asking a 4K capture to encode at 60fps does not make it smoother. It
duplicates every second frame, which produces a bigger file and a number
that flatters it, not more motion. The honest move is to pick the encode
rate that matches what the resolution can sustain (60 below 4K, 30 at or
above it) and say so. This is also why a push-in that scales the whole page
is the moment a 4K clip is most likely to visibly judder: the compositor is
already at its ceiling before the extra work of a live transform lands on
it.

These numbers are per machine, not universal constants: they depend on the
GPU, the OS compositor, and what else is competing for the same thread.
Re-measure on a new machine with `scripts/probe-fps.mjs` rather than trusting
the table above.

## Frames arrive per paint, not per tick

A screencast is not a fixed-rate feed. Chrome sends a frame when something
changed on screen and sends nothing while it hasn't, so the gaps between
frames are the real shape of the animation: a fast sweep produces frames a
few milliseconds apart, a two-second caption hold produces one frame and
then silence for two seconds.

The naive way to turn that into a video is to walk the frames in order and
hand them to an encoder at a fixed rate. That plays the whole clip back at
the wrong speed, because it throws away the information that says how long
each frame was actually on screen. The recorder instead keeps every frame's
own timestamp and writes an ffmpeg concat-demuxer script where each frame
carries its own `duration`. ffmpeg then resamples that uneven, honest
sequence onto a constant output rate, which is the one place in the whole
pipeline a frame is allowed to be invented, because it's inventing time
between two real images rather than inventing the images themselves.

The same mechanism is what makes a still free. Pausing the screencast for
the instant a screenshot is taken and then resuming it leaves a gap in wall
clock time; because every later timestamp gets that gap subtracted back out
before it's written to the concat list, the film runs through the still
moment as if it were never paused. One pass produces both the clip and the
stills that punctuate it, and neither costs the other anything.

## A mean frame rate hides jank; a histogram doesn't

The obvious summary statistic, frames divided by seconds, is actively
misleading for a clip that holds captions: a screencast emits nothing while
the screen is still, so a well-paced clip with a two-second hold scores half
marks on a metric that has no way to tell "the screen had nothing to say"
apart from "a frame went missing." Excluding gaps longer than a motion
threshold (three frames' worth at 60fps, 50ms) and computing the rate only
over what's left fixes that, but it introduces a new failure: it can still
hide a stepping zoom, because a push-in painting at ten frames a second
produces a stream of ~100ms gaps that individually look like short holds
rather than one long stutter.

The check that catches it is a histogram of the gaps during motion, not a
single number. On one 4K run the headline "motion" rate read a perfectly
respectable 34fps. The histogram for the same clip showed 141 gaps under
34ms sitting next to 160 gaps slower than 50ms, out of roughly three hundred
total: half the paints in that clip were running at sub-20fps, averaged
against a healthy-looking other half, and the mean landed in between with no
sign anything was wrong. Enable the histogram (`DEMO_TRACE_FRAMES=1`) and
look at the shape, not the mean, whenever a clip is under suspicion.

## What counts as motion is something the actor says, not something inferred

A histogram of the gaps is only as good as the answer to "which gaps?", and
that question has one wrong answer that looks obviously right: call anything
under 50ms motion and anything longer a hold. It fails in both directions,
and one corpus of twenty-eight scenes showed both failures at once.

Typing at a human rate is 58ms a character. Every keystroke is one paint,
58ms after the last, which lands just the wrong side of the line — so four
scenes whose only sin was a search box were reported as juddering. And a
scene that holds a dialog open for twenty seconds while a line is read emits
the occasional paint through it; those gaps are hundreds of milliseconds
long, they are not motion at all, and they dominated the distribution of
every scene built out of clicks rather than sweeps.

Nothing in the frames can tell those apart after the fact. The actor can,
because it is the thing doing the moving: it brackets its own pointer tweens,
wheel sweeps and camera transitions, and the rate is computed over the gaps
*inside* those stretches. One subtlety earns its own sentence, because
getting it wrong cost a round of measurement: gaps are taken within a span
rather than filtered by where they start. A span's last paint lands a few
milliseconds before the span closes, and the next paint comes whenever the
scene next changes — two seconds later, if a line is being read over a still
frame. Attributing that gap to the movement because it *began* during it
turned a smooth 76fps clip into a 44fps one with a 2.2-second worst gap,
which is a measurement of the hold that followed the animation.

## A rate needs a sample, and the sample is measured in seconds

Some scenes hold still on purpose: the template's `smoke` scene sits on one
frame for four seconds, and a rate computed over two paints lands wherever
the noise puts it. Those are reported as `held` rather than rated, because a
verdict of judder on a clip with no motion in it sends whoever reads it
hunting a capture fault in the one scene the docs tell them to film first.

The floor is **one second of animation**, not a count of paints, and the
difference is not academic. A clip that judders paints *less*, so a
paint-count floor excuses exactly the clips that most deserve flagging:
filmed at 4K, a scene of push-ins produced fewer than sixty paints across
eight seconds of camera movement and a sixty-paint floor called the worst
clip in the corpus "barely moves". Time is the honest denominator. Eight
seconds of animation is eight seconds a viewer watched, however few frames
came back, and ten paints inside it is a finding rather than a small sample.

Both consumers of the measurement — the end-of-run report and
`scripts/gaps.mjs` — apply the same floor, so a clip cannot pass one and fail
the other.

## Encoder choice, and why it runs niced

`recorder.ts` defaults to `h264_videotoolbox`, Apple's hardware encoder,
because at 4K a software encoder stops being free: `libx264 -preset slow`
at 1080p comfortably keeps up with filming, but at 3840x2160 it falls
several times behind real time, turning a multi-scene corpus run into an
afternoon. `DEMO_ENCODER=x264` is there for when file size matters more than
wall-clock time; it trades the media engine for `-crf`-controlled software
encoding at a real time cost.

Either way, the encoder process runs under `nice -n 12`. Scenes run in
parallel workers, so one worker's ffmpeg is on the same set of cores as
another worker's browser doing the actual filming, and if the encoder wins
that contention the browser is the one that drops paints, which is exactly
the failure the frame-rate measurement above exists to catch. Lowering the
encoder's priority costs nothing (raising the browser's would need
privileges; lowering the encoder's never does) and keeps the measured frame
rate a property of what the app painted rather than of which process the
scheduler favored that second. That distinction matters because the
contention is nondeterministic: without the priority drop, the same corpus
can measure different frame rates on different runs for a reason that has
nothing to do with the code being filmed.
