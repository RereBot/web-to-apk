import { AppConfig, BuildOptions, KeystoreConfig } from '../types/index.js';
import { APKBuilder } from '../interfaces/APKBuilder.js';
/**
 * Main APK builder implementation
 */
export declare class APKBuilderImpl implements APKBuilder {
    private projectInitializer;
    private apkSigner;
    constructor();
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
    signAPK(apkPath: string, keystoreConfig?: KeystoreConfig): Promise<string>;
    /**
     * Validate the application configuration
     */
    private validateConfig;
    /**
     * Validate that the project structure exists and is valid
     */
    private validateProjectStructure;
    /**
     * Execute Gradle build with proper logging and error handling
     */
    private executeGradleBuild;
    /**
     * Parse Gradle error output to provide meaningful error messages
     */
    private parseGradleError;
    /**
     * Find the built APK file in the project output directory
     */
    private findBuiltAPK;
    /**
     * Copy APK to the specified output directory
     */
    private copyAPKToOutput;
}
//# sourceMappingURL=APKBuilder.d.ts.map