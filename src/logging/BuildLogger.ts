/**
 * Build process dedicated logger
 */

import type { Logger } from '../interfaces/Logger.js';
import { getLogger } from './Logger.js';

export interface BuildStep {
  name: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  error?: Error;
  metadata?: Record<string, any> | undefined;
}

export class BuildLogger {
  private logger: Logger;
  private buildId: string;
  private steps: Map<string, BuildStep> = new Map();
  private buildStartTime: Date;

  constructor(buildId?: string, logger?: Logger) {
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
  startStep(stepName: string, metadata?: Record<string, any>): void {
    const step: BuildStep = {
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
  completeStep(stepName: string, metadata?: Record<string, any>): void {
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
  failStep(stepName: string, error: Error, metadata?: Record<string, any>): void {
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
  logProgress(message: string, progress?: number, metadata?: Record<string, any>): void {
    this.logger.info(message, 'BUILD_PROGRESS', {
      buildId: this.buildId,
      progress,
      ...metadata
    });
  }

  /**
   * Log build warning
   */
  logWarning(message: string, metadata?: Record<string, any>): void {
    this.logger.warn(message, 'BUILD_WARNING', {
      buildId: this.buildId,
      ...metadata
    });
  }

  /**
   * Log build error
   */
  logError(message: string, error?: Error, metadata?: Record<string, any>): void {
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
  completeBuild(success: boolean, metadata?: Record<string, any>): void {
    const buildEndTime = new Date();
    const totalDuration = buildEndTime.getTime() - this.buildStartTime.getTime();

    const completedSteps = Array.from(this.steps.values()).filter(
      s => s.status === 'completed'
    ).length;
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
    } else {
      this.logger.error(`Build failed (${totalDuration}ms)`, 'BUILD_FAILED', buildSummary);
    }
  }

  /**
   * Get build summary
   */
  getBuildSummary(): {
    buildId: string;
    startTime: Date;
    steps: BuildStep[];
    totalDuration?: number;
  } {
    return {
      buildId: this.buildId,
      startTime: this.buildStartTime,
      steps: Array.from(this.steps.values()),
      totalDuration: new Date().getTime() - this.buildStartTime.getTime()
    };
  }

  private generateBuildId(): string {
    return `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
