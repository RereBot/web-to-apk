import { AppConfig, BuildOptions } from '../types/index.js';
/**
 * Interface for APK building functionality
 */
export interface APKBuilder {
    /**
     * Initialize a new Capacitor project with the given configuration
     */
    initializeProject(config: AppConfig, projectPath: string): Promise<void>;
    /**
     * Build APK from the initialized project
     */
    buildAPK(projectPath: string, options: BuildOptions): Promise<string>;
    /**
     * Sign the APK with the provided keystore configuration
     */
    signAPK(apkPath: string, keystoreConfig?: any): Promise<string>;
}
/**
 * Interface for Capacitor project initialization
 */
export interface CapacitorProjectInitializer {
    /**
     * Create a new Capacitor project structure
     */
    createProject(config: AppConfig, projectPath: string): Promise<void>;
    /**
     * Generate Capacitor configuration file
     */
    generateCapacitorConfig(config: AppConfig, projectPath: string): Promise<void>;
    /**
     * Add Android platform to the project
     */
    addAndroidPlatform(projectPath: string): Promise<void>;
    /**
     * Install required plugins and dependencies
     */
    installDependencies(projectPath: string, plugins?: string[]): Promise<void>;
    /**
     * Sync web assets to native project
     */
    syncProject(projectPath: string): Promise<void>;
}
//# sourceMappingURL=APKBuilder.d.ts.map