import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const skillPath = path.resolve(rootDir, 'skills/browser-agent/SKILL.md')
const matrixTplPath = path.resolve(rootDir, 'skills/browser-agent/templates/test-matrix-template.md')
const fullstackTplPath = path.resolve(rootDir, 'skills/browser-agent/templates/test-matrix-fullstack-template.md')
const bugReportTplPath = path.resolve(rootDir, 'skills/browser-agent/templates/bug-report-template.md')
const initQaScriptPath = path.resolve(rootDir, 'skills/browser-agent/scripts/init-qa.sh')

// 1. Verify SKILL.md contracts
const skillContent = fs.readFileSync(skillPath, 'utf8')

// Session Isolation & Multi-Agent Parallelism
assert.ok(
  skillContent.includes('AGENT_BROWSER_SESSION'),
  'SKILL.md must define AGENT_BROWSER_SESSION for session isolation'
)
assert.ok(
  skillContent.includes('--pin-tab'),
  'SKILL.md must document --pin-tab for shared CDP port concurrency'
)

// Typed MCP tools mapping (fixing prior inaccurate mapping)
assert.ok(
  skillContent.includes('`agent_browser_console`'),
  'SKILL.md must map Console Logs to agent_browser_console'
)
assert.ok(
  skillContent.includes('`agent_browser_errors`'),
  'SKILL.md must map Page Errors to agent_browser_errors'
)
assert.ok(
  skillContent.includes('`agent_browser_network_requests`'),
  'SKILL.md must map Network Requests to agent_browser_network_requests'
)
assert.ok(
  skillContent.includes('`agent_browser_a11y`'),
  'SKILL.md must include agent_browser_a11y tool'
)
assert.ok(
  skillContent.includes('`agent_browser_vitals`'),
  'SKILL.md must include agent_browser_vitals tool'
)
assert.ok(
  skillContent.includes('`agent_browser_record_start`'),
  'SKILL.md must include agent_browser_record_start tool'
)

// WebMCP discovery pattern
assert.ok(
  skillContent.includes('webmcp') || skillContent.includes('WebMCP'),
  'SKILL.md must document WebMCP discovery & invocation pattern'
)

// Token efficiency
assert.ok(
  skillContent.includes('--delta'),
  'SKILL.md must document snapshot --delta for token efficiency'
)
assert.ok(
  skillContent.includes('--if-changed'),
  'SKILL.md must document screenshot --if-changed'
)

// Non-functional standards: A11y & Web Vitals
assert.ok(
  skillContent.includes('wcag') || skillContent.includes('WCAG') || skillContent.includes('axe-core') || skillContent.includes('a11y'),
  'SKILL.md must mandate accessibility testing'
)
assert.ok(
  skillContent.includes('vitals') || skillContent.includes('Vitals') || skillContent.includes('hydration'),
  'SKILL.md must mandate Web Vitals / hydration checks'
)

// Video repro guidelines
assert.ok(
  skillContent.includes('.webm') && skillContent.includes('--cursor'),
  'SKILL.md must guide video reproduction with --cursor for interactive defects'
)

// 2. Verify QA Templates contracts
const matrixTpl = fs.readFileSync(matrixTplPath, 'utf8')
assert.ok(
  matrixTpl.includes('Accessibility') || matrixTpl.includes('A11y') || matrixTpl.includes('WCAG'),
  'test-matrix-template.md must include Accessibility testcase'
)
assert.ok(
  matrixTpl.includes('Responsive') || matrixTpl.includes('Mobile'),
  'test-matrix-template.md must include Responsive/Mobile testcase'
)
assert.ok(
  matrixTpl.includes('Vitals') || matrixTpl.includes('LCP') || matrixTpl.includes('CLS'),
  'test-matrix-template.md must include Web Vitals checklist'
)

const fullstackTpl = fs.readFileSync(fullstackTplPath, 'utf8')
assert.ok(
  fullstackTpl.includes('WebMCP') || fullstackTpl.includes('Accessibility') || fullstackTpl.includes('Vitals'),
  'test-matrix-fullstack-template.md must include WebMCP or A11y & Vitals'
)

const bugReportTpl = fs.readFileSync(bugReportTplPath, 'utf8')
assert.ok(
  bugReportTpl.includes('Video') || bugReportTpl.includes('.webm'),
  'bug-report-template.md must include Video Reproduction evidence field'
)

// 3. Verify init-qa.sh script contracts
const initQaScript = fs.readFileSync(initQaScriptPath, 'utf8')
assert.ok(
  initQaScript.includes('detect_dev_server') || initQaScript.includes('5173'),
  'init-qa.sh must contain dev server auto-detection logic (e.g. port 5173)'
)
assert.ok(
  initQaScript.includes('AGENT_BROWSER_SESSION'),
  'init-qa.sh must populate AGENT_BROWSER_SESSION in generated templates'
)

// 4. Test execution of init-qa.sh in a clean temp directory
import { execSync } from 'node:child_process'
import os from 'node:os'

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'supergraph-qa-test-'))
try {
  execSync(`bash "${initQaScriptPath}" matrix test-checkout ui http://localhost:5173`, {
    cwd: tmpDir,
    stdio: 'pipe',
  })
  const generatedMatrix = fs.readFileSync(path.join(tmpDir, 'docs/qa/test-matrix-test-checkout.md'), 'utf8')
  assert.ok(generatedMatrix.includes('TC-TEST_CHECKOUT-008'), 'Generated matrix must include TC-008 for a11y')
  assert.ok(generatedMatrix.includes('TC-TEST_CHECKOUT-009'), 'Generated matrix must include TC-009 for responsive')
  assert.ok(generatedMatrix.includes('http://localhost:5173'), 'Generated matrix must preserve custom target url')
  assert.ok(generatedMatrix.includes('sg-qa-test-checkout-'), 'Generated matrix must contain dynamic session ID')

  execSync(`bash "${initQaScriptPath}" bug test-checkout BUG-CHK-001 "Cart crash on submit" UI`, {
    cwd: tmpDir,
    stdio: 'pipe',
  })
  const bugFiles = fs.readdirSync(path.join(tmpDir, 'docs/qa')).filter(f => f.startsWith('bug-report-bug-chk-001'))
  assert.strictEqual(bugFiles.length, 1, 'Bug report file must be generated')
  const generatedBug = fs.readFileSync(path.join(tmpDir, 'docs/qa', bugFiles[0]), 'utf8')
  assert.ok(generatedBug.includes('BUG-CHK-001-repro.webm'), 'Bug report must reference webm video repro')
  assert.ok(generatedBug.includes('sg-qa-test-checkout-'), 'Bug report must contain dynamic session ID')
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true })
}

console.log('✔ browser-agent SKILL.md, QA templates, and init-qa.sh satisfy all contracts')
