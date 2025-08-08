import { promises as fs } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { CapacitorProjectInitializerImpl } from '../../src/apk/CapacitorProjectInitializer.js';
import { AppConfig, WebToAPKError } from '../../src/types/index.js';

// Mock fs and execSync
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    copyFile: jest.fn()
  }
}));

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Mock ResourceProcessor
jest.mock('../../src/resources/ResourceProcessor.js', () => ({
  ResourceProcessorImpl: jest.fn().mockImplementation(() => ({
    processIcon: jest.fn().mockResolvedValue(undefined),
    generateSplashScreens: jest.fn().mockResolvedValue(undefined),
    copyWebAssets: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock process.chdir
const mockChdir = jest.fn();
Object.defineProperty(process, 'chdir', {
  value: mockChdir
});

describe('CapacitorProjectInitializer', () => {
  let initializer: CapacitorProjectInitializerImpl;
  let mockConfig: AppConfig;
  let projectPath: string;

  beforeEach(() => {
    initializer = new CapacitorProjectInitializerImpl();
    projectPath = '/test/project';
    mockConfig = {
      appName: 'Test App',
      packageName: 'com.test.app',
      version: '1.0.0',
      webDir: '/test/web',
      startUrl: 'index.html',
      permissions: ['android.permission.INTERNET']
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createProject', () => {
    it('should create project structure successfully', async () => {
      const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
      const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
      const mockReaddir = fs.readdir as jest.MockedFunction<typeof fs.readdir>;

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([]);

      await initializer.createProject(mockConfig, projectPath);

      // Verify project directory creation
      expect(mockMkdir).toHaveBeenCalledWith(projectPath, { recursive: true });
      
      // Verify subdirectories creation
      expect(mockMkdir).toHaveBeenCalledWith(join(projectPath, 'www'), { recursive: true });
      expect(mockMkdir).toHaveBeenCalledWith(join(projectPath, 'src'), { recursive: true });
      expect(mockMkdir).toHaveBeenCalledWith(join(projectPath, 'android'), { recursive: true });

      // Verify package.json creation
      expect(mockWriteFile).toHaveBeenCalledWith(
        join(projectPath, 'package.json'),
        expect.stringContaining('"name": "com-test-app"'),
        'utf-8'
      );

      // Verify capacitor.config.ts creation
      expect(mockWriteFile).toHaveBeenCalledWith(
        join(projectPath, 'capacitor.config.ts'),
        expect.stringContaining('"appId": "com.test.app"'),
        'utf-8'
      );
    });

    it('should handle project creation errors', async () => {
      const mockMkdir = fs.mkdir as jest.MockedFunction<typeof fs.mkdir>;
      mockMkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(initializer.createProject(mockConfig, projectPath))
        .rejects.toThrow(WebToAPKError);
    });
  });

  describe('generateCapacitorConfig', () => {
    it('should generate basic capacitor config', async () => {
      const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
      mockWriteFile.mockResolvedValue(undefined);

      await initializer.generateCapacitorConfig(mockConfig, projectPath);

      expect(mockWriteFile).toHaveBeenCalledWith(
        join(projectPath, 'capacitor.config.ts'),
        expect.stringContaining('"appId": "com.test.app"'),
        'utf-8'
      );

      expect(mockWriteFile).toHaveBeenCalledWith(
        join(projectPath, 'capacitor.config.ts'),
        expect.stringContaining('"appName": "Test App"'),
        'utf-8'
      );
    });

    it('should include server config for HTTP URLs', async () => {
      const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
      mockWriteFile.mockResolvedValue(undefined);

      const configWithHttpUrl = {
        ...mockConfig,
        startUrl: 'http://localhost:3000'
      };

      await initializer.generateCapacitorConfig(configWithHttpUrl, projectPath);

      expect(mockWriteFile).toHaveBeenCalledWith(
        join(projectPath, 'capacitor.config.ts'),
        expect.stringContaining('"url": "http://localhost:3000"'),
        'utf-8'
      );
    });

    it('should include plugins configuration', async () => {
      const mockWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
      mockWriteFile.mockResolvedValue(undefined);

      const configWithPlugins = {
        ...mockConfig,
        plugins: {
          StatusBar: { style: 'dark' },
          SplashScreen: { launchShowDuration: 2000 }
        }
      };

      await initializer.generateCapacitorConfig(configWithPlugins, projectPath);

      expect(mockWriteFile).toHaveBeenCalledWith(
        join(projectPath, 'capacitor.config.ts'),
        expect.stringContaining('StatusBar'),
        'utf-8'
      );
    });
  });

  describe('addAndroidPlatform', () => {
    it('should add Android platform successfully', async () => {
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockReturnValue(Buffer.from('Android platform added'));

      await initializer.addAndroidPlatform(projectPath);

      expect(mockChdir).toHaveBeenCalledWith(projectPath);
      expect(mockExecSync).toHaveBeenCalledWith('npx cap add android', {
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      expect(mockChdir).toHaveBeenCalledWith(expect.any(String)); // Called to restore original directory
    });

    it('should handle platform addition errors', async () => {
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });

      await expect(initializer.addAndroidPlatform(projectPath))
        .rejects.toThrow(WebToAPKError);
    });
  });

  describe('installDependencies', () => {
    it('should install npm dependencies', async () => {
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockReturnValue(Buffer.from('Dependencies installed'));

      await initializer.installDependencies(projectPath);

      expect(mockChdir).toHaveBeenCalledWith(projectPath);
      expect(mockExecSync).toHaveBeenCalledWith('npm install', {
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      expect(mockChdir).toHaveBeenCalledWith(expect.any(String)); // Called to restore original directory
    });

    it('should install additional plugins', async () => {
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockReturnValue(Buffer.from('Dependencies installed'));

      const plugins = ['@capacitor/status-bar', '@capacitor/splash-screen'];

      await initializer.installDependencies(projectPath, plugins);

      expect(mockExecSync).toHaveBeenCalledWith('npm install', {
        stdio: 'pipe',
        encoding: 'utf-8'
      });

      expect(mockExecSync).toHaveBeenCalledWith(
        'npm install @capacitor/status-bar @capacitor/splash-screen',
        {
          stdio: 'pipe',
          encoding: 'utf-8'
        }
      );
    });

    it('should handle dependency installation errors', async () => {
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockImplementation(() => {
        throw new Error('npm install failed');
      });

      await expect(initializer.installDependencies(projectPath))
        .rejects.toThrow(WebToAPKError);
    });
  });

  describe('syncProject', () => {
    it('should sync project successfully', async () => {
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockReturnValue(Buffer.from('Project synced'));

      await initializer.syncProject(projectPath);

      expect(mockChdir).toHaveBeenCalledWith(projectPath);
      expect(mockExecSync).toHaveBeenCalledWith('npx cap sync android', {
        stdio: 'pipe',
        encoding: 'utf-8'
      });
      expect(mockChdir).toHaveBeenCalledWith(expect.any(String)); // Called to restore original directory
    });

    it('should handle sync errors', async () => {
      const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
      mockExecSync.mockImplementation(() => {
        throw new Error('Sync failed');
      });

      await expect(initializer.syncProject(projectPath))
        .rejects.toThrow(WebToAPKError);
    });
  });
});