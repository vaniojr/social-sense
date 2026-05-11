/// <reference types="jest" />
/**
 * Jest Setup File
 * Runs before all tests
 */

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise (but keep warn for test spying)
const originalWarn = console.warn;
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: originalWarn,
  // Keep error for debugging failed tests
  error: console.error,
};

// Add custom matchers if needed
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () => `Expected ${received} to be a valid UUID`,
    };
  },
});
