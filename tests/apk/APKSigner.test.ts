import { APKSignerImpl } from '../../src/apk/APKSigner.js';
import { KeystoreConfig, WebToAPKError } from '../../src/types/index.js';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock child_process
jest.mock('child_process');
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

// Mock fs/promises
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock fs (for existsSync)
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn()
}));

describe('APKSigner', () => {
  let apkSigner: APKSignerImpl;
  let mockKeystoreConfig: KeystoreConfig;
  let testApkPath: string;
  let testKeystorePath: string;

  beforeEach(() => {
    apkSigner = new APKSignerImpl();
    
    testApkPath = '/test/path/app.apk';
    testKeystorePath = '/test/path/keystore.jks';
    
    mockKeystoreConfig = {
      path: testKeystorePath,
      password: 'testpass',
      alias: 'testalias',
      aliasPassword: 'testaliaspass'
    };

    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    mockFs.access.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 1024 } as any);
    mockFs.mkdir.mockResolvedValue(undefined);
    
    // Mock fs.existsSync
    const mockExistsSync = require('fs').existsSync as jest.MockedFunction<any>;
    mockExistsSync.mockReturnValue(true);
    
    // Mock fs.readdirSync
    const mockReaddirSync = require('fs').readdirSync as jest.MockedFunction<any>;
    mockReaddirSync.mockReturnValue(['30.0.0']);

    // Set up environment variables
    process.env.ANDROID_HOME = '/android/sdk';
    process.env.JAVA_HOME = '/java/home';
  });

  afterEach(() => {
    delete process.env.ANDROID_HOME;
    delete process.env.JAVA_HOME;
  });

  describe('signAPK', () => {
    it('should successfully sign APK with valid keystore config', async () => {
      // Mock successful apksigner execution
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0); // Success exit code
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      // Mock signature verification
      const mockVerifyProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0); // Success exit code
          }
        })
      };
      mockSpawn.mockReturnValueOnce(mockProcess as any).mockReturnValueOnce(mockVerifyProcess as any);

      const result = await apkSigner.signAPK(testApkPath, mockKeystoreConfig);

      expect(result).toMatch(/app-signed-.*\.apk$/);
      expect(mockSpawn).toHaveBeenCalledTimes(2); // Sign + verify
      expect(mockFs.access).toHaveBeenCalledWith(testApkPath);
      expect(mockFs.access).toHaveBeenCalledWith(testKeystorePath);
    });

    it('should throw error if APK file does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('File not found'));

      await expect(apkSigner.signAPK(testApkPath, mockKeystoreConfig))
        .rejects.toThrow(WebToAPKError);
    });

    it('should throw error if APK file is empty', async () => {
      mockFs.stat.mockResolvedValueOnce({ size: 0 } as any);

      await expect(apkSigner.signAPK(testApkPath, mockKeystoreConfig))
        .rejects.toThrow(WebToAPKError);
    });

    it('should throw error if APK file has invalid extension', async () => {
      const invalidApkPath = '/test/path/app.txt';

      await expect(apkSigner.signAPK(invalidApkPath, mockKeystoreConfig))
        .rejects.toThrow(WebToAPKError);
    });

    it('should throw error if keystore file does not exist', async () => {
      mockFs.access.mockImplementation((filePath) => {
        if (filePath === testKeystorePath) {
          return Promise.reject(new Error('Keystore not found'));
        }
        return Promise.resolve();
      });

      await expect(apkSigner.signAPK(testApkPath, mockKeystoreConfig))
        .rejects.toThrow(WebToAPKError);
    });

    it('should throw error if apksigner process fails', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn((event: string, callback: (data: Buffer) => void) => {
          if (event === 'data') {
            callback(Buffer.from('Keystore password incorrect'));
          }
        }) },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(1); // Error exit code
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      await expect(apkSigner.signAPK(testApkPath, mockKeystoreConfig))
        .rejects.toThrow(WebToAPKError);
    });

    it('should throw error if signature verification fails', async () => {
      // Mock successful signing
      const mockSignProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0); // Success exit code
          }
        })
      };

      // Mock failed verification
      const mockVerifyProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(1); // Error exit code
          }
        })
      };

      mockSpawn.mockReturnValueOnce(mockSignProcess as any).mockReturnValueOnce(mockVerifyProcess as any);

      await expect(apkSigner.signAPK(testApkPath, mockKeystoreConfig))
        .rejects.toThrow(WebToAPKError);
    });
  });

  describe('signAPKWithDebugKeystore', () => {
    it('should successfully sign APK with debug keystore', async () => {
      const debugKeystorePath = path.join(os.homedir(), '.android', 'debug.keystore');
      
      // Mock debug keystore exists
      mockFs.access.mockImplementation((filePath) => {
        if (filePath === debugKeystorePath) {
          return Promise.resolve();
        }
        return Promise.resolve();
      });

      // Mock successful signing and verification
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0); // Success exit code
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await apkSigner.signAPKWithDebugKeystore(testApkPath);

      expect(result).toMatch(/app-signed-.*\.apk$/);
      expect(mockSpawn).toHaveBeenCalledTimes(2); // Sign + verify
    });

    it('should generate debug keystore if it does not exist', async () => {
      const debugKeystorePath = path.join(os.homedir(), '.android', 'debug.keystore');
      
      // Mock debug keystore doesn't exist initially, then exists after generation
      let keystoreExists = false;
      mockFs.access.mockImplementation((filePath) => {
        if (filePath === debugKeystorePath) {
          if (keystoreExists) {
            return Promise.resolve();
          } else {
            return Promise.reject(new Error('File not found'));
          }
        }
        return Promise.resolve();
      });

      // Mock successful keytool execution
      const mockKeytoolProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            // Simulate keystore creation by setting keystoreExists to true
            keystoreExists = true;
            callback(0); // Success exit code
          }
        })
      };

      // Mock successful signing and verification
      const mockSignProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0); // Success exit code
          }
        })
      };

      mockSpawn
        .mockReturnValueOnce(mockKeytoolProcess as any) // keytool
        .mockReturnValueOnce(mockSignProcess as any)   // apksigner sign
        .mockReturnValueOnce(mockSignProcess as any);  // apksigner verify

      const result = await apkSigner.signAPKWithDebugKeystore(testApkPath);

      expect(result).toMatch(/app-signed-.*\.apk$/);
      expect(mockSpawn).toHaveBeenCalledTimes(3); // keytool + sign + verify
      expect(mockFs.mkdir).toHaveBeenCalled(); // Create .android directory
    });
  });

  describe('verifyAPKSignature', () => {
    it('should return true for valid APK signature', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0); // Success exit code
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await apkSigner.verifyAPKSignature(testApkPath);

      expect(result).toBe(true);
      expect(mockSpawn).toHaveBeenCalledWith(
        expect.stringContaining('apksigner'),
        ['verify', '--verbose', testApkPath],
        expect.any(Object)
      );
    });

    it('should return false for invalid APK signature', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(1); // Error exit code
          }
        })
      };
      
      // Reset the spawn mock to ensure clean state
      mockSpawn.mockReset();
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await apkSigner.verifyAPKSignature(testApkPath);

      expect(result).toBe(false);
    });

    it('should throw error if APK file does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('File not found'));

      await expect(apkSigner.verifyAPKSignature(testApkPath))
        .rejects.toThrow(WebToAPKError);
    });
  });

  describe('generateDebugKeystore', () => {
    it('should return existing keystore path if keystore already exists', async () => {
      const keystorePath = '/test/debug.keystore';
      mockFs.access.mockResolvedValueOnce(undefined);

      const result = await apkSigner.generateDebugKeystore(keystorePath);

      expect(result).toBe(keystorePath);
      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('should generate new keystore if it does not exist', async () => {
      const keystorePath = '/test/debug.keystore';
      
      // Mock keystore doesn't exist initially, then exists after generation
      mockFs.access
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce(undefined);

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0); // Success exit code
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await apkSigner.generateDebugKeystore(keystorePath);

      expect(result).toBe(keystorePath);
      expect(mockSpawn).toHaveBeenCalledWith(
        expect.stringContaining('keytool'),
        expect.arrayContaining(['-genkeypair', '-keystore', keystorePath]),
        expect.any(Object)
      );
      expect(mockFs.mkdir).toHaveBeenCalled();
    });

    it('should throw error if keytool process fails', async () => {
      const keystorePath = '/test/debug.keystore';
      mockFs.access.mockRejectedValueOnce(new Error('File not found'));

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn((event: string, callback: (data: Buffer) => void) => {
          if (event === 'data') {
            callback(Buffer.from('Keytool error'));
          }
        }) },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(1); // Error exit code
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      await expect(apkSigner.generateDebugKeystore(keystorePath))
        .rejects.toThrow(WebToAPKError);
    });
  });

  describe('validateKeystoreConfig', () => {
    it('should return true for valid keystore config', async () => {
      const result = await apkSigner.validateKeystoreConfig(mockKeystoreConfig);

      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith(testKeystorePath);
      expect(mockFs.stat).toHaveBeenCalledWith(testKeystorePath);
    });

    it('should throw error for missing required fields', async () => {
      const invalidConfig = {
        path: testKeystorePath,
        password: '',
        alias: 'testalias',
        aliasPassword: 'testaliaspass'
      };

      await expect(apkSigner.validateKeystoreConfig(invalidConfig))
        .rejects.toThrow(WebToAPKError);
    });

    it('should throw error if keystore file does not exist', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('File not found'));

      await expect(apkSigner.validateKeystoreConfig(mockKeystoreConfig))
        .rejects.toThrow(WebToAPKError);
    });

    it('should throw error if keystore file is empty', async () => {
      mockFs.stat.mockResolvedValueOnce({ size: 0 } as any);

      await expect(apkSigner.validateKeystoreConfig(mockKeystoreConfig))
        .rejects.toThrow(WebToAPKError);
    });
  });

  describe('Error handling', () => {
    it('should handle missing ANDROID_HOME environment variable', async () => {
      delete process.env.ANDROID_HOME;
      delete process.env.ANDROID_SDK_ROOT;

      await expect(apkSigner.signAPK(testApkPath, mockKeystoreConfig))
        .rejects.toThrow(WebToAPKError);
    });

    it('should handle apksigner not found in Android SDK', async () => {
      const mockExistsSync = require('fs').existsSync as jest.MockedFunction<any>;
      mockExistsSync.mockReturnValue(false);

      await expect(apkSigner.signAPK(testApkPath, mockKeystoreConfig))
        .rejects.toThrow(WebToAPKError);
    });

    it('should parse common signing errors correctly', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn((event: string, callback: (data: Buffer) => void) => {
          if (event === 'data') {
            callback(Buffer.from('Keystore was tampered with, or password was incorrect'));
          }
        }) },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(1); // Error exit code
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      await expect(apkSigner.signAPK(testApkPath, mockKeystoreConfig))
        .rejects.toThrow('Incorrect keystore password or corrupted keystore file');
    });
  });

  describe('Platform-specific behavior', () => {
    it('should use correct apksigner path on Windows', async () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      const mockExistsSync = require('fs').existsSync as jest.MockedFunction<any>;
      mockExistsSync.mockImplementation((filePath: string) => {
        return filePath.toString().includes('apksigner.bat');
      });

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      await apkSigner.signAPK(testApkPath, mockKeystoreConfig);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.stringContaining('apksigner.bat'),
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('should use correct keytool path on Windows', async () => {
      // Mock Windows platform
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });

      const debugKeystorePath = path.join(os.homedir(), '.android', 'debug.keystore');
      mockFs.access.mockRejectedValueOnce(new Error('File not found'));

      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };
      mockSpawn.mockReturnValue(mockProcess as any);

      await apkSigner.generateDebugKeystore(debugKeystorePath);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.stringContaining('keytool.exe'),
        expect.any(Array),
        expect.any(Object)
      );
    });
  });
});