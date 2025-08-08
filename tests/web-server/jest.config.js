/**
 * Jest configuration for web server tests
 */

export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ES2022',
        target: 'ES2022',
        moduleResolution: 'node'
      }
    }]
  },
  testEnvironment: 'node',
  testMatch: [
    '**/tests/web-server/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'web-server/**/*.js',
    '!web-server/node_modules/**',
    '!web-server/public/**'
  ],
  coverageDirectory: 'coverage/web-server',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/web-server/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
  moduleDirectories: ['node_modules', '<rootDir>'],
  transformIgnorePatterns: [
    'node_modules/(?!(axios|sharp)/)'
  ]
};