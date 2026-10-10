import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

export class TeamEngine {
  constructor(repoRoot) {
    this.repoRoot = repoRoot
    this.stateDir = path.join(this.repoRoot, '.supergraph', 'team')
    this.statePath = path.join(this.stateDir, 'state.json')
  }

  _loadState() {
    if (!fs.existsSync(this.statePath)) {
      return {
        mission: null,
        tasks: []
      }
    }
    try {
      const raw = fs.readFileSync(this.statePath, 'utf8')
      return JSON.parse(raw)
    } catch {
      return {
        mission: null,
        tasks: []
      }
    }
  }

  _saveState(state) {
    if (!fs.existsSync(this.stateDir)) {
      fs.mkdirSync(this.stateDir, { recursive: true })
    }
    const tmp = `${this.statePath}.${crypto.randomBytes(4).toString('hex')}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8')
    fs.renameSync(tmp, this.statePath)
  }

  initMission({ objective, baseBranch = 'HEAD' }) {
    const id = `mission-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`
    const mission = {
      id,
      objective,
      baseBranch,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    const state = {
      mission,
      tasks: []
    }
    this._saveState(state)
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
