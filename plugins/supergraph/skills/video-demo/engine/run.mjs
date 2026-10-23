#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

/**
 * The one entry point, and the only thing that knows where a project's
 * workspace is.
 *
 * Everything downstream is told rather than asked: the engine reads
 * `DEMO_CONFIG`, `DEMO_PROJECT` and `DEMO_APP_ROOT` from the environment this
 * sets up, so no module has to work out its own relationship to the app. That
 * is what lets one clone of the skill film every project on the machine
 * without anything being copied into any of them.
 *
 * It is also a script rather than a shell chain because the arguments matter.
 * A package script of the form `pin-build && playwright test` silently breaks
 * the first command anybody runs: with pnpm, `demo -- --grep smoke` appends
 * the separator too, Playwright reads everything after `--` as positional file
 * filters rather than options, does not complain, and films the entire corpus.
 * A script can look at what it is forwarding.
 */

const HOME = join(homedir(), '.video-demo');

function usage(message) {
  process.stderr.write(
    `demo: ${message}\n\n` +
      '  demo [--project <path>] [playwright args]\n\n' +
      '  Run from inside the app you want to film, or pass --project to name a\n' +
      "  workspace. Scaffold one first with the skill's scripts/scaffold.mjs.\n"
  );
  process.exit(1);
}

/** `--project` is ours; everything else belongs to Playwright. */
const forwarded = [];
let asked = null;

const argv = process.argv.slice(2).filter((arg) => arg !== '--');
for (let at = 0; at < argv.length; at += 1) {
  const arg = argv[at];
  if (arg === '--project') {
    asked = argv[at + 1];
    at += 1;
    continue;
  }
  if (arg.startsWith('--project=')) {
    asked = arg.slice('--project='.length);
    continue;
  }
  forwarded.push(arg);
}

/**
 * A workspace is found by asking, by environment, or by the repo you are
 * standing in — in that order. The last of those is what makes "record a demo
 * of this app" work twice: each workspace records the repo it belongs to in
 * `.origin`, so the one whose `appRoot` contains the current directory is this
 * repo's workspace, however it was keyed.
 */
async function findWorkspace() {
  if (asked) {
    return resolve(asked);
  }
  if (process.env.DEMO_PROJECT) {
    return resolve(process.env.DEMO_PROJECT);
  }

  const cwd = process.cwd();
  const names = await readdir(HOME).catch(() => []);
  const matches = [];

  for (const name of names) {
    const origin = await readFile(join(HOME, name, '.origin'), 'utf8').catch(
      () => null
    );
    if (!origin) {
      continue;
    }
    const appRoot = JSON.parse(origin).appRoot;
    if (appRoot && (cwd === appRoot || cwd.startsWith(`${appRoot}/`))) {
      matches.push({ path: join(HOME, name), appRoot });
    }
  }

  if (matches.length === 1) {
    return matches[0].path;
  }

  if (matches.length > 1) {
    // The deepest `appRoot` wins: a workspace for `apps/web` is more specific
    // than one for the repo root, and being inside both is normal.
    matches.sort((left, right) => right.appRoot.length - left.appRoot.length);
    return matches[0].path;
  }

  if (names.length === 0) {
    usage(`no workspaces in ${HOME}`);
  }

  usage(
    `no workspace for ${cwd}. Existing ones:\n` +
      names.map((name) => `    ${name}`).join('\n')
  );
}

const project = await findWorkspace();
const config = join(project, 'demo.config.ts');

const origin = await readFile(join(project, '.origin'), 'utf8').catch(() => null);
const appRoot = origin ? JSON.parse(origin).appRoot : null;

/**
 * Set on this process, not just handed to the child: the mode has to be known
 * here (a live URL has nothing to build), and learning it means importing the
 * engine's own config module, which reads exactly these.
 */
process.env.DEMO_CONFIG = config;
process.env.DEMO_PROJECT = project;
if (appRoot) {
  process.env.DEMO_APP_ROOT = appRoot;
}

const env = process.env;

const ENGINE = import.meta.dirname;
const SKILL = join(ENGINE, '..');

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env, ...options });
    child.on('error', reject);
    child.on('close', (code, signal) =>
      signal
        ? reject(new Error(`${command} killed by ${signal}`))
        : resolvePromise(code ?? 0)
    );
  });
}

const { SITE } = await import(join(ENGINE, 'studio', 'config.ts'));

/**
 * `DEMO_BUILD=0` skips the rebuild, which is the difference between a
 * twenty-second iteration and a four-minute one while writing a scene. The
 * default is to build, because a corpus of the code in the tree is the point.
 * A live URL has nothing to build either way.
 */
if (!SITE && process.env.DEMO_BUILD !== '0') {
  const built = await run(process.execPath, [join(ENGINE, 'pin-build.mjs')]);
  if (built !== 0) {
    process.exit(built);
  }
}

process.exit(
  await run(join(SKILL, 'node_modules', '.bin', 'playwright'), [
    'test',
    `--config=${join(ENGINE, 'playwright.demo.ts')}`,
    ...forwarded,
  ])
);
