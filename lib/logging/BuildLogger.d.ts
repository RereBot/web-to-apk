/**
 * Build process dedicated logger
 */
import type { Logger } from '../interfaces/Logger.js';
export interface BuildStep {
    name: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'completed' | 'failed';
    error?: Error;
    metadata?: Record<string, any> | undefined;
}
export declare class BuildLogger {
    private logger;
    private buildId;
    private steps;
    private buildStartTime;
    constructor(buildId?: string, logger?: Logger);
    /**
     * Start a build step
     */
    startStep(stepName: string, metadata?: Record<string, any>): void;
    /**
     * Complete a build step
     */
    completeStep(stepName: string, metadata?: Record<string, any>): void;
    /**
     * Mark step as failed
     */
    failStep(stepName: string, error: Error, metadata?: Record<string, any>): void;
    /**
     * Log build progress
     */
    logProgress(message: string, progress?: number, metadata?: Record<string, any>): void;
    /**
     * Log build warning
     */
    logWarning(message: string, metadata?: Record<string, any>): void;
    /**
     * Log build error
     */
    logError(message: string, error?: Error, metadata?: Record<string, any>): void;
    /**
     * Complete entire build
     */
    completeBuild(success: boolean, metadata?: Record<string, any>): void;
    /**
     * Get build summary
     */
    getBuildSummary(): {
        buildId: string;
        startTime: Date;
        steps: BuildStep[];
        totalDuration?: number;
    };
    private generateBuildId;
}
//# sourceMappingURL=BuildLogger.d.ts.map