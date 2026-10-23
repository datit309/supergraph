import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * How a demo says "my app is on screen and finished loading".
 *
 * This is the seam that stops the studio being one app's demo folder. The
 * original hardcoded a calendar's own readiness — a grid visible, two
 * `data-loaded` attributes true, a measured height past 900px — and every one
 * of those four assertions was load-bearing for a reason that generalises even
 * though the selectors do not.
 *
 * Why it cannot just be "wait for load". Visible is not ready: the app painted
 * its shell and its data is still in flight, so a scene reaching for a row
 * races the read and fails a third of the time. Laid out is not ready either:
 * a grid that sizes itself from a `ResizeObserver` reports a height of nothing
 * for a frame or two, and a scene that measures a slot in that window aims at
 * the wrong pixel. Each predicate below exists because one of those produced a
 * flake that looked like a broken scene.
 *
 * Compose them with `all`. Keep them cheap: this runs before every clip.
 */

export type Ready = (page: Page) => Promise<void>;

/** On screen. The floor, and rarely enough on its own. */
export function visible(testId: string): Ready {
  return async (page) => {
    await expect(page.getByTestId(testId)).toBeVisible();
  };
}

/**
 * An attribute the app sets when it has finished something.
 *
 * The most reliable signal there is, because the app is telling you rather
 * than being guessed at. If the app has no such attribute, this is usually
 * worth adding to the app: one `data-loaded` is cheaper than a suite of
 * heuristics about when a fetch has landed.
 */
export function attribute(testId: string, name: string, value: string): Ready {
  return async (page) => {
    await expect(page.getByTestId(testId)).toHaveAttribute(name, value);
  };
}

/**
 * Settled geometry, polled rather than awaited.
 *
 * For anything that measures itself. The browser clamps and recomputes, so the
 * value that matters is the one it lands on, not the first one it reports.
 */
export function tallerThan(testId: string, px: number): Ready {
  return async (page) => {
    await expect
      .poll(
        async () => (await page.getByTestId(testId).boundingBox())?.height ?? 0
      )
      .toBeGreaterThan(px);
  };
}

export function widerThan(testId: string, px: number): Ready {
  return async (page) => {
    await expect
      .poll(
        async () => (await page.getByTestId(testId).boundingBox())?.width ?? 0
      )
      .toBeGreaterThan(px);
  };
}

/** Text inside a known element, for data that only arrives with a fetch. */
export function text(testId: string, pattern: string | RegExp): Ready {
  return async (page) => {
    await expect(page.getByTestId(testId)).toContainText(pattern);
  };
}

/**
 * The last resort, and genuinely useful for a page with no session.
 *
 * A credential-free public page has no app shell to interrogate and often no
 * attribute to wait on, so "the requests stopped" is the honest signal. Do not
 * reach for it on the signed-in app: it is slower and it goes quiet during a
 * long poll or an open event stream, which then reads as ready when it is not.
 */
export function networkIdle(): Ready {
  return async (page) => {
    await page.waitForLoadState('networkidle');
  };
}

/** Everything in order, which is how readiness is usually expressed. */
export function all(...checks: Ready[]): Ready {
  return async (page) => {
    for (const check of checks) {
      await check(page);
    }
  };
}

/** Nothing to wait for beyond the navigation itself. */
export const immediately: Ready = async () => {};
