---
name: verify
description: Fresh verification gate before claiming work is done, fixed, passing, clean, ready, or before commit/PR. Evidence before claims.
---

# Skill: Verify

Fresh verification gate before completion claims.

**Iron law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.

## When to Use

Use before saying or implying:

- done
- fixed
- passing
- clean
- ready
- complete
- works
- verified
- successful

Also use before:

- marking a plan task `Status: completed`
- committing or creating a PR
- moving to the next plan phase
- accepting a subagent's success report
- final response after execute/fix/integration/review

## Core Rule

Before any positive status claim:

1. Identify the claim
2. Identify what proves it
3. Run fresh verification in the current context
4. Read exit code and output
5. Compare evidence to claim
6. Report evidence with the claim

Prior runs do not count. Subagent reports do not count without independent verification.

## Usage

```bash
/supergraph:verify
/supergraph:verify tests
/supergraph:verify lint
/supergraph:verify build
/supergraph:verify plan auth-login task 2
/supergraph:verify claim "login validation is fixed"
```

## Evidence Mapping

| Claim | Required fresh evidence |
| --- | --- |
| Tests pass | `$TEST_CMD` exits 0 and output shows zero failures |
| Lint clean | `$LINT_CMD` exits 0 and output shows zero errors |
| Build succeeds | `$BUILD_CMD` exits 0 |
| Bug fixed | Original failing symptom/test now passes |
| Regression covered | RED test failed before fix, GREEN test passes after fix |
| TDD complete | RED failure reason verified, GREEN passes, refactor verification passes, tests avoid anti-patterns |
| Task completed | Acceptance criteria checked + verification commands pass |
| Agent completed | Diff inspected + independent tests/lint run |
| Review passed | Code reviewer + graph review + tests/lint pass |
| Ready to merge | Tests + lint + build + review verdict PASS |

## Steps

### 1. Identify Intended Claim

Determine what is about to be claimed:

- `tests pass`
- `lint clean`
- `build succeeds`
- `task completed`
- `bug fixed`
- `review passed`
- `ready to merge`
- other explicit claim

If claim is ambiguous, ask: "What claim should I verify?"

### 2. Select Plan Context (optional)

If args include `plan <slug>` or plan files exist, use standard plan selection rules:

- 0 plans → continue without plan context
- 1 plan → use it
- >1 plans + no `plan <slug>` → ask user to choose
- `plan <slug>` → match filename containing slug

If task scope exists (`task N`, `tasks N,M`), verify acceptance criteria and status for those tasks.

### 3. Determine Proof Commands

Prefer commands from plan `## Environment Context`.

Fallback:

```bash
eval "$(bash bin/detect-project.sh)"
```

Map claim to commands:

- tests → `$TEST_CMD`
- lint → `$LINT_CMD`
- build → `$BUILD_CMD`
- task completed → task VERIFY commands + acceptance criteria
- ready to merge → `$TEST_CMD`, `$LINT_CMD`, `$BUILD_CMD`, `/supergraph:review`

If no command can prove the claim, STOP and report:

```text
Not verified yet. Required check is unknown. Please provide verification command.
```

### 4. Run Fresh Verification

Run required commands now. Do not reuse old output.

For delegated agent output:

```bash
git diff --stat
git diff --name-only
```

Then run relevant tests/lint/build locally.

### 5. Read and Interpret Output

Inspect:

- exit code
- failure count
- error count
- skipped tests (if relevant)
- command output summary

Do not equate:

- lint pass with build pass
- targeted test pass with full suite pass
- subagent summary with verified completion
- no output with success unless exit code is confirmed

### 6. Compare Evidence to Claim

If evidence supports claim, report:

```markdown
## Verification Evidence
- Claim: [claim]
- Command: `[command]`
- Exit code: 0
- Result: PASS
- Evidence: [specific output summary]
- Timestamp: [current timestamp]
```

If evidence fails, report actual state:

```markdown
## Verification Failed
- Claim: [claim]
- Command: `[command]`
- Exit code: [code]
- Result: FAIL
- Failure summary: [specific failure]
- Next: /supergraph:fix [same plan/scope]
```

If verification cannot be run, say so explicitly and do not use completion language.

### 7. Update Plan Status (if applicable)

Only after evidence passes:

- `Status: in_progress` → `Status: completed`

If evidence fails:

- keep current status, or mark `Status: stuck` if retries exhausted
- append verification failure summary

## Anti-Patterns to Block

Do not say:

- "should work"
- "seems fixed"
- "probably passes"
- "looks good"
- "done" without evidence
- "tests pass" when only lint ran
- "ready" when build/review were skipped

Do not:

- trust subagent success reports without independent checks
- use stale command output
- mark tasks completed without checking acceptance criteria
- commit or open PR without fresh verification
- hide skipped checks behind positive wording

## Response Discipline

If verified:

```text
Verified with `<command>`: [evidence]. [claim].
```

If not verified:

```text
Not verified yet. Required check: `<command>`.
```

If failed:

```text
Verification failed with `<command>`: [failure summary].
```

## Rules

- Evidence before claims, always
- Fresh verification only; old runs do not count
- Read command output before reporting
- No positive completion language without proof
- Agent output requires independent verification
- Commit/PR requires fresh tests, lint, build, and review evidence
- If verification cannot be run, state that explicitly
