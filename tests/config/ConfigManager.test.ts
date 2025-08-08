import { ConfigManager } from '../../src/config/ConfigManager';
import { ConfigParser } from '../../src/config/ConfigParser';
import { ConfigValidator } from '../../src/config/ConfigValidator';
import { ErrorHandler } from '../../src/interfaces/ErrorHandler';
import { AppConfig, CapacitorConfig, ValidationResult, WebToAPKError } from '../../src/types';
import * as path from 'path';

// Mock dependencies
jest.mock('../../src/config/ConfigParser');
jest.mock('../../src/config/ConfigValidator');
jest.mock('fs');

const MockConfigParser = ConfigParser as jest.MockedClass<typeof ConfigParser>;
const MockConfigValidator = ConfigValidator as jest.MockedClass<typeof ConfigValidator>;

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;
  let mockParser: jest.Mocked<ConfigParser>;
  let mockValidator: jest.Mocked<ConfigValidator>;

  const validConfig: AppConfig = {
    appName: 'Test App',
    packageName: 'com.test.app',
    version: '1.0.0',
    webDir: './dist',
    startUrl: 'index.html',
    permissions: ['android.permission.INTERNET'],
    orientation: 'portrait'
  };

  const validValidationResult: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  beforeEach(() => {
    mockErrorHandler = {
      handleConfigError: jest.fn(),
      handleBuildError: jest.fn(),
      provideSolution: jest.fn().mockReturnValue('Try checking your configuration file')
    };

    mockParser = new MockConfigParser() as jest.Mocked<ConfigParser>;
    mockValidator = new MockConfigValidator() as jest.Mocked<ConfigValidator>;

    MockConfigParser.mockImplementation(() => mockParser);
    MockConfigValidator.mockImplementation(() => mockValidator);

    configManager = new ConfigManager(mockErrorHandler);

    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load and validate configuration successfully', async () => {
      mockParser.loadConfig.mockReturnValue(validConfig);
      mockValidator.validateConfig.mockReturnValue(validValidationResult);

      const result = await configManager.loadConfig('/test/config.json');

      expect(result).toEqual(validConfig);
      expect(mockParser.loadConfig).toHaveBeenCalledWith('/test/config.json');
      expect(mockValidator.validateConfig).toHaveBeenCalledWith(validConfig);
    });

    it('should handle validation warnings', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const validationWithWarnings: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [
          { field: 'appName', message: 'App name is very long', severity: 'warning' }
        ]
      };

      mockParser.loadConfig.mockReturnValue(validConfig);
      mockValidator.validateConfig.mockReturnValue(validationWithWarnings);

      await configManager.loadConfig('/test/config.json');

      expect(consoleSpy).toHaveBeenCalledWith('Configuration warnings for /test/config.json:');
      expect(consoleSpy).toHaveBeenCalledWith('  - appName: App name is very long');

      consoleSpy.mockRestore();
    });

    it('should throw error for invalid configuration', async () => {
      const invalidValidationResult: ValidationResult = {
        isValid: false,
        errors: [
          { field: 'packageName', message: 'Invalid package name', severity: 'error' }
        ],
        warnings: []
      };

      mockParser.loadConfig.mockReturnValue(validConfig);
      mockValidator.validateConfig.mockReturnValue(invalidValidationResult);

      await expect(configManager.loadConfig('/test/config.json')).rejects.toThrow(WebToAPKError);
      expect(mockErrorHandler.handleConfigError).toHaveBeenCalled();
    });

    it('should handle parser errors', async () => {
      const parserError = new WebToAPKError('CONFIG', 'File not found', {});
      mockParser.loadConfig.mockImplementation(() => { throw parserError; });

      await expect(configManager.loadConfig('/test/config.json')).rejects.toThrow(WebToAPKError);
      expect(mockErrorHandler.handleConfigError).toHaveBeenCalledWith(parserError);
    });

    it('should wrap non-WebToAPKError exceptions', async () => {
      const genericError = new Error('Generic error');
      mockParser.loadConfig.mockImplementation(() => { throw genericError; });

      await expect(configManager.loadConfig('/test/config.json')).rejects.toThrow(WebToAPKError);
      expect(mockErrorHandler.handleConfigError).toHaveBeenCalled();
    });
  });

  describe('createDefaultConfig', () => {
    it('should create and save default configuration', () => {
      mockParser.createDefaultConfig.mockReturnValue(validConfig);
      mockParser.saveConfig.mockImplementation(() => {});

      const result = configManager.createDefaultConfig('/test/default-config.json');

      expect(result).toEqual(validConfig);
      expect(mockParser.createDefaultConfig).toHaveBeenCalled();
      expect(mockParser.saveConfig).toHaveBeenCalledWith(validConfig, '/test/default-config.json');
    });

    it('should handle save errors', () => {
      const saveError = new Error('Save failed');
      mockParser.createDefaultConfig.mockReturnValue(validConfig);
      mockParser.saveConfig.mockImplementation(() => { throw saveError; });

      expect(() => configManager.createDefaultConfig('/test/config.json')).toThrow(WebToAPKError);
      expect(mockErrorHandler.handleConfigError).toHaveBeenCalled();
    });
  });

  describe('validateConfig', () => {
    it('should validate configuration', () => {
      mockValidator.validateConfig.mockReturnValue(validValidationResult);

      const result = configManager.validateConfig(validConfig);

      expect(result).toEqual(validValidationResult);
      expect(mockValidator.validateConfig).toHaveBeenCalledWith(validConfig);
    });
  });

  describe('generateCapacitorConfig', () => {
    it('should generate basic Capacitor configuration', () => {
      const result = configManager.generateCapacitorConfig(validConfig);

      expect(result.appId).toBe(validConfig.packageName);
      expect(result.appName).toBe(validConfig.appName);
      expect(result.webDir).toBe(validConfig.webDir);
      expect(result.plugins).toBeDefined();
      expect(result.plugins!.StatusBar).toBeDefined();
      expect(result.plugins!.SplashScreen).toBeDefined();
    });

    it('should configure server for remote URLs', () => {
      const configWithRemoteUrl: AppConfig = {
        ...validConfig,
        startUrl: 'https://example.com'
      };

      const result = configManager.generateCapacitorConfig(configWithRemoteUrl);

      expect(result.server).toBeDefined();
      expect(result.server!.url).toBe('https://example.com');
      expect(result.server!.cleartext).toBe(false);
    });

    it('should configure server for HTTP URLs', () => {
      const configWithHttpUrl: AppConfig = {
        ...validConfig,
        startUrl: 'http://localhost:3000'
      };

      const result = configManager.generateCapacitorConfig(configWithHttpUrl);

      expect(result.server).toBeDefined();
      expect(result.server!.url).toBe('http://localhost:3000');
      expect(result.server!.cleartext).toBe(true);
    });

    it('should preserve existing plugins', () => {
      const configWithPlugins: AppConfig = {
        ...validConfig,
        plugins: {
          Camera: { quality: 90 },
          StatusBar: { style: 'dark' }
        }
      };

      const result = configManager.generateCapacitorConfig(configWithPlugins);

      expect(result.plugins!.Camera).toEqual({ quality: 90 });
      expect(result.plugins!.StatusBar).toEqual({ style: 'dark' });
    });

    it('should configure orientation', () => {
      const configWithOrientation: AppConfig = {
        ...validConfig,
        orientation: 'landscape'
      };

      const result = configManager.generateCapacitorConfig(configWithOrientation);

      expect(result.plugins!.App).toBeDefined();
      expect(result.plugins!.App.orientation).toBe('landscape');
    });
  });

  describe('saveCapacitorConfig', () => {
    const mockFs = require('fs');
    
    beforeEach(() => {
      mockFs.existsSync = jest.fn().mockReturnValue(true);
      mockFs.mkdirSync = jest.fn();
      mockFs.writeFileSync = jest.fn();
    });

    it('should save Capacitor configuration to file', () => {
      const capacitorConfig: CapacitorConfig = {
        appId: 'com.test.app',
        appName: 'Test App',
        webDir: './dist'
      };

      configManager.saveCapacitorConfig(capacitorConfig, '/test/capacitor.config.ts');

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        '/test/capacitor.config.ts',
        expect.stringContaining('import { CapacitorConfig }'),
        'utf-8'
      );
    });

    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const capacitorConfig: CapacitorConfig = {
        appId: 'com.test.app',
        appName: 'Test App',
        webDir: './dist'
      };

      configManager.saveCapacitorConfig(capacitorConfig, '/test/output/capacitor.config.ts');

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/test/output', { recursive: true });
    });

    it('should handle save errors', () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      const capacitorConfig: CapacitorConfig = {
        appId: 'com.test.app',
        appName: 'Test App',
        webDir: './dist'
      };

      expect(() => configManager.saveCapacitorConfig(capacitorConfig, '/test/config.ts')).toThrow(WebToAPKError);
      expect(mockErrorHandler.handleConfigError).toHaveBeenCalled();
    });
  });

  describe('mergeConfigs', () => {
    it('should merge simple properties', () => {
      const override: Partial<AppConfig> = {
        appName: 'New App Name',
        version: '2.0.0'
      };

      const result = configManager.mergeConfigs(validConfig, override);

      expect(result.appName).toBe('New App Name');
      expect(result.version).toBe('2.0.0');
      expect(result.packageName).toBe(validConfig.packageName); // Unchanged
    });

    it('should merge permissions arrays', () => {
      const override: Partial<AppConfig> = {
        permissions: ['android.permission.CAMERA', 'android.permission.INTERNET']
      };

      const result = configManager.mergeConfigs(validConfig, override);

      expect(result.permissions).toContain('android.permission.INTERNET');
      expect(result.permissions).toContain('android.permission.CAMERA');
      expect(result.permissions.length).toBe(2); // No duplicates
    });

    it('should merge navigation URLs', () => {
      const baseWithNavigation: AppConfig = {
        ...validConfig,
        allowNavigation: ['https://example.com/*']
      };

      const override: Partial<AppConfig> = {
        allowNavigation: ['https://api.example.com/*', 'https://example.com/*']
      };

      const result = configManager.mergeConfigs(baseWithNavigation, override);

      expect(result.allowNavigation).toContain('https://example.com/*');
      expect(result.allowNavigation).toContain('https://api.example.com/*');
      expect(result.allowNavigation!.length).toBe(2); // No duplicates
    });

    it('should deep merge plugins', () => {
      const baseWithPlugins: AppConfig = {
        ...validConfig,
        plugins: {
          StatusBar: { style: 'light' },
          Camera: { quality: 80 }
        }
      };

      const override: Partial<AppConfig> = {
        plugins: {
          StatusBar: { backgroundColor: '#000000' },
          Geolocation: { timeout: 10000 }
        }
      };

      const result = configManager.mergeConfigs(baseWithPlugins, override);

      expect(result.plugins!.StatusBar).toEqual({ backgroundColor: '#000000' });
      expect(result.plugins!.Camera).toEqual({ quality: 80 });
      expect(result.plugins!.Geolocation).toEqual({ timeout: 10000 });
    });
  });

  describe('resolveConfigPaths', () => {
    it('should resolve relative paths', () => {
      const configWithRelativePaths: AppConfig = {
        ...validConfig,
        webDir: './dist',
        icon: './assets/icon.png',
        splashScreen: '../splash.png'
      };

      const configPath = path.join('/project', 'config.json');
      const result = configManager.resolveConfigPaths(configWithRelativePaths, configPath);

      // Use path.resolve to generate expected paths that work on all platforms
      expect(result.webDir).toBe(path.resolve('/project', 'dist'));
      expect(result.icon).toBe(path.resolve('/project', 'assets', 'icon.png'));
      expect(result.splashScreen).toBe(path.resolve('/', 'splash.png'));
    });

    it('should preserve absolute paths', () => {
      const configWithAbsolutePaths: AppConfig = {
        ...validConfig,
        webDir: path.resolve('/absolute', 'dist'),
        icon: path.resolve('/absolute', 'icon.png')
      };

      const configPath = path.join('/project', 'config.json');
      const result = configManager.resolveConfigPaths(configWithAbsolutePaths, configPath);

      // Absolute paths should remain unchanged
      expect(result.webDir).toBe(path.resolve('/absolute', 'dist'));
      expect(result.icon).toBe(path.resolve('/absolute', 'icon.png'));
    });
  });

  describe('getErrorSolution', () => {
    it('should return error solution from error handler', () => {
      const error = new WebToAPKError('CONFIG', 'Test error', {});

      const result = configManager.getErrorSolution(error);

      expect(result).toBe('Try checking your configuration file');
      expect(mockErrorHandler.provideSolution).toHaveBeenCalledWith(error);
    });
  });
});