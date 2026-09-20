module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/support/setup.ts'],
  transform: { '^.+\\.[tj]sx?$': '<rootDir>/tests/unit/support/transform.cjs' },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1', '\\.(css|svg|png|webp|jpg)$': '<rootDir>/tests/unit/support/style.cjs' },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'json-summary', 'text-summary', 'lcov'],
  clearMocks: true,
};
