/**
 * 发布版签名功能最终测试
 * 专门验证server.js中buildAPK函数的核心逻辑
 */

import fs from 'fs/promises';
import path from 'path';

describe('发布版签名功能最终测试', () => {
  let mockKeystoreBuffer: Buffer;
  let tempKeystorePath: string;
  let originalSpawn: any;
  let spawnCalls: any[] = [];
  let unlinkCalls: string[] = [];

  beforeAll(async () => {
    // 创建模拟的密钥库文件
    mockKeystoreBuffer = Buffer.from('MOCK_KEYSTORE_DATA_FOR_TESTING');
    tempKeystorePath = path.join(__dirname, 'test-keystore.jks');
    await fs.writeFile(tempKeystorePath, mockKeystoreBuffer);
  });

  afterAll(async () => {
    // 清理测试文件
    try {
      await fs.unlink(tempKeystorePath);
    } catch (error) {
      // 忽略清理错误
    }
  });

  beforeEach(() => {
    spawnCalls = [];
    unlinkCalls = [];
    
    // 保存原始的spawn函数
    originalSpawn = require('child_process').spawn;
    
    // Mock child_process.spawn
    require('child_process').spawn = jest.fn().mockImplementation((command: string, args: string[], options: any) => {
      spawnCalls.push({ command, args, options });
      
      // 创建模拟的子进程
      const mockProcess = {
        stdout: {
          on: jest.fn((event: string, callback: (data: Buffer) => void) => {
            if (event === 'data') {
              setTimeout(() => callback(Buffer.from('Build successful')), 50);
            }
          })
        },
        stderr: {
          on: jest.fn((event: string, callback: (data: Buffer) => void) => {
            if (event === 'data') {
              setTimeout(() => callback(Buffer.from('')), 50);
            }
          })
        },
        on: jest.fn((event: string, callback: (code: number) => void) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100); // 模拟成功完成
          }
        })
      };
      
      return mockProcess;
    });

    // Mock fs.unlink
    (fs as any).unlink = jest.fn().mockImplementation(async (filePath: string) => {
      unlinkCalls.push(filePath);
      return Promise.resolve();
    });
  });

  afterEach(() => {
    // 恢复原始函数
    require('child_process').spawn = originalSpawn;
    jest.restoreAllMocks();
  });

  describe('核心功能：构建命令参数验证', () => {
    test('当isRelease=true且提供签名信息时，必须包含所有--release相关参数', async () => {
      // 动态导入buildAPK函数
      const serverModule = await import('../../web-server/server.js') as any;
      const buildAPK = serverModule.buildAPK;
      
      const config = {
        appName: 'Release Test App',
        packageName: 'com.release.test',
        version: '1.0.0',
        isRelease: true,
        keystorePassword: 'test-keystore-password',
        keyAlias: 'test-key-alias',
        keyPassword: 'test-key-password'
      };
      
      const iconPath = null;
      const keystorePath = tempKeystorePath;
      const outputDir = path.join(__dirname, 'temp-output');
      
      // 执行buildAPK函数
      await buildAPK(config, iconPath, keystorePath, outputDir);
      
      // 验证spawn被调用
      expect(spawnCalls).toHaveLength(1);
      expect(spawnCalls[0].command).toBe('node');
      
      const args = spawnCalls[0].args;
      
      // 验证必须包含的--release相关参数
      expect(args).toContain('--release');
      expect(args).toContain('--keystore');
      expect(args).toContain(keystorePath);
      expect(args).toContain('--keystore-password');
      expect(args).toContain('test-keystore-password');
      expect(args).toContain('--key-alias');
      expect(args).toContain('test-key-alias');
      expect(args).toContain('--key-password');
      expect(args).toContain('test-key-password');
      
      // 验证参数顺序正确
      const releaseIndex = args.indexOf('--release');
      const keystoreIndex = args.indexOf('--keystore');
      const keystorePasswordIndex = args.indexOf('--keystore-password');
      const keyAliasIndex = args.indexOf('--key-alias');
      const keyPasswordIndex = args.indexOf('--key-password');
      
      expect(releaseIndex).toBeGreaterThan(-1);
      expect(keystoreIndex).toBeGreaterThan(releaseIndex);
      expect(keystorePasswordIndex).toBeGreaterThan(keystoreIndex);
      expect(keyAliasIndex).toBeGreaterThan(keystorePasswordIndex);
      expect(keyPasswordIndex).toBeGreaterThan(keyAliasIndex);
    });

    test('当keyPassword为空时，应该使用keystorePassword作为key-password', async () => {
      const serverModule = await import('../../web-server/server.js') as any;
      const buildAPK = serverModule.buildAPK;
      
      const config = {
        appName: 'Password Fallback Test',
        packageName: 'com.passwordfallback.test',
        version: '1.0.0',
        isRelease: true,
        keystorePassword: 'shared-password',
        keyAlias: 'test-alias',
        keyPassword: '' // 空密钥密码
      };
      
      const iconPath = null;
      const keystorePath = tempKeystorePath;
      const outputDir = path.join(__dirname, 'temp-output');
      
      await buildAPK(config, iconPath, keystorePath, outputDir);
      
      const args = spawnCalls[0].args;
      
      // 验证使用了keystorePassword作为key-password
      expect(args).toContain('--key-password');
      const keyPasswordIndex = args.indexOf('--key-password');
      expect(args[keyPasswordIndex + 1]).toBe('shared-password');
    });

    test('当isRelease=false时，不应包含任何--release相关参数', async () => {
      const serverModule = await import('../../web-server/server.js') as any;
      const buildAPK = serverModule.buildAPK;
      
      const config = {
        appName: 'Debug Test App',
        packageName: 'com.debug.test',
        version: '1.0.0',
        isRelease: false
      };
      
      const iconPath = null;
      const keystorePath = null; // 调试版本不需要keystore
      const outputDir = path.join(__dirname, 'temp-output');
      
      await buildAPK(config, iconPath, keystorePath, outputDir);
      
      const args = spawnCalls[0].args;
      
      // 验证不包含任何发布版本相关参数
      expect(args).not.toContain('--release');
      expect(args).not.toContain('--keystore');
      expect(args).not.toContain('--keystore-password');
      expect(args).not.toContain('--key-alias');
      expect(args).not.toContain('--key-password');
      
      // 但应该包含基本的构建参数
      expect(args).toContain('build');
      expect(args).toContain('--output');
    });
  });

  describe('核心功能：密钥库文件清理验证', () => {
    test('构建成功完成后，必须调用fs.unlink清理密钥库文件', async () => {
      const serverModule = await import('../../web-server/server.js') as any;
      const buildAPK = serverModule.buildAPK;
      
      const config = {
        appName: 'Cleanup Success Test',
        packageName: 'com.cleanup.success',
        version: '1.0.0',
        isRelease: true,
        keystorePassword: 'cleanup-password',
        keyAlias: 'cleanup-alias',
        keyPassword: 'cleanup-key-password'
      };
      
      const iconPath = null;
      const keystorePath = tempKeystorePath;
      const outputDir = path.join(__dirname, 'temp-output');
      
      await buildAPK(config, iconPath, keystorePath, outputDir);
      
      // 验证fs.unlink被调用来清理密钥库文件
      expect(fs.unlink).toHaveBeenCalled();
      expect(unlinkCalls).toContain(keystorePath);
      
      // 验证清理调用发生在构建完成后
      expect(spawnCalls).toHaveLength(1);
      expect(unlinkCalls).toHaveLength(1);
    });

    test('调试版本构建时，不应调用fs.unlink（因为没有密钥库文件）', async () => {
      const serverModule = await import('../../web-server/server.js') as any;
      const buildAPK = serverModule.buildAPK;
      
      const config = {
        appName: 'Debug No Cleanup Test',
        packageName: 'com.debug.nocleanup',
        version: '1.0.0',
        isRelease: false
      };
      
      const iconPath = null;
      const keystorePath = null; // 调试版本没有keystore
      const outputDir = path.join(__dirname, 'temp-output');
      
      await buildAPK(config, iconPath, keystorePath, outputDir);
      
      // 验证fs.unlink没有被调用（因为没有密钥库文件需要清理）
      expect(fs.unlink).not.toHaveBeenCalled();
      expect(unlinkCalls).toHaveLength(0);
    });
  });
});