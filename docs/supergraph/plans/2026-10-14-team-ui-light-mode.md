# Supergraph Team UI Light Mode Implementation Plan

## Architecture & Contracts
- Design system colors for Light Mode:
  - Surface: `--bg: #f8fafc`, `--card-bg: #ffffff`, `--card-border: #e2e8f0`, `--card-hover: #f1f5f9`
  - Text: `--text: #0f172a`, `--text-muted: #64748b`
  - Accent / Badges:
    - Primary: `#0284c7`, dim: `rgba(2, 132, 199, 0.12)`
    - Success: `#059669`, dim: `rgba(5, 150, 105, 0.12)`
    - Warning: `#d97706`, dim: `rgba(217, 119, 6, 0.12)`
    - Danger: `#dc2626`, dim: `rgba(220, 38, 38, 0.12)`
    - Purple: `#7c3aed`, dim: `rgba(124, 58, 237, 0.12)`
    - Teal: `#0d9488`, dim: `rgba(13, 148, 136, 0.12)`
  - Cards, Tables, Nav, Modals:
    - In Light Mode, header has clean white background with subtle border and light shadow.
    - Task cards use clean white cards with crisp slate borders (`#e2e8f0`) and subtle shadows.
    - Code blocks use clean high-contrast container with legible dark syntax/text or dark editor feel that fits seamlessly.
    - Status badges have high-contrast text on soft tinted background.
  - Theme switching contract:
    - Default theme: `light`.
    - Supports `[data-theme="dark"]` for dark theme fallback.
    - Theme toggle button in header: ☀️ Sáng / 🌙 Tối.
    - Persists in `localStorage.getItem('sg_team_theme')`.
    - Honors URL param `?theme=light` or `?theme=dark`.
    - Responds dynamically without full page reload.

## Environment Context
- Language: Node.js (ESM), HTML/CSS, React/TypeScript
- Branch: master
- Test command: node plugins/supergraph/tests/test-ui-html-theme.mjs
- Working Directory: /Users/trantandat/GIC/Freelancer/supergraph

## Task 1: Create Unit Test for Team UI Light Mode Contract
Wave: 1
Status: completed
Risk: low
Dependencies: none
Model: inherit

Files:
- Create: plugins/supergraph/tests/test-ui-html-theme.mjs
- Test: plugins/supergraph/tests/test-ui-html-theme.mjs

Acceptance:
- Test verifies `getTeamUiHtml()` contains light mode default, CSS theme variables, theme toggle element, and theme switching JS logic.
- 🔴 RED initially because test expects light mode styles and toggle which don't exist yet.

TDD:
- Behavior: getTeamUiHtml outputs HTML with light mode by default and theme toggle mechanism.
- Test file: plugins/supergraph/tests/test-ui-html-theme.mjs
- Test name: getTeamUiHtml includes light mode styles and toggle controls
- 🔴 RED command: node plugins/supergraph/tests/test-ui-html-theme.mjs
- Expected 🔴 RED failure: Missing light mode theme variables or theme toggle button
- Minimal 🟢 GREEN change: Implement light mode CSS variables and toggle logic in ui-html.js
- Refactor candidates: Ensure clean semantic CSS tokens for light and dark modes
- Mocking: none

Steps:
1. 🔴 RED: write exact failing test in plugins/supergraph/tests/test-ui-html-theme.mjs
   Command: node plugins/supergraph/tests/test-ui-html-theme.mjs
   Expected: FAIL
2. 🟢 GREEN: Implement minimal light theme variables in ui-html.js
   Command: node plugins/supergraph/tests/test-ui-html-theme.mjs
   Expected: PASS
3. REFACTOR: None
4. VERIFY: node plugins/supergraph/tests/test-ui-html-theme.mjs

Checkpoint:
- Files: plugins/supergraph/tests/test-ui-html-theme.mjs
- Commit: test: add team ui light mode contract test

## Task 2: Implement Light Mode & Theme Switcher in Supergraph Team UI
Wave: 2
Status: completed
Risk: low
Dependencies: Task 1
Model: inherit

Files:
- Modify: plugins/supergraph/team/ui-html.js

Acceptance:
- Complete Light Mode styling for header, cards, KPI counters, DAG columns, badges, modals, data tables, and empty states.
- High accessibility and visual polish (slate palette, crisp borders, legible text, glowing status dots).
- Theme toggle button in header (☀️ Sáng / 🌙 Tối).
- Persistence via localStorage and URL parameter handling.

TDD:
- Behavior: Supergraph Team UI displays in beautiful Light Mode by default, with functional toggle to Dark Mode.
- Test file: plugins/supergraph/tests/test-ui-html-theme.mjs
- Test name: verify full light mode CSS rules and elements
- 🔴 RED command: node plugins/supergraph/tests/test-ui-html-theme.mjs
- Expected 🔴 RED failure: Missing specific light mode components
- Minimal 🟢 GREEN change: Add full light mode styles, dark mode overrides, theme toggle button and switcher script in ui-html.js
- Refactor candidates: Clean CSS variables structure
- Mocking: none

Steps:
1. 🔴 RED: run test before full styling
   Command: node plugins/supergraph/tests/test-ui-html-theme.mjs
   Expected: test assertions
2. 🟢 GREEN: write full light mode implementation in plugins/supergraph/team/ui-html.js
   Command: node plugins/supergraph/tests/test-ui-html-theme.mjs
   Expected: PASS
3. REFACTOR: format and clean up
4. VERIFY:
   - node plugins/supergraph/tests/test-ui-html-theme.mjs
   - node plugins/supergraph/tests/test-team-engine.mjs

Checkpoint:
- Files: plugins/supergraph/team/ui-html.js
- Commit: feat(team-ui): support light mode by default with theme switcher

## Task 3: Enhance DSH Client TeamAction Light Mode Contrast
Wave: 3
Status: completed
Risk: low
Dependencies: Task 2
Model: inherit

Files:
- Modify: /Users/trantandat/GIC/deepseek-harness/packages/experimental/client-ui-agent-team/src/client/TeamAction.tsx
- Modify: /Users/trantandat/GIC/deepseek-harness/packages/experimental/client-ui-agent-team/src/client/TeamAction.module.css

Acceptance:
- TeamAction popup links and banners use theme-aware CSS tokens (var(--dsw-alias-brand-primary), var(--dsw-alias-label-primary)) instead of hardcoded #38bdf8, ensuring high contrast and legibility in Light Mode.
- Rebuild bundle in packages/experimental/client-ui-agent-team.

TDD:
- Behavior: TeamAction renders readable contrast in both light and dark themes without hardcoded #38bdf8.
- Test file: /Users/trantandat/GIC/deepseek-harness/packages/experimental/client-ui-agent-team/tests/team-action.client.spec.tsx
- Test name: verify TeamAction styles
- 🔴 RED command: pnpm --filter @deepseek-ai/dsh-experimental-client-ui-agent-team run bundle
- Expected 🔴 RED failure: N/A (CSS token refinement)
- Minimal 🟢 GREEN change: Update TeamAction.tsx inline styles and TeamAction.module.css
- Refactor candidates: clean tokens
- Mocking: none

Steps:
1. 🔴 RED: Inspect current inline styles
2. 🟢 GREEN: Replace hardcoded colors with theme variables and re-bundle
   Command: pnpm --filter @deepseek-ai/dsh-experimental-client-ui-agent-team run bundle
   Expected: Success
3. REFACTOR: verify clean build
4. VERIFY: pnpm --filter @deepseek-ai/dsh-experimental-client-ui-agent-team run bundle

Checkpoint:
- Files: packages/experimental/client-ui-agent-team/src/client/TeamAction.tsx packages/experimental/client-ui-agent-team/src/client/TeamAction.module.css
- Commit: feat(client-ui-agent-team): improve light mode contrast for supergraph team banner

## Task 4: Verify Running Team UI Service
Wave: 4
Status: completed
Risk: low
Dependencies: Task 2, Task 3
Model: inherit

Files:
- Test: http://127.0.0.1:3333

Acceptance:
- Live Dashboard serves Light Mode HTML by default.
- Restart running sg-team-ui process to load updated code.
- Verify HTTP response status 200 and light mode content.

TDD:
- Behavior: GET http://127.0.0.1:3333 returns light mode HTML.
- 🔴 RED command: curl -s http://127.0.0.1:3333 | grep -q 'data-theme="light"'
- Minimal 🟢 GREEN change: Restart sg-team-ui server and verify response.
- Refactor candidates: none
- Mocking: none

Steps:
1. 🔴 RED: curl -s http://127.0.0.1:3333
2. 🟢 GREEN: kill existing sg-team-ui and start fresh, then curl http://127.0.0.1:3333
   Command: curl -s http://127.0.0.1:3333 | head -n 30
   Expected: Status 200 and light mode styles
3. VERIFY: full pipeline verification

Checkpoint:
- Files: None
- Commit: chore: verify live team ui in light mode
