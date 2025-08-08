/**
 * CLI接口定义
 */
export interface CLIOptions {
    verbose?: boolean;
    color?: boolean;
}
export interface InitOptions extends CLIOptions {
    name?: string;
    packageName?: string;
    template?: string;
    interactive?: boolean;
    force?: boolean;
    listTemplates?: boolean;
}
export interface BuildOptions extends CLIOptions {
    config?: string;
    output?: string;
    release?: boolean;
    keystore?: string;
    keystorePassword?: string;
    keyAlias?: string;
    keyPassword?: string;
    minify?: boolean;
    clean?: boolean;
    skipValidation?: boolean;
    target?: string;
    arch?: string;
}
export interface ServeOptions extends CLIOptions {
    port?: number;
    host?: string;
    open?: boolean;
    https?: boolean;
}
export interface CLI {
    /**
     * 初始化新项目
     */
    init(projectPath: string, options: InitOptions): Promise<void>;
    /**
     * 构建APK文件
     */
    build(configPath: string, options: BuildOptions): Promise<void>;
    /**
     * 启动开发服务器
     */
    serve(options: ServeOptions): Promise<void>;
}
//# sourceMappingURL=CLI.d.ts.map