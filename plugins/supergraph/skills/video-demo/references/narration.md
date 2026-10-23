# Narration: the voice and the words

Every `actor.say` line becomes spoken voice-over. There are no subtitles in
the finished asset — the words either work said out loud, or they don't work
at all.

## The register

The brief that produced this codebase's actual scenes was: **"make it sound
like someone making a video"**, not "fancy English". Those are different
instructions and they pull in opposite directions — the second one produces
prose that reads well silently and sounds stilted the moment a voice says it.
The real example, from this repo's reference scene:

| literary | spoken (what's actually in the scene) |
| --- | --- |
| "One door for everything that has no place on the grid yet." | "So your tasks sit right here, next to the calendar. Not in a separate app." |

The literary version is a fine sentence to read. Said aloud it sounds like
narration of a museum placard. The spoken version has a "so" doing the work
a sentence connective does when someone is actually explaining something to
you, splits into two short clauses instead of one dense one, and ends on
"not in a separate app" — which is a person anticipating the obvious next
question, not a feature description.

The rules that fall out of that brief:

- **Say it out loud before you commit to it.** If it doesn't sound like
  something you'd actually say to a person sitting next to you, rewrite it.
  This is the single highest-leverage check and it costs nothing.
- **Use "you" and "I".** A demo is one person showing another person their
  own screen; write it in that voice, not in the third person a spec sheet
  uses.
- **Use contractions.** "It's" and "that's", not "it is" and "that is" —
  except where a contraction changes what's actually said (see the heteronym
  section below, where spelling something out can be the fix).
- **One idea per line.** This is also a choreography rule (see
  [scenes.md](scenes.md)): a line with two ideas in it sends the pointer to
  the first one and holds it there through a sentence that has moved on.
- **No inversions, no aphorisms.** "Never has undoing been easier" is not
  something anyone says out loud. Plain subject-verb-object.
- **No marketing adjectives.** "Powerful", "seamless", "effortless" are the
  words that make a demo sound like it's trying to sell you something rather
  than show you something. Describe what happens, not how impressive it is.

## The mechanics

Narration is synthesized locally by [Kokoro-82M](https://github.com/thewh1teagle/kokoro-onnx)
running as ONNX on CPU, via `kokoro-onnx`. Nothing is uploaded, ever — this is
the same bargain the rest of the studio keeps with the seeded diary: none of
it leaves the machine.

The settings, and why each number is what it is:

- **Voice**: `af_heart` by default (overridable per-app via `voice.name` in
  `demo.config.ts`, or `DEMO_VOICE_NAME` at film time for a quick audition).
- **Speed**: `1` — a shade faster than a polished voice-over reading a
  script, because the brief is "someone talking through their own screen",
  which runs faster and blends its clauses together more than something read
  from a page.
- **Sentence pause**: `0.14s`. **Clause pause**: `0.06s`. Kokoro's own
  defaults (`0.25`/`0.1`) read as noticeably more ponderous over a demo;
  tightening both is most of the difference between "text-to-speech" and
  "a person talking".
- **Loudness**: every line is normalized to an RMS of `0.12`, clamped to a
  gain between `0.55x` and `1.6x` so a very quiet line is lifted rather than
  amplified into audible noise. Kokoro's raw output level drifts with the
  phonemes in a given line — one sentence comes out twice as loud as the
  next with nothing else different — and no amount of mixing afterward fixes
  that once every line has already drifted independently. Normalizing at the
  source, per line, is what keeps a whole scene at one consistent loudness.

**Where it lives.** One directory for every demo on the machine,
`~/.cache/demo-voice` (`DEMO_VOICE_HOME` to move it). The model and its Python
environment are a quarter of a gigabyte and identical whoever is filming, so a
second app would otherwise pay the whole install again for a byte-for-byte
copy of the first one's — and the cut lines cannot collide, because the key
below is a hash of everything that decides what the audio sounds like. Two
apps share a file only when they wanted the same words in the same voice.

**Caching.** Every line is cached by a hash of: the respelt text (see below),
voice, language, speed, both pauses, and the target RMS. Re-filming the dark
pass of a scene speaks nothing new — it says exactly what the light pass
said, and the wav is already on disk. The model's own file size is also part
of the key, deliberately: swapping the int8 model for an fp32 one changes
what a given piece of text sounds like, and without the size in the key the
cache would silently keep serving back lines the *old* model spoke. Anything
that can change how a line sounds belongs in the key that decides whether to
resynthesize it.

## Heteronyms: when the model guesses the wrong reading

English is full of words spelled once and said two different ways depending
on meaning, and a phonemiser working from letters alone has to guess. The
real case that came up here: the line "your tasks live right here" was
synthesized with "live" read as the adjective, rhyming with *hive* — the
sense in "a live band" — rather than the verb rhyming with *give*, which is
what the sentence actually meant.

Two fixes, and when each one is right:

1. **Respell it**, if the word is one you need and the sentence is otherwise
   right. A small table of regex-to-respelling pairs, scoped as narrowly as
   the actual sense you mean:

   ```ts
   const SAID_AS: [RegExp, string][] = [
     [/\blive\b/gi, 'liv'], // the verb only — "live stream" would want the other reading
   ];
   ```

   Keep this table to words you've actually heard mispronounced, never
   speculative entries for words that might theoretically be ambiguous. A
   respelling scoped to one sense is also a trap for the *next* line that
   uses the same word in the other sense — the comment on the entry above
   exists so whoever adds that line later knows to write around it instead
   of silently getting it wrong.

2. **Reword it**, if there's a cleaner sentence that avoids the ambiguous
   word entirely. This is in fact what happened to the real example above:
   the shipped line doesn't say "live" at all — it says "your tasks *sit*
   right here, next to the calendar" — which sidesteps the heteronym rather
   than fighting it. Rewording is usually the better fix when the ambiguous
   word isn't load-bearing to the sentence's meaning; reach for a respelling
   when it is.

## Pacing: the hold has to be guessed before the audio exists

`actor.say` holds the scene for as long as a line takes to speak — but the
wav file doesn't exist yet at the point the scene needs to decide how long
to wait, because narration for a whole scene is synthesized together
afterward, not line by line as the scene runs. So holds are paced against an
*estimate*: roughly 3.7 words per second at speed 1, plus a fixed 0.4s
floor. This deliberately errs long. Dead air at the end of a hold is
invisible to a viewer; a pointer that starts moving toward the next subject
while the narrator is still finishing the current sentence is not, and reads
as the demo rushing ahead of its own voice-over.

If a line genuinely runs longer than even the padded estimate — a closing
line of a scene with nothing after it to absorb the overrun — the video's
last frame is cloned forward (`tpad`) rather than cutting the narration off
mid-word. This is the safety net for the one place in a scene where there's
no next beat to borrow time from.

## Audition before you film

Use `scripts/say.sh` to hear a line rendered through the exact same voice
settings a scene will use — same voice, speed, pauses, and respelling table —
before spending a filmed take on it. This is the fast way to catch a
heteronym or an awkward cadence: it's much cheaper to notice "live" is being
said wrong from a five-second audition than from watching a full clip back
after a scene has already been shot.
