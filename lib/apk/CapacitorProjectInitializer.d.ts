import { AppConfig } from '../types/index.js';
import { CapacitorProjectInitializer } from '../interfaces/APKBuilder.js';
/**
 * Implementation of Capacitor project initialization
 */
export declare class CapacitorProjectInitializerImpl implements CapacitorProjectInitializer {
    private resourceProcessor;
    constructor();
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
     * Verify Android development environment
     */
    private verifyAndroidEnvironment;
    /**
     * Install required plugins and dependencies
     */
    installDependencies(projectPath: string, plugins?: string[]): Promise<void>;
    /**
     * Sync web assets to native project
     */
    syncProject(projectPath: string): Promise<void>;
    /**
     * Create basic project directory structure
     */
    private createProjectStructure;
    /**
     * Generate package.json for the Capacitor project
     */
    private generatePackageJson;
    /**
     * Copy web assets to the project www directory
     */
    private copyWebAssets;
    /**
     * Recursively copy directory contents
     */
    private copyDirectory;
    /**
     * Process application resources (icons and splash screens)
     */
    private processResources;
}
//# sourceMappingURL=CapacitorProjectInitializer.d.ts.map