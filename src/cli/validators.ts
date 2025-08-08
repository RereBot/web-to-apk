/**
 * CLI参数验证工具
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * 验证包名格式
 */
export function validatePackageName(packageName: string): boolean {
  const packageRegex = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
  return packageRegex.test(packageName);
}

/**
 * 验证应用名称
 */
export function validateAppName(appName: string): boolean {
  return appName.trim().length > 0 && appName.length <= 50;
}

/**
 * 验证版本号格式
 */
export function validateVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
  return versionRegex.test(version);
}

/**
 * 验证端口号
 */
export function validatePort(port: string | number): boolean {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

/**
 * 验证文件路径是否存在
 */
export async function validateFilePath(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证目录路径是否存在
 */
export async function validateDirectoryPath(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * 验证配置文件格式
 */
export async function validateConfigFile(
  configPath: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const exists = await validateFilePath(configPath);
    if (!exists) {
      return { valid: false, error: '配置文件不存在' };
    }

    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    // 基本字段验证
    const requiredFields = ['appName', 'packageName', 'version', 'webDir'];
    for (const field of requiredFields) {
      if (!config[field]) {
        return { valid: false, error: `缺少必需字段: ${field}` };
      }
    }

    // 包名验证
    if (!validatePackageName(config.packageName)) {
      return { valid: false, error: '包名格式无效' };
    }

    // 版本号验证
    if (!validateVersion(config.version)) {
      return { valid: false, error: '版本号格式无效' };
    }

    return { valid: true };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { valid: false, error: '配置文件格式错误' };
    }
    return {
      valid: false,
      error: error instanceof Error ? error.message : '配置文件格式错误'
    };
  }
}

/**
 * 验证密钥库文件
 */
export async function validateKeystoreFile(
  keystorePath: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const exists = await validateFilePath(keystorePath);
    if (!exists) {
      return { valid: false, error: '密钥库文件不存在' };
    }

    const ext = path.extname(keystorePath).toLowerCase();
    if (!['.keystore', '.jks', '.p12'].includes(ext)) {
      return { valid: false, error: '不支持的密钥库文件格式' };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : '密钥库文件验证失败'
    };
  }
}

/**
 * 验证Web目录
 */
export async function validateWebDirectory(
  webDir: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const exists = await validateDirectoryPath(webDir);
    if (!exists) {
      return { valid: false, error: 'Web目录不存在' };
    }

    // 检查是否包含index.html或其他入口文件
    const possibleEntries = ['index.html', 'index.htm', 'main.html'];
    let hasEntry = false;

    for (const entry of possibleEntries) {
      const entryPath = path.join(webDir, entry);
      if (await validateFilePath(entryPath)) {
        hasEntry = true;
        break;
      }
    }

    if (!hasEntry) {
      return {
        valid: false,
        error: 'Web目录中未找到入口文件 (index.html)'
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Web目录验证失败'
    };
  }
}
