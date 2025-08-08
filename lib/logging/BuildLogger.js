/**
 * Build process dedicated logger
 */
import { getLogger } from './Logger.js';
export class BuildLogger {
    constructor(buildId, logger) {
        this.steps = new Map();
        this.logger = logger || getLogger();
        this.buildId = buildId || this.generateBuildId();
        this.buildStartTime = new Date();
        this.logger.info('Build started', 'BUILD', {
            buildId: this.buildId,
            startTime: this.buildStartTime.toISOString()
        });
    }
    /**
     * Start a build step
     */
    startStep(stepName, metadata) {
        const step = {
            name: stepName,
            startTime: new Date(),
            status: 'running',
            metadata
        };
        this.steps.set(stepName, step);
        this.logger.info(`Starting step: ${stepName}`, 'BUILD_STEP', {
            buildId: this.buildId,
            stepName,
            startTime: step.startTime.toISOString(),
            ...metadata
        });
    }
    /**
     * Complete a build step
     */
    completeStep(stepName, metadata) {
        const step = this.steps.get(stepName);
        if (!step) {
            this.logger.warn(`Attempting to complete unknown step: ${stepName}`, 'BUILD_STEP');
            return;
        }
        step.endTime = new Date();
        step.status = 'completed';
        step.metadata = { ...step.metadata, ...metadata };
        const duration = step.endTime.getTime() - step.startTime.getTime();
        this.logger.info(`Completed step: ${stepName} (${duration}ms)`, 'BUILD_STEP', {
            buildId: this.buildId,
            stepName,
            duration,
            startTime: step.startTime.toISOString(),
            endTime: step.endTime.toISOString(),
            ...step.metadata
        });
    }
    /**
     * Mark step as failed
     */
    failStep(stepName, error, metadata) {
        const step = this.steps.get(stepName);
        if (!step) {
            this.logger.warn(`Attempting to mark unknown step as failed: ${stepName}`, 'BUILD_STEP');
            return;
        }
        step.endTime = new Date();
        step.status = 'failed';
        step.error = error;
        step.metadata = { ...step.metadata, ...metadata };
        const duration = step.endTime.getTime() - step.startTime.getTime();
        this.logger.error(`Step failed: ${stepName} (${duration}ms) - ${error.message}`, 'BUILD_STEP', {
            buildId: this.buildId,
            stepName,
            duration,
            error: error.message,
            stack: error.stack,
            startTime: step.startTime.toISOString(),
            endTime: step.endTime.toISOString(),
            ...step.metadata
        });
    }
    /**
     * Log build progress
     */
    logProgress(message, progress, metadata) {
        this.logger.info(message, 'BUILD_PROGRESS', {
            buildId: this.buildId,
            progress,
            ...metadata
        });
    }
    /**
     * Log build warning
     */
    logWarning(message, metadata) {
        this.logger.warn(message, 'BUILD_WARNING', {
            buildId: this.buildId,
            ...metadata
        });
    }
    /**
     * Log build error
     */
    logError(message, error, metadata) {
        this.logger.error(message, 'BUILD_ERROR', {
            buildId: this.buildId,
            error: error?.message,
            stack: error?.stack,
            ...metadata
        });
    }
    /**
     * Complete entire build
     */
    completeBuild(success, metadata) {
        const buildEndTime = new Date();
        const totalDuration = buildEndTime.getTime() - this.buildStartTime.getTime();
        const completedSteps = Array.from(this.steps.values()).filter(s => s.status === 'completed').length;
        const failedSteps = Array.from(this.steps.values()).filter(s => s.status === 'failed').length;
        const totalSteps = this.steps.size;
        const buildSummary = {
            buildId: this.buildId,
            success,
            totalDuration,
            totalSteps,
            completedSteps,
            failedSteps,
            startTime: this.buildStartTime.toISOString(),
            endTime: buildEndTime.toISOString(),
            ...metadata
        };
        if (success) {
            this.logger.info(`Build completed successfully (${totalDuration}ms)`, 'BUILD_COMPLETE', buildSummary);
        }
        else {
            this.logger.error(`Build failed (${totalDuration}ms)`, 'BUILD_FAILED', buildSummary);
        }
    }
    /**
     * Get build summary
     */
    getBuildSummary() {
        return {
            buildId: this.buildId,
            startTime: this.buildStartTime,
            steps: Array.from(this.steps.values()),
            totalDuration: new Date().getTime() - this.buildStartTime.getTime()
        };
    }
    generateBuildId() {
        return `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=BuildLogger.js.map