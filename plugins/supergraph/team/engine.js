import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export class TeamEngine {
  constructor(repoRoot, sessionId = null) {
    this.repoRoot = repoRoot
    this.sessionId = sessionId || process.env.DSH_SESSION_ID || null
    this.stateDir = path.join(this.repoRoot, '.supergraph', 'team')
    this.sessionsDir = path.join(this.stateDir, 'sessions')
    this.statePath = path.join(this.stateDir, 'state.json')
  }

  _getSessionStatePath(sid) {
    const s = sid || this.sessionId
    if (!s) return null
    return path.join(this.sessionsDir, `${s}.json`)
  }

  _loadState(sid) {
    const sessionPath = this._getSessionStatePath(sid)
    if (sessionPath && fs.existsSync(sessionPath)) {
      try {
        const raw = fs.readFileSync(sessionPath, 'utf8')
        return JSON.parse(raw)
      } catch {}
    }
    if (!fs.existsSync(this.statePath)) {
      return {
        mission: null,
        tasks: []
      }
    }
    try {
      const raw = fs.readFileSync(this.statePath, 'utf8')
      const parsed = JSON.parse(raw)
      const targetSid = sid || this.sessionId
      if (targetSid && parsed?.mission?.sessionId && parsed.mission.sessionId !== targetSid) {
        return {
          mission: null,
          tasks: []
        }
      }
      return parsed
    } catch {
      return {
        mission: null,
        tasks: []
      }
    }
  }

  _saveState(state, sid) {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true })
    }
    const targetSid = sid || this.sessionId
    const sessionPath = this._getSessionStatePath(targetSid)
    if (sessionPath) {
      if (!fs.existsSync(this.sessionsDir)) {
        fs.mkdirSync(this.sessionsDir, { recursive: true })
      }
      const tmp = `${sessionPath}.${crypto.randomBytes(4).toString('hex')}.tmp`
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8')
      fs.renameSync(tmp, sessionPath)
    }
    const tmp = `${this.statePath}.${crypto.randomBytes(4).toString('hex')}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8')
    fs.renameSync(tmp, this.statePath)
  }

  initMission({ objective, baseBranch = 'HEAD', sessionId = null }) {
    const targetSid = sessionId || this.sessionId || process.env.DSH_SESSION_ID || null
    if (targetSid) {
      this.sessionId = targetSid
    }
    const id = `mission-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`
    const mission = {
      id,
      sessionId: targetSid,
      objective,
      baseBranch,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    const state = {
      mission,
      tasks: []
    }
    this._saveState(state, targetSid)
    return mission
  }

  getMission() {
    return this._loadState().mission
  }

  createTask({ id, title, description = '', wave = 1, dependencies = [], writeScopes = [] }) {
    const state = this._loadState()
    if (state.tasks.some(t => t.id === id)) {
      throw new Error(`Task with id '${id}' already exists`)
    }
    const task = {
      id,
      title,
      description,
      wave: Number(wave) || 1,
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      writeScopes: Array.isArray(writeScopes) ? writeScopes : [],
      status: 'pending',
      assignedTo: null,
      redOutput: '',
      greenOutput: '',
      diff: '',
      worktreeDir: null,
      worktreeBranch: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    state.tasks.push(task)
    this._saveState(state)
    return task
  }

  getTasks() {
    return this._loadState().tasks
  }

  getTask(taskId) {
    const state = this._loadState()
    return state.tasks.find(t => t.id === taskId) || null
  }

  claimTask({ taskId, workerId }) {
    const state = this._loadState()
    const task = state.tasks.find(t => t.id === taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    // Check unsatisfied dependencies
    for (const depId of task.dependencies) {
      const dep = state.tasks.find(t => t.id === depId)
      if (!dep || dep.status !== 'merged') {
        throw new Error(`Dependencies not satisfied: '${depId}' is not merged yet`)
      }
    }

    task.status = 'claimed'
    task.assignedTo = workerId
    task.updatedAt = Date.now()
    this._saveState(state)
    return task
  }

  recordRed({ taskId, testOutput }) {
    const state = this._loadState()
    const task = state.tasks.find(t => t.id === taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)
    task.status = 'red_tested'
    task.redOutput = testOutput || ''
    task.updatedAt = Date.now()
    this._saveState(state)
    return task
  }

  recordGreen({ taskId, testOutput, diff = '' }) {
    const state = this._loadState()
    const task = state.tasks.find(t => t.id === taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)
    task.status = 'green'
    task.greenOutput = testOutput || ''
    task.diff = diff || ''
    task.updatedAt = Date.now()
    this._saveState(state)
    return task
  }

  markMerged({ taskId }) {
    const state = this._loadState()
    const task = state.tasks.find(t => t.id === taskId)
    if (!task) throw new Error(`Task not found: ${taskId}`)
    task.status = 'merged'
    task.updatedAt = Date.now()
    this._saveState(state)
    return task
  }

  getWaveStatus() {
    const state = this._loadState()
    const waves = {}
    for (const t of state.tasks) {
      const w = t.wave || 1
      if (!waves[w]) waves[w] = { wave: w, tasks: [] }
      const ready = t.status === 'pending' && t.dependencies.every(d => {
        const dep = state.tasks.find(x => x.id === d)
        return dep && dep.status === 'merged'
      })
      waves[w].tasks.push({
        ...t,
        ready
      })
    }
    return {
      mission: state.mission,
      waves
    }
  }
}
