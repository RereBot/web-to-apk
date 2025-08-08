/**
 * Web Server Error Handler
 * Provides unified error handling and formatting for the web server
 */

export class WebServerErrorHandler {
  constructor(logLevel = 'info') {
    this.logLevel = logLevel;
  }

  /**
   * Format error message for JSON safety
   */
  formatErrorForJSON(error) {
    if (!error) return 'Unknown error';
    
    const message = typeof error === 'string' ? error : error.message || error.toString();
    
    return message
      .replace(/[\r\n]+/g, ' ')  // Replace newlines with spaces
      .replace(/"/g, '\\"')      // Escape quotes
      .replace(/\t/g, ' ')       // Replace tabs with spaces
      .replace(/\\/g, '\\\\')    // Escape backslashes
      .trim();
  }

  /**
   * Categorize error based on message content
   */
  categorizeError(error) {
    const message = error.message || error.toString();
    
    if (message.includes('Android platform') || message.includes('cap add android')) {
      return 'ANDROID_PLATFORM';
    }
    if (message.includes('JAVA_HOME') || message.includes('java')) {
      return 'JAVA_ENVIRONMENT';
    }
    if (message.includes('ANDROID_SDK') || message.includes('sdkmanager')) {
      return 'ANDROID_SDK';
    }
    if (message.includes('memory')) {
      return 'MEMORY';
    }
    if (message.includes('keystore') || message.includes('signing')) {
      return 'SIGNING';
    }
    if (message.includes('network') || message.includes('timeout')) {
      return 'NETWORK';
    }
    if (message.includes('permission') || message.includes('access')) {
      return 'PERMISSION';
    }
    
    return 'GENERAL';
  }

  /**
   * Generate solution based on error category
   */
  generateSolution(errorCategory, error) {
    const solutions = {
      ANDROID_PLATFORM: 'Please check Android SDK installation and environment variable configuration',
      JAVA_ENVIRONMENT: 'Please ensure JAVA_HOME environment variable is correctly set',
      ANDROID_SDK: 'Please verify Android SDK installation and PATH configuration',
      MEMORY: 'Insufficient system memory, please free up memory or increase available memory',
      SIGNING: 'Please check keystore file and signing configuration',
      NETWORK: 'Please check network connection and firewall settings',
      PERMISSION: 'Please check file and directory permissions',
      GENERAL: 'Please review error details and retry'
    };

    return solutions[errorCategory] || solutions.GENERAL;
  }

  /**
   * Generate troubleshooting steps
   */
  generateTroubleshootingSteps(errorCategory) {
    const steps = {
      ANDROID_PLATFORM: [
        'Check if Android SDK is properly installed',
        'Ensure all dependencies are installed',
        'Verify configuration file format is correct',
        'Check if network connection is normal'
      ],
      JAVA_ENVIRONMENT: [
        'Verify Java JDK is installed',
        'Check JAVA_HOME environment variable',
        'Confirm Java version compatibility',
        'Restart terminal or container'
      ],
      ANDROID_SDK: [
        'Verify ANDROID_SDK_ROOT environment variable',
        'Check if SDK tools are in PATH',
        'Confirm SDK licenses are accepted',
        'Try reinstalling SDK tools'
      ],
      MEMORY: [
        'Close unnecessary applications',
        'Clean temporary files',
        'Increase virtual memory',
        'Consider upgrading hardware configuration'
      ],
      SIGNING: [
        'Verify keystore file path',
        'Check keystore password',
        'Confirm key alias is correct',
        'Verify key has not expired'
      ],
      NETWORK: [
        'Check network connection',
        'Verify firewall settings',
        'Try using proxy',
        'Check DNS configuration'
      ],
      PERMISSION: [
        'Check file permissions',
        'Verify directory access permissions',
        'Confirm user permissions',
        'Try running as administrator'
      ],
      GENERAL: [
        'Check error log details',
        'Verify system environment',
        'Try restarting service',
        'Check documentation or seek help'
      ]
    };

    return steps[errorCategory] || steps.GENERAL;
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(error, statusCode = 500) {
    const category = this.categorizeError(error);
    const cleanMessage = this.formatErrorForJSON(error.message || error.toString());
    const solution = this.generateSolution(category, error);
    const troubleshooting = this.generateTroubleshootingSteps(category);

    return {
      status: 'error',
      error: cleanMessage,
      category: category,
      solution: solution,
      troubleshooting: troubleshooting,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log error with appropriate level
   */
  logError(error, context = {}) {
    const category = this.categorizeError(error);
    const timestamp = new Date().toISOString();
    
    console.error(`[${timestamp}] Error (${category}):`, error.message || error);
    
    if (this.logLevel !== 'error' && Object.keys(context).length > 0) {
      console.error('Context:', JSON.stringify(context, null, 2));
    }

    if (this.logLevel === 'debug' && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Set log level
   */
  setLogLevel(level) {
    this.logLevel = level;
  }
}

// Create singleton instance
export const errorHandler = new WebServerErrorHandler();