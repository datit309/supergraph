# Changelog

## 2.0.0

### Features

- 13 skills: scan, analyze, plan, tdd, execute, fix, integration, verify, review, database-migrations, flutter-dart-code-review, frontend-design, webapp-testing
- 4 agents: executor, plan-writer, code-reviewer, plan-reviewer
- Refactored core skills (scan → analyze → plan → execute → fix → verify → review) for enhanced clarity
- Enhanced executor with graph-assisted parallel dispatch (independent tasks run concurrently)
- New skill: **database-migrations** — patterns for PostgreSQL, Prisma, Drizzle, Kysely, Django, golang-migrate
- New skill: **flutter-dart-code-review** — 15-section checklist covering widgets, state management, Dart idioms, performance, accessibility, security
- New skill: **frontend-design** — distinctive, production-grade frontend interfaces avoiding generic AI aesthetics
- New skill: **webapp-testing** — Playwright-based web application testing toolkit with helper scripts
- Standardized machine-readable plan format with task status tracking
- Plan-aware fix/review cycle (auto-updates task status)
- Mandatory "read-before-edit" guardrails in documentation
- Auto-fix loop: max 3 iterations (test → lint → graph review)
- Dead code detection in fix loop
- Report progress after each phase

## 1.0.1

### Features

- 9 skills: scan, design, plan, tdd, execute, fix, integration, verify, review
- 4 agents: executor, plan-writer, code-reviewer, plan-reviewer
- MCP integration with code-review-graph
- Auto language detection: Node.js, Flutter, PHP
- Auto-fix loop: test + lint + graph review, max 3 iterations
- Blast radius analysis for change impact
- Hub node protection — requires user approval
- Community boundary detection
- Surprise score flagging
- Hook system for pre/post code write tracking

### Supported Languages

- Node.js / TypeScript (jest, vitest, mocha, eslint)
- Flutter / Dart (flutter test, flutter analyze)
- PHP (phpunit, pest, phpstan, phpcs)
