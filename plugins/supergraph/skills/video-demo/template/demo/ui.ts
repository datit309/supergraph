/**
 * One import for everything a scene needs to point at.
 *
 * Nothing lives here yet, on purpose: `studio/` has no idea what your app's
 * DOM looks like, and this is the one file allowed to. Fill it in *after*
 * the smoke run in SKILL.md's workflow proves a real page, not before —
 * writing locators against a page you haven't yet seen on screen is how a
 * scene ends up pointing at something that used to be there.
 *
 * If your app already has an e2e suite, prefer re-exporting its own locator
 * helpers over writing new ones. They already encode the app's own layout
 * quirks (a canvas that renders more than one page at once, a list that
 * collapses past N items, geometry driven by a measured element rather than
 * an assumed size) and a second copy here will drift from the first the
 * moment either one changes.
 *
 * A locator helper takes a `Page` and returns a Playwright `Locator` — never
 * an element handle, never a raw selector string a scene has to remember.
 *
 * // export function thing(page: Page, title: string): Locator {
 * //   return page.getByTestId('thing-row').filter({ hasText: title });
 * // }
 */

export {};
