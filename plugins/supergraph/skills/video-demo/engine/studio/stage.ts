import type { Page } from '@playwright/test';

import { Actor } from './actor.ts';
import type { ConfigServer } from './config.ts';
import { ANCHOR, PINNED, STAGE, TRACE_NAV, demo } from './config.ts';
import type { Theme } from './define.ts';
import { installOverlay } from './overlay.ts';

/**
 * Getting a page into the state a demo is filmed from.
 *
 * Three things have to be true before a single frame is worth keeping, and
 * all three have to be true *before* the first paint, which is why none of
 * them can be done from a scene.
 *
 * The clock is pinned, so the now-line lands where the seeded data was
 * written around it and the same view is on screen in twelve months' time.
 * `demo.storage`'s entries are written into `localStorage` before the page's
 * own first script runs, so a themed scene never opens on one wrong-theme
 * frame — the thing that write exists to prevent, which a recorder would
 * otherwise catch on every run. And the cursor overlay goes in as an init
 * script too, so it exists before the app does rather than appearing a
 * moment into the film.
 */

/**
 * A scene's own starting state, in the app's shape — not the engine's.
 *
 * These used to be written to `localStorage` as literal key/value entries,
 * which is wrong for every app whose preferences are one JSON blob under one
 * key: a scene asking to start in another time zone got a stray top-level
 * entry nothing reads, the app booted on its defaults, and the scene failed
 * several steps later looking for a dialog that had no reason to open. They
 * go through `demo.storage` instead, which is the one function that knows how
 * this app spells its own state.
 */
export type Preferences = Record<string, unknown>;

export type StageOptions = {
  theme: Theme;
  /** Which `demo.entries` key to open. Default `'app'`. */
  entry?: string;
  /** Overrides that entry's own `path`. */
  path?: string;
  reference?: Date;
  /** Merged over `demo.storage(theme)`'s own entries, for one scene's own override. */
  preferences?: Preferences;
};

export type Stage = {
  page: Page;
  actor: Actor;
  server: ConfigServer;
};

export async function openStage(
  page: Page,
  options: StageOptions
): Promise<Stage> {
  const reference = options.reference ?? ANCHOR;
  const entryName = options.entry ?? 'app';
  const entry = demo.entries[entryName];
  if (!entry) {
    throw new Error(`demo: no entry "${entryName}" in demo.config.ts`);
  }
  const signedIn = entry.signedIn ?? true;

  await page.emulateMedia({
    colorScheme: options.theme,
    reducedMotion: 'no-preference',
  });

  if (options.preferences && !demo.storage) {
    throw new Error(
      'demo: a scene passed `preferences`, but demo.config.ts has no `storage`. ' +
        'Scene preferences are folded in by that function, so without it they ' +
        'would be silently dropped.'
    );
  }

  const seed = demo.storage?.(options.theme, options.preferences) ?? {};
  await page.addInitScript((entries: Record<string, string>) => {
    for (const key of Object.keys(entries)) {
      try {
        localStorage.setItem(key, entries[key]!);
      } catch {
        /* a private window has no storage; the defaults are fine */
      }
    }
  }, seed);

  /**
   * `DEMO_TRACE_NAV=1` prints every main-frame navigation and page error.
   *
   * Worth keeping. A scene that ends up somewhere it did not mean to go fails
   * much later, at whatever it waits for next, and the failure names a missing
   * locator rather than the navigation that lost the page. This turns that
   * into one line.
   */
  if (TRACE_NAV) {
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        process.stdout.write(`    nav  ${frame.url()}\n`);
      }
    });
    page.on('pageerror', (error) => {
      process.stdout.write(`    err  ${error.message.slice(0, 160)}\n`);
    });
  }

  await installOverlay(page);

  /**
   * Mocks apply for every entry, credential-free ones included: `mock` is
   * called before `goto` regardless, and `ctx.signedIn` is what tells it
   * whether a route like `auth/me` should answer as someone or as no one.
   */
  const server = (await demo.mock?.(page, {
    reference,
    entry: entryName,
    signedIn,
  })) as ConfigServer;

  /**
   * Only when the config named an instant. A live site keeps the real clock:
   * freezing time under a page that fetches relative to "now" breaks it
   * rather than steadying it, and there is nothing seeded around a fixed
   * instant to steady it for.
   */
  if (PINNED) {
    await page.clock.setFixedTime(reference);
  }
  await page.goto(options.path ?? entry.path);

  /**
   * The whole of "my app is ready when X" — see `ready.ts`. Nothing below
   * this line assumes anything about what the entry actually renders.
   */
  await entry.ready(page);

  const actor = new Actor(page);
  await page.waitForFunction(() => Boolean(window.__demo));
  await actor.measureStage();

  /**
   * The pointer starts out of the way, low and to the side.
   *
   * It used to be planted in the middle of the frame before anything had
   * happened, which reads as a cursor somebody abandoned rather than one about
   * to be used: the first thing a viewer sees is an arrow pointing at nothing.
   * Parking it near the bottom corner means the opening move glides in from
   * the edge, the way a hand arrives.
   */
  await actor.moveTo({ x: 64, y: STAGE.height - 56 }, 1);
  await actor.settle();

  return { page, actor, server };
}
