#!/usr/bin/env node

import path from 'node:path'
import { TeamEngine } from '../team/engine.js'

const repoRoot = process.cwd()
const engine = new TeamEngine(repoRoot)
const status = engine.getWaveStatus()

if (!status.mission) {
  console.log('\n❌ Chưa có mission nào được khởi tạo trong .supergraph/team/state.json')
  console.log('   Khởi tạo bằng: sg_team_init qua MCP hoặc TeamEngine.initMission()\n')
  process.exit(0)
}

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
}

const statusBadge = {
  merged: `${colors.green}[MERGED]${colors.reset}`,
  green: `${colors.cyan}[GREEN]${colors.reset}`,
  red_tested: `${colors.red}[RED]${colors.reset}`,
  claimed: `${colors.yellow}[CLAIMED]${colors.reset}`,
  pending: `${colors.dim}[PENDING]${colors.reset}`,
}

console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`)
console.log(`${colors.bold}⚡ SUPERGRAPH AGENT TEAM DASHBOARD${colors.reset}`)
console.log(`${colors.cyan}======================================================================${colors.reset}`)
console.log(`${colors.bold}Mission:${colors.reset}    ${status.mission.objective}`)
console.log(`${colors.bold}Base Branch:${colors.reset}${status.mission.baseBranch} | ${colors.bold}ID:${colors.reset} ${status.mission.id}`)
console.log(`${colors.cyan}----------------------------------------------------------------------${colors.reset}`)

const waveKeys = Object.keys(status.waves).sort((a, b) => Number(a) - Number(b))

for (const waveKey of waveKeys) {
  const wave = status.waves[waveKey]
  console.log(`\n${colors.bold}${colors.magenta}🌊 WAVE ${wave.wave}${colors.reset}`)
  
  for (const task of wave.tasks) {
    const badge = statusBadge[task.status] || `[${task.status}]`
    const worker = task.assignedTo ? `${colors.blue}@${task.assignedTo}${colors.reset}` : `${colors.dim}(unassigned)${colors.reset}`
    const deps = task.dependencies.length > 0 ? `${colors.dim}<- [${task.dependencies.join(', ')}]${colors.reset}` : ''
    
    console.log(`  ${badge} ${colors.bold}${task.id}${colors.reset}: ${task.title}`)
    console.log(`         Worker: ${worker} ${deps}`)
  }
}

console.log(`\n${colors.cyan}======================================================================${colors.reset}\n`)
