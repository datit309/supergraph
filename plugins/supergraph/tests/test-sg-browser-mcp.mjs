import assert from 'node:assert'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const binPath = path.resolve(__dirname, '../bin/sg-browser-mcp.js')

const proc = spawn(process.execPath, [binPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
  },
})

let stdout = ''
proc.stdout.on('data', chunk => {
  stdout += chunk.toString()
})

const send = msg => {
  proc.stdin.write(JSON.stringify(msg) + '\n')
}

// 1. Initialize MCP
send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-agent-browser', version: '1.0.0' },
  },
})

await new Promise(r => setTimeout(r, 600))
assert.ok(stdout.includes('"protocolVersion"'), 'MCP initialize response received')

// 2. Query tools/list
send({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
  params: {},
})

await new Promise(r => setTimeout(r, 800))
proc.kill()

assert.ok(stdout.includes('agent_browser_open'), 'agent_browser_open tool exists')
assert.ok(stdout.includes('agent_browser_snapshot'), 'agent_browser_snapshot tool exists')
assert.ok(stdout.includes('agent_browser_click'), 'agent_browser_click tool exists')
assert.ok(stdout.includes('agent_browser_fill'), 'agent_browser_fill tool exists')

console.log('✔ sg-browser-mcp starts and exposes agent-browser tools correctly')
