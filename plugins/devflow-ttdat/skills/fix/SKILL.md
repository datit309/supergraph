---
name: devflow-fix
description: Tự động fix loop test + lint + graph review. Tự động kích hoạt sau khi coding hoàn tất.
autoTrigger: post_implementation
---

# Skill: Auto-Fix Loop

> Auto-trigger: After all coding is complete.

## Purpose

Catch and fix issues automatically. Max 3 iterations.

## Steps

### 0. Setup

Detect language:

- `pubspec.yaml` → TEST=`flutter test`, LINT=`flutter analyze`
- `package.json` → TEST=`npm test`, LINT=`npm run lint` or `npx eslint .`
- `composer.json` → TEST=`vendor/bin/phpunit`, LINT=`vendor/bin/phpstan analyse`

Get changed files:

    git diff --name-only

Graph scope:

    mcp__code-review-graph__blast_radius(files=[changed], depth=3, direction="both")

### 1. Fix Loop

    MAX = 3
    iter = 0

    while iter < MAX:

        A. Tests
        Run [TEST_CMD]
        If failed:
            For each failing test:
                Find source file
                blast_radius([source], depth=2)
                Read test + source + blast files
                Analyze failure
                Fix source (NOT test unless test is wrong)
            iter++
            continue

        B. Lint
        Run [LINT_CMD]
        If errors:
            For each error: fix it
            iter++
            continue

        C. Graph Review
        cycles = find_cycles()
        For each changed file:
            score = surprise_score(file)
            If score > 0.7: mark CRITICAL
        For each changed file:
            tests = find_tests_for(file)
            If no tests: mark WARNING

        If any CRITICAL: fix them; iter++; continue

        break

    If iter >= MAX:
        STOP → present remaining issues → NEVER commit broken code
    Else:
        "Auto-fix complete — tests PASS, lint PASS, review PASS"

### Rules

- NEVER modify tests to make them pass (unless test is wrong)
- NEVER commit if any check fails after 3 iterations
- ALWAYS use blast_radius to understand fix impact
- ALWAYS re-run full check after each fix
