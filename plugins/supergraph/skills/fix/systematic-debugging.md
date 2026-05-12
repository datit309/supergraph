# Systematic Debugging Guide

Use inside `/supergraph:fix` when failures are unclear or repeated fixes fail.

## Principle

Find root cause before changing code. Do not guess-fix.

## When to Apply

Apply when:

- Test fails for unclear reason
- Same fix attempt failed twice
- Failure is flaky/timing-related
- Error points to symptoms, not root cause
- Multiple systems interact
- Regression source is unknown
- Fix would touch hub/bridge nodes

## Workflow

1. Reproduce with smallest command:
   - command
   - expected
   - actual
   - error

2. Classify failure:
   - assertion failure
   - exception/crash
   - timeout/flaky wait
   - environment/config
   - dependency/API mismatch
   - data/state pollution
   - race/order dependency

3. Trace root cause:
   - where bad value/state is observed
   - where it was produced
   - where it should have been validated/transformed
   - what changed recently

4. Use graph tools:
   - `get_minimal_context_tool()`
   - `query_graph_tool(query_type="callers", target="failing_symbol")`
   - `query_graph_tool(query_type="callees", target="failing_symbol")`
   - `get_impact_radius_tool(files=[suspect_files], depth=2)`
   - `get_affected_flows_tool(files=[suspect_files])`

5. Form one hypothesis:
   - hypothesis
   - evidence
   - test to confirm

6. Make minimal root-cause fix only.

7. Verify focused test and relevant suite.

## Stop Conditions

Stop and ask when:

- Cannot reproduce
- Root cause unclear after 3 hypotheses
- Fix requires public API or hub node changes
- Failure depends on external service you cannot inspect
- Suggested fix conflicts with plan/requirements

## Rules

- Reproduce before fixing
- Root cause before code change
- One hypothesis at a time
- Minimal fix only
- Never weaken tests to pass
- Never hide failure with broad catch/fallback
- Verify after fix
