# Supergraph Skills — Complete Flow

## Skills (7)

| #   | Skill           | File                | Vai trò                                     | Khi nào dùng                |
| --- | --------------- | ------------------- | ------------------------------------------- | --------------------------- |
| 1   | **Context**     | `01-context.md`     | Load codebase graph, detect project         | Session start, 1 lần        |
| 2   | **Plan**        | `02-plan.md`        | Scan codebase, blast radius, task breakdown | Trước khi code              |
| 3   | **TDD**         | `03-tdd.md`         | RED-GREEN-REFACTOR per task                 | Khi implement (single task) |
| 4   | **Fix**         | `04-fix.md`         | Auto-fix loop: test + lint + format + graph | Sau khi code xong           |
| 5   | **Review**      | `05-review.md`      | Final gate trước merge                      | Sau fix                     |
| 6   | **Execute**     | `06-execute.md`     | Dispatch plan, orchestrate multi-task       | Khi có plan muốn chạy hết   |
| 7   | **Integration** | `07-integration.md` | Integration + e2e tests                     | Sau fix, trước review       |

## Agents (2)

| Agent                   | File                | Vai trò                           |
| ----------------------- | ------------------- | --------------------------------- |
| **supergraph-planner**  | `agent-planner.md`  | Tạo plan, không bao giờ code      |
| **supergraph-executor** | `agent-executor.md` | Chạy plan, không bao giờ tạo plan |

## Flow chính

```
┌─────────────────────────────────────────────────────────┐
│                    SESSION START                         │
│                    /supergraph:context                   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    PLANNING                              │
│  /supergraph:plan (or supergraph-planner agent)         │
│  → Scan codebase, graph analysis, create tasks          │
│  → Save to docs/supergraph/plans/                      │
└──────────────────────────┬──────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌──────────────────────┐  ┌───────────────────────────────┐
│  SMALL CHANGE        │  │  LARGE CHANGE                 │
│  /supergraph:tdd     │  │  /supergraph:execute          │
│  (skip plan)         │  │  (dispatch executor agent)    │
└──────────┬───────────┘  └───────────┬───────────────────┘
           │                          │
           │         ┌────────────────┘
           │         ▼
           │  ┌──────────────────────┐
           │  │  PER TASK (TDD)      │
           │  │  RED → GREEN →       │
           │  │  REFACTOR → COMMIT   │
           │  │  (max 3 retries)     │
           │  └──────────┬───────────┘
           │             │
           │             │  (all tasks done)
           │             ▼
           │  ┌──────────────────────┐
           │  │  /supergraph:fix     │
           │  │  Tests + Lint +      │
           │  │  Format + Graph      │
           │  │  (max 3 iterations)  │
           │  └──────────┬───────────┘
           │             │
           └─────────────┤
                         ▼
           ┌──────────────────────────┐
           │  /supergraph:integration │
           │  Integration + E2E       │
           │  (max 3 retries)         │
           └──────────┬───────────────┘
                      │
                      ▼
           ┌──────────────────────────┐
           │  /supergraph:review      │
           │  Graph review + verify   │
           │  PASS / NEEDS_CHANGES /  │
           │  BLOCKED                 │
           └──────────┬───────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
      PASS      NEEDS_CHANGES   BLOCKED
       │            │              │
       ▼            ▼              ▼
     MERGE    /supergraph:fix   ESCALATE
              (max 2 cycles)    TO HUMAN
```

## Rollback Paths

- **TDD stuck** (3 fails) → mark stuck in plan, skip, continue next
- **Fix blocked** (3 iterations) → stop, report issues, never commit broken
- **Review NEEDS_CHANGES** → return to fix (max 2 review cycles)
- **Review BLOCKED** → escalate to human
- **Regression at checkpoint** → revert checkpoint, debug

## Key Improvements vs Original

| Gap                                    | Fix                                              |
| -------------------------------------- | ------------------------------------------------ |
| No fallback for `detect-project.sh`    | Added auto-detect by config files                |
| No stuck handling in TDD               | Max 3 retries → mark stuck, skip                 |
| No rollback path in review             | Explicit rollback: fix → re-review → escalate    |
| No execute/dispatch skill              | New `/supergraph:execute` with parallel dispatch |
| No integration testing                 | New `/supergraph:integration` skill              |
| Executor agent lacked parallel support | Added parallel group execution                   |
| No `.supergraph-env` persistence       | Context skill saves to `.supergraph-env`         |
| Review had no handoff                  | Added verdict → next step mapping                |
