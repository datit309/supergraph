---
name: tdd
description: Strict test-driven development for behavior changes. Requires verified RED before production code, minimal GREEN, and refactor only after passing tests.
---

# Skill: TDD

Strict test-driven development for features, bug fixes, refactors, and behavior changes.

Before claiming a TDD task complete or taking branch actions, apply `skills/tdd/finishing-development.md`.

**Iron law:** NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.

**Delete means delete:** If production code was written before a verified failing test, delete it and restart from RED. Do not keep it as a reference.

## When to Use

Always use for:

- New features
- Bug fixes
- Behavior changes
- Refactoring behavior-preserving code with test coverage

Ask before skipping for:

- Configuration-only changes
- Generated code
- Throwaway prototypes
- Documentation-only changes

## State Machine

Every behavior change must move through these states in order:

1. `needs_test`
2. `red_written`
3. `red_verified`
4. `green_implementation_allowed`
5. `green_verified`
6. `refactor_allowed`
7. `complete`

Do not skip states.

## Steps

### 1. Identify One Behavior

Before writing code, state the behavior under test:

```markdown
Behavior: [single externally visible behavior]
Test file: [path]
Test name: [clear behavior-focused name]
Command: [focused test command]
Expected RED failure: [why it should fail before implementation]
```

Rules:

- One behavior per test
- Test public behavior, not implementation details
- Prefer real code over mocks
- Mocks allowed only when unavoidable; state why
- Bug fixes must reproduce the bug first

### 2. RED — Write One Failing Test

Write the minimal automated test for the behavior.

Do not edit production code yet.

Good tests:

- Clear name describing expected behavior
- Minimal setup
- Deterministic
- Assertions on observable behavior
- Uses real code where practical

Bad tests:

- Name like `works`
- Multiple unrelated assertions
- Mock-call-count-only assertions
- Mirrors implementation details
- Requires production test-only hooks

### 3. Verify RED

Run the focused test:

```bash
$FOCUSED_TEST_CMD
```

Valid RED means:

- Test fails
- Failure is for the expected missing behavior
- Failure is not syntax/import/setup error
- Failure is not due to typo or bad assertion

If test passes immediately:

- It does not prove new behavior
- Revise the test until it fails for the expected reason

If test errors:

- Fix test/setup until it fails for the intended behavioral reason

Record evidence:

```markdown
## TDD Evidence
- Behavior: [behavior]
- RED command: `[command]`
- RED result: FAIL
- RED reason: [expected missing behavior]
```

Only after valid RED may production implementation begin.

### 4. GREEN — Minimal Implementation

Write only the production code needed to pass the failing test.

Allowed:

- Minimal code to satisfy current test
- Smallest API change required by test

Forbidden:

- Unrelated cleanup
- Future behavior not required by current test
- Speculative abstractions/options/callbacks
- Broad refactors
- Adding test-only methods to production code

If production code was already written before RED:

1. Delete it
2. Re-run RED test to confirm failure
3. Re-implement minimally

### 5. Verify GREEN

Run focused test first:

```bash
$FOCUSED_TEST_CMD
```

Then run relevant broader tests:

```bash
$TEST_CMD
```

Valid GREEN means:

- New test passes
- Existing relevant tests pass
- Output has no unexpected warnings/errors/logs

Record evidence:

```markdown
- GREEN command: `[command]`
- GREEN result: PASS
- Relevant suite: PASS
```

### 6. REFACTOR — Only After Green

Refactor only after tests pass.

Allowed:

- Rename for clarity
- Remove duplication
- Extract helper
- Improve structure without changing behavior

Required after refactor:

```bash
$FOCUSED_TEST_CMD
$TEST_CMD
```

Record evidence:

```markdown
- Refactor: [summary or none]
- Refactor verification: PASS
```

### 7. Complete Behavior

Before marking complete, run `/supergraph:verify` or include fresh evidence:

```markdown
## TDD Complete
- Behavior: [behavior]
- RED verified: yes
- GREEN verified: yes
- Refactor verified: yes|none
- Tests: PASS
```

Then move to next behavior and repeat from RED.

## Plan Integration

Plans should include TDD metadata for every behavior task:

```markdown
TDD:
- Behavior: [single behavior]
- Test file: [path]
- Test name: [name]
- RED command: `[focused test command]`
- Expected RED failure: [missing behavior]
- Minimal GREEN change: [smallest implementation idea]
- Refactor candidates: [optional, only after GREEN]
- Mocking: none | [why unavoidable]
```

## Execute Integration

Executor must enforce:

- No production edits before `red_verified`
- Stop if RED passes immediately
- Stop if RED error is setup/import/syntax issue
- Allow implementation only after valid RED
- Allow refactor only after GREEN
- Mark task completed only after verification evidence

## Review Integration

Review must reject or flag work when:

- Tests were added after implementation
- No RED evidence exists
- RED passed immediately
- RED failed for wrong reason
- Implementation exceeds tested behavior
- Bug fix lacks regression test
- Tests assert implementation details instead of behavior
- Mocks hide real integration risk

## Testing Anti-Patterns Reference

Before writing or approving tests, check `skills/tdd/testing-anti-patterns.md`.

Pre-mock gate:

- What behavior is under test?
- Is this mock isolating an external, slow, or flaky boundary?
- What side effects does the real dependency provide?
- Is the fake data schema complete enough?
- Would this test fail if real behavior broke?

Reject tests that only prove mocks exist or were called.

## Anti-Patterns

Stop and return to RED if you see:

- Production code before failing test
- Tests added after implementation
- "Too small to test"
- Manual testing instead of automated test
- Immediate test pass accepted as RED
- Cannot explain failure reason
- Keeping prewritten implementation as reference
- Overbuilding before tests require it
- Test-only production methods
- Heavy mocking due to tight coupling

## Rules

- NO production code without verified RED first
- Delete means delete
- Bugs require regression tests first
- One behavior per test
- Verify RED failure reason explicitly
- GREEN must be minimal
- Refactor only after GREEN
- Re-run tests after refactor
- Evidence required before completion
- Prefer behavior tests over implementation tests
