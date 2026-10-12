/**
 * Supergraph plugin for DeepSeek Harness (DSH).
 *
 * Implements Cordis plugin standard:
 * - Registers Supergraph skills via ctx.skills
 * - Injects workflow guidelines via ctx.systemPrompt
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getTeamUiHtml } from './team/ui-html.js'

export const name = 'supergraph'
export const inject = ['skills']

function parseSkill(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw)
  if (!match) return { description: '', content: raw }
  const yaml = match[1]
  const content = raw.slice(match[0].length).trim()
  const descMatch = /description:\s*["']?([^"'\r\n]+)["']?/.exec(yaml)
  const nameMatch = /name:\s*["']?([^"'\r\n]+)["']?/.exec(yaml)
  return {
    name: nameMatch ? nameMatch[1].trim() : undefined,
    description: descMatch ? descMatch[1].trim() : '',
    content,
  }
}

export function apply(ctx) {
  const root = fileURLToPath(new URL('.', import.meta.url))
  const skillsDir = path.join(root, 'skills')

  const skillsService = ctx.get('skills') ?? ctx.skills
  if (skillsService && fs.existsSync(skillsDir)) {
    skillsService.registerProvider(() => ({
      name: 'supergraph',
      async list() {
        const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
        const candidates = []
        for (const ent of entries) {
          if (!ent.isDirectory()) continue
          const skillFile = path.join(skillsDir, ent.name, 'SKILL.md')
          if (!fs.existsSync(skillFile)) continue
          try {
            const raw = fs.readFileSync(skillFile, 'utf8')
            const { description, name: parsedName } = parseSkill(raw)
            candidates.push({
              name: parsedName || ent.name,
              description: description || `Supergraph ${ent.name} skill`,
              invocation: { modelInvocable: true, userInvocable: true },
              provider: 'supergraph',
              source: 'bundled',
              rank: 350,
              resourceBase: { kind: 'directory', path: path.join(skillsDir, ent.name) },
              locator: skillFile,
            })
          } catch {}
        }
        return candidates
      },
      async get(candidate, options) {
        const raw = await fs.promises.readFile(candidate.locator, {
          encoding: 'utf8',
          signal: options?.signal,
        })
        const { content } = parseSkill(raw)
        return {
          name: candidate.name,
          description: candidate.description,
          invocation: candidate.invocation,
          provider: candidate.provider,
          source: candidate.source,
          resourceBase: candidate.resourceBase,
          content,
        }
      },
    }))
  }

  const systemPrompt = ctx.get('systemPrompt')
  if (systemPrompt) {
    const agentsPath = path.join(root, 'AGENTS.md')
    if (fs.existsSync(agentsPath)) {
      systemPrompt.section({
        name: 'supergraph:workflow',
        order: 850,
        interpolate: false,
        text: () => fs.readFileSync(agentsPath, 'utf8'),
      })
    }
  }

  // Register API route for DSH Web GUI sidebar
  const registerRoute = (webServer) => {
    if (!webServer || typeof webServer.register !== 'function') return

    // 1. Standalone Supergraph Team UI HTML
    webServer.register({
      kind: 'exact',
      path: '/api/supergraph/team/ui',
      handler: (_req, res) => {
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        })
        res.end(getTeamUiHtml())
      }
    })

    // 2. Session-scoped Team State JSON
    webServer.register({
      kind: 'exact',
      path: '/api/supergraph/team/state',
      handler: (req, res) => {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        })

        const url = new URL(req.url, 'http://127.0.0.1:3080')
        const sessionId = url.searchParams.get('sessionId')
        const cwd = url.searchParams.get('cwd')

        const candidateRoots = []
        if (cwd) candidateRoots.push(cwd)

        const workspaceRegistry = ctx.get('workspaceRegistry') ?? ctx.workspaceRegistry
        if (workspaceRegistry && typeof workspaceRegistry.list === 'function') {
          try {
            for (const ws of workspaceRegistry.list()) {
              const wsPath = ws?.record?.path || ws?.path
              if (wsPath && !candidateRoots.includes(wsPath)) {
                candidateRoots.push(wsPath)
              }
            }
          } catch {}
        }
        if (!candidateRoots.includes(process.cwd())) candidateRoots.push(process.cwd())
        const defaultRoot = path.resolve(root, '../..')
        if (!candidateRoots.includes(defaultRoot)) candidateRoots.push(defaultRoot)

        for (const baseRoot of candidateRoots) {
          const teamDir = path.join(baseRoot, '.supergraph', 'team')

          // 1. Check session-specific state file if sessionId is present
          if (sessionId) {
            const sessionPath = path.join(teamDir, 'sessions', `${sessionId}.json`)
            if (fs.existsSync(sessionPath)) {
              try {
                res.end(fs.readFileSync(sessionPath, 'utf8'))
                return
              } catch {}
            }
          }

          // 2. Check general state.json
          const statePath = path.join(teamDir, 'state.json')
          if (fs.existsSync(statePath)) {
            try {
              const raw = fs.readFileSync(statePath, 'utf8')
              const parsed = JSON.parse(raw)
              // Only return if session matches or if no sessionId was requested
              if (sessionId) {
                if (parsed?.mission?.sessionId === sessionId) {
                  res.end(raw)
                  return
                }
              } else {
                res.end(raw)
                return
              }
            } catch {}
          }
        }

        res.end(JSON.stringify({ mission: null, tasks: [], sessionId: sessionId || null }))
      }
    })
  }

  if (typeof ctx.inject === 'function') {
    ctx.inject(['webServer'], (scope) => {
      registerRoute(scope.webServer)
    })
  } else if (ctx.webServer) {
    registerRoute(ctx.webServer)
  }
}
