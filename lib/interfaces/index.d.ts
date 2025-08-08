/**
 * Interface definitions for Web-to-APK converter
 */
export interface ResourceProcessor {
    processResources(inputDir: string, outputDir: string): Promise<void>;
}
export interface ErrorHandler {
    handleError(error: Error): void;
    logError(message: string, details?: any): void;
}
export interface VersionManager {
    getCurrentVersion(): string;
    checkForUpdates(): Promise<boolean>;
}
export interface CLIOptions {
    config?: string;
    output?: string;
    release?: boolean;
    verbose?: boolean;
    help?: boolean;
    version?: boolean;
}
export interface InitOptions {
    name?: string;
    template?: string;
    force?: boolean;
    interactive?: boolean;
}
export interface ServeOptions {
    port?: number;
    host?: string;
    open?: boolean;
    https?: boolean;
    cert?: string;
    key?: string;
}
//# sourceMappingURL=index.d.ts.map