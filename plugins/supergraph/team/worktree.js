import fs from 'node:fs'
import path from 'node:path'
import { execSync, spawnSync, execFileSync } from 'node:child_process'

export class WorktreeManager {
  constructor(repoRoot) {
    this.repoRoot = repoRoot
    this.worktreeParent = path.join(this.repoRoot, '.supergraph', 'worktrees')
  }

  hasWorktree(taskId) {
    return fs.existsSync(path.join(this.worktreeParent, `task-${taskId}`))
  }

  createWorktree(taskId, baseBranch = 'HEAD') {
    if (!fs.existsSync(this.worktreeParent)) {
      fs.mkdirSync(this.worktreeParent, { recursive: true })
    }
    this._ensureGitExclude()
    const branch = `sg-task-${taskId}`
    const worktreeDir = path.join(this.worktreeParent, `task-${taskId}`)

    if (fs.existsSync(worktreeDir)) {
      this.removeWorktree(taskId)
    }

    try {
      execFileSync('git', ['worktree', 'add', '-B', branch, worktreeDir, baseBranch], {
        cwd: this.repoRoot,
        stdio: 'pipe'
      })
    } catch (err) {
      throw new Error(`Failed to create git worktree for ${taskId}: ${err.message}`)
    }

    // Link dependencies and environment files
    this._linkDependencies(worktreeDir)

    return {
      worktreeDir,
      branch
    }
  }

  _ensureGitExclude() {
    try {
      const gitDir = path.join(this.repoRoot, '.git')
      if (!fs.existsSync(gitDir)) return
      let infoExclude = path.join(gitDir, 'info', 'exclude')
      if (!fs.statSync(gitDir).isDirectory()) {
        const gitFileContent = fs.readFileSync(gitDir, 'utf8').trim()
        const match = gitFileContent.match(/gitdir:\s*(.*)/)
        if (match) {
          const resolvedGitDir = path.resolve(this.repoRoot, match[1])
          infoExclude = path.join(resolvedGitDir, 'info', 'exclude')
        }
      }
      if (fs.existsSync(path.dirname(infoExclude))) {
        let content = fs.existsSync(infoExclude) ? fs.readFileSync(infoExclude, 'utf8') : ''
        const needed = ['.supergraph/', 'node_modules/', '.env', '.env.*']
        const toAdd = needed.filter(n => !content.includes(n))
        if (toAdd.length > 0) {
          fs.appendFileSync(infoExclude, '\n# Supergraph team runtime excludes\n' + toAdd.join('\n') + '\n')
        }
      }
    } catch {}
  }

  _linkDependencies(worktreeDir) {
    // 1. node_modules symlink from repoRoot
    const nmSrc = path.join(this.repoRoot, 'node_modules')
    const nmDst = path.join(worktreeDir, 'node_modules')
    if (fs.existsSync(nmSrc) && !fs.existsSync(nmDst)) {
      try {
        fs.symlinkSync(nmSrc, nmDst, 'junction')
      } catch {}
    }

    // 2. Copy .env files from repoRoot
    try {
      const rootEntries = fs.readdirSync(this.repoRoot, { withFileTypes: true })
      for (const ent of rootEntries) {
        if (ent.isFile() && (ent.name === '.env' || ent.name.startsWith('.env.'))) {
          const srcFile = path.join(this.repoRoot, ent.name)
          const dstFile = path.join(worktreeDir, ent.name)
          if (!fs.existsSync(dstFile)) {
            try {
              fs.copyFileSync(srcFile, dstFile)
            } catch {}
          }
        }
      }
    } catch {}
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

  getModifiedFiles(taskId, baseBranch = 'HEAD') {
    const worktreeDir = path.join(this.worktreeParent, `task-${taskId}`)
    if (!fs.existsSync(worktreeDir)) return []
    const files = new Set()

    // 1. Untracked and unstaged files in worktree (-uall lists every file within directories)
    try {
      const status = execSync('git status --porcelain -uall', { cwd: worktreeDir, encoding: 'utf8' })
      for (const line of status.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed) continue
        const parts = trimmed.split(/\s+/)
        const file = parts[parts.length - 1]
        if (file) files.add(file)
      }
    } catch {}

    // 2. Committed files on this task branch vs baseBranch
    try {
      let targetRef = baseBranch
      if (baseBranch === 'HEAD') {
        try {
          targetRef = execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.repoRoot, encoding: 'utf8' }).trim()
        } catch {
          targetRef = 'main'
        }
      }
      const diffOut = execFileSync('git', ['diff', '--name-only', `${targetRef}...HEAD`], { cwd: worktreeDir, encoding: 'utf8' })
      for (const line of diffOut.split('\n')) {
        const file = line.trim()
        if (file) files.add(file)
      }
    } catch {}

    return Array.from(files)
  }

  validateWriteScopes(taskId, writeScopes = [], baseBranch = 'HEAD') {
    if (!Array.isArray(writeScopes) || writeScopes.length === 0) {
      return { valid: true, violations: [] }
    }
    const modified = this.getModifiedFiles(taskId, baseBranch)
    const violations = []
    for (const file of modified) {
      // Ignore git-internal, supergraph engine files, and injected runtime dependencies (.env, node_modules)
      if (
        file.startsWith('.git') ||
        file.includes('.supergraph') ||
        file === 'node_modules' ||
        file.startsWith('node_modules/') ||
        file === '.env' ||
        file.startsWith('.env.')
      ) {
        continue
      }

      const match = writeScopes.some(scope => {
        const s = scope.trim()
        if (s.endsWith('/*') || s.endsWith('/**')) {
          const prefix = s.replace(/\/\*+$/, '')
          return file === prefix || file.startsWith(prefix + '/')
        }
        if (s.includes('*')) {
          const parts = s.split('**')
          const pattern = parts
            .map(part =>
              part
                .split('*')
                .map(sub => sub.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
                .join('[^/]*')
            )
            .join('.*')
          const regex = new RegExp('^' + pattern + '$')
          return regex.test(file)
        }
        return file === s || file.startsWith(s + '/')
      })
      if (!match) {
        violations.push(file)
      }
    }
    return {
      valid: violations.length === 0,
      violations
    }
  }

  syncWithTarget(taskId, targetBranch = 'HEAD') {
    const worktreeDir = path.join(this.worktreeParent, `task-${taskId}`)
    if (!fs.existsSync(worktreeDir)) {
      throw new Error(`Worktree not found for task ${taskId}`)
    }

    // Commit any uncommitted changes first to avoid dirty working tree merge failure
    try {
      const status = execSync('git status --porcelain', { cwd: worktreeDir, encoding: 'utf8' }).trim()
      if (status) {
        execFileSync('git', ['add', '-A'], { cwd: worktreeDir, stdio: 'pipe' })
        execFileSync('git', ['commit', '-m', `chore(${taskId}): sync checkpoint`], { cwd: worktreeDir, stdio: 'pipe' })
      }
    } catch {}

    let targetRef = targetBranch
    if (targetBranch === 'HEAD') {
      try {
        targetRef = execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.repoRoot, encoding: 'utf8' }).trim()
      } catch {
        targetRef = 'main'
      }
    }

    try {
      execFileSync('git', ['merge', targetRef, '--no-edit'], { cwd: worktreeDir, stdio: 'pipe' })
      return { success: true, syncedWith: targetRef }
    } catch (err) {
      try {
        execFileSync('git', ['merge', '--abort'], { cwd: worktreeDir, stdio: 'ignore' })
      } catch {}
      throw new Error(`Sync conflict with base '${targetRef}': worktree cannot merge cleanly with latest branch. Resolve conflicts before merge. Detail: ${err.message}`)
    }
  }

  _acquireMergeLock(timeoutMs = 15000) {
    if (!fs.existsSync(this.worktreeParent)) {
      fs.mkdirSync(this.worktreeParent, { recursive: true })
    }
    const lockDir = path.join(this.worktreeParent, 'merge.lock')
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      try {
        fs.mkdirSync(lockDir)
        return () => {
          try {
            fs.rmdirSync(lockDir)
          } catch {}
        }
      } catch (err) {
        if (err.code === 'EEXIST') {
          try {
            const stat = fs.statSync(lockDir)
            if (Date.now() - stat.mtimeMs > 30000) {
              fs.rmdirSync(lockDir)
              continue
            }
          } catch {}
          const sleepUntil = Date.now() + 50
          while (Date.now() < sleepUntil) {}
        } else {
          throw err
        }
      }
    }
    throw new Error('Timed out waiting for merge lock on base repository')
  }

  mergeWorktree(taskId, targetBranch = 'HEAD', commitMsg = '') {
    const releaseLock = this._acquireMergeLock()
    try {
      const branch = `sg-task-${taskId}`
      const worktreeDir = path.join(this.worktreeParent, `task-${taskId}`)

      if (!fs.existsSync(worktreeDir)) {
        throw new Error(`Worktree not found for task ${taskId}`)
      }

      // 1. Commit any uncommitted changes inside the worktree
      try {
        const status = execSync('git status --porcelain', { cwd: worktreeDir, encoding: 'utf8' }).trim()
        if (status) {
          execFileSync('git', ['add', '-A'], { cwd: worktreeDir, stdio: 'pipe' })
          const msg = commitMsg || `feat(${taskId}): complete task changes`
          execFileSync('git', ['commit', '-m', msg], { cwd: worktreeDir, stdio: 'pipe' })
        }
      } catch (err) {
        throw new Error(`Failed to commit in worktree: ${err.message}`)
      }

      // 2. In base repo, ensure target branch is checked out if specified and not HEAD
      if (targetBranch && targetBranch !== 'HEAD') {
        try {
          const current = execSync('git rev-parse --abbrev-ref HEAD', { cwd: this.repoRoot, encoding: 'utf8' }).trim()
          if (current !== targetBranch) {
            execFileSync('git', ['checkout', targetBranch], { cwd: this.repoRoot, stdio: 'pipe' })
          }
        } catch (err) {
          throw new Error(`Failed to checkout target branch ${targetBranch}: ${err.message}`)
        }
      }

      // 3. Merge task branch into base repo, with abort on failure
      try {
        execFileSync('git', ['merge', branch, '--no-edit'], { cwd: this.repoRoot, stdio: 'pipe' })
      } catch (err) {
        try {
          execFileSync('git', ['merge', '--abort'], { cwd: this.repoRoot, stdio: 'ignore' })
        } catch {}
        throw new Error(`Failed to merge branch ${branch} into base repo (merge aborted cleanly): ${err.message}`)
      }

      // 4. Remove worktree and branch
      this.removeWorktree(taskId)

      return {
        success: true,
        branch
      }
    } finally {
      releaseLock()
    }
  }

  removeWorktree(taskId) {
    const branch = `sg-task-${taskId}`
    const worktreeDir = path.join(this.worktreeParent, `task-${taskId}`)

    if (fs.existsSync(worktreeDir)) {
      // Safely unlink node_modules symlink if present to prevent worktree deletion issues
      const nmDst = path.join(worktreeDir, 'node_modules')
      if (fs.existsSync(nmDst)) {
        try {
          fs.rmSync(nmDst, { recursive: false, force: true })
        } catch {}
      }

      try {
        execFileSync('git', ['worktree', 'remove', '--force', worktreeDir], { cwd: this.repoRoot, stdio: 'ignore' })
      } catch {}
    }

    try {
      execFileSync('git', ['branch', '-D', branch], { cwd: this.repoRoot, stdio: 'ignore' })
    } catch {}
  }
}
