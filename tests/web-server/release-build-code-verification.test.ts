/**
 * 发布版签名功能代码验证测试
 * 通过检查server.js源代码来验证发布版本构建逻辑是否正确实现
 */

import fs from 'fs/promises';
import path from 'path';

describe('发布版签名功能代码验证测试', () => {
  let serverCode: string;

  beforeAll(async () => {
    // 读取server.js源代码
    const serverPath = path.join(__dirname, '../../web-server/server.js');
    serverCode = await fs.readFile(serverPath, 'utf-8');
  });

  describe('核心功能：构建命令参数验证', () => {
    test('server.js必须包含发布版本构建逻辑', () => {
      // 验证包含isRelease检查
      expect(serverCode).toContain('config.isRelease');
      expect(serverCode).toContain('keystorePath');
      
      // 验证包含--release参数添加逻辑
      expect(serverCode).toContain('--release');
      expect(serverCode).toContain('--keystore');
      expect(serverCode).toContain('--keystore-password');
      expect(serverCode).toContain('--key-alias');
      expect(serverCode).toContain('--key-password');
    });

    test('server.js必须包含正确的参数添加逻辑', () => {
      // 验证条件检查逻辑
      expect(serverCode).toMatch(/if\s*\(\s*config\.isRelease\s*&&\s*keystorePath\s*\)/);
      
      // 验证参数推送逻辑
      expect(serverCode).toContain('buildArgs.push(\'--release\')');
      expect(serverCode).toContain('buildArgs.push(\'--keystore\', keystorePath)');
      expect(serverCode).toContain('buildArgs.push(\'--keystore-password\', config.keystorePassword)');
      expect(serverCode).toContain('buildArgs.push(\'--key-alias\', config.keyAlias)');
    });

    test('server.js必须包含密钥密码回退逻辑', () => {
      // 验证密钥密码回退逻辑
      expect(serverCode).toMatch(/const\s+keyPassword\s*=\s*config\.keyPassword\s*\|\|\s*config\.keystorePassword/);
      expect(serverCode).toContain('buildArgs.push(\'--key-password\', keyPassword)');
    });

    test('server.js必须包含基础构建参数', () => {
      // 验证基础构建参数
      expect(serverCode).toContain('buildArgs = [');
      expect(serverCode).toContain('\'build\'');
      expect(serverCode).toContain('\'--output\'');
      expect(serverCode).toContain('outputDir');
    });
  });

  describe('核心功能：密钥库文件清理验证', () => {
    test('server.js必须包含密钥库文件清理逻辑', () => {
      // 验证包含fs.unlink调用
      expect(serverCode).toContain('fs.unlink(keystorePath)');
      
      // 验证清理逻辑在多个地方存在
      const unlinkMatches = serverCode.match(/fs\.unlink\(keystorePath\)/g);
      expect(unlinkMatches).not.toBeNull();
      expect(unlinkMatches!.length).toBeGreaterThan(1); // 应该在多个地方清理
    });

    test('server.js必须包含构建成功后的清理逻辑', () => {
      // 验证在构建完成后清理
      expect(serverCode).toMatch(/buildProcess\.on\(['"]close['"],.*fs\.unlink/s);
    });

    test('server.js必须包含构建错误时的清理逻辑', () => {
      // 验证在错误处理中也有清理
      expect(serverCode).toMatch(/buildProcess\.on\(['"]error['"],.*fs\.unlink/s);
      expect(serverCode).toMatch(/\.catch\(.*fs\.unlink/s);
    });

    test('server.js必须包含清理成功和失败的日志', () => {
      // 验证清理日志
      expect(serverCode).toContain('Keystore file cleaned up successfully');
      expect(serverCode).toContain('Failed to clean up keystore file');
    });
  });

  describe('补充验证：API端点验证', () => {
    test('server.js必须包含发布版本验证逻辑', () => {
      // 验证API端点中的发布版本验证
      expect(serverCode).toContain('isRelease');
      expect(serverCode).toContain('keystoreFile');
      expect(serverCode).toContain('keystorePassword');
      expect(serverCode).toContain('keyAlias');
    });

    test('server.js必须包含文件上传处理', () => {
      // 验证文件上传处理
      expect(serverCode).toContain('upload.fields');
      expect(serverCode).toContain('keystoreFile');
      expect(serverCode).toMatch(/req\.files.*keystoreFile/);
    });

    test('server.js必须包含错误处理', () => {
      // 验证错误处理
      expect(serverCode).toContain('try {');
      expect(serverCode).toContain('catch');
      expect(serverCode).toContain('res.status(400)');
      expect(serverCode).toContain('res.status(500)');
    });
  });

  describe('安全性验证', () => {
    test('server.js必须包含密钥库文件类型验证', () => {
      // 验证文件类型检查
      expect(serverCode).toMatch(/\.keystore|\.jks/i);
    });

    test('server.js必须包含必填字段验证', () => {
      // 验证必填字段检查
      expect(serverCode).toContain('required');
      expect(serverCode).toMatch(/Keystore.*required/i);
      expect(serverCode).toMatch(/password.*required/i);
      expect(serverCode).toMatch(/alias.*required/i);
    });
  });

  describe('代码质量验证', () => {
    test('server.js必须包含适当的注释', () => {
      // 验证关键部分有注释
      expect(serverCode).toMatch(/\/\/.*release.*build/i);
      expect(serverCode).toMatch(/\/\/.*clean.*up/i);
    });

    test('server.js必须使用现代JavaScript语法', () => {
      // 验证使用ES6+语法
      expect(serverCode).toContain('const ');
      expect(serverCode).toContain('async ');
      expect(serverCode).toContain('await ');
      expect(serverCode).toContain('=>');
    });

    test('server.js必须包含错误处理最佳实践', () => {
      // 验证错误处理最佳实践
      expect(serverCode).toContain('try {');
      expect(serverCode).toContain('} catch');
      expect(serverCode).toMatch(/error\.message/);
    });
  });
});