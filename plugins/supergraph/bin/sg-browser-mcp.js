#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'

const req = createRequire(import.meta.url)

let cliPath = null
try {
  const pkgJson = req.resolve('@playwright/mcp/package.json')
  cliPath = join(dirname(pkgJson), 'cli.js')
} catch {
  try {
    cliPath = join(dirname(req.resolve('../../package.json')), 'node_modules/@playwright/mcp/cli.js')
  } catch {}
}

const args = []
if (cliPath && existsSync(cliPath)) {
  args.push(cliPath)
}

// Config defaults
const browser = process.env.SG_BROWSER || 'chrome'
const headless = process.env.SG_BROWSER_HEADLESS === 'true'
const cdpEndpoint = process.env.SG_BROWSER_CDP
const userDataDir = process.env.SG_BROWSER_USER_DATA_DIR

if (cdpEndpoint) {
  args.push('--cdp-endpoint', cdpEndpoint)
} else {
  args.push('--browser', browser)
  if (headless) {
    args.push('--headless')
  }
  if (userDataDir) {
    args.push('--user-data-dir', userDataDir)
  }
}

// Additional helpful capabilities
args.push('--caps', 'vision,devtools')

const cmd = cliPath && existsSync(cliPath) ? process.execPath : 'npx'
const finalArgs = cliPath && existsSync(cliPath) ? args : ['-y', '@playwright/mcp@0.0.80', ...args]

const child = spawn(cmd, finalArgs, {
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
