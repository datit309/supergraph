import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync } from 'node:child_process'

export class WorktreeManager {
  constructor(repoRoot) {
    this.repoRoot = repoRoot
    this.worktreeParent = path.join(this.repoRoot, '.supergraph', 'worktrees')
  }

  createWorktree(taskId, baseBranch = 'HEAD') {
    if (!fs.existsSync(this.worktreeParent)) {
      fs.mkdirSync(this.worktreeParent, { recursive: true })
    }
    const branch = `sg-task-${taskId}`
    const worktreeDir = path.join(this.worktreeParent, `task-${taskId}`)

    if (fs.existsSync(worktreeDir)) {
      try {
        execSync(`git worktree remove --force "${worktreeDir}"`, { cwd: this.repoRoot, stdio: 'ignore' })
      } catch {}
    }

    try {
      execSync(`git worktree add -B "${branch}" "${worktreeDir}" "${baseBranch}"`, {
        cwd: this.repoRoot,
        stdio: 'pipe'
      })
    } catch (err) {
      throw new Error(`Failed to create git worktree for ${taskId}: ${err.message}`)
    }

    return {
      worktreeDir,
      branch
    }
  }

  runTest(taskId, testCmd) {
    const worktreeDir = path.join(this.worktreeParent, `task-${taskId}`)
    if (!fs.existsSync(worktreeDir)) {
      throw new Error(`Worktree directory not found for ${taskId}`)
    }

    const res = spawnSync(testCmd, {
      cwd: worktreeDir,
      shell: true,
      encoding: 'utf8'
    })

    const exitCode = res.status ?? (res.error ? 1 : 0)
    const stdout = res.stdout || ''
    const stderr = res.stderr || (res.error ? res.error.message : '')

    return {
      exitCode,
      stdout,
      stderr,
      passed: exitCode === 0
    }
  }

  getDiff(taskId) {
    const worktreeDir = path.join(this.worktreeParent, `task-${taskId}`)
    if (!fs.existsSync(worktreeDir)) {
      throw new Error(`Worktree directory not found for ${taskId}`)
    }

    try {
      // Show both tracked diffs and untracked file listings
      const tracked = execSync('git diff HEAD', { cwd: worktreeDir, encoding: 'utf8' })
      const untracked = execSync('git status --porcelain', { cwd: worktreeDir, encoding: 'utf8' })
      return tracked || untracked
    } catch {
      return ''
    }
  }

  mergeWorktree(taskId, targetBranch = 'HEAD', commitMsg = '') {
    const branch = `sg-task-${taskId}`
    const worktreeDir = path.join(this.worktreeParent, `task-${taskId}`)

    if (!fs.existsSync(worktreeDir)) {
      throw new Error(`Worktree not found for task ${taskId}`)
    }

    // 1. Commit any uncommitted changes inside the worktree
    try {
      const status = execSync('git status --porcelain', { cwd: worktreeDir, encoding: 'utf8' }).trim()
      if (status) {
        execSync('git add -A', { cwd: worktreeDir, stdio: 'pipe' })
        const msg = commitMsg || `feat(${taskId}): complete task changes`
        execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { cwd: worktreeDir, stdio: 'pipe' })
      }
    } catch (err) {
      throw new Error(`Failed to commit in worktree: ${err.message}`)
    }

    // 2. In base repo, ensure target branch is checked out if specified and not HEAD
    if (targetBranch && targetBranch !== 'HEAD') {
      try {
        const current = execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.repoRoot, encoding: 'utf8' }).trim()
        if (current !== targetBranch) {
          execSync(`git checkout "${targetBranch}"`, { cwd: this.repoRoot, stdio: 'pipe' })
        }
      } catch (err) {
        throw new Error(`Failed to checkout target branch ${targetBranch}: ${err.message}`)
      }
    }

    // 3. Merge task branch
    try {
      execSync(`git merge "${branch}" --no-edit`, { cwd: this.repoRoot, stdio: 'pipe' })
    } catch (err) {
      throw new Error(`Failed to merge branch ${branch}: ${err.message}`)
    }

    // 4. Remove worktree and branch
    this.removeWorktree(taskId)

    return {
      success: true,
      branch
    }
  }

  removeWorktree(taskId) {
    const branch = `sg-task-${taskId}`
    const worktreeDir = path.join(this.worktreeParent, `task-${taskId}`)

    if (fs.existsSync(worktreeDir)) {
      try {
        execSync(`git worktree remove --force "${worktreeDir}"`, { cwd: this.repoRoot, stdio: 'ignore' })
      } catch {}
    }

    try {
      execSync(`git branch -D "${branch}"`, { cwd: this.repoRoot, stdio: 'ignore' })
    } catch {}
  }
}
