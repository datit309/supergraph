# Writing the choreography

A scene is one file, filmed once, that yields both a clip and a set of
stills. Everything in it runs through the `actor`, which is the one thing in
a scene that knows how to move a pointer, push the camera in, and speak a
line without any of it looking like a script running.

## The actor, one line each

| call | what it does |
| --- | --- |
| `actor.say(text, hold?)` | a line of narration; holds while it's spoken (or `hold`, whichever is longer) |
| `actor.moveTo(point, ms?)` | an eased pointer move to a raw screen point |
| `actor.to(target, opts?)` | measures a locator/testid/point and moves there |
| `actor.hover(target, hold?)` | moves onto a target and stays long enough for its hover state to read |
| `actor.click(target, opts?)` | moves, pauses, **re-measures on arrival**, presses, releases, settles |
| `actor.dragTo(from, to, opts?)` | unwinds any zoom, presses, nudges past the drag threshold, sweeps, releases |
| `actor.scroll(target, deltaY, ms?)` | unwinds any zoom, then an eased wheel |
| `actor.press(combo, opts?)` | shows the combo as a key-hint overlay, presses it, clears the hint |
| `actor.type(text, perChar?)` | types at a human rate, with a small per-character wobble |
| `actor.focus(target, opts?)` | pushes the camera and pointer in on a subject together; no-ops if already framed |
| `actor.unfocus(opts?)` | returns to 1x; the pointer keeps whatever it was pointing at while the view releases |
| `actor.spotlight(target, text, opts?)` | the composed move: mark the narration, focus, hold for the spoken length, optionally unfocus |
| `actor.beat(ms)` | a plain pause |
| `actor.settle(cap?)` | waits for every running animation to finish, then two animation frames |
| `actor.where(target, at?)` | reads a target's current screen point without moving anything |

A `target` is a Playwright `Locator`, a `{ x, y }` point, or a string read as
a `data-testid`.

`click` re-measuring on arrival is worth calling out on its own: a click used
to measure a box, travel for most of a second, and press wherever the
pointer landed. Anything that moved in that time — a list re-rendering, a
panel finishing its own settle, a push-in still easing — left the press
somewhere the target used to be, and the scene carried on as though nothing
had gone wrong. `click` now re-measures the target the instant before it
presses and corrects for any drift; it's cheap and it removes the whole
class of "phantom click landed on the wrong row" failure.

## The rules, and why each one is a rule

**Do the gesture, then narrate while pushed in on the result.** Never
narrate before the subject exists on screen; never leave a silent push-in on
a payoff shot with nothing said over it. Both directions were tried and both
were rejected on sight by a user watching the same scene: narrating first
talks about a thing that isn't there yet, and doing the reverse — the gesture
land, a wordless zoom, and only then a sentence — makes the zoom itself look
like a mistake, a camera that moved for no reason anyone can point to. The
fix that stuck: click the checkbox, *then* push in and say "tick one off and
it is gone" over the ticked state. The action and the words describe the
same frame.

**One subject per line.** Write each sentence as a single beat, because
`spotlight` moves the pointer to the subject on the line's opening words. A
two-sentence line about two different things sends the cursor to the first
one immediately and holds it there through a sentence that is now about
something else on screen. "Today is what you planned for today. And this
one is from yesterday that I never got to, so it is flagged." is two lines
in the actual scene file, each with its own `spotlight`/`say`, precisely so
the cursor arrives at "this one" for the row the sentence is actually about
instead of a second and a half early.

**Zoom scale by what's being shown, never a fixed number:**

| subject | scale |
| --- | --- |
| a panel | ~1.35–1.5 |
| a row | ~1.7 |
| a single control | ~1.9–2.2 |
| the whole screen, or a layout relationship | no zoom — plain `say` |

The last row matters as much as the numbers above it. A line like "your
tasks sit right here, next to the calendar" is a claim about *layout* — it
only reads as true if the calendar is still visible in the same frame as the
tasks panel. Zooming in on the panel for that line removes the very thing
the sentence is about.

**Aim at content, not a flex container.** A full-height panel with four rows
in it has its visual center in the empty space below the rows, not on any of
them. `focus`/`spotlight` a specific row or the row list itself, never the
outer panel element, when the panel's height is driven by its container
rather than its content.

**Clicking and typing while pushed in is safe. Dragging is not.**
`boundingBox()` reports the post-transform rect, so a click lands correctly
on a zoomed-in target. A drag's arming threshold, though, is measured in the
*app's own* pixels — at 1.7x zoom, the 6px nudge that arms a drag on the
unzoomed page is only 3.5px on screen, which reads as a click instead of a
drag start. `dragTo` and `scroll` unwind any active zoom themselves before
they move, so a scene never has to remember this — but it does mean you
can't hand-roll a drag with raw mouse events while zoomed and expect it to
behave.

**Length is a consequence, not a quota.** Most scenes land between about
twelve and twenty-five seconds because that's how long it actually takes to
show one thing and say one sentence about it. That's an observation, not a
floor: a scene that's a click, a Backspace, and a ⌘Z reads clearly in six
seconds, and padding it with holds to reach some target number buys a longer
clip and a worse one. Narration is the one thing that's allowed to lengthen
a clip on its own, because `say` holds for exactly as long as the line takes
to speak.

**Close a popover through its own trigger, never with Escape.** Two separate
traps live here. First, Escape is ambiguous partway through a panel: some
popovers stop it from propagating and others let it bubble up to the panel's
own close handler, and you can't tell which from outside. Second — and this
is the one that wastes real debugging time — clicking a control that an open
popover happens to be covering does not fail at the click. The click is
silently absorbed by the popover, the scene continues as if it had landed,
and the failure surfaces much later at whatever the scene waits for next,
with nothing in the resulting error pointing back at the popover that was
actually in the way.

**Do not trust a title, or any text, to be unique.** A seeded week can
easily have two events called "Design review" on different days. Scope by
container — `dayColumn.nth(DAY.wed)`, then the chip inside it — rather than
relying on which match a bare text filter happens to reach first.

**A list may be collapsed, hiding the very state you meant to show.** A
guest flyout that renders five rows and folds the rest behind a "+2 more"
control will hide the one declined RSVP on a six-guest meeting until that
control is expanded. Deciding a scene "shows" a state and confirming the
still actually shows it are two different steps — see the next rule.

**`unfocus` is a hint, not a movement, so write beats without worrying about
the camera bouncing.** A beat that ends with `unfocus` (or a `spotlight`
without `stay: true`) does not pull the camera out there and then. It records
that the scene is finished with that subject, and the engine pays for coming
out at the first moment something actually needs the whole app on screen: a
`shot`, a plain `say`, a drag or a scroll, a pointer reaching for something
the current framing cannot see, or the end of the scene. If instead the next
thing is another `focus` or `spotlight`, the release is cancelled and the
camera glides from one framing straight to the next.

This exists because the alternative was the most-noticed flaw in the first
corpus. Four beats about the same panel filmed as push in, pull out, push in
to within thirty-five pixels of where it just was, pull out, and so on: eight
camera movements where four would do, and a second of motion each time whose
only purpose was to be undone. Measured on the AI scene, the coalescing took
it from eight moves to six, the clip from 43.0s to 41.5s, and the paint rate
from 44.9fps to 49.0 simply because there were fewer transitions to draw.

What it does *not* do is decide your framing for you. Two beats at the same
scale about neighbouring things still collapse to no camera move at all (see
`framed`), and two beats at different scales still move, once.

**Where the app has its own timer, the gesture goes inside it and the words
come after.** This is the same rule as the first one, but it stops being a
matter of pacing and becomes a hard constraint. The calendar's undo lives for
six seconds from the keystroke that caused it (`UNDO_WINDOW_MS`), and a scene
that pushed in on the toast, took a still and read a line about it spent all
six before pressing anything. Nothing errors: the shortcut is simply ignored,
so the film shows an app whose Undo does not work, and the scene fails much
later waiting for something that is never coming back. Find the real timeout
in the app's own source and write the beat around it: delete, toast, still,
undo, *then* narrate over the restored state.

**Take the still at the moment that makes the point**, not reflexively at
the end of a beat. In the tasks scene, the "done" still is shot after a
`beat(700)` following the click on the checkbox — long enough for the
completed state's own transition to finish rendering — not at the instant
the click handler returns.

## Verification is not optional: read the PNG, every time

A scene can pass — every assertion green, every `shot()` call completing
without error — while framing exactly the wrong thing: a zoom that fired a
beat early, a popover that covered the control the scene meant to show, a
list collapsed over the one row that mattered. None of those throw. The only
way to catch them is to open every still a scene produces and actually look
at it before moving on to the next scene. This is slower than trusting a
green checkmark, and it is the step that has caught real defects — a zoom
firing at the wrong moment, a silent push-in, a cursor arriving before the
words about it, a mispronunciation — that nothing else in the pipeline
would have. Film one scene, read every still it produced, and only then
either fix it or move to the next one.
