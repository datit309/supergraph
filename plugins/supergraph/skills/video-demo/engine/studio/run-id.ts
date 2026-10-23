import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

import { OUT_DIR } from './config.ts';

/**
 * One identity per studio run, shared by every worker in it.
 *
 * Scenes file an entry each, and the teardown collects those entries into the
 * manifest and then clears them. With one run that is trivial. With two runs
 * at once it is a trap that took two attempts to close: the first version
 * swept the whole entries directory, so a finishing run deleted an in-flight
 * one's frames; the second swept "only its own entries", except it worked out
 * which those were by reading every file in a shared directory, which is the
 * same bug wearing a hat. A run that finished at the wrong moment silently
 * took four already-filmed scenes out of another run's manifest, and the only
 * evidence was a count going down.
 *
 * So a run's entries live somewhere only that run knows about. The id is
 * minted in `globalSetup`, which Playwright evaluates once in the main process
 * before it forks any worker, and reaches the workers through the environment
 * they inherit. A worker that somehow starts without one mints its own rather
 * than colliding: the manifest would then come out short, which is loud, and
 * far better than two runs quietly deleting each other's work.
 */
const ENV_KEY = 'DEMO_RUN_ID';

export default function mintRunId(): void {
  process.env[ENV_KEY] = randomBytes(6).toString('hex');
}

export function runId(): string {
  const held = process.env[ENV_KEY];
  if (held) {
    return held;
  }

  const minted = randomBytes(6).toString('hex');
  process.env[ENV_KEY] = minted;
  return minted;
}

/** Where this run files its per-scene entries, before they become a manifest. */
export function entryDir(): string {
  return join(OUT_DIR, '.entries', runId());
}
