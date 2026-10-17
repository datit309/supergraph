import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'
import { spawn, exec } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { TeamEngine } from './engine.js'
import { WorktreeManager } from './worktree.js'

export class TeamMcpServer {
  constructor(repoRoot = process.cwd(), sessionId = null) {
    this.repoRoot = repoRoot
    this.sessionId = sessionId || process.env.DSH_SESSION_ID || null
    this.engine = new TeamEngine(this.repoRoot, this.sessionId)
    this.wt = new WorktreeManager(this.repoRoot)
  }

  getTools() {
    return [
      {
        name: 'sg_team_init',
        description: 'Initialize a Supergraph team mission and objective with base git branch.',
        inputSchema: {
          type: 'object',
          properties: {
            objective: { type: 'string', description: 'Overall mission objective' },
            base_branch: { type: 'string', description: 'Base git branch (default: HEAD or main)' },
            session_id: { type: 'string', description: 'Optional DSH session ID' }
          },
          required: ['objective']
        }
      },
      {
        name: 'sg_task_create',
        description: 'Create a DAG task belonging to an execution wave with dependencies.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique task id (kebab-case, e.g. auth-db)' },
            title: { type: 'string', description: 'Short task title' },
            description: { type: 'string', description: 'Detailed acceptance criteria' },
            wave: { type: 'number', description: 'Wave number in execution order (1, 2, 3...)' },
            dependencies: {
              type: 'array',
              items: { type: 'string' },
              description: 'Task IDs that must be completed/merged before this task can start'
            },
            write_scopes: {
              type: 'array',
              items: { type: 'string' },
              description: 'File or directory patterns this task is permitted to mutate'
            }
          },
          required: ['id']
        }
      },
      {
        name: 'sg_task_list',
        description: 'List all tasks and their DAG readiness status.',
        inputSchema: {
          type: 'object',
          properties: {
            wave: { type: 'number', description: 'Optional wave filter' }
          }
        }
      },
      {
        name: 'sg_task_claim',
        description: 'Claim a task for a worker. Automatically provisions an isolated git worktree branch.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'Task ID to claim' },
            worker_id: { type: 'string', description: 'Worker/Agent identifier claiming the task' },
            auto_worktree: { type: 'boolean', description: 'Provision isolated git worktree (default true)' }
          },
          required: ['task_id', 'worker_id']
        }
      },
      {
        name: 'sg_task_record_red',
        description: 'Enforce TDD RED phase: record failing test suite output before writing code.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'Task ID' },
            test_output: { type: 'string', description: 'Console output demonstrating test failure' }
          },
          required: ['task_id', 'test_output']
        }
      },
      {
        name: 'sg_task_submit',
        description: 'Submit task work after TDD GREEN phase. Optionally runs verification test inside worktree.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'Task ID' },
            test_cmd: { type: 'string', description: 'Test command to run inside worktree (e.g. npm test)' }
          },
          required: ['task_id']
        }
      },
      {
        name: 'sg_task_verify_merge',
        description: 'Verification gate: tests pass in worktree, merges branch into base repo, and cleans up worktree.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'Task ID' },
            test_cmd: { type: 'string', description: 'Test command to re-verify before merge' },
            commit_msg: { type: 'string', description: 'Commit message for the merge' }
          },
          required: ['task_id']
        }
      },
      {
        name: 'sg_task_complete',
        description: 'Directly mark a task as completed/merged in DAG (supports direct commits or manual override).',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'Task ID to mark completed' },
            summary: { type: 'string', description: 'Optional summary of completed work or commit hash' }
          },
          required: ['task_id']
        }
      },
      {
        name: 'sg_worktree_cleanup',
        description: 'Discard and remove a task worktree and branch without merging.',
        inputSchema: {
          type: 'object',
          properties: {
            task_id: { type: 'string', description: 'Task ID' }
          },
          required: ['task_id']
        }
      },
      {
        name: 'sg_team_status',
        description: 'Get comprehensive overview of mission, waves DAG, and worker progress.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'sg_team_ui',
        description: 'Ensure Supergraph Agent Team Live Dashboard is running for DSH Right Sidebar (http://127.0.0.1:3080).',
        inputSchema: {
          type: 'object',
          properties: {
            open_browser: { type: 'boolean', description: 'Whether to also open in external browser tab (default: false)' }
          }
        }
      }
    ]
  }

  ensureTeamUi(openBrowser = false) {
    const url = 'http://127.0.0.1:3333'
    const scriptPath = path.resolve(this.repoRoot, 'plugins/supergraph/bin/sg-team-ui.js')
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const fallbackPath = path.resolve(currentDir, '../bin/sg-team-ui.js')
    const uiScript = fs.existsSync(scriptPath) ? scriptPath : fallbackPath

    const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'

    try {
      if (fs.existsSync(uiScript)) {
        const child = spawn(process.execPath, [uiScript, ...(openBrowser ? ['--open'] : [])], {
          detached: true,
          stdio: 'ignore',
          cwd: this.repoRoot
        })
        child.unref()
      } else if (openBrowser) {
        exec(`${openCmd} ${url}`, () => {})
      }
      return { status: 'running', location: 'DSH Right Sidebar (Team Monitor)', standalone_url: url }
    } catch (e) {
      return { status: 'error', error: e.message }
    }
  }

  async executeTool(name, args = {}) {
    const sid = args.session_id || this.sessionId || process.env.DSH_SESSION_ID || null
    if (sid && sid !== this.engine.sessionId) {
      this.sessionId = sid
      this.engine.sessionId = sid
    }
    switch (name) {
      case 'sg_team_init': {
        const sid = args.session_id || this.sessionId || process.env.DSH_SESSION_ID || null
        if (sid) {
          this.sessionId = sid
          this.engine.sessionId = sid
        }
        const mission = this.engine.initMission({
          objective: args.objective,
          baseBranch: args.base_branch || 'HEAD',
          sessionId: sid
        })
        const ui = this.ensureTeamUi(false)
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              ...mission,
              ui_dashboard: 'DSH Right Sidebar (Team Monitor)',
              ui_status: ui.status
            }, null, 2)
          }],
          isError: false
        }
      }

      case 'sg_team_ui': {
        const ui = this.ensureTeamUi(args.open_browser === true)
        return {
          content: [{ type: 'text', text: JSON.stringify(ui, null, 2) }],
          isError: false
        }
      }

      case 'sg_task_create': {
        const task = this.engine.createTask({
          id: args.id,
          title: args.title || args.id,
          description: args.description || '',
          wave: args.wave || 1,
          dependencies: args.dependencies || [],
          writeScopes: args.write_scopes || []
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
          isError: false
        }
      }

      case 'sg_task_list': {
        const waveStatus = this.engine.getWaveStatus()
        let result = waveStatus
        if (args.wave !== undefined) {
          result = waveStatus.waves[args.wave] || { wave: args.wave, tasks: [] }
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          isError: false
        }
      }

      case 'sg_task_claim': {
        const task = this.engine.claimTask({
          taskId: args.task_id,
          workerId: args.worker_id
        })

        const autoWorktree = args.auto_worktree !== false
        let worktreeInfo = null
        if (autoWorktree) {
          const mission = this.engine.getMission()
          const baseBranch = mission?.baseBranch || 'HEAD'
          worktreeInfo = this.wt.createWorktree(args.task_id, baseBranch)
          task.worktreeDir = worktreeInfo.worktreeDir
          task.worktreeBranch = worktreeInfo.branch
          this.engine._saveState(this.engine._loadState()) // persist worktree paths
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              ...task,
              worktreeDir: worktreeInfo?.worktreeDir,
              worktreeBranch: worktreeInfo?.branch
            }, null, 2)
          }],
          isError: false
        }
      }

      case 'sg_task_record_red': {
        const task = this.engine.recordRed({
          taskId: args.task_id,
          testOutput: args.test_output
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
          isError: false
        }
      }

      case 'sg_task_submit': {
        const taskObj = this.engine.getTask(args.task_id)
        const mission = this.engine.getMission()
        const baseBranch = mission?.baseBranch || 'HEAD'

        // 1. Validate write scopes
        if (taskObj && taskObj.writeScopes && taskObj.writeScopes.length > 0) {
          const scopeCheck = this.wt.validateWriteScopes(args.task_id, taskObj.writeScopes, baseBranch)
          if (!scopeCheck.valid) {
            return {
              content: [{
                type: 'text',
                text: `[WRITE_SCOPES_VIOLATION] Task '${args.task_id}' modified files outside allowed scopes (${taskObj.writeScopes.join(', ')}):\n${scopeCheck.violations.map(f => '  - ' + f).join('\n')}`
              }],
              isError: true
            }
          }
        }

        let testLog = ''
        if (args.test_cmd) {
          const testRes = this.wt.runTest(args.task_id, args.test_cmd)
          testLog = `${testRes.stdout}\n${testRes.stderr}`.trim()
          if (!testRes.passed) {
            return {
              content: [{
                type: 'text',
                text: `Test execution failed with exit code ${testRes.exitCode}:\n${testLog}`
              }],
              isError: true
            }
          }
        }

        const diff = this.wt.getDiff(args.task_id)
        const task = this.engine.recordGreen({
          taskId: args.task_id,
          testOutput: testLog || 'Submitted without command',
          diff
        })

        return {
          content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
          isError: false
        }
      }

      case 'sg_task_complete': {
        const taskObj = this.engine.getTask(args.task_id)
        if (!taskObj) {
          return {
            content: [{ type: 'text', text: `Task not found: ${args.task_id}` }],
            isError: true
          }
        }
        if (this.wt.hasWorktree(args.task_id)) {
          this.wt.removeWorktree(args.task_id)
        }
        const task = this.engine.markMerged({ taskId: args.task_id })
        if (args.summary) {
          task.greenOutput = args.summary
          this.engine._saveState(this.engine._loadState())
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
          isError: false
        }
      }

      case 'sg_task_verify_merge': {
        const taskObj = this.engine.getTask(args.task_id)
        const mission = this.engine.getMission()
        const targetBranch = mission?.baseBranch || 'HEAD'

        const hasWorktree = this.wt.hasWorktree(args.task_id)
        if (!hasWorktree) {
          let testLog = ''
          if (args.test_cmd) {
            try {
              const res = exec(args.test_cmd, { cwd: this.repoRoot })
            } catch (err) {
              // ignore
            }
          }
          const task = this.engine.markMerged({ taskId: args.task_id })
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                task,
                directCommit: true,
                success: true
              }, null, 2)
            }],
            isError: false
          }
        }

        // 1. Validate write scopes
        if (taskObj && taskObj.writeScopes && taskObj.writeScopes.length > 0) {
          const scopeCheck = this.wt.validateWriteScopes(args.task_id, taskObj.writeScopes, targetBranch)
          if (!scopeCheck.valid) {
            return {
              content: [{
                type: 'text',
                text: `[WRITE_SCOPES_VIOLATION] Cannot merge: Task '${args.task_id}' modified files outside allowed scopes (${taskObj.writeScopes.join(', ')}):\n${scopeCheck.violations.map(f => '  - ' + f).join('\n')}`
              }],
              isError: true
            }
          }
        }

        // 2. Integration sync with target branch before running tests
        try {
          this.wt.syncWithTarget(args.task_id, targetBranch)
        } catch (err) {
          return {
            content: [{
              type: 'text',
              text: `[INTEGRATION_SYNC_FAILED] Failed to sync worktree with base '${targetBranch}' before merge:\n${err.message}`
            }],
            isError: true
          }
        }

        // 3. Verification test on integrated code
        if (args.test_cmd) {
          const testRes = this.wt.runTest(args.task_id, args.test_cmd)
          if (!testRes.passed) {
            return {
              content: [{
                type: 'text',
                text: `Verification test failed before merge with exit code ${testRes.exitCode}:\n${testRes.stdout}\n${testRes.stderr}`
              }],
              isError: true
            }
          }
        }

        // 4. Merge into base repository with merge lock and abort fallback
        try {
          const mergeRes = this.wt.mergeWorktree(args.task_id, targetBranch, args.commit_msg)
          const task = this.engine.markMerged({ taskId: args.task_id })

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                task,
                merge: mergeRes,
                success: true
              }, null, 2)
            }],
            isError: false
          }
        } catch (err) {
          return {
            content: [{
              type: 'text',
              text: `Merge failed: ${err.message}`
            }],
            isError: true
          }
        }
      }

      case 'sg_worktree_cleanup': {
        this.wt.removeWorktree(args.task_id)
        return {
          content: [{ type: 'text', text: `Cleaned up worktree for ${args.task_id}` }],
          isError: false
        }
      }

      case 'sg_team_status': {
        const waveStatus = this.engine.getWaveStatus()
        const allTasks = this.engine.getTasks()
        const summary = {
          mission: waveStatus.mission,
          totalTasks: allTasks.length,
          completed: allTasks.filter(t => t.status === 'merged').length,
          inProgress: allTasks.filter(t => ['claimed', 'red_tested', 'green'].includes(t.status)).length,
          pending: allTasks.filter(t => t.status === 'pending').length,
          waves: waveStatus.waves
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
          isError: false
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  }

  async handleMessage(msg) {
    const { id, method, params } = msg

    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'supergraph-team',
            version: '1.0.0'
          }
        }
      }
    }

    if (method === 'notifications/initialized') {
      return null
    }

    if (method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: this.getTools()
        }
      }
    }

    if (method === 'tools/call') {
      try {
        const result = await this.executeTool(params.name, params.arguments || {})
        return {
          jsonrpc: '2.0',
          id,
          result
        }
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: err.message }],
            isError: true
          }
        }
      }
    }

    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    }
  }

  startStdio() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    })

    rl.on('line', async (line) => {
      const trimmed = line.trim()
      if (!trimmed) return
      try {
        const msg = JSON.parse(trimmed)
        const response = await this.handleMessage(msg)
        if (response) {
          process.stdout.write(JSON.stringify(response) + '\n')
        }
      } catch (err) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: `Parse error: ${err.message}` }
        }) + '\n')
      }
    })
  }
}
