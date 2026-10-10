import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { TeamMcpServer } from '../team/mcp-server.js'

test('TeamMcpServer - protocol handling & tools lifecycle', async (t) => {
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-mcp-test-'))
  t.after(() => {
    fs.rmSync(tmpRepo, { recursive: true, force: true })
  })

  execSync('git init -b main', { cwd: tmpRepo })
  execSync('git config user.email "test@example.com"', { cwd: tmpRepo })
  execSync('git config user.name "Tester"', { cwd: tmpRepo })
  fs.writeFileSync(path.join(tmpRepo, 'README.md'), '# Main Repo\n')
  execSync('git add . && git commit -m "initial commit"', { cwd: tmpRepo })

  const server = new TeamMcpServer(tmpRepo)

  // 1. Initialize
  const initRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { clientInfo: { name: 'test-client', version: '1.0' } }
  })
  assert.equal(initRes.result.serverInfo.name, 'supergraph-team')

  // 2. Tools list
  const listRes = await server.handleMessage({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  })
  const tools = listRes.result.tools
  assert.ok(tools.some(t => t.name === 'sg_team_init'))
  assert.ok(tools.some(t => t.name === 'sg_task_claim'))
  assert.ok(tools.some(t => t.name === 'sg_task_verify_merge'))

  // 3. Call sg_team_init
  const callInit = await server.handleMessage({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'sg_team_init',
      arguments: {
        objective: 'Implement OAuth',
        base_branch: 'main'
      }
    }
  })
  assert.equal(callInit.result.isError, false)

  // 4. Call sg_task_create
  const callCreate = await server.handleMessage({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'sg_task_create',
      arguments: {
        id: 'oauth-jwt',
        title: 'Generate JWT tokens',
        wave: 1
      }
    }
  })
  assert.equal(callCreate.result.isError, false)

  // 5. Call sg_task_claim (should spawn worktree)
  const callClaim = await server.handleMessage({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'sg_task_claim',
      arguments: {
        task_id: 'oauth-jwt',
        worker_id: 'agent-codex'
      }
    }
  })
  assert.equal(callClaim.result.isError, false)
  const claimData = JSON.parse(callClaim.result.content[0].text)
  assert.equal(claimData.status, 'claimed')
  assert.ok(claimData.worktreeDir && fs.existsSync(claimData.worktreeDir))

  // Make change in worktree
  fs.writeFileSync(path.join(claimData.worktreeDir, 'jwt.js'), 'export const sign = () => "jwt";\n')

  // 6. Record RED
  await server.handleMessage({
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'sg_task_record_red',
      arguments: {
        task_id: 'oauth-jwt',
        test_output: 'FAIL: sign is not defined'
      }
    }
  })

  // 7. Submit (runs test inside worktree)
  const callSubmit = await server.handleMessage({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'sg_task_submit',
      arguments: {
        task_id: 'oauth-jwt',
        test_cmd: 'node -e "process.exit(0)"'
      }
    }
  })
  assert.equal(callSubmit.result.isError, false)

  // 8. Verify and merge
  const callMerge = await server.handleMessage({
    jsonrpc: '2.0',
    id: 8,
    method: 'tools/call',
    params: {
      name: 'sg_task_verify_merge',
      arguments: {
        task_id: 'oauth-jwt',
        test_cmd: 'node -e "process.exit(0)"',
        commit_msg: 'feat(oauth): add jwt sign'
      }
    }
  })
  assert.equal(callMerge.result.isError, false)

  // File should now be in main branch
  assert.ok(fs.existsSync(path.join(tmpRepo, 'jwt.js')))
})

test('TeamMcpServer - stdio binary integration', async (t) => {
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-mcp-bin-'))
  t.after(() => {
    fs.rmSync(tmpRepo, { recursive: true, force: true })
  })

  execSync('git init -b main', { cwd: tmpRepo })
  execSync('git config user.email "test@example.com"', { cwd: tmpRepo })
  execSync('git config user.name "Tester"', { cwd: tmpRepo })
  fs.writeFileSync(path.join(tmpRepo, 'README.md'), '# Main Repo\n')
  execSync('git add . && git commit -m "initial commit"', { cwd: tmpRepo })

  const binPath = path.resolve(fileURLToPath(import.meta.url), '../../bin/sg-team-mcp.js')
  const child = spawn('node', [binPath], {
    cwd: tmpRepo,
    stdio: ['pipe', 'pipe', 'inherit']
  })

  t.after(() => {
    child.kill()
  })

  const send = (req) => {
    child.stdin.write(JSON.stringify(req) + '\n')
  }

  const responsePromise = new Promise((resolve) => {
    child.stdout.once('data', (data) => {
      resolve(JSON.parse(data.toString().trim()))
    })
  })

  send({
    jsonrpc: '2.0',
    id: 10,
    method: 'initialize',
    params: {}
  })

  const res = await responsePromise
  assert.equal(res.id, 10)
  assert.equal(res.result.serverInfo.name, 'supergraph-team')
})
