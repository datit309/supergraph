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
}
