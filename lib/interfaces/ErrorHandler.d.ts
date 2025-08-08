import { WebToAPKError } from '../types/index.js';
/**
 * Interface for error handling and user guidance
 */
export interface ErrorHandler {
    /**
     * Handle configuration-related errors
     */
    handleConfigError(error: WebToAPKError): void;
    /**
     * Handle build-related errors
     */
    handleBuildError(error: WebToAPKError): void;
    /**
     * Provide solution suggestions for the given error
     */
    provideSolution(error: WebToAPKError): string;
}
//# sourceMappingURL=ErrorHandler.d.ts.map