import { ConfigValidator } from '../../src/config/ConfigValidator';
import { AppConfig } from '../../src/types';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
    jest.clearAllMocks();
  });

  describe('validateConfig', () => {
    const validConfig: AppConfig = {
      appName: 'Test App',
      packageName: 'com.test.app',
      version: '1.0.0',
      webDir: './dist',
      startUrl: 'index.html',
      permissions: ['android.permission.INTERNET'],
      orientation: 'portrait'
    };

    it('should validate a correct configuration', () => {
      mockFs.existsSync.mockReturnValue(true);

      const result = validator.validateConfig(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const incompleteConfig = {
        appName: 'Test App'
        // Missing other required fields
      } as AppConfig;

      const result = validator.validateConfig(incompleteConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'packageName')).toBe(true);
      expect(result.errors.some(e => e.field === 'version')).toBe(true);
    });

    it('should detect empty required fields', () => {
      const configWithEmptyFields: AppConfig = {
        ...validConfig,
        appName: '',
        packageName: '   ',
        permissions: []
      };

      const result = validator.validateConfig(configWithEmptyFields);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'appName')).toBe(true);
      expect(result.errors.some(e => e.field === 'packageName')).toBe(true);
      expect(result.errors.some(e => e.field === 'permissions')).toBe(true);
    });

    it('should validate package name format', () => {
      const invalidPackageNames = [
        'invalid',
        'com.123invalid',
        'com..invalid',
        'Com.Invalid.App',
        'com.invalid-app'
      ];

      for (const packageName of invalidPackageNames) {
        const config: AppConfig = { ...validConfig, packageName };
        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => 
          e.field === 'packageName' && 
          e.message.includes('Java package naming convention')
        )).toBe(true);
      }
    });

    it('should validate version format', () => {
      const invalidVersions = ['1.0', '1.0.0.0', 'v1.0.0', '1.0.0-beta'];

      for (const version of invalidVersions) {
        const config: AppConfig = { ...validConfig, version };
        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => 
          e.field === 'version' && 
          e.message.includes('semantic versioning')
        )).toBe(true);
      }
    });

    it('should validate orientation values', () => {
      const invalidOrientations = ['vertical', 'horizontal', 'auto'];

      for (const orientation of invalidOrientations) {
        const config: AppConfig = { ...validConfig, orientation: orientation as any };
        const result = validator.validateConfig(config);

        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => 
          e.field === 'orientation' && 
          e.message.includes('portrait, landscape, any')
        )).toBe(true);
      }
    });

    it('should warn about long app names', () => {
      const longAppName = 'A'.repeat(60);
      const config: AppConfig = { ...validConfig, appName: longAppName };

      const result = validator.validateConfig(config);

      expect(result.warnings.some(w => 
        w.field === 'appName' && 
        w.message.includes('longer than 50 characters')
      )).toBe(true);
    });

    it('should warn about remote start URLs', () => {
      const remoteUrls = ['http://example.com', 'https://example.com/app'];

      for (const startUrl of remoteUrls) {
        const config: AppConfig = { ...validConfig, startUrl };
        const result = validator.validateConfig(config);

        expect(result.warnings.some(w => 
          w.field === 'startUrl' && 
          w.message.includes('remote URL')
        )).toBe(true);
      }
    });

    it('should detect missing web directory', () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = validator.validateConfig(validConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => 
        e.field === 'webDir' && 
        e.message.includes('does not exist')
      )).toBe(true);
    });

    it('should warn about missing icon file', () => {
      const config: AppConfig = { ...validConfig, icon: './missing-icon.png' };
      mockFs.existsSync.mockImplementation((path) => path !== './missing-icon.png');

      const result = validator.validateConfig(config);

      expect(result.warnings.some(w => 
        w.field === 'icon' && 
        w.message.includes('does not exist')
      )).toBe(true);
    });

    it('should warn about non-standard icon formats', () => {
      const config: AppConfig = { ...validConfig, icon: './icon.gif' };
      mockFs.existsSync.mockReturnValue(true);

      const result = validator.validateConfig(config);

      expect(result.warnings.some(w => 
        w.field === 'icon' && 
        w.message.includes('PNG or JPEG')
      )).toBe(true);
    });

    it('should warn about missing essential permissions', () => {
      const config: AppConfig = { 
        ...validConfig, 
        permissions: ['android.permission.CAMERA'] 
      };

      const result = validator.validateConfig(config);

      expect(result.warnings.some(w => 
        w.field === 'permissions' && 
        w.message.includes('INTERNET permission')
      )).toBe(true);
      expect(result.warnings.some(w => 
        w.field === 'permissions' && 
        w.message.includes('ACCESS_NETWORK_STATE permission')
      )).toBe(true);
    });

    it('should warn about non-standard permission names', () => {
      const config: AppConfig = { 
        ...validConfig, 
        permissions: ['custom.permission.TEST', 'android.permission.INTERNET'] 
      };

      const result = validator.validateConfig(config);

      expect(result.warnings.some(w => 
        w.field === 'permissions' && 
        w.message.includes('does not follow Android permission naming convention')
      )).toBe(true);
    });
  });

  describe('validateNavigationUrls', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://api.example.com/*',
        'https://*.example.com'
      ];

      const result = validator.validateNavigationUrls(validUrls);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid URL formats', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'invalid://url'
      ];

      const result = validator.validateNavigationUrls(invalidUrls);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => 
        e.field === 'allowNavigation' && 
        e.message.includes('Invalid URL format')
      )).toBe(true);
    });

    it('should allow wildcard patterns', () => {
      const wildcardUrls = [
        'https://example.com/*',
        'https://*.example.com',
        'https://api.*.com/v1/*'
      ];

      const result = validator.validateNavigationUrls(wildcardUrls);

      expect(result.isValid).toBe(true);
    });
  });
});