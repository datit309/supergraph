import assert from 'node:assert'
import http from 'node:http'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const binPath = path.resolve(__dirname, '../bin/sg-wda-mcp.js')

console.log('Testing sg-wda-mcp server and protocol...')

// 1. Setup a Mock WDA HTTP Server on test port 18100
const mockServer = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json')

  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify({
      value: {
        state: 'success',
        os: { name: 'iOS', version: '17.5' },
        device: 'iPhone 15 Pro',
        ready: true,
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
        value: {
          sessionId: 'mock-session-12345',
          capabilities: { device: 'iPhone 15 Pro' },
        },
        sessionId: 'mock-session-12345',
      }))
    })
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: 'not found' }))
})

await new Promise(resolve => mockServer.listen(18100, '127.0.0.1', resolve))

// 2. Spawn MCP Server with WDA_URL pointing to mock server
const proc = spawn(process.execPath, [binPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    WDA_URL: 'http://127.0.0.1:18100',
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
    clientInfo: { name: 'test-wda-client', version: '1.0.0' },
  },
})

await new Promise(r => setTimeout(r, 400))
assert.ok(stdout.includes('"supergraph-wda"'), 'MCP initialize response must include supergraph-wda')

// Step B: Query tools/list
send({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {},
})

await new Promise(r => setTimeout(r, 400))
assert.ok(stdout.includes('wda_status'), 'tools/list must include wda_status')
assert.ok(stdout.includes('wda_device_list'), 'tools/list must include wda_device_list')
assert.ok(stdout.includes('wda_session_start'), 'tools/list must include wda_session_start')
assert.ok(stdout.includes('wda_snapshot'), 'tools/list must include wda_snapshot')
assert.ok(stdout.includes('wda_tap'), 'tools/list must include wda_tap')
assert.ok(stdout.includes('wda_fill'), 'tools/list must include wda_fill')
assert.ok(stdout.includes('wda_swipe'), 'tools/list must include wda_swipe')
assert.ok(stdout.includes('wda_screenshot'), 'tools/list must include wda_screenshot')
assert.ok(stdout.includes('wda_handle_alert'), 'tools/list must include wda_handle_alert')

// Step C: Call wda_status
send({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: {
    name: 'wda_status',
    arguments: {},
  },
})

await new Promise(r => setTimeout(r, 400))
assert.ok(stdout.includes('iPhone 15 Pro'), 'wda_status tool call must return device status from mock WDA server')

// Clean up
proc.kill()
mockServer.close()

console.log('✔ All sg-wda-mcp server and protocol tests passed successfully!')
