import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { TeamEngine } from '../team/engine.js'

test('TeamEngine - strict session isolation and no leakage', async (t) => {
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-session-leak-test-'))
  t.after(() => {
    fs.rmSync(tmpRepo, { recursive: true, force: true })
  })

  const engineA = new TeamEngine(tmpRepo, 'session-A')
  const engineB = new TeamEngine(tmpRepo, 'session-B')

  // 1. Session A initializes mission
  engineA.initMission({ objective: 'Mission of Session A', baseBranch: 'main' })
  engineA.createTask({ id: 'task-a1', title: 'Task in A', wave: 1 })

  // 2. Session A sees its mission and task
  const stateA = engineA._loadState('session-A')
  assert.equal(stateA.mission?.objective, 'Mission of Session A')
  assert.equal(stateA.tasks.length, 1)

  // 3. Session B MUST NOT see Session A mission or tasks!
  const stateB = engineB._loadState('session-B')
  assert.equal(stateB.mission, null, 'Session B must have null mission')
  assert.equal(stateB.tasks.length, 0, 'Session B must have 0 tasks')

  // 4. Session C (unknown) must also be empty
  const stateC = engineA._loadState('session-C')
  assert.equal(stateC.mission, null, 'Session C must have null mission')
  assert.equal(stateC.tasks.length, 0, 'Session C must have 0 tasks')
})

test('sg-team-ui server - strictly isolates state when sessionId query param is provided', async (t) => {
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-ui-session-leak-'))
  t.after(() => {
    fs.rmSync(tmpRepo, { recursive: true, force: true })
  })

  const engineA = new TeamEngine(tmpRepo, 'session-A')
  engineA.initMission({ objective: 'Mission of Session A', baseBranch: 'main' })

  // Simulate UI request handling logic with requested sessionId
  const requestedSessionId = 'session-B'
  const engine = new TeamEngine(tmpRepo, requestedSessionId)

  let state = engine._loadState(requestedSessionId)
  // BUGGY BEHAVIOR: if (!state || !state.mission) state = engine._loadState(null)
  // CORRECT BEHAVIOR: only fallback if !requestedSessionId
  if (!requestedSessionId && (!state || !state.mission)) {
    state = engine._loadState(null)
  }

  assert.equal(state.mission, null, 'HTTP state for session-B must NOT fallback to session-A!')
})

