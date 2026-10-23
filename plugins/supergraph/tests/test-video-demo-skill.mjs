import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const testDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(testDir, '..')
const repoRoot = path.resolve(rootDir, '../..')

const skillDir = path.resolve(rootDir, 'skills/video-demo')
const skillMdPath = path.resolve(skillDir, 'SKILL.md')
const demoScriptPath = path.resolve(skillDir, 'scripts/demo')
const doctorScriptPath = path.resolve(skillDir, 'scripts/doctor.sh')
const scaffoldScriptPath = path.resolve(skillDir, 'scripts/scaffold.mjs')
const engineRunPath = path.resolve(skillDir, 'engine/run.mjs')
const templateConfigPath = path.resolve(skillDir, 'template/demo/demo.config.ts')
const referencesDir = path.resolve(skillDir, 'references')

// 1. SKILL.md Existence & Contract
assert.ok(fs.existsSync(skillMdPath), 'skills/video-demo/SKILL.md must exist')
const skillContent = fs.readFileSync(skillMdPath, 'utf8')
assert.match(skillContent, /name:\s*video-demo/, 'SKILL.md must define name: video-demo')
assert.match(skillContent, /# \/supergraph:video-demo/, 'SKILL.md must have # /supergraph:video-demo heading')
assert.match(skillContent, /Announce:/, 'SKILL.md must have an Announce line')
assert.match(skillContent, /Non-negotiables/, 'SKILL.md must document Non-negotiables')

// 2. Scripts and Engine files
assert.ok(fs.existsSync(demoScriptPath), 'scripts/demo must exist')
assert.ok(fs.existsSync(doctorScriptPath), 'scripts/doctor.sh must exist')
assert.ok(fs.existsSync(scaffoldScriptPath), 'scripts/scaffold.mjs must exist')
assert.ok(fs.existsSync(engineRunPath), 'engine/run.mjs must exist')
assert.ok(fs.existsSync(templateConfigPath), 'template/demo/demo.config.ts must exist')
assert.ok(fs.existsSync(referencesDir), 'references/ directory must exist')

const refFiles = fs.readdirSync(referencesDir)
assert.ok(refFiles.length >= 5, 'references/ must contain at least 5 guide documents')

// 3. Executable permissions
const demoStat = fs.statSync(demoScriptPath)
assert.ok((demoStat.mode & 0o111) !== 0, 'scripts/demo must be executable')
const doctorStat = fs.statSync(doctorScriptPath)
assert.ok((doctorStat.mode & 0o111) !== 0, 'scripts/doctor.sh must be executable')

// 4. Package.json bin declarations
const rootPkg = JSON.parse(fs.readFileSync(path.resolve(repoRoot, 'package.json'), 'utf8'))
assert.strictEqual(
  rootPkg.bin?.['sg-video-demo'],
  './plugins/supergraph/skills/video-demo/scripts/demo',
  'Root package.json must declare bin.sg-video-demo'
)

const pluginPkg = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf8'))
assert.strictEqual(
  pluginPkg.bin?.['sg-video-demo'],
  './skills/video-demo/scripts/demo',
  'Plugin package.json must declare bin.sg-video-demo'
)

console.log('✔ video-demo SKILL.md, scripts, engine, templates, and bin declarations satisfy all contracts')
