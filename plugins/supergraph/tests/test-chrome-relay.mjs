import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync, spawn } from 'node:child_process'
import http from 'node:http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const relayDir = path.resolve(rootDir, 'extensions/chrome-relay')
const bgPath = path.resolve(relayDir, 'background.js')
const popupPath = path.resolve(relayDir, 'popup.js')
const serverPath = path.resolve(relayDir, 'relay-server.js')

console.log('Testing Chrome Relay extension & server contracts...')

// 1. Syntax check on files
try {
  execSync(`node --check "${bgPath}"`, { stdio: 'pipe' })
  console.log('✔ background.js syntax is valid')
} catch (err) {
  assert.fail(`background.js has syntax error: ${err.stderr.toString()}`)
}

try {
  execSync(`node --check "${popupPath}"`, { stdio: 'pipe' })
  console.log('✔ popup.js syntax is valid')
} catch (err) {
  assert.fail(`popup.js has syntax error: ${err.stderr.toString()}`)
}

// 2. popup.js hygiene
const popupContent = fs.readFileSync(popupPath, 'utf8')
assert.ok(
  !popupContent.includes('659099347'),
  'popup.js must not contain hardcoded test tabId 659099347'
)

// 3. background.js runtime listener & keepalive
const bgContent = fs.readFileSync(bgPath, 'utf8')
assert.ok(
  bgContent.includes('chrome.runtime.onMessage.addListener'),
  'background.js must listen for chrome.runtime.onMessage (e.g. reconnect)'
)
assert.ok(
  bgContent.includes('ping') || bgContent.includes('keepalive') || bgContent.includes('keepAlive'),
  'background.js must include keepalive / ping mechanism for MV3'
)

// 4. Test relay server live startup on a test port
const testPort = 9876
const serverProc = spawn('node', [serverPath], {
  env: { ...process.env, PORT: String(testPort) },
  stdio: 'pipe'
})

let stdout = ''
serverProc.stdout.on('data', (d) => { stdout += d.toString() })

await new Promise((resolve) => setTimeout(resolve, 800))

try {
  const versionRes = await fetch(`http://127.0.0.1:${testPort}/json/version`)
  assert.strictEqual(versionRes.status, 200, '/json/version should respond 200')
  const versionData = await versionRes.json()
  assert.ok(versionData.Browser.includes('Supergraph-Relay'), 'Browser string matches Supergraph-Relay')

  const listRes = await fetch(`http://127.0.0.1:${testPort}/json/list`)
  assert.strictEqual(listRes.status, 200, '/json/list should respond 200')
  const listData = await listRes.json()
  assert.ok(Array.isArray(listData), '/json/list returns an array')

  console.log('✔ relay-server HTTP endpoints operational on test port')
} finally {
  serverProc.kill('SIGTERM')
}

console.log('✔ All Chrome Relay tests passed successfully')
