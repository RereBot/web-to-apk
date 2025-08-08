import { ConfigParser } from '../../src/config/ConfigParser';
import { AppConfig, WebToAPKError } from '../../src/types';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ConfigParser', () => {
  let configParser: ConfigParser;
  const testConfigPath = '/test/config.json';

  beforeEach(() => {
    configParser = new ConfigParser();
    jest.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load valid configuration file', () => {
      const mockConfig = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '1.0.0',
        webDir: './dist',
        startUrl: 'index.html',
        permissions: ['android.permission.INTERNET']
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

      const result = configParser.loadConfig(testConfigPath);

      expect(result.appName).toBe('Test App');
      expect(result.packageName).toBe('com.test.app');
      expect(result.orientation).toBe('any'); // Default value
    });

    it('should throw error when config file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(() => configParser.loadConfig(testConfigPath)).toThrow(WebToAPKError);
      expect(() => configParser.loadConfig(testConfigPath)).toThrow('Configuration file not found');
    });

    it('should throw error for invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{ invalid json }');

      expect(() => configParser.loadConfig(testConfigPath)).toThrow(WebToAPKError);
      expect(() => configParser.loadConfig(testConfigPath)).toThrow('Invalid JSON');
    });

    it('should apply default values for missing optional fields', () => {
      const minimalConfig = {
        appName: 'Test App',
        packageName: 'com.test.app'
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(minimalConfig));

      const result = configParser.loadConfig(testConfigPath);

      expect(result.version).toBe('1.0.0');
      expect(result.webDir).toBe('./dist');
      expect(result.startUrl).toBe('index.html');
      expect(result.orientation).toBe('any');
      expect(result.permissions).toEqual([
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE'
      ]);
    });

    it('should preserve provided optional fields', () => {
      const configWithOptionals = {
        appName: 'Test App',
        packageName: 'com.test.app',
        version: '2.1.0',
        webDir: './build',
        startUrl: 'main.html',
        orientation: 'portrait',
        icon: './icon.png',
        splashScreen: './splash.png',
        permissions: ['android.permission.CAMERA'],
        allowNavigation: ['https://example.com/*'],
        plugins: { StatusBar: { style: 'dark' } }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(configWithOptionals));

      const result = configParser.loadConfig(testConfigPath);

      expect(result.version).toBe('2.1.0');
      expect(result.webDir).toBe('./build');
      expect(result.startUrl).toBe('main.html');
      expect(result.orientation).toBe('portrait');
      expect(result.icon).toBe('./icon.png');
      expect(result.splashScreen).toBe('./splash.png');
      expect(result.permissions).toEqual(['android.permission.CAMERA']);
      expect(result.allowNavigation).toEqual(['https://example.com/*']);
      expect(result.plugins).toEqual({ StatusBar: { style: 'dark' } });
    });
  });

  describe('createDefaultConfig', () => {
    it('should create valid default configuration', () => {
      const defaultConfig = configParser.createDefaultConfig();

      expect(defaultConfig.appName).toBe('My Web App');
      expect(defaultConfig.packageName).toBe('com.example.mywebapp');
      expect(defaultConfig.version).toBe('1.0.0');
      expect(defaultConfig.webDir).toBe('./dist');
      expect(defaultConfig.startUrl).toBe('index.html');
      expect(defaultConfig.orientation).toBe('any');
      expect(defaultConfig.permissions).toEqual([
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE'
      ]);
    });
  });

  describe('saveConfig', () => {
    const testOutputPath = '/test/output/config.json';
    const testConfig: AppConfig = {
      appName: 'Test App',
      packageName: 'com.test.app',
      version: '1.0.0',
      webDir: './dist',
      startUrl: 'index.html',
      permissions: ['android.permission.INTERNET'],
      orientation: 'any'
    };

    it('should save configuration to file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation(() => {});

      configParser.saveConfig(testConfig, testOutputPath);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        testOutputPath,
        JSON.stringify(testConfig, null, 2),
        'utf-8'
      );
    });

    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => '');
      mockFs.writeFileSync.mockImplementation(() => {});

      configParser.saveConfig(testConfig, testOutputPath);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/test/output', { recursive: true });
    });

    it('should throw error when save fails', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      expect(() => configParser.saveConfig(testConfig, testOutputPath)).toThrow(WebToAPKError);
      expect(() => configParser.saveConfig(testConfig, testOutputPath)).toThrow('Failed to save configuration');
    });
  });
});