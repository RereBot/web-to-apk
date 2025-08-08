/**
 * CLI Error Handler Implementation
 */
import type { ErrorHandler } from '../interfaces/ErrorHandler.js';
import type { WebToAPKError } from '../types/index.js';
export declare class CLIErrorHandler implements ErrorHandler {
    private logLevel;
    constructor(logLevel?: 'error' | 'warn' | 'info' | 'debug');
    handleConfigError(error: WebToAPKError): void;
    handleBuildError(error: WebToAPKError): void;
    private logError;
    private provideSolutionForError;
    provideSolution(error: WebToAPKError): string;
    private getConfigSolution;
    private getResourceSolution;
    private getBuildSolution;
    private getSigningSolution;
    private getTroubleshootingSteps;
    setLogLevel(level: 'error' | 'warn' | 'info' | 'debug'): void;
    formatErrorForJSON(error: any): string;
}
//# sourceMappingURL=ErrorHandler.d.ts.map