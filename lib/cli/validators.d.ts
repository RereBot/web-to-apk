/**
 * CLI参数验证工具
 */
/**
 * 验证包名格式
 */
export declare function validatePackageName(packageName: string): boolean;
/**
 * 验证应用名称
 */
export declare function validateAppName(appName: string): boolean;
/**
 * 验证版本号格式
 */
export declare function validateVersion(version: string): boolean;
/**
 * 验证端口号
 */
export declare function validatePort(port: string | number): boolean;
/**
 * 验证文件路径是否存在
 */
export declare function validateFilePath(filePath: string): Promise<boolean>;
/**
 * 验证目录路径是否存在
 */
export declare function validateDirectoryPath(dirPath: string): Promise<boolean>;
/**
 * 验证配置文件格式
 */
export declare function validateConfigFile(configPath: string): Promise<{
    valid: boolean;
    error?: string;
}>;
/**
 * 验证密钥库文件
 */
export declare function validateKeystoreFile(keystorePath: string): Promise<{
    valid: boolean;
    error?: string;
}>;
/**
 * 验证Web目录
 */
export declare function validateWebDirectory(webDir: string): Promise<{
    valid: boolean;
    error?: string;
}>;
//# sourceMappingURL=validators.d.ts.map