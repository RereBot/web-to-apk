/**
 * CLI命令单元测试
 */

import { jest } from '@jest/globals';
import { Command } from 'commander';
import { initCommand } from '../../src/cli/commands/init.js';
import { buildCommand } from '../../src/cli/commands/build.js';
import { serveCommand } from '../../src/cli/commands/serve.js';

// Mock CLIImpl
jest.mock('../../src/cli/CLIImpl.js');

describe('CLI Commands', () => {
  let mockCLI: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock CLIImpl
    const { CLIImpl } = require('../../src/cli/CLIImpl.js');
    mockCLI = {
      init: jest.fn(),
      build: jest.fn(),
      serve: jest.fn()
    };
    CLIImpl.mockImplementation(() => mockCLI);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('init command', () => {
    it('应该有正确的命令配置', () => {
      expect(initCommand.name()).toBe('init');
      expect(initCommand.description()).toBe('初始化新的Web-to-APK项目');
    });

    it('应该有正确的选项', () => {
      const options = (initCommand as any).options;
      const optionNames = options.map((opt: any) => opt.long);
      
      expect(optionNames).toContain('--name');
      expect(optionNames).toContain('--package-name');
      expect(optionNames).toContain('--template');
      expect(optionNames).toContain('--interactive');
    });

    it('应该调用CLI.init方法', async () => {
      mockCLI.init.mockResolvedValue(undefined);

      // 模拟命令执行
      const program = new Command();
      program.addCommand(initCommand);
      
      await program.parseAsync(['node', 'test', 'init', 'my-project', '--name', 'Test App']);

      expect(mockCLI.init).toHaveBeenCalledWith('my-project', expect.objectContaining({
        name: 'Test App'
      }));
    });

    it('应该处理初始化错误', async () => {
      mockCLI.init.mockRejectedValue(new Error('Init failed'));

      const program = new Command();
      program.addCommand(initCommand);
      program.exitOverride();

      try {
        await program.parseAsync(['node', 'test', 'init', 'my-project']);
      } catch (error) {
        // Expected to throw due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ 初始化失败:'),
        'Init failed'
      );
    });
  });

  describe('build command', () => {
    it('应该有正确的命令配置', () => {
      expect(buildCommand.name()).toBe('build');
      expect(buildCommand.description()).toBe('构建Android APK文件');
    });

    it('应该有正确的选项', () => {
      const options = (buildCommand as any).options;
      const optionNames = options.map((opt: any) => opt.long);
      
      expect(optionNames).toContain('--output');
      expect(optionNames).toContain('--release');
      expect(optionNames).toContain('--keystore');
      expect(optionNames).toContain('--keystore-password');
      expect(optionNames).toContain('--key-alias');
      expect(optionNames).toContain('--key-password');
      expect(optionNames).toContain('--minify');
    });

    it('应该调用CLI.build方法', async () => {
      mockCLI.build.mockResolvedValue(undefined);

      const program = new Command();
      program.addCommand(buildCommand);
      
      await program.parseAsync(['node', 'test', 'build', '--release', '--output', './build']);

      expect(mockCLI.build).toHaveBeenCalledWith('./web-to-apk.config.json', expect.objectContaining({
        release: true,
        output: './build'
      }));
    });

    it('应该使用默认配置路径', async () => {
      mockCLI.build.mockResolvedValue(undefined);

      const program = new Command();
      program.addCommand(buildCommand);
      
      await program.parseAsync(['node', 'test', 'build']);

      expect(mockCLI.build).toHaveBeenCalledWith('./web-to-apk.config.json', expect.any(Object));
    });

    it('应该处理构建错误', async () => {
      mockCLI.build.mockRejectedValue(new Error('Build failed'));

      const program = new Command();
      program.addCommand(buildCommand);
      program.exitOverride();

      try {
        await program.parseAsync(['node', 'test', 'build']);
      } catch (error) {
        // Expected to throw due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('💥 构建失败!')
      );
    });
  });

  describe('serve command', () => {
    it('应该有正确的命令配置', () => {
      expect(serveCommand.name()).toBe('serve');
      expect(serveCommand.description()).toBe('启动开发服务器预览应用');
    });

    it('应该有正确的选项', () => {
      const options = (serveCommand as any).options;
      const optionNames = options.map((opt: any) => opt.long);
      
      expect(optionNames).toContain('--port');
      expect(optionNames).toContain('--host');
      expect(optionNames).toContain('--open');
    });

    it('应该调用CLI.serve方法', async () => {
      mockCLI.serve.mockResolvedValue(undefined);

      const program = new Command();
      program.addCommand(serveCommand);
      
      await program.parseAsync(['node', 'test', 'serve', '--port', '8080', '--host', '0.0.0.0']);

      expect(mockCLI.serve).toHaveBeenCalledWith(expect.objectContaining({
        port: '8080',
        host: '0.0.0.0'
      }));
    });

    it('应该处理服务器启动错误', async () => {
      mockCLI.serve.mockRejectedValue(new Error('Server failed'));

      const program = new Command();
      program.addCommand(serveCommand);
      program.exitOverride();

      try {
        await program.parseAsync(['node', 'test', 'serve']);
      } catch (error) {
        // Expected to throw due to process.exit mock
      }

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ 服务器启动失败:'),
        'Server failed'
      );
    });
  });
});