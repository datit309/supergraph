#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'

const req = createRequire(import.meta.url)

let binPath = 'agent-browser'
try {
  const pkgJson = req.resolve('agent-browser/package.json')
  const localBin = join(dirname(pkgJson), 'bin/agent-browser')
  if (existsSync(localBin)) {
    binPath = localBin
  }
} catch {
  try {
    const rootBin = join(dirname(req.resolve('../../package.json')), 'node_modules/.bin/agent-browser')
    if (existsSync(rootBin)) {
      binPath = rootBin
    }
  } catch {}
}

// Configurable tools profile (default to 'core,network,react' to save ~50k-70k tokens)
const toolsProfile = process.env.SG_BROWSER_TOOLS || 'core,network,react'
const args = ['mcp', '--tools', toolsProfile]

// Human pointer movement by default (bypasses bot detection)
const inputMode = process.env.SG_BROWSER_INPUT_MODE || 'human'
args.push('--input-mode', inputMode)

// Anti-automation flag
args.push('--args', '--disable-blink-features=AutomationControlled')

// Headed mode if configured
if (process.env.SG_BROWSER_HEADED === 'true') {
  args.push('--headed')
}

// CDP or Profile attachment
if (process.env.SG_BROWSER_CDP) {
  args.push('--cdp', process.env.SG_BROWSER_CDP)
} else if (process.env.SG_BROWSER_AUTO_CONNECT === 'true') {
  args.push('--auto-connect')
} else if (process.env.SG_BROWSER_PROFILE) {
  args.push('--profile', process.env.SG_BROWSER_PROFILE)
}

const child = spawn(binPath, args, {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
  },
})

process.stdin.pipe(child.stdin)
child.stdout.pipe(process.stdout)

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0))
})
process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
