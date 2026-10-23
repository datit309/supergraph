#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { cp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { APP_ROOT, PROJECT, SITE, demo } from './studio/config.ts';

/**
 * Builds the app fresh, then puts the result somewhere private.
 *
 * A build directory is one anybody in the repo may rebuild at any moment,
 * mid-run, with a different environment. That is exactly what happened once:
 * another session's build had no same-origin API base, so it baked the real
 * one in instead. Every request then went cross-origin, missed the studio's
 * stubs entirely, and the app did the correct thing with no session, which is
 * to show its own home page. Fifty-four scenes then failed looking for an app
 * that was sitting on its login screen, and nothing in that failure pointed
 * at a build.
 *
 * So the corpus is filmed from a copy nobody else writes to, and the check
 * afterwards is the other half: a build with the wrong API base looks perfect
 * until it runs, so `demo.build.forbid` is verified here, where the message
 * can say what is wrong, rather than later as a wall of missing locators.
 */

if (SITE) {
  process.stdout.write(`demo: filming ${SITE}, nothing to build\n`);
  process.exit(0);
}

/**
   * The pinned copy lives in the workspace, not beside the engine: the engine
   * is one shared clone and two projects filming at once would otherwise
   * overwrite each other's bundle.
   */
const PINNED = join(PROJECT, '.build');
const OUTPUT = join(APP_ROOT, demo.build.output);

function runBuild(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      cwd: APP_ROOT,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`build exited ${code}`))
    );
  });
}

async function jsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const found = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        return jsFiles(full);
      }
      return entry.name.endsWith('.js') ? [full] : [];
    })
  );
  return found.flat();
}

/** Kept per file, not joined into one blob, so a hit can name where it landed. */
async function readAssets() {
  const files = await jsFiles(PINNED);
  return Promise.all(
    files.map(async (file) => ({
      file,
      text: await readFile(file, 'utf8').catch(() => ''),
    }))
  );
}

process.stdout.write(`demo: building (${demo.build.command})\n`);
await runBuild(demo.build.command);

const built = await stat(join(OUTPUT, 'index.html')).catch(() => null);
if (!built) {
  process.stderr.write(
    `demo: build finished but ${OUTPUT} has no index.html.\n` +
      '      check build.output in demo/demo.config.ts.\n'
  );
  process.exit(1);
}

await rm(PINNED, { recursive: true, force: true });
await cp(OUTPUT, PINNED, { recursive: true });

const assets = await readAssets();

/**
 * A string or a pattern, because both are reasonable things to reach for and
 * the failure mode of guessing wrong is a throw inside the one script whose
 * whole job is a clear message about a misconfigured build.
 */
const hit = (rule, text) =>
  typeof rule === 'string' ? text.includes(rule) : rule.test(text);

for (const rule of demo.build.forbid ?? []) {
  const found = assets.find((asset) => hit(rule, asset.text));
  if (!found) {
    continue;
  }

  process.stderr.write(
    `demo: the pinned build matches a forbidden rule: ${String(rule)}\n` +
      `      found in: ${relative(PINNED, found.file)}\n` +
      '      This usually means the build ran without the same-origin API\n' +
      '      base, so every request would go cross-origin, miss the mocks,\n' +
      '      and leave the app on its login screen while scene after scene\n' +
      '      fails looking for content. Check build.command in\n' +
      '      demo/demo.config.ts.\n'
  );
  process.exit(1);
}

process.stdout.write(`demo: pinned ${OUTPUT} to ${PINNED}\n`);
