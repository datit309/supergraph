import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { WdaClient } from '../src/wda/client.js'
import { UiAutomator2Client } from '../src/uiautomator2/client.js'
import { WdaMcpServer } from '../src/wda/mcp-server.js'
import { UiAutomator2McpServer } from '../src/uiautomator2/mcp-server.js'

async function endpoint(t, response = { value: null }) {
  const calls = []
  const server = http.createServer(async (req, res) => {
    let body = ''
    for await (const chunk of req) body += chunk
    calls.push({ path: req.url, method: req.method, body: body ? JSON.parse(body) : null })
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(response))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  return { calls, baseUrl: `http://127.0.0.1:${server.address().port}` }
}

for (const Client of [WdaClient, UiAutomator2Client]) {
  for (const response of [{ value: { error: 'invalid session id', message: 'expired session' } }, { status: 13, value: { message: 'legacy failure' } }]) {
    test(`${Client.name} rejects HTTP 200 protocol error ${JSON.stringify(response)}`, async t => {
      const api = await endpoint(t, response)
      await assert.rejects(new Client(api).status(), /expired session|legacy failure/)
    })
  }
  test(`${Client.name} rejects malformed successful session without keeping old ID`, async t => {
    const api = await endpoint(t, { value: { capabilities: {} } })
    const client = new Client({ ...api, sessionId: 'old' })
    await assert.rejects(client.createSession('example.app'), /session.*id/i)
    assert.equal(client.sessionId, null)
  })
  test(`${Client.name} accepts nested session ID`, async t => {
    const api = await endpoint(t, { value: { sessionId: 'new' } })
    const client = new Client(api)
    await client.createSession('example.app')
    assert.equal(client.sessionId, 'new')
  })
}

test('WDA coordinate tap uses registered route without legacy nil suffix', async t => {
  const api = await endpoint(t)
  await new WdaClient({ ...api, sessionId: 's' }).tap(10, 20)
  assert.equal(api.calls[0].path, '/session/s/wda/tap')
})

test('Android focused fill uses keys endpoint with replacement payload', async t => {
  const api = await endpoint(t)
  await new UiAutomator2Client({ ...api, sessionId: 's' }).fill(null, 'hello')
  assert.deepEqual(api.calls[0], { path: '/session/s/keys', method: 'POST', body: { text: 'hello', replace: true } })
})
test('Android element fill replaces existing content', async t => {
  const api = await endpoint(t)
  await new UiAutomator2Client({ ...api, sessionId: 's' }).fill('e', '')
  assert.deepEqual(api.calls[0].body, { text: '', replace: true })
})
test('Android source requests session scoped XML endpoint without format query', async t => {
  const api = await endpoint(t, { value: '<hierarchy />' })
  const client = new UiAutomator2Client({ ...api, sessionId: 's' })
  assert.deepEqual(await client.source(), { value: '<hierarchy />' })
  assert.equal(api.calls[0].path, '/session/s/source')
})
test('Android screenshot is session scoped', async t => {
  const api = await endpoint(t, { value: 'png' })
  assert.equal(await new UiAutomator2Client({ ...api, sessionId: 's' }).screenshot(), 'png')
  assert.equal(api.calls[0].path, '/session/s/screenshot')
})
test('Android coordinate tap uses registered gesture endpoint', async t => {
  const api = await endpoint(t)
  await new UiAutomator2Client({ ...api, sessionId: 's' }).tap(1.2, 2.8)
  assert.deepEqual(api.calls[0], { path: '/session/s/appium/gestures/click', method: 'POST', body: { x: 1, y: 3 } })
})
test('WDA app lifecycle uses plural apps routes including state', async t => {
  const api = await endpoint(t)
  const client = new WdaClient({ ...api, sessionId: 's' })
  for (const name of ['appLaunch', 'appActivate', 'appTerminate', 'appState']) await client[name]('bundle')
  assert.deepEqual(api.calls.map(c => c.path), ['launch', 'activate', 'terminate', 'state'].map(action => `/session/s/wda/apps/${action}`))
  assert.ok(api.calls.every(c => c.method === 'POST' && c.body.bundleId === 'bundle'))
})
for (const [Client, path] of [[WdaClient, '/session/s/window/size'], [UiAutomator2Client, '/session/s/window/current/size']]) {
  test(`${Client.name} reads current dimensions`, async t => {
    const api = await endpoint(t, { value: { width: 800, height: 600 } })
    assert.deepEqual(await new Client({ ...api, sessionId: 's' }).windowSize(), { value: { width: 800, height: 600 } })
    assert.equal(api.calls[0].path, path)
  })
}
for (const [Server, prefix] of [[WdaMcpServer, 'wda'], [UiAutomator2McpServer, 'uiauto']]) {
  test(`${prefix} directional swipe uses server dimensions`, async () => {
    const server = new Server()
    let coords
    server.client.windowSize = async () => ({ value: { width: 800, height: 600 } })
    server.client.swipe = async (...args) => { coords = args }
    await server.executeTool(`${prefix}_swipe`, { direction: 'up' })
    assert.deepEqual(coords.slice(0, 4), [400, 450, 400, 150])
  })
}
test('Android MCP requests XML snapshots and wait source', async () => {
  const server = new UiAutomator2McpServer()
  const formats = []
  server.client.source = async format => { formats.push(format); return { value: '<hierarchy />' } }
  server.parser.parse = () => ({ text: 'tree', elements: [{ label: 'ready', ref: '@e1', type: 'Text' }] })
  await server.executeTool('uiauto_snapshot')
  await server.executeTool('uiauto_wait', { text: 'ready' })
  assert.deepEqual(formats, ['xml', 'xml'])
})
for (const method of ['source', 'screenshot', 'windowSize']) {
  test(`Android ${method} requires session before network request`, async () => {
    const client = new UiAutomator2Client()
    let called = false
    client.request = async () => { called = true; return {} }
    await assert.rejects(client[method](), /No active/)
    assert.equal(called, false)
  })
}

test('Android swipe uses W3C touch actions instead of Appium middleware routes', async t => {
  const api = await endpoint(t)
  await new UiAutomator2Client({ ...api, sessionId: 's' }).swipe(10, 20, 30, 40)
  assert.equal(api.calls[0].path, '/session/s/actions')
  const [pointer] = api.calls[0].body.actions
  assert.equal(pointer.type, 'pointer')
  assert.equal(pointer.parameters.pointerType, 'touch')
  assert.deepEqual(pointer.actions.map(a => a.type), ['pointerMove', 'pointerDown', 'pause', 'pointerMove', 'pointerUp'])
  assert.deepEqual([pointer.actions[0].x, pointer.actions[0].y, pointer.actions[3].x, pointer.actions[3].y], [10, 20, 30, 40])
})

test('Android hideKeyboard does not silently claim unsupported endpoint succeeded', async () => {
  const client = new UiAutomator2Client({ sessionId: 's' })
  await assert.rejects(client.hideKeyboard(), /not supported|unsupported/i)
})
for (const [method, args] of [['activateApp', ['app']], ['terminateApp', ['app']], ['openUrl', ['https://example.com']]]) {
  test(`Android ${method} explicitly rejects unsupported direct-server operation`, async () => {
    const client = new UiAutomator2Client({ sessionId: 's' })
    await assert.rejects(client[method](...args), /not supported|unsupported/i)
  })
}
