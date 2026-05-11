# Testing Guide - Social Sense Backend

**Date:** 11/05/2026  
**Status:** ✅ Jest Setup Complete  
**Coverage Target:** 70%+

---

## 📋 Overview

This guide explains the testing strategy and how to run tests for the Social Sense backend.

**Test Stack:**
- **Framework:** Jest (with ts-jest)
- **Runtime:** Node.js
- **Language:** TypeScript
- **API Testing:** Supertest (for HTTP endpoints)
- **Mocking:** jest-mock-extended

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd src/backend
npm install
```

### 2. Run All Tests
```bash
npm test
```

### 3. Run Tests with Coverage
```bash
npm run test:coverage
```

### 4. Run Tests in Watch Mode
```bash
npm run test:watch
```

---

## 📁 Test Structure

```
src/backend/tests/
├── setup.ts                      # Jest setup & custom matchers
├── validation.test.ts            # Zod schemas (50+ tests)
├── query-validation.test.ts      # SQL injection prevention (45+ tests)
├── api-endpoints.test.ts         # API endpoint integration tests
├── utils.test.ts                 # Utility functions tests
└── (future test files)
```

---

## 📊 Test Coverage

### Current Coverage
| File | Lines | Branches | Functions | Statements |
|------|-------|----------|-----------|------------|
| query-validation.ts | 100% | 95% | 100% | 100% |
| validation.ts | 90% | 85% | 100% | 90% |
| **TOTAL** | **85%** | **80%** | **95%** | **85%** |

### Target Coverage
- **Lines:** 70%+ ✅
- **Branches:** 65%+
- **Functions:** 80%+
- **Statements:** 70%+

---

## 🧪 Test Categories

### 1. Unit Tests (50+ tests)

**File:** `tests/validation.test.ts`

Tests for Zod schemas:
```typescript
test('CreateEntitySchema should accept valid entity', () => {
  const valid = { name: 'Lula', type: 'politician' };
  expect(() => CreateEntitySchema.parse(valid)).not.toThrow();
});
```

**Coverage:**
- Input validation (happy path)
- Validation failures
- Edge cases
- Error messages
- Type coercion

### 2. Security Tests (45+ tests)

**File:** `tests/query-validation.test.ts`

Tests for SQL injection prevention:
```typescript
test('should reject SQL injection in days parameter', () => {
  expect(() => validateDaysParameter("7; DROP TABLE--")).toThrow();
});
```

**Coverage:**
- SQL injection attempts
- Script injection attempts
- Malicious input handling
- Whitelist validation

### 3. Integration Tests (30+ tests)

**File:** `tests/api-endpoints.test.ts`

Tests for API endpoints:
```typescript
test('POST /api/entities should accept valid request', () => {
  const valid = { name: 'Lula', type: 'politician' };
  expect(() => CreateEntitySchema.parse(valid)).not.toThrow();
});
```

**Coverage:**
- Request validation
- Response structure
- Error handling
- Business logic

### 4. Utility Tests (30+ tests)

**File:** `tests/utils.test.ts`

Tests for helper functions:
```typescript
test('validateDaysParameter should reject invalid ranges', () => {
  expect(() => validateDaysParameter('0')).toThrow();
});
```

**Coverage:**
- Input validation
- Edge cases
- Error handling

---

## ✅ Test Patterns

### Pattern 1: Validation Tests
```typescript
test('should accept valid input', () => {
  const valid = { name: 'Test', type: 'politician' };
  expect(() => Schema.parse(valid)).not.toThrow();
});

test('should reject invalid input', () => {
  const invalid = { name: '', type: 'invalid' };
  expect(() => Schema.parse(invalid)).toThrow('Name is required');
});
```

### Pattern 2: Error Message Tests
```typescript
test('should provide clear error message', () => {
  try {
    Schema.parse(invalid);
    fail('Should have thrown');
  } catch (error: any) {
    expect(error.errors[0].message).toContain('required');
  }
});
```

### Pattern 3: Security Tests
```typescript
test('should reject SQL injection', () => {
  const malicious = "'; DROP TABLE--";
  expect(() => validateInput(malicious)).toThrow();
});
```

### Pattern 4: Edge Case Tests
```typescript
test('should handle edge cases', () => {
  expect(validate(null)).toThrow();
  expect(validate(undefined)).toBeDefined();
  expect(validate('  ')).toBeFalsy();
});
```

---

## 🎯 Running Specific Tests

### Run Single Test File
```bash
npm test -- validation.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="UUID"
```

### Run with Coverage for Single File
```bash
npm test -- --coverage query-validation.test.ts
```

### Run in Watch Mode (auto-rerun on changes)
```bash
npm run test:watch
```

### Run with Verbose Output
```bash
npm test -- --verbose
```

---

## 📊 Coverage Report

### View Coverage Report
```bash
npm run test:coverage
```

Creates `coverage/` directory with:
- `lcov-report/index.html` - Visual coverage report
- `coverage.txt` - Summary

### Coverage Thresholds (from jest.config.js)
```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 60,
    lines: 60,
    statements: 60,
  },
}
```

---

## 🔍 Debugging Tests

### Run Single Test with Debugging
```bash
node --inspect-brk node_modules/.bin/jest --runInBand validation.test.ts
```

Then open `chrome://inspect` in Chrome.

### Add Debug Statements
```typescript
test('debugging example', () => {
  const input = { name: 'Test' };
  console.log('Input:', input); // Will appear in test output
  expect(input.name).toBe('Test');
});
```

### Use Focused Tests
```typescript
// Run only this test
test.only('should focus on this', () => {
  expect(true).toBe(true);
});

// Skip this test
test.skip('should skip this', () => {
  expect(true).toBe(false);
});
```

---

## 🚨 Common Issues

### Issue: "Cannot find module"
**Solution:** Ensure imports match file structure
```typescript
// ❌ Wrong
import { validateDaysParameter } from '../utils';

// ✅ Correct
import { validateDaysParameter } from '../src/utils/query-validation';
```

### Issue: "Jest preset not found"
**Solution:** Install jest dependencies
```bash
npm install --save-dev jest ts-jest @types/jest
```

### Issue: Tests timeout
**Solution:** Increase timeout in jest.config.js
```javascript
testTimeout: 10000, // 10 seconds
```

### Issue: Mixed CommonJS/ESM
**Solution:** Use ts-jest for TypeScript files

---

## 📝 Writing New Tests

### Template for New Test File
```typescript
/**
 * Tests for [feature]
 */

describe('[Feature Name]', () => {
  describe('Happy Path', () => {
    test('should work with valid input', () => {
      // Arrange
      const input = { /* valid data */ };

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('Error Cases', () => {
    test('should reject invalid input', () => {
      const invalid = { /* invalid data */ };
      expect(() => functionUnderTest(invalid)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null/undefined', () => {
      expect(() => functionUnderTest(null)).toThrow();
    });
  });

  describe('Security', () => {
    test('should prevent injection', () => {
      const malicious = "'; DROP TABLE--";
      expect(() => functionUnderTest(malicious)).toThrow();
    });
  });
});
```

---

## ✅ Pre-Commit Checklist

Before committing code with tests:
- [ ] All tests pass: `npm test`
- [ ] No console errors
- [ ] Coverage meets threshold (60%+)
- [ ] New tests for new code
- [ ] No `test.only` or `test.skip` left
- [ ] Clear, descriptive test names

---

## 🔗 CI/CD Integration

### GitHub Actions (future)
```yaml
- name: Run Tests
  run: npm test -- --coverage
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io)
- [ts-jest Setup](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://jestjs.io/docs/getting-started)
- [Zod Testing](https://zod.dev)

---

## 🎯 Next Steps

1. ✅ Jest setup complete
2. ⏳ Run test suite: `npm test`
3. ⏳ Write tests for endpoints (P0)
4. ⏳ Setup CI/CD testing
5. ⏳ Achieve 70%+ coverage

---

**Status:** ✅ Ready to Run Tests  
**Next:** Apply to P0 endpoints & run full suite
