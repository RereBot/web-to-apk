/**
 * Integration test setup
 */

import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set up global test environment
  process.env.NODE_ENV = 'test';
  
  // Mock console methods to reduce noise in test output
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Clean up after all tests
  jest.restoreAllMocks();
});

// Global test utilities
global.testUtils = {
  createMockConfig: (overrides = {}) => ({
    appName: 'My Sample App',
    packageName: 'com.example.mysampleapp',
    version: '1.0.0',
    webDir: './dist',
    startUrl: 'index.html',
    permissions: ['android.permission.INTERNET'],
    ...overrides
  }),
  
  createMockBuildOptions: (overrides = {}) => ({
    output: './build',
    release: false,
    minify: false,
    clean: false,
    ...overrides
  }),
  
  createMockInitOptions: (overrides = {}) => ({
    name: 'My Sample App',
    packageName: 'com.example.mysampleapp',
    template: 'basic',
    interactive: false,
    force: false,
    ...overrides
  })
};

// Performance monitoring utilities
global.performanceUtils = {
  measureTime: async (fn: () => Promise<any>) => {
    const start = Date.now();
    await fn();
    return Date.now() - start;
  },
  
  measureMemory: async (fn: () => Promise<any>) => {
    const initialMemory = process.memoryUsage();
    await fn();
    const finalMemory = process.memoryUsage();
    return {
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
      external: finalMemory.external - initialMemory.external
    };
  }
};

// Declare global types
declare global {
  var testUtils: {
    createMockConfig: (overrides?: any) => any;
    createMockBuildOptions: (overrides?: any) => any;
    createMockInitOptions: (overrides?: any) => any;
  };
  
  var performanceUtils: {
    measureTime: (fn: () => Promise<any>) => Promise<number>;
    measureMemory: (fn: () => Promise<any>) => Promise<{
      heapUsed: number;
      heapTotal: number;
      external: number;
    }>;
  };
}