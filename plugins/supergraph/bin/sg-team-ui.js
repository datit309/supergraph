#!/usr/bin/env node

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'
import { TeamEngine } from '../team/engine.js'
import { getTeamUiHtml } from '../team/ui-html.js'

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333
const repoRoot = process.cwd()
const engine = new TeamEngine(repoRoot)

const server = http.createServer((req, res) => {
  if (req.url === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    const state = engine._loadState()
    res.end(JSON.stringify(state))
    return
  }

  if (req.url === '/api/init-demo' && req.method === 'POST') {
    engine.initMission({
      objective: 'Tái cấu trúc Kiến trúc Multi-Agent & Git Worktree Isolation',
      baseBranch: 'main'
    })
    engine.createTask({
      id: 'task-1-schema',
      title: 'Thiết kế Data Contract & Schema định nghĩa DAG Wave',
      wave: 1,
      dependencies: [],
      writeScopes: ['packages/core/src/schema.ts']
    })
    engine.createTask({
      id: 'task-2-engine',
      title: 'Xây dựng TeamEngine core & State Machine',
      wave: 1,
      dependencies: [],
      writeScopes: ['packages/core/src/engine.ts']
    })
    engine.markMerged({ taskId: 'task-1-schema' })
    engine.claimTask({ taskId: 'task-2-engine', workerId: 'agent-beta' })
    engine.recordRed({ taskId: 'task-2-engine', testOutput: 'FAIL: Task state machine transition invalid' })
    engine.recordGreen({
      taskId: 'task-2-engine',
      testOutput: 'PASS: 12 tests passed',
      diff: 'diff --git a/engine.ts b/engine.ts\n+ state machine tests green'
    })
    engine.markMerged({ taskId: 'task-2-engine' })

    engine.claimTask({ taskId: 'task-3-worktree', workerId: 'agent-gamma' })
    engine.recordRed({ taskId: 'task-3-worktree', testOutput: 'FAIL: git worktree add failed with exit code 1\n  fatal: invalid reference: HEAD' })

    engine.claimTask({ taskId: 'task-4-mcp', workerId: 'agent-delta' })

    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ success: true }))
    return
  }

  if (req.url === '/api/reset' && req.method === 'POST') {
    engine.initMission({ objective: '', baseBranch: 'HEAD' })
    const state = engine._loadState()
    state.mission = null
    state.tasks = []
    engine._saveState(state)
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
    res.end(JSON.stringify({ success: true }))
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
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
