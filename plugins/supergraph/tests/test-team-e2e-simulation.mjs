import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'
import { TeamMcpServer } from '../team/mcp-server.js'

test('Team Engine E2E Simulation - Multi-worker Wave DAG with Git Worktree Isolation', async (t) => {
  const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'sg-team-e2e-'))
  t.after(() => {
    fs.rmSync(tmpRepo, { recursive: true, force: true })
  })

  // 1. Setup base Git repository
  execSync('git init -b main', { cwd: tmpRepo })
  execSync('git config user.email "lead@supergraph.dev"', { cwd: tmpRepo })
  execSync('git config user.name "Supergraph Lead"', { cwd: tmpRepo })

  fs.mkdirSync(path.join(tmpRepo, 'src'), { recursive: true })
  fs.mkdirSync(path.join(tmpRepo, 'test'), { recursive: true })
  fs.writeFileSync(path.join(tmpRepo, 'src', '.gitkeep'), '')
  fs.writeFileSync(path.join(tmpRepo, 'test', '.gitkeep'), '')
  fs.writeFileSync(path.join(tmpRepo, 'package.json'), JSON.stringify({ name: 'calc-app', type: 'module' }, null, 2))
  execSync('git add . && git commit -m "chore: initial commit"', { cwd: tmpRepo })

  const server = new TeamMcpServer(tmpRepo)

  // 2. Initialize mission
  await server.executeTool('sg_team_init', {
    objective: 'Build Calculator with Math & String utilities',
    base_branch: 'main'
  })

  // 3. Create Wave 1 tasks (independent, parallel)
  await server.executeTool('sg_task_create', {
    id: 'core-math',
    title: 'Implement add utility',
    wave: 1,
    dependencies: [],
    write_scopes: ['src/math.js', 'test/math.test.js']
  })

  await server.executeTool('sg_task_create', {
    id: 'core-str',
    title: 'Implement format utility',
    wave: 1,
    dependencies: [],
    write_scopes: ['src/str.js', 'test/str.test.js']
  })

  // 4. Create Wave 2 task (dependent on both Wave 1 tasks)
  await server.executeTool('sg_task_create', {
    id: 'core-calc',
    title: 'Implement combined calculator',
    wave: 2,
    dependencies: ['core-math', 'core-str'],
    write_scopes: ['src/calc.js', 'test/calc.test.js']
  })

  // Check DAG status
  const statusRes = await server.executeTool('sg_team_status', {})
  const statusObj = JSON.parse(statusRes.content[0].text)
  assert.equal(statusObj.totalTasks, 3)
  assert.equal(statusObj.completed, 0)
  assert.equal(statusObj.waves[1].tasks.every(t => t.ready), true)
  assert.equal(statusObj.waves[2].tasks.every(t => !t.ready), true)

  // 5. Worker 1 claims 'core-math' & Worker 2 claims 'core-str' in parallel
  const claim1Res = await server.executeTool('sg_task_claim', {
    task_id: 'core-math',
    worker_id: 'worker-math'
  })
  const claim1 = JSON.parse(claim1Res.content[0].text)
  assert.ok(claim1.worktreeDir && fs.existsSync(claim1.worktreeDir))

  const claim2Res = await server.executeTool('sg_task_claim', {
    task_id: 'core-str',
    worker_id: 'worker-str'
  })
  const claim2 = JSON.parse(claim2Res.content[0].text)
  assert.ok(claim2.worktreeDir && fs.existsSync(claim2.worktreeDir))

  // 6. Worker 1 executes TDD in worktree 1
  const mathTestFile = path.join(claim1.worktreeDir, 'test', 'math.test.js')
  fs.writeFileSync(mathTestFile, `
import assert from 'node:assert/strict'
import { add } from '../src/math.js'
assert.equal(add(2, 3), 5)
console.log('MATH TEST PASS')
`)
  // Test fails before code (RED)
  const red1 = server.wt.runTest('core-math', 'node test/math.test.js')
  assert.equal(red1.passed, false)
  await server.executeTool('sg_task_record_red', {
    task_id: 'core-math',
    test_output: red1.stderr || 'ERR: add not defined'
  })

  // Implement GREEN
  fs.writeFileSync(path.join(claim1.worktreeDir, 'src', 'math.js'), `
export function add(a, b) {
  return a + b
}
`)
  const submit1 = await server.executeTool('sg_task_submit', {
    task_id: 'core-math',
    test_cmd: 'node test/math.test.js'
  })
  assert.equal(submit1.isError, false)

  // 7. Worker 2 executes TDD in worktree 2 simultaneously
  const strTestFile = path.join(claim2.worktreeDir, 'test', 'str.test.js')
  fs.writeFileSync(strTestFile, `
import assert from 'node:assert/strict'
import { formatResult } from '../src/str.js'
assert.equal(formatResult(5), 'Result: 5')
console.log('STR TEST PASS')
`)
  const red2 = server.wt.runTest('core-str', 'node test/str.test.js')
  assert.equal(red2.passed, false)
  await server.executeTool('sg_task_record_red', {
    task_id: 'core-str',
    test_output: red2.stderr || 'ERR: formatResult not defined'
  })

  // Implement GREEN
  fs.writeFileSync(path.join(claim2.worktreeDir, 'src', 'str.js'), `
export function formatResult(val) {
  return 'Result: ' + val
}
`)
  const submit2 = await server.executeTool('sg_task_submit', {
    task_id: 'core-str',
    test_cmd: 'node test/str.test.js'
  })
  assert.equal(submit2.isError, false)

  // 8. Lead merges both tasks into main branch
  const merge1 = await server.executeTool('sg_task_verify_merge', {
    task_id: 'core-math',
    test_cmd: 'node test/math.test.js',
    commit_msg: 'feat: add math module'
  })
  assert.equal(merge1.isError, false)

  const merge2 = await server.executeTool('sg_task_verify_merge', {
    task_id: 'core-str',
    test_cmd: 'node test/str.test.js',
    commit_msg: 'feat: add str module'
  })
  assert.equal(merge2.isError, false)

  // 9. Now check that Wave 2 task 'core-calc' is ready!
  const statusAfterWave1 = await server.executeTool('sg_team_status', {})
  const statusWave1Obj = JSON.parse(statusAfterWave1.content[0].text)
  assert.equal(statusWave1Obj.completed, 2)
  assert.equal(statusWave1Obj.waves[2].tasks[0].ready, true)

  // 10. Worker 3 claims 'core-calc' in Wave 2
  const claim3Res = await server.executeTool('sg_task_claim', {
    task_id: 'core-calc',
    worker_id: 'worker-calc'
  })
  const claim3 = JSON.parse(claim3Res.content[0].text)
  assert.ok(claim3.worktreeDir && fs.existsSync(claim3.worktreeDir))

  // Notice: Worktree 3 was branched from main, which now contains both math.js and str.js!
  assert.ok(fs.existsSync(path.join(claim3.worktreeDir, 'src', 'math.js')))
  assert.ok(fs.existsSync(path.join(claim3.worktreeDir, 'src', 'str.js')))

  // Worker 3 implements calc using math and str
  fs.writeFileSync(path.join(claim3.worktreeDir, 'test', 'calc.test.js'), `
import assert from 'node:assert/strict'
import { calcAndFormat } from '../src/calc.js'
assert.equal(calcAndFormat(2, 3), 'Result: 5')
console.log('CALC TEST PASS')
`)
  const red3 = server.wt.runTest('core-calc', 'node test/calc.test.js')
  assert.equal(red3.passed, false)
  await server.executeTool('sg_task_record_red', {
    task_id: 'core-calc',
    test_output: red3.stderr || 'ERR: calcAndFormat not defined'
  })

  fs.writeFileSync(path.join(claim3.worktreeDir, 'src', 'calc.js'), `
import { add } from './math.js'
import { formatResult } from './str.js'
export function calcAndFormat(a, b) {
  return formatResult(add(a, b))
}
`)

  const submit3 = await server.executeTool('sg_task_submit', {
    task_id: 'core-calc',
    test_cmd: 'node test/calc.test.js'
  })
  assert.equal(submit3.isError, false)

  const merge3 = await server.executeTool('sg_task_verify_merge', {
    task_id: 'core-calc',
    test_cmd: 'node test/calc.test.js',
    commit_msg: 'feat: add calc and format integration'
  })
  assert.equal(merge3.isError, false)

  // 11. Final verification on base repo
  assert.ok(fs.existsSync(path.join(tmpRepo, 'src', 'math.js')))
  assert.ok(fs.existsSync(path.join(tmpRepo, 'src', 'str.js')))
  assert.ok(fs.existsSync(path.join(tmpRepo, 'src', 'calc.js')))

  const testMath = execSync('node test/math.test.js', { cwd: tmpRepo, encoding: 'utf8' })
  const testStr = execSync('node test/str.test.js', { cwd: tmpRepo, encoding: 'utf8' })
  const testCalc = execSync('node test/calc.test.js', { cwd: tmpRepo, encoding: 'utf8' })

  assert.ok(testMath.includes('MATH TEST PASS'))
  assert.ok(testStr.includes('STR TEST PASS'))
  assert.ok(testCalc.includes('CALC TEST PASS'))

  // All worktrees cleaned up
  assert.equal(fs.existsSync(claim1.worktreeDir), false)
  assert.equal(fs.existsSync(claim2.worktreeDir), false)
  assert.equal(fs.existsSync(claim3.worktreeDir), false)
})
