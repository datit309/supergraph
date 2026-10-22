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

console.log('✔ browser-agent SKILL.md satisfies all contracts')
