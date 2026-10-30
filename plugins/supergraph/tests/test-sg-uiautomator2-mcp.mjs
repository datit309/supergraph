import assert from 'node:assert'
import http from 'node:http'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const binPath = path.resolve(__dirname, '../bin/sg-uiautomator2-mcp.js')

console.log('Testing sg-uiautomator2-mcp server and protocol...')

// 1. Setup Mock UiAutomator2 HTTP Server on port 16790
const mockServer = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json')

  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({
      status: 0,
      value: {
        ready: true,
        message: 'UiAutomator2 Server is ready to accept commands',
      },
      sessionId: null,
    }))
    return
  }

  if (req.url === '/session' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      res.writeHead(200)
      res.end(JSON.stringify({
        status: 0,
        value: {
          sessionId: 'mock-android-session-67890',
        },
        sessionId: 'mock-android-session-67890',
      }))
    })
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: 'not found' }))
})

await new Promise(resolve => mockServer.listen(16790, '127.0.0.1', resolve))

// 2. Spawn MCP Server with UIAUTOMATOR2_URL pointing to mock server
const proc = spawn(process.execPath, [binPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    UIAUTOMATOR2_URL: 'http://127.0.0.1:16790',
  },
})

let stdout = ''
proc.stdout.on('data', chunk => {
  stdout += chunk.toString()
})

const send = msg => {
  proc.stdin.write(JSON.stringify(msg) + '\n')
}

// Step A: Initialize MCP
send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-uiauto-client', version: '1.0.0' },
  },
})

await new Promise(r => setTimeout(r, 400))
assert.ok(stdout.includes('"supergraph-uiautomator2"'), 'MCP initialize response must include supergraph-uiautomator2')

// Step B: Query tools/list
send({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {},
})

await new Promise(r => setTimeout(r, 400))
assert.ok(stdout.includes('uiauto_status'), 'tools/list must include uiauto_status')
assert.ok(stdout.includes('uiauto_device_list'), 'tools/list must include uiauto_device_list')
assert.ok(stdout.includes('uiauto_session_start'), 'tools/list must include uiauto_session_start')
assert.ok(stdout.includes('uiauto_snapshot'), 'tools/list must include uiauto_snapshot')
assert.ok(stdout.includes('uiauto_tap'), 'tools/list must include uiauto_tap')
assert.ok(stdout.includes('uiauto_fill'), 'tools/list must include uiauto_fill')
assert.ok(stdout.includes('uiauto_press_keycode'), 'tools/list must include uiauto_press_keycode')
assert.ok(stdout.includes('uiauto_screenshot'), 'tools/list must include uiauto_screenshot')
assert.ok(stdout.includes('uiauto_handle_alert'), 'tools/list must include uiauto_handle_alert')

// Step C: Call uiauto_status
send({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'uiauto_status',
    arguments: {},
  },
})

await new Promise(r => setTimeout(r, 400))
assert.ok(stdout.includes('UiAutomator2 Server is ready'), 'uiauto_status call must return status from mock server')

// Clean up
proc.kill()
mockServer.close()

console.log('✔ All sg-uiautomator2-mcp server and protocol tests passed successfully!')
