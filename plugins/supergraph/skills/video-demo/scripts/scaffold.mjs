#!/usr/bin/env node
import {
  cp,
  mkdir,
  readFile,
  readdir,
  realpath,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Makes a workspace for one project, and touches nothing else.
 *
 * A workspace holds the six things that are the user's — the config, the
 * mocks, the seed data, the locators, the scenes, and the corpus they produce
 * — and nothing of the engine's. The engine stays in the skill, one copy,
 * shared by every project on the machine.
 *
 * It deliberately writes nothing into the app being filmed. Not a script in
 * its package.json, not a line in its .gitignore, not a dependency: an app
 * that happens to be filmed should be indistinguishable afterwards from one
 * that was not. The only thing a run ever writes near the app is the app's own
 * build output, put there by the app's own build command.
 */

const SKILL = fileURLToPath(new URL('../', import.meta.url));
const TEMPLATE = join(SKILL, 'template/demo');
const HOME = join(homedir(), '.video-demo');

const argv = process.argv.slice(2);
let site = null;
let where = null;
let target = null;
let force = false;

for (let at = 0; at < argv.length; at += 1) {
  const arg = argv[at];
  if (arg === '--site') {
    site = argv[at + 1];
    at += 1;
  } else if (arg.startsWith('--site=')) {
    site = arg.slice('--site='.length);
  } else if (arg === '--project') {
    where = argv[at + 1];
    at += 1;
  } else if (arg.startsWith('--project=')) {
    where = arg.slice('--project='.length);
  } else if (arg === '--force') {
    force = true;
  } else if (!arg.startsWith('-')) {
    target = arg;
  }
}

if (!site && !target) {
  process.stderr.write(
    'scaffold: name what to film.\n\n' +
      '  scaffold.mjs <appRoot>            build the repo at <appRoot> and film it\n' +
      '  scaffold.mjs --site <url>         film a URL that is already live\n\n' +
      '  --project <path>   put the workspace here instead of ~/.video-demo/<key>\n' +
      '  --force            replace an existing workspace\n'
  );
  process.exit(1);
}

/**
 * A name a person can read, because they will type it. The app's own package
 * name where there is one, the URL's host for a live site, and a numbered
 * suffix only when two different projects genuinely collide.
 */
async function keyFor(appRoot) {
  if (site) {
    return new URL(site).host;
  }

  const raw = await readFile(join(appRoot, 'package.json'), 'utf8').catch(
    () => null
  );
  const named = raw ? JSON.parse(raw).name : null;

  return (named ?? basename(appRoot))
    .replace(/^@/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function freeWorkspace(key, appRoot) {
  for (let suffix = 1; suffix < 20; suffix += 1) {
    const path = join(HOME, suffix === 1 ? key : `${key}-${suffix}`);
    const found = await stat(path).catch(() => null);
    if (!found) {
      return path;
    }

    const origin = await readFile(join(path, '.origin'), 'utf8').catch(() => null);
    const owner = origin ? JSON.parse(origin).appRoot : null;
    if (force || owner === appRoot || (!owner && site)) {
      return path;
    }
  }
  throw new Error(`scaffold: too many workspaces named ${key}`);
}

const appRoot = target ? resolve(target) : null;
if (appRoot) {
  const found = await stat(appRoot).catch(() => null);
  if (!found?.isDirectory()) {
    process.stderr.write(`scaffold: ${appRoot} is not a directory\n`);
    process.exit(1);
  }
}

const key = await keyFor(appRoot);
const project = where ? resolve(where) : await freeWorkspace(key, appRoot);

const existing = await readdir(project).catch(() => null);

/**
 * A workspace that already has a config keeps it. The links and `.origin`
 * below are still rewritten every time: they are infrastructure rather than
 * anybody's work, an install or a moved repo invalidates them, and a run that
 * fails because a symlink went stale reports something else entirely.
 */
const reuse = Boolean(existing?.includes('demo.config.ts')) && !force;

await mkdir(join(project, 'scenes'), { recursive: true });

/** The stubs, minus the ones a live URL has no use for. */
if (!reuse) {
await cp(join(TEMPLATE, 'ui.ts'), join(project, 'ui.ts'), { force: true });
await cp(
  join(TEMPLATE, 'scenes/smoke.scene.ts'),
  join(project, 'scenes/smoke.scene.ts'),
  { force: true }
);

if (site) {
  await writeFile(
    join(project, 'demo.config.ts'),
    `import { defineDemo } from 'video-demo/define';
import { networkIdle } from 'video-demo/ready';

/**
 * A live URL, filmed as it stands: no build, no mocks, no pinned clock. The
 * film is of whatever was served when it ran, so re-film when the page
 * changes rather than expecting yesterday's corpus to still be true.
 */
export default defineDemo({
  name: '${key}',
  site: '${new URL(site).origin}',

  clock: { timezone: 'UTC', locale: 'en-US' },

  themes: ['dark'],

  entries: {
    app: {
      // TODO: the path on that origin this films, and what "loaded" means for
      // it. \`networkIdle\` is right for most pages; prefer something the page
      // says about itself once its data has landed.
      path: '${new URL(site).pathname}',
      ready: networkIdle(),
    },
  },
});
`
  );
} else {
  await cp(join(TEMPLATE, 'demo.config.ts'), join(project, 'demo.config.ts'), {
    force: true,
  });
  await cp(join(TEMPLATE, 'mock.ts'), join(project, 'mock.ts'), { force: true });
  // Empty, because seeded data is written per app and a stub would only be
  // something to delete.
  await mkdir(join(project, 'seed'), { recursive: true });
}

}

/**
 * A tsconfig for the workspace, carrying the app's own path mapping across.
 *
 * Not a convenience. Playwright reads the tsconfig nearest a test file and
 * applies its `paths`, which is how a monorepo app's `@app/core/*` imports
 * resolve at all: the package ships source, the mapping points at that
 * source, and without it the specifier lands in `node_modules` where
 * Playwright will not guess a `.ts` extension. Scenes used to live inside the
 * app and inherited this for free. They do not live there any more, so it
 * comes with them, rewritten to absolute paths because the workspace is
 * somewhere else entirely.
 */
async function readTsconfig(dir) {
  const raw = await readFile(join(dir, 'tsconfig.json'), 'utf8').catch(
    () => null
  );
  if (!raw) {
    return null;
  }
  // Comments are legal in a tsconfig and not in JSON.
  const stripped = raw
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

async function appPaths() {
  if (!appRoot) {
    return {};
  }

  const own = await readTsconfig(appRoot);
  if (!own) {
    return {};
  }

  const layers = [own];
  if (typeof own.extends === 'string' && own.extends.startsWith('.')) {
    const parent = await readTsconfig(join(appRoot, own.extends, '..'));
    if (parent) {
      layers.unshift(parent);
    }
  }

  const out = {};
  for (const layer of layers) {
    const paths = layer.compilerOptions?.paths ?? {};
    for (const [specifier, targets] of Object.entries(paths)) {
      out[specifier] = targets.map((target) =>
        target.startsWith('.') ? resolve(appRoot, target) : target
      );
    }
  }
  return out;
}

await writeFile(
  join(project, 'tsconfig.json'),
  `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        types: ['node'],
        baseUrl: '.',
        paths: {
          ...(await appPaths()),
          'video-demo/*': [join(SKILL, 'engine/studio/*')],
        },
      },
      include: ['**/*.ts'],
      exclude: ['node_modules', 'app', '.build', 'demo-out'],
    },
    null,
    2
  )}\n`
);

/** `type: module` here, so nothing depends on what the app's package says. */
await writeFile(
  join(project, 'package.json'),
  `${JSON.stringify({ name: `demo-${key}`, private: true, type: 'module' }, null, 2)}\n`
);

async function link(from, to) {
  await symlink(to, from).catch(async (error) => {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  });
}

/**
 * The workspace's own `node_modules`, as a merged view rather than one link.
 *
 * A single symlink to the skill's `node_modules` is enough until a seed file
 * imports one of the app's own packages, which is exactly what seed data
 * written against a typed helper does: `@calendar/core` is not the skill's
 * dependency and never will be. Node gives a directory one `node_modules`
 * slot, so the slot has to hold both.
 *
 * So it is a real directory of links: the engine and the one Playwright
 * install come from the skill, everything else from the app. The skill's
 * Playwright wins deliberately — two physical copies in one run is the error
 * Playwright refuses outright, and it must be the copy the engine itself
 * loaded.
 */
async function linkModules() {
  const modules = join(project, 'node_modules');
  await mkdir(modules, { recursive: true });

  await link(join(modules, 'video-demo'), SKILL);
  await link(join(modules, '@playwright'), join(SKILL, 'node_modules/@playwright'));
  await link(join(modules, '.bin'), join(SKILL, 'node_modules/.bin'));

  if (!appRoot) {
    return;
  }

  const theirs = join(appRoot, 'node_modules');
  const entries = await readdir(theirs).catch(() => []);
  let linked = 0;

  for (const entry of entries) {
    if (entry === '.bin' || entry === 'video-demo' || entry === '@playwright') {
      continue;
    }
    const before = await stat(join(modules, entry)).catch(() => null);
    if (before) {
      continue;
    }

    /**
     * Linked to where the package really is, not to the app's link to it.
     *
     * A workspace package in a monorepo is itself a symlink into `packages/`,
     * and pointing at the link means every resolution below it runs through a
     * path with `node_modules` in it. Playwright skips transforming those, so
     * a source-shipping package's extensionless import
     * (`@app/core/src/lib/time`) stops resolving, while the same import works
     * in the app's own tests. Resolving the link first keeps the real path
     * clean and the two behave the same.
     */
    const real = await realpath(join(theirs, entry)).catch(() =>
      join(theirs, entry)
    );
    await link(join(modules, entry), real);
    linked += 1;
  }

  if (linked > 0) {
    process.stdout.write(`  linked ${linked} package(s) from the app\n`);
  }
}

await linkModules();
if (appRoot) {
  await link(join(project, 'app'), appRoot);
  await writeFile(
    join(project, '.origin'),
    `${JSON.stringify({ appRoot }, null, 2)}\n`
  );
}

process.stdout.write(
  `scaffold: ${project}${reuse ? ' (kept the config that was already here)' : ''}\n`
);
process.stdout.write(
  site
    ? `  films ${new URL(site).origin}\n`
    : `  films the build in ${appRoot}\n`
);
process.stdout.write('\nnext:\n');
process.stdout.write(`  1. fill in ${join(project, 'demo.config.ts')}\n`);
if (!site) {
  process.stdout.write(`  2. write ${join(project, 'mock.ts')} and seed/\n`);
}
process.stdout.write(
  `  ${site ? '2' : '3'}. film the smoke scene: DEMO_VOICE=0 ${join(SKILL, 'scripts/demo')} --grep smoke\n`
);

if (where) {
  process.stdout.write(
    '\nthis workspace is inside a repo, so add these to its .gitignore:\n' +
      '  node_modules/\n  .build/\n  demo-out/\n'
  );
}
