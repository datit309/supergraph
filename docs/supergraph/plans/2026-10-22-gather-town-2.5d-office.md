# Plan: Gather.town Style 2.5D RPG 3/4 Virtual Office Workspace

## Problem & Motivation
The previous CSS 3D perspective transform created skewed boxes and distorted fonts ("lỏ" / awkward perspective).
The user selected **Gather.town / 2.5D RPG 3/4** style: a clean, familiar, un-skewed top-down 3/4 oblique view (similar to Gather.town, Pokemon, Stardew Valley, WorkAdventure) with crisp fonts, front-facing desks with depth, glowing monitors, seated avatars with animated typing, meeting room with smartboard, QA server lab with blinking LEDs, pantry lounge, and walking personnel.

## Architecture & Visual Contracts
1. **Container & View Mode**:
   - Toggle button: `btn-view-gather` ("🎮 Văn Phòng 2.5D RPG") set as primary view.
   - Keep `btn-view-floorplan` ("🗺️ Bản Vẽ 2D") and `btn-view-pods` ("💻 Bàn Làm Việc").
   - Container: `#office-gather-wrapper`, `.gather-office`.
2. **Top-Down 3/4 Visual Hierarchy**:
   - Walls with 3D depth: `.gather-wall` (with top surface, shadow, and front face).
   - Floors: Parquet wood or modern carpet tiles with soft room borders.
   - Rooms:
     - **War Room** (Top-Left): Large conference table, chairs, big presentation smartboard, seated `@architect`.
     - **QA & Server Lab** (Top-Right): Server rack towers with animated blinking LEDs, test bench, `@tester-qa`.
     - **Engineering Bay** (Bottom-Left): Dual-monitor wooden workstations, glowing screens with code, cute animated typing characters, desk lamps, nametags, task badges.
     - **Pantry Cafe & Lounge** (Bottom-Right): Coffee counter with steaming mug, water cooler, snacks, comfy sofa, standby pool.
   - **Hallways & Pathway**:
     - Carpeted corridor connecting all 4 zones.
     - Potted ficus plants (`🪴`) in corners.
     - Animated walking personnel (`🏃`) patrolling the hallway with smooth CSS keyframes.
3. **Interactivity**:
   - Clicking any desk opens the Task Details / Workbench Drawer.
   - Clicking standby employees shows their role & readiness toast.

## Waves & Task Breakdown

### Wave 1: Test Contracts (TDD RED)
- Task `task-1-gather-test`: Update `plugins/supergraph/tests/test-ui-office-workspace.mjs` to assert Gather.town 2.5D RPG view toggle (`btn-view-gather`), `.gather-office`, room structures, and workstations.
- Write scope: `plugins/supergraph/tests/test-ui-office-workspace.mjs`

### Wave 2: Implementation (GREEN)
- Task `task-2-gather-ui`: Implement Gather.town 2.5D RPG CSS styles and HTML markup in `plugins/supergraph/team/ui-html.js`.
- Write scope: `plugins/supergraph/team/ui-html.js`

### Wave 3: E2E Browser Testing & Validation
- Task `task-3-gather-e2e`: Test in `agent-browser` (snapshot, click desk, toggle views, theme toggle), capture screenshot, and verify clean rendering.
