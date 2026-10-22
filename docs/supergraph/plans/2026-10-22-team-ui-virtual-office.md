# Supergraph Team Virtual Office Workspace Implementation Plan

## Architecture & Contracts
- **Virtual Office Concept**:
  - Transform the Supergraph Team Monitor (:3333 / DSH Right Sidebar) into a rich, interactive 2.5D/Modern Bento Virtual Office.
  - Each AI Agent / Worker is visually represented as a team member sitting at an interactive workstation (desk) or relaxing in the lounge.
- **Office Layout & Zones**:
  - **Zone 1: War Room / Command Hub (Phòng Chỉ Huy)**:
    - Smart Whiteboard displaying Mission Objective, active Wave, progress bar, base branch, KPI counters.
  - **Zone 2: Team Workstations / Pods (Bàn Làm Việc Nhân Sự)**:
    - Visual desks for active and standby agents (@architect, @frontend-dev, @backend-dev, @tester-qa, @git-ops, dynamic worker IDs).
    - Desk details:
      - Animated Character Avatar with persona badge.
      - Dual-screen monitors reflecting real-time task status (coding matrix, RED test alert 🚨, GREEN test checkmark 🟢, Git merge 🔀).
      - Desk lamp with state-colored light cone / ambient glow.
      - Coffee cup with steaming aroma ☕.
      - Pinboard note with task ID, wave, and worktree branch.
    - Click interaction: Clicking any desk opens the Member Workbench / Task Modal with logs, test output, and git diff.
  - **Zone 3: QA & Browser Lab (Phòng Thí Nghiệm QA)**:
    - Dedicated station for agent-browser E2E testing, accessibility checks, and test runner indicators.
  - **Zone 4: Coffee Lounge & Idle Pool (Khu Nghỉ Ngơi & Đợi Việc)**:
    - Dedicated area for idle agents waiting for wave dependencies to unlock.
- **Tab Navigation**:
  - Tab 1: 🏢 Văn Phòng Team (id: `tab-btn-office`, default active tab)
  - Tab 2: 🌊 Sóng DAG (id: `tab-btn-dag`)
  - Tab 3: 🤖 Agents & Worktrees (id: `tab-btn-workers`)
  - Tab 4: 📜 Dòng Nhật Ký (id: `tab-btn-logs`)
- **Theme & Responsiveness**:
  - Full Light Mode and Dark Mode styling using CSS custom properties.
  - Responsive design adapting smoothly from DSH Right Sidebar (380px) to full widescreen desktop.

## Environment Context
- Language: Node.js (ESM), HTML5, CSS3, JavaScript
- Working Directory: /Users/trantandat/GIC/Freelancer/supergraph
- Test command: node plugins/supergraph/tests/test-ui-office-workspace.mjs

## Tasks DAG & Execution Waves

### Wave 1: Test Contract (TDD RED)
- **Task 1: Create Unit Test for Virtual Office Workspace Contract**
  - ID: `task-1-office-test`
  - Wave: 1
  - Dependencies: []
  - Write scopes: `plugins/supergraph/tests/test-ui-office-workspace.mjs`
  - Acceptance: Test verifies `getTeamUiHtml()` contains office tab button, content container, CSS classes, desk components, and `renderOffice()` reactivity.

### Wave 2: Core Virtual Office Implementation (TDD GREEN)
- **Task 2: Implement Virtual Office Workspace in Supergraph Team UI**
  - ID: `task-2-office-ui`
  - Wave: 2
  - Dependencies: [`task-1-office-test`]
  - Write scopes: `plugins/supergraph/team/ui-html.js`
  - Acceptance:
    - Add `tab-btn-office` and `content-office` to HTML.
    - Make office the primary view with smooth tab switching.
    - Implement CSS styles for office floor, desks, dual monitors, avatars, state glow, coffee cup, and lounge.
    - Implement `renderOffice()` in client JavaScript to dynamically populate desks based on `currentData.tasks` and workers.
    - Wire desk clicks to `openTaskModal()`.
    - Pass test suite and verify in agent-browser.
