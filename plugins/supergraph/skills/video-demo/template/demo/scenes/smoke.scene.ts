import { scene } from 'video-demo/scene';

/**
 * The first thing to film, and the only scene that ships with the template.
 *
 * It is deliberately almost nothing: open the app, look at it, take one still.
 * That is enough to prove the four things which, if any of them is wrong, make
 * every richer scene fail in a way that points somewhere else.
 *
 *   1. The build was pinned and served, and the API base was not baked wrong.
 *      Otherwise the app sits on its login screen and a scene fails looking
 *      for content that was never going to be there.
 *   2. The mocks answered, so the session and the seeded data are real. An
 *      unanswered `auth/me` looks exactly like a broken selector.
 *   3. `entries.app.ready` actually resolves when the app is ready, rather than
 *      when it has merely painted. Get this wrong and scenes fail
 *      intermittently, which is the most expensive kind of wrong.
 *   4. The capture works at the configured resolution and holds its frame rate.
 *
 * Run it silent first, because the voice model is a separate concern and a
 * missing one should not stop you proving the capture:
 *
 *     DEMO_VOICE=0 scripts/demo --grep smoke
 *
 * Then read `demo-out/<theme>/smoke.png`. Not the exit code: a scene that
 * passes while showing a login page, an empty state or the wrong theme has
 * told you nothing. Look for the app signed in, the seeded data on screen, the
 * theme you configured, and the cursor parked in the bottom-left corner.
 *
 * Delete this once real scenes exist, or keep it as the thing to run after
 * changing anything in `demo.config.ts`.
 */
scene(
  'smoke',
  {
    title: 'It films',
    blurb:
      'The app, pinned and mocked, with the capture and the clock working.',
  },
  async ({ actor, shot }) => {
    await actor.beat(400);
    await actor.say(
      'This is the app, filmed from a pinned build against mocked data.'
    );
    await shot();
  }
);
