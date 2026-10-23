/**
 * A page that reads the manifest, so the corpus can be looked at.
 *
 * This is not the website. It is the proof that a website could be: it reads
 * nothing but `manifest.json`, knows nothing about how any of it was filmed,
 * and does the two things a product page actually does with assets like these
 * — swap the still for the clip when a viewer shows interest, and swap light
 * for dark when the theme changes. If those two work here from the manifest
 * alone, they will work anywhere, and if the manifest is missing something
 * they need, this is where it becomes obvious rather than three weeks later
 * in somebody else's repo.
 *
 * It also prints the measured frame rate on every card, which is the number a
 * corpus is easiest to lie to yourself about.
 */

export function previewPage(): string {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Demo corpus</title>
<style>
  :root {
    color-scheme: light;
    --bg: #fbfbfa;
    --card: #ffffff;
    --ink: #16181d;
    --muted: #6b7280;
    --line: #e6e6e3;
    --accent: #d6492f;
  }
  :root[data-theme='dark'] {
    color-scheme: dark;
    --bg: #0d0f13;
    --card: #15181e;
    --ink: #f2f4f7;
    --muted: #98a1ae;
    --line: #23272f;
    --accent: #ff7a5c;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0 24px 96px;
    background: var(--bg);
    color: var(--ink);
    font: 15px/1.5 ui-sans-serif, -apple-system, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  header {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: baseline;
    gap: 16px;
    margin: 0 auto;
    padding: 28px 0 20px;
    max-width: 1180px;
    background: linear-gradient(var(--bg) 70%, transparent);
  }
  h1 { margin: 0; font-size: 21px; letter-spacing: -0.02em; }
  .meta { color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; }
  .spacer { flex: 1; }
  button {
    font: inherit;
    font-size: 13px;
    color: var(--ink);
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 7px 14px;
    cursor: pointer;
  }
  button[aria-pressed='true'] { border-color: var(--ink); }
  main {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
    gap: 22px;
    max-width: 1180px;
    margin: 0 auto;
  }
  article {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 14px;
    overflow: hidden;
  }
  .frame {
    position: relative;
    aspect-ratio: 8 / 5;
    background: #000;
    cursor: pointer;
  }
  .frame img, .frame video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .frame video { opacity: 0; transition: opacity 180ms ease; }
  .frame[data-playing='true'] video { opacity: 1; }
  .badge {
    position: absolute;
    right: 10px;
    bottom: 10px;
    padding: 4px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    color: #fff;
    background: rgba(0, 0, 0, 0.62);
    backdrop-filter: blur(6px);
  }
  .body { padding: 14px 16px 16px; }
  h2 { margin: 0 0 4px; font-size: 15.5px; letter-spacing: -0.01em; }
  p { margin: 0; color: var(--muted); font-size: 13.5px; }
  .stills { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
  .stills a {
    font-size: 11.5px;
    color: var(--muted);
    text-decoration: none;
    border: 1px solid var(--line);
    border-radius: 6px;
    padding: 3px 7px;
  }
  .stills a:hover { color: var(--ink); border-color: var(--ink); }
  .ref { color: var(--accent); font-size: 11.5px; font-variant-numeric: tabular-nums; }
  .tour { max-width: 1180px; margin: 0 auto 22px; }
  .tour video { width: 100%; border-radius: 14px; border: 1px solid var(--line); display: block; }
</style>
</head>
<body>
<header>
  <h1>Demo corpus</h1>
  <span class="meta" id="meta"></span>
  <span class="spacer"></span>
  <button id="theme" aria-pressed="false">Dark</button>
</header>

<div class="tour" id="tour"></div>
<main id="grid"></main>

<script type="module">
const manifest = await fetch('./manifest.json').then((response) => response.json());
let theme = 'light';

const grid = document.getElementById('grid');
const tour = document.getElementById('tour');
const meta = document.getElementById('meta');

meta.textContent = [
  manifest.scenes.length + ' scenes',
  manifest.themes.length + ' themes',
  manifest.stage.video.width + '\\u00d7' + manifest.stage.video.height,
  manifest.stage.fps + 'fps',
  'filmed ' + manifest.filmedAt.slice(0, 10),
].join('  \\u00b7  ');

function draw() {
  tour.innerHTML = manifest.tours[theme]
    ? '<video src="' + manifest.tours[theme] + '" controls preload="metadata"></video>'
    : '';

  grid.replaceChildren(
    ...manifest.scenes.flatMap((scene) => {
      const assets = scene.assets[theme];
      if (!assets) {
        return [];
      }

      const article = document.createElement('article');
      article.innerHTML =
        '<div class="frame">' +
        '<img loading="lazy" src="' + (assets.stills[0] ?? assets.poster) + '" alt="">' +
        '<video loop playsinline preload="none" src="' + assets.mp4 + '"></video>' +
        '<span class="badge">' + assets.seconds.toFixed(1) + 's \\u00b7 ' + assets.fps.toFixed(0) + 'fps' +
        (assets.spoken ? ' \\u00b7 \\ud83d\\udd08' : '') + '</span>' +
        '</div>' +
        '<div class="body">' +
        '<h2>' + scene.title + '</h2>' +
        '<p>' + scene.blurb + '</p>' +
        '<div class="stills">' +
        assets.stills
          .map((still) => '<a href="' + still + '" target="_blank">' + still.split('/').pop() + '</a>')
          .join('') +
        (scene.ref ? '<span class="ref">' + scene.ref + '</span>' : '') +
        '</div></div>';

      const frame = article.querySelector('.frame');
      const video = article.querySelector('video');

      // Muted on hover so a grid of cards cannot start talking over itself;
      // a click is a deliberate choice to hear the narration.
      const play = (withSound) => {
        video.muted = !withSound;
        frame.dataset.playing = 'true';
        video.play().catch(() => undefined);
      };
      const stop = () => {
        frame.dataset.playing = 'false';
        video.pause();
        video.currentTime = 0;
      };

      frame.addEventListener('mouseenter', () => play(false));
      frame.addEventListener('mouseleave', stop);
      frame.addEventListener('click', () => {
        if (frame.dataset.playing === 'true' && !video.muted) {
          stop();
          return;
        }
        play(true);
      });

      return [article];
    })
  );
}

document.getElementById('theme').addEventListener('click', (event) => {
  theme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  event.currentTarget.textContent = theme === 'light' ? 'Dark' : 'Light';
  event.currentTarget.setAttribute('aria-pressed', String(theme === 'dark'));
  draw();
});

draw();
</script>
</body>
</html>
`;
}
