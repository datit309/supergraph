import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { Page } from '@playwright/test';
import { test } from '@playwright/test';

import type { Actor } from './actor.ts';
import type { ConfigServer } from './config.ts';
import { ANCHOR, FRAME_DIR, OUT_DIR, STAGE } from './config.ts';
import type { Theme } from './define.ts';
import type { Clip } from './recorder.ts';
import { Recorder } from './recorder.ts';
import { entryDir } from './run-id.ts';
import type { Preferences } from './stage.ts';
import { openStage } from './stage.ts';

/**
 * What a scene is, and why one script produces both kinds of asset.
 *
 * The temptation is to write the screenshots and the clips separately, and it
 * is a trap: two scripts drift, and the still on the website stops being a
 * frame of the video beside it. So a scene is written once, as a piece of
 * choreography, and it is filmed. Wherever it wants a still it says so, and
 * the recorder lifts for the moment it takes to hide the cursor and shoot —
 * see `Recorder.pause`. One script, one run, both outputs, and the still is
 * by construction a moment the film actually passes through.
 *
 * A scene is a Playwright test, which is not laziness either: the runner
 * brings the dev server up, tears a browser context down cleanly, retries a
 * scene that lost a race, and gives `--grep` for free as the scene selector.
 * What it must not bring is its own idea of artifacts, which is why the
 * config switches its screenshots and videos off and this file writes
 * everything itself.
 */

export type SceneContext = {
  page: Page;
  actor: Actor;
  theme: Theme;
  server: ConfigServer;
  /**
   * Takes a themed still, with the cursor and caption out of the frame.
   *
   * Declared as a property rather than with method shorthand on purpose:
   * every scene destructures this out of its context, and a destructured
   * *method* is an unbound reference the linter rightly complains about. One
   * character of syntax here, or a warning in all twenty-seven scenes.
   */
  shot: (name?: string) => Promise<void>;
};

export type SceneOptions = {
  /** Shown on the site beside the asset. */
  title: string;
  blurb: string;
  /** A doc pointer for the manifest — an ADR, a ticket, whatever this app uses. */
  ref?: string;
  /** Which `demo.entries` key to open. Default `'app'`. */
  entry?: string;
  /** Overrides that entry's own `path`. */
  path?: string;
  reference?: Date;
  /** Folded into `demo.storage`'s entries — see `Preferences`. */
  preferences?: Preferences;
};

export type SceneEntry = SceneOptions & {
  scene: string;
  theme: Theme;
  stills: string[];
  clip: Omit<Clip, 'mp4' | 'webm' | 'poster'> & {
    mp4: string;
    webm: string | null;
    poster: string;
  };
};

export function scene(
  name: string,
  options: SceneOptions,
  body: (context: SceneContext) => Promise<void>
) {
  test(name, async ({ page }, info) => {
    const theme = info.project.name as Theme;
    const themeDir = join(OUT_DIR, theme);
    const frameDir = join(FRAME_DIR, `${theme}-${name}`);

    await mkdir(themeDir, { recursive: true });

    await page.setViewportSize({ width: STAGE.width, height: STAGE.height });

    const stage = await openStage(page, {
      theme,
      entry: options.entry,
      path: options.path,
      reference: options.reference ?? ANCHOR,
      preferences: options.preferences,
    });

    const recorder = new Recorder(page, frameDir);
    const stills: string[] = [];

    // Every `actor.say` becomes a line of voice-over at the moment the scene
    // says it, on the clip's own timeline rather than wall-clock.
    stage.actor.onNarrate = (text) => recorder.mark(text);
    stage.actor.onMotion = (state) => recorder.motion(state);

    const shot: SceneContext['shot'] = async (label) => {
      const file = label ? `${name}-${label}.png` : `${name}.png`;

      await recorder.pause();
      await stage.actor.overlay(false);

      /**
       * A still asked for after the scene let go of its subject is a still of
       * the whole app — but the camera must not be seen going there, so it
       * happens inside the pause and is undone before capture resumes. A
       * no-op for the commoner `focus` / `shot` / `unfocus` order, where the
       * framing is the point of the shot.
       */
      const reframe = await stage.actor.wideForStill();

      await stage.actor.settle();
      await page.screenshot({
        path: join(themeDir, file),
        animations: 'disabled',
      });
      stills.push(`${theme}/${file}`);

      await reframe();
      await stage.actor.overlay(true);
      await recorder.resume();
      await stage.actor.beat(120);
    };

    await recorder.start();
    await stage.actor.beat(420);

    try {
      await body({
        page,
        actor: stage.actor,
        theme,
        server: stage.server,
        shot,
      });
    } catch (error) {
      await recorder.discard();
      throw error;
    }

    // Whatever a scene was looking at, the clip ends on the whole app. Both
    // calls: the first says the scene is finished with its subject, the
    // second is what actually pays for coming out, since nothing follows it
    // that would.
    await stage.actor.unfocus();
    await stage.actor.release();
    await stage.actor.say(null);
    await stage.actor.beat(520);

    const clip = await recorder.stop(join(themeDir, name));

    const entry: SceneEntry = {
      ...options,
      scene: name,
      theme,
      stills,
      clip: {
        ...clip,
        mp4: `${theme}/${name}.mp4`,
        webm: clip.webm ? `${theme}/${name}.webm` : null,
        poster: `${theme}/${name}.poster.jpg`,
      },
    };

    const entries = entryDir();
    await mkdir(entries, { recursive: true });
    await writeFile(
      join(entries, `${theme}-${name}.json`),
      `${JSON.stringify(entry, null, 2)}\n`
    );

    info.annotations.push({
      type: 'capture',
      description:
        `${clip.frames} frames · ${clip.measured.toFixed(1)}fps · ` +
        `${clip.seconds.toFixed(1)}s · ${clip.spoken} line(s) spoken`,
    });
  });
}
