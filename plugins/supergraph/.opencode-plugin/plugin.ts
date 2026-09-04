import type { Plugin } from "@opencode-ai/plugin"
import * as fs from "node:fs"
import * as path from "node:path"
import * as os from "node:os"

const DESTRUCTIVE_RE =
  /(rm\s+.*-[a-z]*r[a-z]*f.*\s+(\/.*|~|\$HOME)|;\s*rm|&&\s*rm|\$\(\s*rm|`rm|mkfs|dd\s+if=|git\s+push\s+--force|git\s+reset\s+--hard|DROP\s+TABLE|DELETE\s+FROM)/i

const CODE_EXT_RE = /\.(py|js|ts|jsx|tsx|go|rs|java|php|dart|vue|svelte)$/

function readContextMd(cwd: string): string | null {
  const p = path.join(cwd, "CONTEXT.md")
  try {
    if (fs.existsSync(p) && fs.statSync(p).size > 0) {
      const content = fs.readFileSync(p, "utf-8").split("\n").slice(0, 80).join("\n").trim()
      if (content) return content
    }
  } catch {}
  return null
}

function findLatestPlan(cwd: string): string | null {
  const dir = path.join(cwd, "docs/supergraph/plans")
  try {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"))
    if (!files.length) return null
    // sort by mtime desc
    files.sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs)
    return path.join(dir, files[0])
  } catch {
    return null
  }
}

function readPlanStats(planPath: string | null) {
  if (!planPath) return null
  try {
    const c = fs.readFileSync(planPath, "utf-8")
    const pending = (c.match(/^Status: pending$/gm) || []).length
    const inProgress = (c.match(/^Status: in_progress$/gm) || []).length
    const completed = (c.match(/^Status: completed$/gm) || []).length
    const stuck = (c.match(/^Status: stuck$/gm) || []).length
    const approved = /Review:\s*Approved/.test(c)
    return { pending, inProgress, completed, stuck, approved, name: path.basename(planPath) }
  } catch {
    return null
  }
}

function latestHandoff(): { file: string; ageHours: number } | null {
  const tmp = process.env.TMPDIR || os.tmpdir()
  try {
    const files = fs
      .readdirSync(tmp)
      .filter((f) => f.startsWith("supergraph-handoff-") && f.endsWith(".md"))
      .map((f) => path.join(tmp, f))
      .filter((p) => fs.existsSync(p))
    if (!files.length) return null
    files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    const latest = files[0]
    const mtime = fs.statSync(latest).mtimeMs
    const ageHours = Math.floor((Date.now() - mtime) / 3600000)
    if (ageHours < 48) return { file: latest, ageHours }
  } catch {}
  return null
}

function keywordHint(prompt: string): string | null {
  const p = prompt.toLowerCase()
  if (/\b(triage|triaging|backlog|needs[- ]triage|issue queue|classify.*issue|issue.*classif)\b/.test(p))
    return "💡 Triage → analyze → plan: needs-triage→needs-info→ready-for-agent→ready-for-human→wontfix."
  if (!/\b(verify|verification|review|PR|pull request)\b/.test(p) && /\b(bug|not working|broken|failing|crash|exception)\b/.test(p))
    return "💡 Bug detected — /supergraph:diagnose: 6-phase debugging."
  if (/\b(build.*(ui|page|component|dashboard|landing)|design.*(web|ui|page)|make.*look|style.*component|landing page|web ui|frontend)\b/.test(p))
    return "💡 Frontend → /supergraph:frontend-design."
  if (/\b(analyze|analysis|phân tích|risk|ambiguous|hub|bridge)\b/.test(p))
    return "💡 Analyze → /supergraph:analyze: frame problem, check graph risk, propose approaches before plan."
  if (/\b(sdd|design doc|software design|system design|data contract|api spec|interface contract|đặc tả thiết kế)\b/.test(p))
    return "💡 SDD → /skills → sdd: component architecture, data contracts, and platform matrix before plan."
  if (/\b(plan|plann?ing|lên kế hoạch|create plan)\b/.test(p))
    return "💡 Plan → /supergraph:plan: graph-informed tasks with TDD steps (run analyze first)."
  if (/\b(implement|execute|thực thi|build feature)\b/.test(p))
    return "💡 Execute → /supergraph:execute (or tdd for single task) — ensure analyze→plan done."
  if (/\b(verify|verification|kiểm tra|xác minh|check done|ready to merge)\b/.test(p))
    return "💡 Verify → /supergraph:verify: fresh evidence before done."
  if (/\b(review|code review|merge|pull request|PR)\b/.test(p))
    return "💡 Review → /supergraph:review: independent reviewer + graph check."
  return null
}

export const SupergraphPlugin: Plugin = async ({ directory, client }) => {
  const cwd = directory || process.cwd()

  // Helper to log via opencode client when available
  const log = async (msg: string, level: "info" | "warn" | "debug" = "info") => {
    try {
      await (client as any)?.app?.log?.({
        body: { service: "supergraph", level, message: msg },
      })
    } catch {
      // fallback
      // eslint-disable-next-line no-console
      console.log(`[supergraph] ${msg}`)
    }
  }

  // Initial session hints (like session-start) will be injected via system.transform
  // We also log handoff if found at plugin init
  const handoff = latestHandoff()
  if (handoff) {
    log(`📦 HANDOFF FOUND: ${handoff.file} (${handoff.ageHours}h ago) — read before work`, "info")
  }

  return {
    // Inject mandatory workflow + context into system prompt (replaces SessionStart hook)
    "experimental.chat.system.transform": async (_input, output) => {
      const parts: string[] = []

      // 1. Mandatory workflow (from session-start / pre-invocation) — analyze before plan
      parts.push(`<EXTREMELY_IMPORTANT>
You have supergraph.

Mandatory workflow:
1. scan — load minimal graph context first (use /skills → scan)
2. analyze — assess ambiguity/risk, hub/bridge, select approach (required before plan for Standard/Full; skip only for Micro)
3. sdd — software design document, data contracts, API specs & platform matrix (Full tier)
4. plan — create machine-readable plan and get plan-reviewer approval
5. execute — execute plan, parallel by default when tasks are independent
6. fix — auto-fix with systematic debugging when needed
7. integration — run integration/e2e when configured
8. verify — no completion claims without fresh evidence
9. review — independent code-reviewer + graph review before merge

Tiered workflow — pick the right tier first:
- Micro (< 20 lines, ≤2 files, no hub/bridge, complexity <10): tdd → verify (skip analyze/plan)
- Standard (≤5 files, clear req, no cross-boundary): scan → analyze → plan → execute → fix → verify
- Full (>5 files, ambiguous, hub/bridge, cross-boundary): scan→analyze→sdd→plan→execute→fix→integration→verify→review

Hard rules:
- No production code without verified RED test first.
- Ask instead of guessing when requirements unclear.
- Do not proceed on main/master without explicit approval.
- Never claim done/ready/fixed without fresh verification evidence.
- ALWAYS reply in the same language the user wrote in. Skill announce strings are templates — translate before output.
- Use codebase-memory-mcp graph tools before assuming relationships; use Serena when available.
</EXTREMELY_IMPORTANT>`)

      // 2. CONTEXT.md domain vocabulary
      const ctx = readContextMd(cwd)
      if (ctx) {
        parts.push(`<DOMAIN_VOCABULARY>\nProject CONTEXT.md loaded — use these terms in all task descriptions and analysis:\n${ctx}\n</DOMAIN_VOCABULARY>`)
      }

      // 3. Handoff reminder
      if (handoff) {
        parts.push(`📦 HANDOFF FILE FOUND: ${handoff.file} (${handoff.ageHours}h ago)\nRead this file BEFORE starting any work — it contains session state, remaining tasks, and resume instructions.`)
      }

      // 4. Caveman always-on
      parts.push(`🦴 caveman mode ON (always). Rules: Strip articles/filler/subject pronouns. Keep exact: code, numbers, paths, errors, URLs. Structure: bullet lists over prose, one clause per bullet. Auto-suspend for: safety warnings, destructive ops, error explanations, questions needing full answer — then resume. No toggle needed.`)

      // 5. Zoom-out hint if no plan
      const plan = findLatestPlan(cwd)
      if (!plan) {
        parts.push(`💡 No active plan found. If this is an unfamiliar codebase, run scan then zoom-out to get oriented before planning.`)
      }

      // 6. Language hint
      parts.push(`🌐 Always reply in the same language the user wrote in.`)

      // Inject into system (opencode merges system arrays)
      for (const p of parts) output.system.push(p)
    },

    // Handle user prompt keyword hints — inject via chat.message parts? For now via log + system is enough,
    // but we also handle via chat.message to add hint as user-visible toast via event.
    "chat.message": async (input, output) => {
      try {
        const msg = (output.message as any) || {}
        // parts may contain text
        const parts = output.parts || []
        let prompt = ""
        for (const part of parts as any[]) {
          if (part.type === "text" && typeof part.text === "string") prompt += part.text + "\n"
          if (typeof part === "string") prompt += part + "\n"
        }
        // fallback from message content
        if (!prompt && msg.content) prompt = String(msg.content)

        const hint = prompt ? keywordHint(prompt) : null
        if (hint) {
          // Append hint as extra text part so LLM sees it (non-destructive, as auxiliary)
          // We add a new text part at end — opencode will include it in LLM context
          ;(output.parts as any[]).push({ type: "text", text: `\n\n[supergraph hint] ${hint}` })
          await log(`Hint injected: ${hint}`, "debug")
        }
        // Always ensure caveman reminder is present for first message
        // (already in system, but ensure per-message language hint)
        if (prompt && !hint) {
          // no extra action; system already has caveman
        }
      } catch (e) {
        // never block
      }
    },

    // Bash guard + plan guard — maps to PreToolUse hooks
    "tool.execute.before": async (input, output) => {
      const tool = (input as any).tool as string
      const args = (output as any).args as any

      // 1) Bash guard (from hooks/bash-guard)
      if (tool === "bash" || tool === "shell" || tool === "run_command" || tool === "bash_tool") {
        const command = args?.command ?? args?.cmd ?? args?.input ?? ""
        if (typeof command === "string" && DESTRUCTIVE_RE.test(command)) {
          await log(`🚫 BLOCKED destructive command: ${command.slice(0, 200)}`, "warn")
          throw new Error(
            `🚫 BLOCKED: Destructive command detected by Supergraph bash-guard.\nCommand: ${command.slice(0, 500)}\nIf this is intentional, explicitly confirm and retry.`,
          )
        }
      }

      // 2) File write guard (from hooks/pre-tool-use)
      // opencode tools for file writes: write, edit, apply_patch, create_file, etc.
      const fileWriteTools = new Set(["write", "edit", "apply_patch", "create", "update_file", "write_to_file", "replace_file_content"])
      if (fileWriteTools.has(tool)) {
        const filePath = args?.filePath ?? args?.file_path ?? args?.path ?? args?.targetFile ?? ""
        if (typeof filePath === "string" && CODE_EXT_RE.test(filePath)) {
          const plan = findLatestPlan(cwd)
          const stats = readPlanStats(plan)
          if (!plan) {
            const msg = `⚠️ No plan file found. Fast path: <10 lines / 1 file → use tdd directly (no plan needed). Otherwise: run plan first via /skills → plan.`
            await log(msg, "warn")
            // Don't block, but warn — inject via throwing? We choose to warn but allow
            // To make it visible, we log and also annotate via tool output? For now just log
            // Optionally we could throw to enforce, but we keep non-blocking as per original hook which was additionalContext
          } else if (stats && !stats.approved) {
            const msg = `📋 Plan: ${stats.name} — completed=${stats.completed} pending=${stats.pending} in_progress=${stats.inProgress} stuck=${stats.stuck} — ⚠️ Plan review not approved yet. Ensure plan-reviewer approves before implementation.`
            await log(msg, "warn")
          }
        }
      }
    },

    // Stop hook equivalent — session.idle progress reminder
    event: async ({ event }) => {
      const t = (event as any).type as string
      if (t === "session.idle" || t === "session.status") {
        const plan = findLatestPlan(cwd)
        const stats = readPlanStats(plan)
        const msgs: string[] = []
        if (stats) {
          const total = stats.pending + stats.inProgress + stats.completed + stats.stuck
          if (total > 0) msgs.push(`📊 Progress: completed=${stats.completed}/${total} pending=${stats.pending} in_progress=${stats.inProgress} stuck=${stats.stuck}`)
          if (stats.pending === 0 && stats.inProgress === 0 && stats.completed > 0) {
            msgs.push(`✅ Plan tasks done → fix → verify → review`)
          }
        }
        try {
          const dirty = (await import("node:child_process")).execSync("git status --porcelain 2>/dev/null | wc -l", { encoding: "utf-8" }).trim()
          const n = parseInt(dirty || "0", 10)
          if (n > 0) msgs.push(`⚠️ ${n} uncommitted changes — verify before claiming completion.`)
        } catch {}
        if (msgs.length) await log(msgs.join(" | "), "info")
      }

      // TUI prompt hint via event (alternative to chat.message) — just log
      if (t === "tui.prompt.append") {
        const props = (event as any).properties as any
        const prompt = props?.prompt ?? props?.text ?? ""
        if (prompt) {
          const hint = keywordHint(String(prompt))
          if (hint) await log(`Prompt hint: ${hint}`, "debug")
        }
      }
    },

    // Session compacting — inject persistent context
    "experimental.session.compacting": async (_input, output) => {
      const ctx = readContextMd(cwd)
      if (ctx) output.context.push(`DOMAIN VOCABULARY (from CONTEXT.md):\n${ctx.slice(0, 2000)}`)
      const plan = findLatestPlan(cwd)
      const stats = readPlanStats(plan)
      if (stats) {
        output.context.push(`Supergraph plan ${stats.name}: completed=${stats.completed} pending=${stats.pending} in_progress=${stats.inProgress} stuck=${stats.stuck} approved=${stats.approved}`)
      }
      await log(`Compaction context injected`, "debug")
    },
  }
}
