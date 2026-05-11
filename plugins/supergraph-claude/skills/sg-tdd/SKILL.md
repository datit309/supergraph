---
description: Test-Driven Development for every implementation. Use when implementing any feature or fix. RED-GREEN-REFACTOR cycle.
---

# Skill: TDD

Write test first, then implement. No exceptions.

## Steps

### 1. Detect Language

Run: `bash bin/detect-project.sh`

### 2. Find Existing Tests

```
mcp__code-review-graph__query_graph_tool(query_type="tests", target="target/file.py")
```

If tests exist → read and understand patterns.
If no tests → create new test file following project conventions.

### 3. RED — Write Failing Test

1. Write MINIMAL failing test describing expected behavior
2. Run: `$TEST_CMD`
3. MUST FAIL
4. Report: `RED: [test_name] fails`

### 4. GREEN — Minimal Implementation

1. Write SIMPLEST code that makes test pass
2. No extras, no optimization
3. Run: `$TEST_CMD`
4. MUST PASS
5. Report: `GREEN: [test_name] passes`

### 5. REFACTOR — Safe Improvement

1. Check impact:

```
mcp__code-review-graph__get_impact_radius_tool(files=["refactored_file"], depth=2)
```

2. Refactor while keeping tests green
3. Run ALL tests for blast radius files
4. Report: `REFACTOR: clean`

### 6. Verify Blast Radius

```
mcp__code-review-graph__get_impact_radius_tool(files=["all_changed_files"], depth=3)
```

Run tests for ALL files in blast radius.

### 7. Commit

```bash
git add -p
git commit -m "test: [description]"
git commit -m "feat: [description]"
```

## Rules

- Test first, always
- Minimal test, minimal implementation
- Verify blast radius after changes
- Separate commits for test and implementation
