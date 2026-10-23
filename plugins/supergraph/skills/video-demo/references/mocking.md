# Mocking: answering every request in-process

`mock(page, ctx)` is where every network request your app makes during a film
gets answered. There is no API, no database, and no third party behind a demo
run — just `page.route` handlers and a diary held in memory for the length of
the test.

It lives in your workspace as `mock.ts`, and `demo.config.ts` reaches it with
a dynamic import rather than a static one, because the config is read by plain
Node as well as by the runner (see [config.md](config.md)).

**Reuse the app's data fixtures; never a file that imports
`@playwright/test`.** The first half is the point of this page: a fixture API
the e2e suite already trusts models a write the way the real route does, and
copying it would drift. The second half is not a preference. The engine loads
Playwright from the skill and the app loads it from its own `node_modules`;
two physical copies in one run is an error Playwright refuses outright, and it
refuses for the whole corpus, because every file under `scenes/` is loaded to
collect tests before `--grep` filters any of them. Data fixtures are usually
clean (they deal in objects, not pages). Locator helpers usually are not, so
those belong in your workspace's own `ui.ts`.

## Why, twice over

**A corpus gets published.** These stills and clips end up on a marketing
site or a README. A demo filmed against a real account is a demo that
publishes real meetings, with real people's names and email addresses
sitting in a 4K screenshot forever. There is no amount of care in choosing
what to click that fixes this — the fix is that nothing real is ever behind
the glass to begin with.

**And reproducibility.** A demo asset is only worth automating if the same
command produces the same file next month. A real backend has opinions of
its own — rate limits, a token that expires, a calendar that now has
different events in it because time passed. Answering everything in-process
means the only clock that matters is the one you pinned in `clock.anchor`.

## Route precedence is backwards from how you'd guess

Playwright asks the *last-registered* handler first. Register a catch-all
before anything specific, or the specific one never gets a chance to run —
worse, register a *specific* handler first and a broader one added later
will silently shadow it.

This is not a theoretical trap; it happened in this codebase. `**/api/v1/booking**`
(the whole booking page: hours, days off, settings) was registered, and
later `**/api/v1/booking/**` (one specific sub-route: creating and editing
links) was added *after* it, intending to be more specific. But Playwright
tries the second-registered handler first regardless of which glob looks
narrower, so as far as route matching is concerned both patterns match a
request to `/api/v1/booking/links`, and whichever was registered later wins.
Get the order backwards and the broad handler answers every write to a link
with `{ page: bookingPage }` and an unmutated page — the panel's own
optimistic update renders the change immediately, the read-back a moment
later contradicts it, and the change visibly snaps back on film. It reads
exactly like a bug in the app, and it is invisible from the still alone —
only the clip, watched end to end, shows a value reverting a beat after it
appeared.

The rule this settles on: **register broad handlers first, narrow handlers
after**, so the narrow one is asked first and the broad one is the true
catch-all of last resort:

```ts
await page.route('**/api/**', (route) => json(route, {}));       // last resort
await page.route('**/api/v1/booking**', (route) => /* whole page */);
await page.route('**/api/v1/booking/**', (route) => /* one route */); // wins
```

The failure this whole scheme exists to prevent: a request that matches
*nothing* escapes to the static file server, which answers with a page of
HTML instead of JSON. The app's `fetch` then tries to parse HTML as JSON,
throws somewhere unrelated, and the scene fails with an error that names
neither the missing route nor the real cause.

## Absorb writes, don't just acknowledge them

A stub that answers every `POST`/`PATCH`/`DELETE` with `{}` and status 200
looks like it's mocking a write. It isn't — it's mocking a write that has no
effect, and a scene does not end the moment it writes. The panel that just
sent the request reads its own state back. The grid rehydrates the row by
id. A sweep on an interval re-fetches the list. Every one of those reads the
same in-memory store the write should have touched, and if the write went
nowhere, each of those reads hands back the *old* value — so the viewer's own
change, which the UI showed optimistically a second earlier, appears to
undo itself on screen, on film, for no reason a viewer of the finished asset
could ever guess at.

The fix is to actually model the write: keep the entity in a real
in-process store (a plain object or array closed over by the route handler)
and mutate it, so every subsequent read is consistent with everything a
scene has done so far:

```ts
let links = createDemoSchedulingLinks(reference);

await page.route('**/api/v1/scheduling/links**', (route) => {
  const method = route.request().method();
  if (method === 'POST') {
    const made = { id: `slk_made_${links.length + 1}`, ...body, /* ... */ };
    links = [made, ...links];
    return json(route, { link: made }, 201);
  }
  if (method === 'DELETE') {
    links = links.filter((link) => link.id !== id);
    return json(route, {});
  }
  return json(route, { links });
});
```

**Reuse an existing e2e fixture API instead of writing this twice.** If your
app already has an e2e suite, it almost certainly already has exactly this —
a `createFixtureApi` or MSW handler set that models writes the way the real
routes do, because the e2e suite needed the same honesty for the same reason
(a Playwright assertion that reads its own write back is exactly as
sensitive to a no-op stub as a demo scene is). `mock()` in this codebase's
calendar example imports `createFixtureApi` and `eventDto` straight from
`e2e/support/fixtures.ts` rather than re-deriving event shapes. Writing a
second mock layer from scratch is redundant work that will drift from the
first one the moment either side changes.

## Pin the clock, seed a lived-in week

Every route handler closes over the same `reference` date from `clock.anchor`
— never `new Date()`. Seed data around it so there's history behind the
anchor and days still ahead of it; a diary that starts at the anchor and has
nothing before it reads as a freshly created account, not a calendar someone
actually uses.

Prefer a handful of *recurring* rules over hundreds of individually seeded
rows. A generator that expands "stand-up, weekdays, 9:30" across the visible
range gives you a populated diary if a scene scrolls back or forward weeks,
where a fixed list of thirty one-off events runs out the moment a scene goes
past the seeded window — and a scene that scrolls into empty space looks
exactly like a broken scene rather than an under-seeded one.

Never use a real name, a real company, or a real email domain in seed data,
even as a placeholder you mean to replace. Invented names on a reserved
example domain — `example.com`, `example.org`, `example.net` — read as
obviously fictional to anyone who looks closely, and can never collide with
an actual person's inbox.

## The one route that can't be a `route.fulfill`: streaming

Everything above assumes a request/response pair, answered whole. An
assistant or chat surface is different: the entire point of talking to a
model is that the reply arrives a few words at a time, and `route.fulfill`
hands back one complete body in one call. Fulfilling a streamed endpoint
gives you a card that blinks into existence fully formed, which demonstrates
a *different* product than the one you're filming.

The fix is a real local HTTP server standing in for the streaming endpoint,
writing the same event format (SSE, or whatever your app's transport is) a
few words and a `setTimeout` apart, and a route handler that hands the
request to it with `route.continue({ url })` instead of `route.fulfill(...)`:

```ts
await page.route('**/api/v1/assistant**', (route) => {
  if (route.request().method() !== 'POST') {
    return route.fulfill({ status: 200, body: '{}' });
  }
  return route.continue({ url: `http://127.0.0.1:${port}/turn` });
});
```

`route.continue({ url })` rewrites the request below the browser, so the
response comes back attributed to the origin the page actually asked for —
same-origin as far as the page's own JavaScript is concerned, no preflight,
no CORS, and no special-casing anywhere in the app to make this work. The
one real constraint: the rewritten URL has to speak the same protocol
(`http`, not `https`) the local stand-in server was actually opened with.

Register the streaming route *after* your catch-all for the same reason as
anything else specific: last registered, first asked.
