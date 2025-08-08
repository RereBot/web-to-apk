/**
 * CLI验证器单元测试
 */

import { jest } from '@jest/globals';
import fs from 'fs/promises';
import {
  validatePackageName,
  validateAppName,
  validateVersion,
  validatePort,
  validateFilePath,
  validateDirectoryPath,
  validateConfigFile,
  validateKeystoreFile,
  validateWebDirectory
} from '../../src/cli/validators.js';

// Mock fs
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('CLI Validators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePackageName', () => {
    it('应该验证有效的包名', () => {
      expect(validatePackageName('com.example.app')).toBe(true);
      expect(validatePackageName('com.company.myapp')).toBe(true);
      expect(validatePackageName('org.apache.commons')).toBe(true);
    });

    it('应该拒绝无效的包名', () => {
      expect(validatePackageName('invalid')).toBe(false);
      expect(validatePackageName('com')).toBe(false);
      expect(validatePackageName('Com.Example.App')).toBe(false);
      expect(validatePackageName('com.123invalid.app')).toBe(false);
      expect(validatePackageName('')).toBe(false);
    });
  });

  describe('validateAppName', () => {
    it('应该验证有效的应用名称', () => {
      expect(validateAppName('My App')).toBe(true);
      expect(validateAppName('我的应用')).toBe(true);
      expect(validateAppName('App123')).toBe(true);
    });

    it('应该拒绝无效的应用名称', () => {
      expect(validateAppName('')).toBe(false);
      expect(validateAppName('   ')).toBe(false);
      expect(validateAppName('a'.repeat(51))).toBe(false);
    });
  });

  describe('validateVersion', () => {
    it('应该验证有效的版本号', () => {
      expect(validateVersion('1.0.0')).toBe(true);
      expect(validateVersion('2.1.3')).toBe(true);
      expect(validateVersion('1.0.0-beta')).toBe(true);
      expect(validateVersion('1.0.0-alpha1')).toBe(true);
    });

    it('应该拒绝无效的版本号', () => {
      expect(validateVersion('1.0')).toBe(false);
      expect(validateVersion('1.0.0.0')).toBe(false);
      expect(validateVersion('v1.0.0')).toBe(false);
      expect(validateVersion('1.0.0-')).toBe(false);
      expect(validateVersion('')).toBe(false);
    });
  });

  describe('validatePort', () => {
    it('应该验证有效的端口号', () => {
      expect(validatePort(3000)).toBe(true);
      expect(validatePort('8080')).toBe(true);
      expect(validatePort(1)).toBe(true);
      expect(validatePort(65535)).toBe(true);
    });

    it('应该拒绝无效的端口号', () => {
      expect(validatePort(0)).toBe(false);
      expect(validatePort(65536)).toBe(false);
      expect(validatePort(-1)).toBe(false);
      expect(validatePort('invalid')).toBe(false);
    });
  });

  describe('validateFilePath', () => {
    it('应该验证存在的文件', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const result = await validateFilePath('/path/to/file.txt');
      
      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith('/path/to/file.txt');
    });

    it('应该拒绝不存在的文件', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      
      const result = await validateFilePath('/path/to/nonexistent.txt');
      
      expect(result).toBe(false);
    });
  });

  describe('validateDirectoryPath', () => {
    it('应该验证存在的目录', async () => {
      mockFs.stat.mockResolvedValue({
        isDirectory: () => true
      } as any);
      
      const result = await validateDirectoryPath('/path/to/dir');
      
      expect(result).toBe(true);
      expect(mockFs.stat).toHaveBeenCalledWith('/path/to/dir');
    });

    it('应该拒绝不存在的目录', async () => {
      mockFs.stat.mockRejectedValue(new Error('Directory not found'));
      
      const result = await validateDirectoryPath('/path/to/nonexistent');
      
      expect(result).toBe(false);
    });

    it('应该拒绝文件路径', async () => {
      mockFs.stat.mockResolvedValue({
        isDirectory: () => false
      } as any);
      
      const result = await validateDirectoryPath('/path/to/file.txt');
      
      expect(result).toBe(false);
    });
  });

  describe('validateConfigFile', () => {
    it('应该验证有效的配置文件', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        appName: 'Test App',
        packageName: 'com.example.test',
        version: '1.0.0',
        webDir: './dist'
      }));
      
      const result = await validateConfigFile('/path/to/config.json');
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('应该拒绝不存在的配置文件', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      
      const result = await validateConfigFile('/path/to/nonexistent.json');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('配置文件不存在');
    });

    it('应该拒绝缺少必需字段的配置', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        appName: 'Test App'
        // 缺少其他必需字段
      }));
      
      const result = await validateConfigFile('/path/to/config.json');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('缺少必需字段');
    });

    it('应该拒绝无效包名的配置', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        appName: 'Test App',
        packageName: 'invalid',
        version: '1.0.0',
        webDir: './dist'
      }));
      
      const result = await validateConfigFile('/path/to/config.json');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('包名格式无效');
    });

    it('应该拒绝无效版本号的配置', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        appName: 'Test App',
        packageName: 'com.example.test',
        version: 'invalid',
        webDir: './dist'
      }));
      
      const result = await validateConfigFile('/path/to/config.json');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('版本号格式无效');
    });

    it('应该处理JSON解析错误', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('invalid json');
      
      const result = await validateConfigFile('/path/to/config.json');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('配置文件格式错误');
    });
  });

  describe('validateKeystoreFile', () => {
    it('应该验证有效的密钥库文件', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const result = await validateKeystoreFile('/path/to/keystore.keystore');
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('应该验证不同格式的密钥库文件', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      expect((await validateKeystoreFile('/path/to/keystore.jks')).valid).toBe(true);
      expect((await validateKeystoreFile('/path/to/keystore.p12')).valid).toBe(true);
    });

    it('应该拒绝不存在的密钥库文件', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      
      const result = await validateKeystoreFile('/path/to/nonexistent.keystore');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('密钥库文件不存在');
    });

    it('应该拒绝不支持的文件格式', async () => {
      mockFs.access.mockResolvedValue(undefined);
      
      const result = await validateKeystoreFile('/path/to/keystore.txt');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('不支持的密钥库文件格式');
    });
  });

  describe('validateWebDirectory', () => {
    it('应该验证包含index.html的目录', async () => {
      mockFs.stat.mockResolvedValue({
        isDirectory: () => true
      } as any);
      
      // 第一次调用验证目录，第二次调用验证index.html
      mockFs.access
        .mockResolvedValueOnce(undefined) // 目录存在
        .mockResolvedValueOnce(undefined); // index.html存在
      
      const result = await validateWebDirectory('/path/to/web');
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('应该拒绝不存在的目录', async () => {
      mockFs.stat.mockRejectedValue(new Error('Directory not found'));
      
      const result = await validateWebDirectory('/path/to/nonexistent');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Web目录不存在');
    });

    it('应该拒绝没有入口文件的目录', async () => {
      // 目录存在 (validateDirectoryPath调用)
      mockFs.stat.mockResolvedValue({
        isDirectory: () => true
      } as any);
      
      // 重置之前的mock并设置所有入口文件都不存在
      mockFs.access.mockReset();
      mockFs.access.mockRejectedValue(new Error('File not found'));
      
      const result = await validateWebDirectory('/path/to/web');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('未找到入口文件');
    });
  });
});