---
name: sg-tdd
description: Test-Driven Development cho mọi implementation. Tự động kích hoạt khi writing code.
autoTrigger: implementation
---

# Skill: sg-tdd

> Auto-trigger: When implementing any feature or fix.

## Purpose

Write test first, then implement. No exceptions.

## Steps

### Detect Language

- `pubspec.yaml` → `flutter test [file]`
- `package.json` → `npm test` / `npx jest [file]` / `npx vitest [file]`
- `composer.json` → `vendor/bin/phpunit [file]` / `vendor/bin/pest [file]`

### RED: Write Failing Test

1. Find existing tests:

   mcp__code-review-graph__find_tests_for(file=[target_file])

2. If tests exist: read, understand patterns, extend.
   If no tests: create new test file following project conventions.

3. Write MINIMAL failing test that describes expected behavior.

4. Run test → MUST FAIL.

5. Report: "RED: [test_name] fails"

### GREEN: Minimal Implementation

1. Write SIMPLEST code that makes the test pass.
2. No extras. No optimization.
3. Run test → MUST PASS.
4. Report: "GREEN: [test_name] passes"

### REFACTOR: Safe Improvement

1. Check impact:

   mcp__code-review-graph__blast_radius(files=[refactored_file], depth=2)
   mcp__code-review-graph__find_similar(pattern=[current_implementation])

2. Refactor while keeping tests green.
3. Run ALL tests for blast_radius files.
4. Report: "REFACTOR: clean"

### Verify Blast Radius

    mcp__code-review-graph__blast_radius(files=[all_changed_files], depth=3)

Run tests for ALL files in blast_radius.

### Commit

    git add -p
    git commit -m "test: [description of test]"
    git commit -m "feat: [description of implementation]"

## Escalation

| Condition                   | Action                   |
| --------------------------- | ------------------------ |
| No existing tests           | Create new test file     |
| Test fails after 3 attempts | STOP — ask for help      |
| Refactor creates new deps   | Re-run blast_radius      |
| Hub node involved           | REQUIRE user approval    |
