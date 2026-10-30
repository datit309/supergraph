import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const skillPath = path.resolve(rootDir, 'skills/mobile-agent/SKILL.md')
const matrixTplPath = path.resolve(rootDir, 'skills/mobile-agent/templates/test-matrix-mobile-template.md')
const bugTplPath = path.resolve(rootDir, 'skills/mobile-agent/templates/mobile-bug-report-template.md')
const initScriptPath = path.resolve(rootDir, 'skills/mobile-agent/scripts/init-mobile-qa.sh')

console.log('Testing unified mobile-agent SKILL.md, templates, and scripts...')

// 1. Verify SKILL.md
assert.ok(fs.existsSync(skillPath), 'SKILL.md must exist')
const skillContent = fs.readFileSync(skillPath, 'utf8')
assert.ok(skillContent.includes('name: mobile-agent'), 'Must have name: mobile-agent in frontmatter')
assert.ok(skillContent.includes('supergraph-wda'), 'Must declare supergraph-wda')
assert.ok(skillContent.includes('supergraph-uiautomator2'), 'Must declare supergraph-uiautomator2')
assert.ok(skillContent.includes('wda_snapshot') && skillContent.includes('uiauto_snapshot'), 'Must document both snapshots')
assert.ok(skillContent.includes('wda_tap') && skillContent.includes('uiauto_tap'), 'Must document both taps')
assert.ok(skillContent.includes('WebDriverAgent') && skillContent.includes('UiAutomator2'), 'Must cover both engines')

// 2. Verify Templates
assert.ok(fs.existsSync(matrixTplPath), 'Test matrix template must exist')
const matrixContent = fs.readFileSync(matrixTplPath, 'utf8')
assert.ok(matrixContent.includes('ISTQB Mobile Standard'), 'Matrix must adhere to ISTQB Mobile QA')
assert.ok(matrixContent.includes('Safe Area & Navigation'), 'Matrix must cover safe area')

assert.ok(fs.existsSync(bugTplPath), 'Bug report template must exist')
const bugContent = fs.readFileSync(bugTplPath, 'utf8')
assert.ok(bugContent.includes('Action Trace'), 'Bug report must have action trace')

// 3. Verify init-mobile-qa.sh script
assert.ok(fs.existsSync(initScriptPath), 'init-mobile-qa.sh must exist')
fs.accessSync(initScriptPath, fs.constants.X_OK)

// Test scaffolding
const testQaDir = path.resolve(rootDir, 'docs/qa')
execSync(`bash "${initScriptPath}" matrix auth com.example.auth iOS`, { cwd: rootDir })
const generatedMatrix = path.resolve(testQaDir, 'mobile-matrix-auth.md')
assert.ok(fs.existsSync(generatedMatrix), 'Must scaffold mobile-matrix-auth.md')

execSync(`bash "${initScriptPath}" bug auth MOB-TEST-999 "Unified mobile defect" Android`, { cwd: rootDir })
const generatedBug = path.resolve(testQaDir, 'mobile-bug-MOB-TEST-999.md')
assert.ok(fs.existsSync(generatedBug), 'Must scaffold mobile-bug-MOB-TEST-999.md')

// Clean up test docs
try {
  fs.unlinkSync(generatedMatrix)
  fs.unlinkSync(generatedBug)
} catch {}

console.log('✔ mobile-agent SKILL.md, templates, and scripts satisfy all contracts!')
