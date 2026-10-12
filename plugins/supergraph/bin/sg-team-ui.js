#!/usr/bin/env node

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { TeamEngine } from '../team/engine.js'
import { getTeamUiHtml } from '../team/ui-html.js'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333
const repoRoot = process.cwd()

function findStateRoot(startDir) {
  let curr = path.resolve(startDir || process.cwd())
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, '.supergraph', 'team', 'state.json'))) {
      return curr
    }
    curr = path.dirname(curr)
  }
  const candidates = [
    process.env.DSH_WORKSPACE,
    '/Users/trantandat/GIC/Freelancer',
    '/Users/trantandat/GIC/deepseek-harness',
    process.cwd()
  ].filter(Boolean)
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, '.supergraph', 'team', 'state.json'))) {
      return c
    }
  }
  return startDir || process.cwd()
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`)
  const pathname = url.pathname
  const sessionId = url.searchParams.get('sessionId') || null
  const queryCwd = url.searchParams.get('cwd')
  const cwd = queryCwd || findStateRoot(repoRoot)
  const engine = new TeamEngine(cwd, sessionId)

  if (pathname === '/api/state' || pathname === '/api/supergraph/team/state') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    })
    let state = engine._loadState(sessionId)
    if (!state || !state.mission) {
      // Fallback to shared/repo mission if session has no isolated mission
      state = engine._loadState(null)
    }
    res.end(JSON.stringify(state))
    return
  }

  if (pathname === '/api/init-demo' && req.method === 'POST') {
    const demoEngine = new TeamEngine(cwd, sessionId)
    demoEngine.initMission({
      objective: 'Tái cấu trúc Kiến trúc Multi-Agent & Git Worktree Isolation',
      baseBranch: 'main',
      sessionId: sessionId || null
    })
    demoEngine.createTask({
      id: 'task-1-schema',
      title: 'Thiết kế Data Contract & Schema định nghĩa DAG Wave',
      wave: 1,
      dependencies: [],
      writeScopes: ['packages/core/src/schema.ts']
    })
    demoEngine.createTask({
      id: 'task-2-engine',
      title: 'Xây dựng TeamEngine core & State Machine',
      wave: 1,
      dependencies: [],
      writeScopes: ['packages/core/src/engine.ts']
    })
    demoEngine.markMerged({ taskId: 'task-1-schema' })
    demoEngine.claimTask({ taskId: 'task-2-engine', workerId: 'agent-beta' })
    demoEngine.recordRed({ taskId: 'task-2-engine', testOutput: 'FAIL: Task state machine transition invalid' })
    demoEngine.recordGreen({
      taskId: 'task-2-engine',
      testOutput: 'PASS: 12 tests passed',
      diff: 'diff --git a/engine.ts b/engine.ts\n+ state machine tests green'
    })
    demoEngine.markMerged({ taskId: 'task-2-engine' })

    demoEngine.claimTask({ taskId: 'task-3-worktree', workerId: 'agent-gamma' })
    demoEngine.recordRed({ taskId: 'task-3-worktree', testOutput: 'FAIL: git worktree add failed with exit code 1\n  fatal: invalid reference: HEAD' })

    demoEngine.claimTask({ taskId: 'task-4-mcp', workerId: 'agent-delta' })

    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ success: true }))
    return
  }

  if (pathname === '/api/reset' && req.method === 'POST') {
    const resetEngine = new TeamEngine(cwd, sessionId)
    resetEngine.initMission({ objective: '', baseBranch: 'HEAD', sessionId: sessionId || null })
    const state = resetEngine._loadState(sessionId)
    state.mission = null
    state.tasks = []
    resetEngine._saveState(state, sessionId)
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ success: true }))
    return
  }

  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  })
  res.end(getTeamUiHtml())
})

function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  try {
    exec(`${start} ${url}`, () => {})
  } catch {}
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[Supergraph Team UI] Already running at http://127.0.0.1:${PORT}`)
    if (process.argv.includes('--open')) {
      openBrowser(`http://127.0.0.1:${PORT}`)
    }
    process.exit(0)
  } else {
    console.error(`[Supergraph Team UI] Server error:`, err)
    process.exit(1)
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Supergraph Team UI] Running at http://127.0.0.1:${PORT}`)
  if (process.argv.includes('--open')) {
    openBrowser(`http://127.0.0.1:${PORT}`)
  }
})
