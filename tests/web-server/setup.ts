/**
 * Web server test setup
 */

import { jest } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set up test environment
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';
  
  // Mock console methods to reduce noise
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Clean up after all tests
  jest.restoreAllMocks();
});

// Global test utilities for web server
global.webServerTestUtils = {
  createMockFormData: (overrides = {}) => ({
    appName: 'My Sample App',
    packageName: 'com.example.mysampleapp',
    version: '1.0.0',
    ...overrides
  }),
  
  createMockImageBuffer: (size = 1024) => {
    return Buffer.alloc(size, 'mock-image-data');
  },
  
  createMockFaviconHTML: (faviconUrl = '/favicon.ico') => {
    return `
      <html>
        <head>
          <link rel="icon" href="${faviconUrl}">
          <title>Test Site</title>
        </head>
        <body>Test content</body>
      </html>
    `;
  },
  
  createMockBuildResult: (status = 'success', overrides = {}) => ({
    status,
    apkFile: 'mysampleapp-debug.apk',
    config: {
      appName: 'My Sample App',
      packageName: 'com.example.mysampleapp',
      version: '1.0.0'
    },
    buildTime: new Date().toISOString(),
    ...overrides
  })
};

// Performance monitoring for web server tests
global.webServerPerformanceUtils = {
  measureResponseTime: async (requestFn: () => Promise<any>) => {
    const start = Date.now();
    await requestFn();
    return Date.now() - start;
  },
  
  measureMemoryUsage: async (operationFn: () => Promise<any>) => {
    const initialMemory = process.memoryUsage();
    await operationFn();
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
  var webServerTestUtils: {
    createMockFormData: (overrides?: any) => any;
    createMockImageBuffer: (size?: number) => Buffer;
    createMockFaviconHTML: (faviconUrl?: string) => string;
    createMockBuildResult: (status?: string, overrides?: any) => any;
  };
  
  var webServerPerformanceUtils: {
    measureResponseTime: (requestFn: () => Promise<any>) => Promise<number>;
    measureMemoryUsage: (operationFn: () => Promise<any>) => Promise<{
      heapUsed: number;
      heapTotal: number;
      external: number;
    }>;
  };
}