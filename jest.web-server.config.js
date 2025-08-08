export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^chalk$': '<rootDir>/tests/__mocks__/chalk.js',
    '^inquirer$': '<rootDir>/tests/__mocks__/inquirer.js',
    '^ora$': '<rootDir>/tests/__mocks__/ora.js',
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/web-server'],
  testMatch: ['**/tests/web-server/**/*.test.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/lib/',
    '/examples/'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'ES2022',
        target: 'ES2022',
        moduleResolution: 'node',
        skipLibCheck: true,
        noImplicitAny: false
      }
    }]
  },
  collectCoverageFrom: [
    'web-server/**/*.js',
    '!web-server/node_modules/**',
  ],
  coverageDirectory: 'coverage-web-server',
  coverageReporters: ['text', 'lcov', 'html'],
  maxWorkers: 1,
  testTimeout: 60000,
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/tests/web-server/setup.ts'],
  globals: {
    __SERVER_URL__: 'http://localhost:3001'
  }
};