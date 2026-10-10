import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'
import { TeamEngine } from '../team/engine.js'
import { WorktreeManager } from '../team/worktree.js'

test('TeamEngine - mission lifecycle & task DAG dependencies', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-team-test-'))
  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  const engine = new TeamEngine(tmpDir)

  // 1. Init Mission
  const mission = engine.initMission({
    objective: 'Build Auth Feature',
    baseBranch: 'main'
  })
  assert.equal(mission.objective, 'Build Auth Feature')
  assert.equal(mission.baseBranch, 'main')

  // 2. Create Tasks across waves
  const task1 = engine.createTask({
    id: 'auth-db',
    title: 'Setup Auth DB schema',
    wave: 1,
    dependencies: [],
    writeScopes: ['src/db/**']
  })
  assert.equal(task1.id, 'auth-db')
  assert.equal(task1.status, 'pending')

  const task2 = engine.createTask({
    id: 'auth-api',
    title: 'Implement Auth API',
    wave: 2,
    dependencies: ['auth-db'],
    writeScopes: ['src/api/**']
  })

  // 3. Check readiness
  const waveStatus = engine.getWaveStatus()
  assert.equal(waveStatus.waves[1].tasks[0].ready, true)
  assert.equal(waveStatus.waves[2].tasks[0].ready, false, 'Task 2 should not be ready because task 1 is not merged')

  // 4. Cannot claim task2 before task1 is merged
  assert.throws(() => {
    engine.claimTask({ taskId: 'auth-api', workerId: 'worker-2' })
  }, /dependencies not satisfied/i)

  // 5. Claim task1
  const claimed1 = engine.claimTask({ taskId: 'auth-db', workerId: 'worker-1' })
  assert.equal(claimed1.status, 'claimed')
  assert.equal(claimed1.assignedTo, 'worker-1')

  // 6. Record RED phase
  const red1 = engine.recordRed({ taskId: 'auth-db', testOutput: 'FAIL: table users does not exist' })
  assert.equal(red1.status, 'red_tested')
  assert.ok(red1.redOutput.includes('FAIL'))

  // 7. Record GREEN phase
  const green1 = engine.recordGreen({ taskId: 'auth-db', testOutput: 'PASS: 1 test passed', diff: '+CREATE TABLE users' })
  assert.equal(green1.status, 'green')

  // 8. Mark Merged
  const merged1 = engine.markMerged({ taskId: 'auth-db' })
  assert.equal(merged1.status, 'merged')

  // 9. Now task2 should be ready
  const waveStatusAfter = engine.getWaveStatus()
  assert.equal(waveStatusAfter.waves[2].tasks[0].ready, true)

  const claimed2 = engine.claimTask({ taskId: 'auth-api', workerId: 'worker-2' })
  assert.equal(claimed2.status, 'claimed')
})

test('WorktreeManager - isolated git worktree spawn, test, diff and merge', async (t) => {
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-wt-test-'))
  t.after(() => {
    fs.rmSync(tmpRepo, { recursive: true, force: true })
  })

  // Setup a real git repo
  execSync('git init -b main', { cwd: tmpRepo })
  execSync('git config user.email "test@example.com"', { cwd: tmpRepo })
  execSync('git config user.name "Tester"', { cwd: tmpRepo })
  fs.writeFileSync(path.join(tmpRepo, 'README.md'), '# Main Repo\n')
  execSync('git add README.md && git commit -m "initial commit"', { cwd: tmpRepo })

  const wtManager = new WorktreeManager(tmpRepo)

  // 1. Spawn worktree for task
  const wtInfo = wtManager.createWorktree('task-1', 'main')
  assert.ok(fs.existsSync(wtInfo.worktreeDir))
  assert.equal(wtInfo.branch, 'sg-task-task-1')

  // 2. Make change inside worktree
  const testFilePath = path.join(wtInfo.worktreeDir, 'feature.js')
  fs.writeFileSync(testFilePath, 'console.log("hello worktree");\n')

  // 3. Get diff
  const diff = wtManager.getDiff('task-1')
  assert.ok(diff.includes('feature.js'))

  // 4. Run test inside worktree
  const testResult = wtManager.runTest('task-1', 'node -e "process.exit(0)"')
  assert.equal(testResult.passed, true)
  assert.equal(testResult.exitCode, 0)

  const failResult = wtManager.runTest('task-1', 'node -e "process.exit(1)"')
  assert.equal(failResult.passed, false)
  assert.equal(failResult.exitCode, 1)

  // 5. Merge worktree into main
  const mergeResult = wtManager.mergeWorktree('task-1', 'main', 'feat: add feature in task-1')
  assert.equal(mergeResult.success, true)

  // Verify feature.js exists in main repo
  assert.ok(fs.existsSync(path.join(tmpRepo, 'feature.js')))
  assert.equal(fs.readFileSync(path.join(tmpRepo, 'feature.js'), 'utf8'), 'console.log("hello worktree");\n')

  // Verify worktree cleaned up
  assert.ok(!fs.existsSync(wtInfo.worktreeDir))
})

test('WorktreeManager - concurrent parallel worktrees with zero conflict', async (t) => {
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-wt-parallel-'))
  t.after(() => {
    fs.rmSync(tmpRepo, { recursive: true, force: true })
  })

  execSync('git init -b main', { cwd: tmpRepo })
  execSync('git config user.email "test@example.com"', { cwd: tmpRepo })
  execSync('git config user.name "Tester"', { cwd: tmpRepo })
  fs.mkdirSync(path.join(tmpRepo, 'src'), { recursive: true })
  fs.writeFileSync(path.join(tmpRepo, 'README.md'), '# Main Repo\n')
  execSync('git add . && git commit -m "initial commit"', { cwd: tmpRepo })

  const wtManager = new WorktreeManager(tmpRepo)

  // Spawn 2 parallel worktrees in Wave 1
  const wtA = wtManager.createWorktree('mod-a', 'main')
  const wtB = wtManager.createWorktree('mod-b', 'main')

  // Worker A works in module A
  fs.mkdirSync(path.join(wtA.worktreeDir, 'src', 'a'), { recursive: true })
  fs.writeFileSync(path.join(wtA.worktreeDir, 'src', 'a', 'index.js'), 'export const A = 1;\n')

  // Worker B works in module B simultaneously
  fs.mkdirSync(path.join(wtB.worktreeDir, 'src', 'b'), { recursive: true })
  fs.writeFileSync(path.join(wtB.worktreeDir, 'src', 'b', 'index.js'), 'export const B = 2;\n')

  // Both run their tests independently
  assert.equal(wtManager.runTest('mod-a', 'node -e "process.exit(0)"').passed, true)
  assert.equal(wtManager.runTest('mod-b', 'node -e "process.exit(0)"').passed, true)

  // Merge A first
  wtManager.mergeWorktree('mod-a', 'main', 'feat: add module A')

  // Merge B second without conflict
  wtManager.mergeWorktree('mod-b', 'main', 'feat: add module B')

  // Both modules exist in main repo cleanly!
  assert.ok(fs.existsSync(path.join(tmpRepo, 'src', 'a', 'index.js')))
  assert.ok(fs.existsSync(path.join(tmpRepo, 'src', 'b', 'index.js')))
})
