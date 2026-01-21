---
description: Test generation and test running command. Creates and executes tests for code.
---

# /test - Test Generation and Execution

$ARGUMENTS

---

## PHASE 0: DEEP THINK PROTOCOL (MANDATORY)

**STOP & REASON:** Testing is not about passing; it is about finding failures.
Output this analysis in a `<reasoning>` block:

1.  **Context Audit (Framework Alignment)**:
    *   **Identify Framework:** Check `package.json` (Jest, Vitest, Mocha?) or `pyproject.toml` (Pytest?).
    *   *Constraint:* STRICTLY use the existing framework syntax. Do not mix Jest syntax in a Pytest repo.
2.  **Gap Analysis (The Matrix)**:
    *   **Target:** What file/function is being tested?
    *   **Missing Coverage:** Identify logic branches that are currently untested.
3.  **Risk Assessment (Adversarial Mode)**:
    *   *Happy Path:* Inputs that work.
    *   *Sad Path:* Inputs that throw errors (invalid types, nulls).
    *   *Edge Cases:* Empty arrays, boundary numbers (0, -1), network timeouts.
4.  **Verification Strategy**:
    *   Construct the exact command to run *only* this new test file (e.g., `npm test -- path/to/file`).

*Once the `<reasoning>` block is complete, proceed immediately to the Purpose section.*

---

## Purpose

This command generates tests, runs existing tests, or checks test coverage.

---

## Sub-commands

```
/test                - Run all tests
/test [file/feature] - Generate tests for specific target
/test coverage       - Show test coverage report
/test watch          - Run tests in watch mode
```

---

## Behavior

### Generate Tests

When asked to test a file or feature:

1. **Analyze the code**
   - Identify functions and methods
   - Find edge cases
   - Detect dependencies to mock

2. **Generate test cases**
   - Happy path tests
   - Error cases
   - Edge cases
   - Integration tests (if needed)

3. **Write tests**
   - Use project's test framework (Jest, Vitest, etc.)
   - Follow existing test patterns
   - Mock external dependencies

---

## Output Format

### For Test Generation

```markdown
## Tests: [Target]

### Test Plan
| Test Case | Type | Coverage |
|-----------|------|----------|
| Should create user | Unit | Happy path |
| Should reject invalid email | Unit | Validation |
| Should handle db error | Unit | Error case |

### Generated Tests

`tests/[file].test.ts`

[Code block with tests]

---

Run with: `npm test`
```

### For Test Execution

```
Running tests...

PASS auth.test.ts (5 passed)
PASS user.test.ts (8 passed)
FAIL order.test.ts (2 passed, 1 failed)

Failed:
  - should calculate total with discount
    Expected: 90
    Received: 100

Total: 15 tests (14 passed, 1 failed)
```

---

## Key Principles

- **Test behavior not implementation**
- **One assertion per test** (when practical)
- **Descriptive test names**
- **Arrange-Act-Assert pattern**
- **Mock external dependencies**
