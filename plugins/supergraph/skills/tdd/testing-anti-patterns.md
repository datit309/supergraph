# Testing Anti-Patterns

Testing guardrails for TDD, review, and verification.

**Principle:** Test what the code does, not what the mocks do.

Use this before writing tests, adding mocks, modifying test fixtures, or approving test coverage.

## 1. Testing Mock Behavior

**Anti-pattern:** Test asserts that a mock was rendered, called, or present rather than verifying real behavior.

Bad examples:

```ts
expect(MockedButton).toHaveBeenCalled()
expect(screen.getByTestId('mock-user-card')).toBeInTheDocument()
```

Better:

```ts
expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
expect(screen.getByText('Jane Doe')).toBeVisible()
```

Ask:

- What user-visible behavior is proven?
- Would this test fail if the real behavior broke?
- Is the mock assertion just proving the mock exists?

## 2. Test-Only Production Methods

**Anti-pattern:** Adding production APIs that exist only for tests.

Examples:

- `resetForTest()`
- `clearInternalCacheForTests()`
- test-only lifecycle hooks
- exposing private internals only for assertions

Better:

- Move setup/cleanup into test utilities
- Use public behavior to drive state
- Improve design only if production also benefits

Ask:

- Is this API used outside tests?
- Does production need this capability?
- Can a test utility handle it instead?

## 3. Mocking Without Understanding Dependencies

**Anti-pattern:** Mocking high-level behavior without understanding side effects or dependency chains.

Symptoms:

- Test passes but integration fails
- Mock skips state updates, event dispatch, cache writes, or cleanup
- Mocked function returns data but omits important behavior

Better:

- Run with real dependency first when practical
- Mock only slow, flaky, or external boundaries
- Document why the mock is necessary

Ask:

- What side effects does the real dependency provide?
- Are those side effects required by downstream code?
- Is this a boundary mock or an internal behavior mock?

## 4. Incomplete Mocks and Fixtures

**Anti-pattern:** Fake responses omit fields real downstream code needs.

Bad:

```ts
const user = { id: '1' }
```

Better:

```ts
const user = makeUserFixture({ id: '1' })
```

Ask:

- Does fixture mirror the real schema?
- Are optional/nullable fields represented?
- Would this test catch schema mismatch bugs?

## 5. Integration Tests as Afterthought

**Anti-pattern:** Implementation first, tests later.

Correct flow:

1. RED: write failing behavior test
2. Verify RED failure reason
3. GREEN: minimal implementation
4. Verify GREEN
5. REFACTOR
6. Verify again

Ask:

- Did the test fail before implementation?
- Is there RED evidence?
- Was this added after the fact?

## 6. Over-Complex Mocks

**Anti-pattern:** Mock setup is larger or more brittle than real behavior.

Symptoms:

- Test has pages of mock setup
- Mock mimics an entire subsystem
- Updating implementation requires rewriting mock internals

Better:

- Use real component/module
- Use integration test
- Simplify design to make behavior testable

Ask:

- Is this mock harder to understand than the real dependency?
- Would an integration test be clearer?
- Is tight coupling making this hard to test?

## Review Checklist

Flag tests that:

- Assert mock-specific calls instead of behavior
- Rely heavily on `data-testid` when role/text/output would work
- Add production APIs used only by tests
- Mock internal modules without explaining why
- Use partial fixtures that do not match real schemas
- Have mock setup dominating the test
- Test implementation details rather than observable outcomes
- Lack RED evidence for behavior changes

## Acceptable Mocking

Mocks are acceptable when they isolate:

- Network calls
- File system
- Time/date
- Randomness
- External services
- Slow or flaky boundaries

But the test must still prove real behavior at the boundary under test.

## Rule

If a mock does not clearly isolate an external/slow/flaky boundary, question it.
