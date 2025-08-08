import { APKBuilderImpl } from '../../src/apk/APKBuilder.js';
import { BuildOptions, WebToAPKError } from '../../src/types/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

// Mock child_process for integration tests
jest.mock('child_process');
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

// Mock fs/promises for integration tests
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock the CapacitorProjectInitializer
jest.mock('../../src/apk/CapacitorProjectInitializer.js', () => ({
  CapacitorProjectInitializerImpl: jest.fn().mockImplementation(() => ({
    createProject: jest.fn(),
    installDependencies: jest.fn(),
    addAndroidPlatform: jest.fn(),
    syncProject: jest.fn()
  }))
}));

describe('APKBuilder Integration Tests', () => {
  let apkBuilder: APKBuilderImpl;
  let mockProjectInitializer: any;
  let projectPath: string;
  let buildOptions: BuildOptions;

  beforeEach(() => {
    apkBuilder = new APKBuilderImpl();
    mockProjectInitializer = (apkBuilder as any).projectInitializer;
    projectPath = '/test/integration/project';

    buildOptions = {
      release: false,
      outputDir: '/test/output',
      minifyWeb: false
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Full Build Process Integration', () => {
    it('should complete full debug build process successfully', async () => {
      // Setup successful mocks for all operations
      setupSuccessfulMocks();

      // Execute full build process
      const result = await apkBuilder.buildAPK(projectPath, buildOptions);

      // Verify all steps were executed
      expect(mockProjectInitializer.syncProject).toHaveBeenCalledWith(projectPath);
      expect(mockSpawn).toHaveBeenCalledWith(
        expect.stringMatching(/gradlew/),
        ['assembleDebug', '--info'],
        expect.objectContaining({
          cwd: path.join(projectPath, 'android')
        })
      );
      expect(mockFs.readdir).toHaveBeenCalled();
      expect(mockFs.stat).toHaveBeenCalled();
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/output', { recursive: true });
      expect(mockFs.copyFile).toHaveBeenCalled();
      expect(result).toMatch(/app-debug-.*\.apk$/);
    });

    it('should complete full release build process successfully', async () => {
      buildOptions.release = true;
      buildOptions.minifyWeb = true;
      setupSuccessfulMocks();

      const result = await apkBuilder.buildAPK(projectPath, buildOptions);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.stringMatching(/gradlew/),
        ['assembleRelease', '--stacktrace', '-PminifyEnabled=true'],
        expect.objectContaining({
          cwd: path.join(projectPath, 'android')
        })
      );
      expect(result).toMatch(/app-release-.*\.apk$/);
    });

    it('should handle build process with multiple error scenarios', async () => {
      // Setup project validation failure
      mockFs.access.mockRejectedValueOnce(new Error('Project not found'));

      await expect(apkBuilder.buildAPK(projectPath, buildOptions))
        .rejects.toThrow(WebToAPKError);
    });

    it('should handle gradle build failure with detailed error parsing', async () => {
      setupPartialMocks();
      
      // Setup gradle failure with specific error
      const mockProcess = createMockProcess();
      mockProcess.stderr.on.mockImplementation((event: string, callback: any) => {
        if (event === 'data') {
          callback(Buffer.from('FAILURE: Build failed with an exception.\n* What went wrong:\nExecution failed for task \':app:compileDebugJavaWithJavac\'.\n> Compilation failed; see the compiler error output for details.'));
        }
      });
      mockProcess.on.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(1); // Failure exit code
        }
      });
      mockSpawn.mockReturnValue(mockProcess as any);

      await expect(apkBuilder.buildAPK(projectPath, buildOptions))
        .rejects.toThrow(/Build failed with exception/);
    });

    it('should handle missing APK output files', async () => {
      setupPartialMocks();
      setupSuccessfulGradleBuild();
      
      // Mock empty APK directory
      mockFs.readdir.mockResolvedValue([] as any);

      await expect(apkBuilder.buildAPK(projectPath, buildOptions))
        .rejects.toThrow(/No APK files found/);
    });

    it('should handle corrupted APK files', async () => {
      setupPartialMocks();
      setupSuccessfulGradleBuild();
      
      // Mock APK file with zero size
      mockFs.readdir.mockResolvedValue(['app-debug.apk'] as any);
      mockFs.stat.mockResolvedValue({ size: 0 } as any);

      await expect(apkBuilder.buildAPK(projectPath, buildOptions))
        .rejects.toThrow(/APK file is empty/);
    });

    it('should handle output directory creation failure', async () => {
      setupPartialMocks();
      setupSuccessfulGradleBuild();
      setupSuccessfulAPKFind();
      
      // Mock output directory creation failure
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      await expect(apkBuilder.buildAPK(projectPath, buildOptions))
        .rejects.toThrow(WebToAPKError);
    });

    it('should handle APK copy failure', async () => {
      setupPartialMocks();
      setupSuccessfulGradleBuild();
      setupSuccessfulAPKFind();
      
      // Mock successful directory creation but failed copy
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.copyFile.mockRejectedValue(new Error('Disk full'));

      await expect(apkBuilder.buildAPK(projectPath, buildOptions))
        .rejects.toThrow(WebToAPKError);
    });
  });

  describe('Build Process Logging Integration', () => {
    it('should log complete build process with progress updates', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      setupSuccessfulMocks();
      
      // Setup detailed gradle output
      const mockProcess = createMockProcess();
      mockProcess.stdout.on.mockImplementation((event: string, callback: any) => {
        if (event === 'data') {
          callback(Buffer.from(`
> Configure project :app
> Task :app:preBuild UP-TO-DATE
> Task :app:compileDebugJavaWithJavac
> Task :app:processDebugResources
> Task :app:packageDebug
BUILD SUCCESSFUL in 45s
          `));
        }
      });
      mockSpawn.mockReturnValue(mockProcess as any);

      await apkBuilder.buildAPK(projectPath, buildOptions);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Starting debug build'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Executing: gradlew'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Gradle] > Task :app:compileDebugJavaWithJavac'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Gradle] BUILD SUCCESSFUL'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('APK built successfully'));

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log error details for failed builds', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      setupPartialMocks();
      
      const mockProcess = createMockProcess();
      mockProcess.stderr.on.mockImplementation((event: string, callback: any) => {
        if (event === 'data') {
          callback(Buffer.from('ERROR: Android SDK not found at specified location\nFAILURE: Build failed with an exception'));
        }
      });
      mockProcess.on.mockImplementation((event: string, callback: any) => {
        if (event === 'close') {
          callback(1);
        }
      });
      mockSpawn.mockReturnValue(mockProcess as any);

      await expect(apkBuilder.buildAPK(projectPath, buildOptions))
        .rejects.toThrow(WebToAPKError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[Gradle Error] ERROR: Android SDK not found'));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[Gradle Error] FAILURE: Build failed'));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Build Options Integration', () => {
    it('should handle complex build configuration', async () => {
      buildOptions = {
        release: true,
        outputDir: '/custom/output/path',
        minifyWeb: true,
        keystore: {
          path: '/path/to/keystore.jks',
          password: 'keystorepass',
          alias: 'myalias',
          aliasPassword: 'aliaspass'
        }
      };

      setupSuccessfulMocks();

      const result = await apkBuilder.buildAPK(projectPath, buildOptions);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.stringMatching(/gradlew/),
        expect.arrayContaining(['assembleRelease', '--stacktrace', '-PminifyEnabled=true']),
        expect.any(Object)
      );
      expect(mockFs.mkdir).toHaveBeenCalledWith('/custom/output/path', { recursive: true });
      expect(result).toMatch(/app-release-.*\.apk$/);
    });
  });

  // Helper functions
  function setupSuccessfulMocks() {
    setupPartialMocks();
    setupSuccessfulGradleBuild();
    setupSuccessfulAPKFind();
    setupSuccessfulOutput();
  }

  function setupPartialMocks() {
    // Mock project validation
    mockFs.access.mockResolvedValue(undefined);
    mockProjectInitializer.syncProject.mockResolvedValue(undefined);
  }

  function setupSuccessfulGradleBuild() {
    const mockProcess = createMockProcess();
    mockSpawn.mockReturnValue(mockProcess as any);
  }

  function setupSuccessfulAPKFind() {
    mockFs.readdir.mockResolvedValue(['app-debug.apk'] as any);
    mockFs.stat.mockResolvedValue({ size: 1024 * 1024 } as any); // 1MB APK
  }

  function setupSuccessfulOutput() {
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.copyFile.mockResolvedValue(undefined);
  }

  function createMockProcess() {
    return {
      stdout: {
        on: jest.fn((event: string, callback: any) => {
          if (event === 'data') {
            callback(Buffer.from('BUILD SUCCESSFUL\n'));
          }
        })
      },
      stderr: {
        on: jest.fn()
      },
      on: jest.fn((event: string, callback: any) => {
        if (event === 'close') {
          callback(0); // Success exit code
        }
      }),
      kill: jest.fn()
    };
  }
});