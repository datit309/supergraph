# Writing Good Tests

Use this guide when designing the RED test. The test should be able to fail for the behavior it claims to protect, not merely prove that a line, mock, or fixture exists.

## Falsifiability checklist

- Name the behavior that must break if the implementation regresses.
- Use independent expected values. Do not calculate the expected answer with the same helper or algorithm as production code.
- Prefer behavior over implementation text: assert observable output, state, files, exit status, or protocol payloads when feasible.
- Choose the mock level deliberately. Mock only an external, slow, flaky, or nondeterministic boundary; keep the behavior under test real.
- Apply a mutation check: temporarily remove or alter the relevant production behavior and confirm the test turns RED.

## Strong fixture shape

Keep fixtures small and name the reason each input exists. Include at least one input that distinguishes the intended behavior from a plausible but wrong implementation. For shell workflows, assert both stdout/artifacts and failure behavior for invalid input.

## Review questions

1. What exact break does this test detect?
2. Could a hard-coded or change-detector implementation pass it?
3. Are expected values independent from production logic?
4. Does the mock hide the integration boundary that matters?
5. Which one-line mutation should make the test fail?
