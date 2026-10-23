import type { Page, Route } from '@playwright/test';

import type { MockContext } from 'video-demo/define';

/**
 * Every request the app makes during a film, answered in this process.
 *
 * There is no API, no database and no third party behind a demo run — only
 * `page.route` handlers and whatever this file keeps in memory for the
 * length of a scene. See references/mocking.md for the two reasons this
 * matters (a corpus gets published; a demo has to be reproducible) and for
 * the route-ordering trap the comment below exists to prevent.
 *
 * Unlike `demo.config.ts`, this file is only ever evaluated by the test
 * runner, which is the whole reason the config reaches it through a dynamic
 * `import('./mock.ts')`. So it may import anything Playwright can load —
 * your app's packages, an e2e fixture, a workspace module with extensionless
 * specifiers — none of which plain Node's resolver would follow.
 */

type Row = { id: string };

/**
 * An in-memory table with the four operations a mocked write route needs.
 *
 * A stub that answers every write with `{}` and status 200 looks like it
 * mocks a write; it doesn't. The panel that just sent the request reads its
 * own state back a moment later, and if the write went nowhere, that read
 * hands back the old value — the viewer's own change appears to undo itself
 * on film. `createStore` exists so a route handler can actually mutate
 * something and have every later read agree with it.
 */
export function createStore<T extends Row>(seed: T[]) {
  const rows = new Map(seed.map((row) => [row.id, row]));
  let minted = rows.size;

  return {
    list(): T[] {
      return [...rows.values()];
    },
    one(id: string): T | undefined {
      return rows.get(id);
    },
    create(value: Omit<T, 'id'> & { id?: string }): T {
      const id = value.id ?? `row_${++minted}`;
      const row = { ...value, id } as T;
      rows.set(id, row);
      return row;
    },
    patch(id: string, changes: Partial<T>): T | undefined {
      const row = rows.get(id);
      if (!row) {
        return undefined;
      }
      const updated = { ...row, ...changes };
      rows.set(id, updated);
      return updated;
    },
    remove(id: string): boolean {
      return rows.delete(id);
    },
  };
}

export function json(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mock(page: Page, ctx: MockContext): Promise<unknown> {
  // TODO: model each entity the app fetches with its own createStore, seeded
  // around ctx.reference (never `new Date()`) so there's history behind the
  // anchor and days still ahead of it:
  //
  // const things = createStore(createSeedThings(ctx.reference));

  /**
   * Registration order matters, and it is backwards from how you'd guess.
   * Playwright asks the *last-registered* handler first, so a broad pattern
   * has to go on before a narrow one, or the narrow one never gets a turn —
   * '**\/api/**' before '**\/api/v1/things**' before '**\/api/v1/things/**'.
   * Get it backwards and a later, broader registration silently shadows an
   * earlier, narrower one: a write answers with the old, unmutated state,
   * and the change the panel just showed optimistically reverts on film a
   * beat later, which reads exactly like a bug in the app.
   */
  await page.route('**/api/**', (route) => json(route, {}));

  await page.route('**/api/v1/auth/me**', (route) => {
    if (!ctx.signedIn) {
      return json(route, { message: 'No session' }, 401);
    }
    // TODO: return your own viewer shape.
    return json(route, { id: 'usr_demo' });
  });

  // TODO: one page.route per surface this app reads or writes, broadest
  // first, narrowest last:
  //
  // await page.route('**/api/v1/things**', (route) => {
  //   const request = route.request();
  //   if (request.method() === 'POST') {
  //     const made = things.create(request.postDataJSON());
  //     return json(route, { thing: made }, 201);
  //   }
  //   return json(route, { things: things.list() });
  // });

  return {};
}
