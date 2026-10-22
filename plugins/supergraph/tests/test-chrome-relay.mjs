import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { execSync, spawn } from 'node:child_process'
import http from 'node:http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const relayDir = path.resolve(rootDir, 'extensions/chrome-relay')
const bgPath = path.resolve(relayDir, 'background.js')
const popupPath = path.resolve(relayDir, 'popup.js')
const serverPath = path.resolve(relayDir, 'relay-server.js')
const manifestPath = path.resolve(relayDir, 'manifest.json')
const installScriptPath = path.resolve(relayDir, 'scripts/install-extension.sh')

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

try {
  execSync(`node --check "${serverPath}"`, { stdio: 'pipe' })
  console.log('✔ relay-server.js syntax is valid')
} catch (err) {
  assert.fail(`relay-server.js has syntax error: ${err.stderr.toString()}`)
}

// 2. manifest.json and Extension ID derivation (Google Modern Web Guidance)
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
assert.ok(manifest.key, 'manifest.json must have "key" property')
assert.ok(manifest.permissions.includes('alarms'), 'manifest.json must have "alarms" permission')

const der = Buffer.from(manifest.key, 'base64')
const hash = crypto.createHash('sha256').update(der).digest('hex').slice(0, 32)
const derivedExtId = hash.split('').map(c => String.fromCharCode(parseInt(c, 16) + 97)).join('')
assert.strictEqual(derivedExtId, 'gdckcijknndghlpfkfgmodaibicgjhgl', 'Derived extension ID matches standard 32-char ID')

const installScript = fs.readFileSync(installScriptPath, 'utf8')
assert.ok(installScript.includes(derivedExtId), 'install-extension.sh must contain derived extension ID')
console.log('✔ manifest.json & install-extension.sh ID alignment verified')

// 3. background.js MV3 lifecycle, alarms & tab handlers
const bgContent = fs.readFileSync(bgPath, 'utf8')
assert.ok(
  bgContent.includes('chrome.alarms'),
  'background.js must use chrome.alarms for persistent keepalive'
)
assert.ok(
  bgContent.includes('chrome.tabs.onActivated'),
  'background.js must listen for chrome.tabs.onActivated'
)
assert.ok(
  bgContent.includes('create_tab'),
  'background.js must handle create_tab message'
)
assert.ok(
  bgContent.includes('close_tab'),
  'background.js must handle close_tab message'
)
console.log('✔ background.js MV3 alarms & tab lifecycle verified')

// 4. Test relay server live startup on a test port with Security & Target tests
const testPort = 9876
const serverProc = spawn('node', [serverPath], {
  env: { ...process.env, PORT: String(testPort) },
  stdio: 'pipe'
})

let stdout = ''
serverProc.stdout.on('data', (d) => { stdout += d.toString() })

await new Promise((resolve) => setTimeout(resolve, 800))

try {
  // A. Public endpoints without Origin
  const versionRes = await fetch(`http://127.0.0.1:${testPort}/json/version`)
  assert.strictEqual(versionRes.status, 200, '/json/version should respond 200')
  const versionData = await versionRes.json()
  assert.ok(versionData.Browser.includes('Supergraph-Relay'), 'Browser string matches Supergraph-Relay')

  const listRes = await fetch(`http://127.0.0.1:${testPort}/json/list`)
  assert.strictEqual(listRes.status, 200, '/json/list should respond 200')
  const listData = await listRes.json()
  assert.ok(Array.isArray(listData), '/json/list returns an array')

  // B. Security: Whitelisted Origin
  const allowedRes = await fetch(`http://127.0.0.1:${testPort}/json/list`, {
    headers: { Origin: 'http://127.0.0.1:3000' }
  })
  assert.strictEqual(allowedRes.status, 200, 'Whitelisted localhost origin allowed')

  // C. Security: Block untrusted cross-origin
  const evilRes = await fetch(`http://127.0.0.1:${testPort}/json/list`, {
    headers: { Origin: 'https://evil.com' }
  })
  assert.strictEqual(evilRes.status, 403, 'Cross-origin request from evil.com MUST be blocked with 403 Forbidden')
  console.log('✔ Origin whitelist security verified (403 on untrusted domains)')

  // D. WebSocket CSWSH blocking: evil.com WebSocket upgrade rejected
  const evilWsReq = http.request({
    port: testPort,
    host: '127.0.0.1',
    headers: {
      Connection: 'Upgrade',
      Upgrade: 'websocket',
      'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
      'Sec-WebSocket-Version': '13',
      Origin: 'https://evil.com'
    }
  })
  const evilWsStatus = await new Promise((resolve) => {
    evilWsReq.on('response', (res) => resolve(res.statusCode))
    evilWsReq.on('error', () => resolve(403))
    evilWsReq.end()
  })
  assert.strictEqual(evilWsStatus, 403, 'WebSocket upgrade with Origin: evil.com rejected with 403')
  console.log('✔ CSWSH WebSocket security verified')

  // E. Live CDP Target.createTarget & Target.closeTarget contract roundtrip
  const browserWs = new WebSocket(`ws://127.0.0.1:${testPort}/devtools/browser`)
  await new Promise((resolve, reject) => {
    browserWs.onopen = resolve
    browserWs.onerror = reject
  })

  // 1. Without extension, createTarget returns graceful error
  browserWs.send(JSON.stringify({ id: 101, method: 'Target.createTarget', params: { url: 'https://example.com' } }))
  const errRes = await new Promise((resolve) => {
    browserWs.onmessage = (e) => resolve(JSON.parse(e.data))
  })
  assert.strictEqual(errRes.id, 101)
  assert.ok(errRes.error?.message.includes('Extension is not connected'), 'Graceful error when extension is not connected')

  // 2. Connect mock extension
  const extWs = new WebSocket(`ws://127.0.0.1:${testPort}/extension`)
  await new Promise((resolve, reject) => {
    extWs.onopen = resolve
    extWs.onerror = reject
  })

  extWs.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.type === 'create_tab') {
      extWs.send(JSON.stringify({
        type: 'create_tab_response',
        id: msg.id,
        tabId: 999,
        success: true
      }))
    } else if (msg.type === 'close_tab') {
      extWs.send(JSON.stringify({
        type: 'close_tab_response',
        id: msg.id,
        tabId: msg.tabId,
        success: true
      }))
    }
  }

  // 3. With extension connected: Target.createTarget
  browserWs.send(JSON.stringify({ id: 102, method: 'Target.createTarget', params: { url: 'https://supergraph.dev' } }))
  const createRes = await new Promise((resolve) => {
    browserWs.onmessage = (e) => resolve(JSON.parse(e.data))
  })
  assert.strictEqual(createRes.id, 102)
  assert.strictEqual(createRes.result?.targetId, '999', 'Target.createTarget returned created tabId')
  console.log('✔ CDP Target.createTarget bridge verified')

  // 4. With extension connected: Target.closeTarget
  browserWs.send(JSON.stringify({ id: 103, method: 'Target.closeTarget', params: { targetId: '999' } }))
  const closeRes = await new Promise((resolve) => {
    browserWs.onmessage = (e) => resolve(JSON.parse(e.data))
  })
  assert.strictEqual(closeRes.id, 103)
  assert.strictEqual(closeRes.result?.success, true, 'Target.closeTarget returned success')
  console.log('✔ CDP Target.closeTarget bridge verified')

  browserWs.close()
  extWs.close()

  console.log('✔ relay-server HTTP & Security contracts operational on test port')
} finally {
  serverProc.kill('SIGTERM')
}

console.log('✔ All Chrome Relay tests passed successfully')
