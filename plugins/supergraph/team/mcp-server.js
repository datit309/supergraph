import readline from 'node:readline'
import { TeamEngine } from './engine.js'
import { WorktreeManager } from './worktree.js'

export class TeamMcpServer {
  constructor(repoRoot = process.cwd()) {
    this.repoRoot = repoRoot
    this.engine = new TeamEngine(this.repoRoot)
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
            base_branch: { type: 'string', description: 'Base git branch (default: HEAD or main)' }
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
          required: ['id', 'title']
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
      }
    ]
  }

  async executeTool(name, args = {}) {
    switch (name) {
      case 'sg_team_init': {
        const mission = this.engine.initMission({
          objective: args.objective,
          baseBranch: args.base_branch || 'HEAD'
        })
        return {
          content: [{ type: 'text', text: JSON.stringify(mission, null, 2) }],
          isError: false
        }
      }

      case 'sg_task_create': {
        const task = this.engine.createTask({
          id: args.id,
          title: args.title,
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

      case 'sg_task_verify_merge': {
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

        const mission = this.engine.getMission()
        const targetBranch = mission?.baseBranch || 'HEAD'
        const mergeRes = this.wt.mergeWorktree(args.task_id, targetBranch, args.commit_msg)
        const task = this.engine.markMerged({ taskId: args.task_id })

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              task,
              merge: mergeRes
            }, null, 2)
          }],
          isError: false
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
