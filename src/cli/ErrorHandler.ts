/**
 * CLI Error Handler Implementation
 */

import type { ErrorHandler } from '../interfaces/ErrorHandler.js';
import type { WebToAPKError } from '../types/index.js';

export class CLIErrorHandler implements ErrorHandler {
  private logLevel: 'error' | 'warn' | 'info' | 'debug' = 'info';

  constructor(logLevel?: 'error' | 'warn' | 'info' | 'debug') {
    if (logLevel) {
      this.logLevel = logLevel;
    }
  }

  handleConfigError(error: WebToAPKError): void {
    this.logError('Configuration error', error);
    this.provideSolutionForError(error);
  }

  handleBuildError(error: WebToAPKError): void {
    this.logError('Build error', error);
    this.provideSolutionForError(error);
  }

  private logError(prefix: string, error: WebToAPKError): void {
    console.error(`❌ ${prefix}: ${error.message}`);
    
    if (error.details && this.logLevel !== 'error') {
      console.error('Details:', JSON.stringify(error.details, null, 2));
    }

    // Log stack trace in debug mode
    if (this.logLevel === 'debug' && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  private provideSolutionForError(error: WebToAPKError): void {
    const solution = this.provideSolution(error);
    const troubleshooting = this.getTroubleshootingSteps(error);
    
    console.error('\n💡 Solution:', solution);
    
    if (troubleshooting.length > 0) {
      console.error('\nTroubleshooting tips:');
      troubleshooting.forEach((step, index) => {
        console.error(`  ${index + 1}. ${step}`);
      });
    }
  }

  provideSolution(error: WebToAPKError): string {
    switch (error.type) {
    case 'CONFIG':
      return this.getConfigSolution(error);
    case 'RESOURCE':
      return this.getResourceSolution(error);
    case 'BUILD':
      return this.getBuildSolution(error);
    case 'SIGNING':
      return this.getSigningSolution(error);
    default:
      return 'Please check error message and retry';
    }
  }

  private getConfigSolution(error: WebToAPKError): string {
    if (error.message.includes('package name')) {
      return 'Please use valid package name format, e.g. com.example.app';
    }
    if (error.message.includes('version')) {
      return 'Please use valid version format, e.g. 1.0.0';
    }
    return 'Please check configuration file format and required fields';
  }

  private getResourceSolution(error: WebToAPKError): string {
    if (error.message.includes('icon')) {
      return 'Please provide valid icon file (PNG, JPG, WebP format)';
    }
    if (error.message.includes('web directory')) {
      return 'Please ensure web directory exists and contains valid HTML files';
    }
    return 'Please ensure all resource files exist and are in correct format';
  }

  private getBuildSolution(error: WebToAPKError): string {
    if (error.message.includes('Android platform')) {
      return 'Please check Android SDK installation and environment variable configuration';
    }
    if (error.message.includes('JAVA_HOME')) {
      return 'Please set JAVA_HOME environment variable to JDK installation directory';
    }
    if (error.message.includes('ANDROID_SDK_ROOT') || error.message.includes('ANDROID_HOME')) {
      return 'Please set ANDROID_SDK_ROOT or ANDROID_HOME environment variable';
    }
    if (error.message.includes('memory')) {
      return 'Insufficient system memory, please increase available memory or close other applications';
    }
    return 'Please check build environment configuration';
  }

  private getSigningSolution(error: WebToAPKError): string {
    if (error.message.includes('keystore')) {
      return 'Please check keystore file path and format';
    }
    if (error.message.includes('password')) {
      return 'Please check keystore password and key password';
    }
    if (error.message.includes('alias')) {
      return 'Please check if key alias is correct';
    }
    return 'Please check APK signing configuration';
  }

  private getTroubleshootingSteps(error: WebToAPKError): string[] {
    const steps: string[] = [];

    switch (error.type) {
    case 'CONFIG':
      steps.push('Verify configuration file JSON format is correct');
      steps.push('Check all required fields are filled');
      steps.push('Confirm package name follows Android specifications');
      break;
    case 'RESOURCE':
      steps.push('Check file paths are correct');
      steps.push('Verify file formats are supported');
      steps.push('Confirm file permissions are correct');
      break;
    case 'BUILD':
      steps.push('Check Android SDK is properly installed');
      steps.push('Ensure all dependencies are installed');
      steps.push('Verify environment variable configuration');
      steps.push('Check network connection is available');
      if (error.message.includes('memory')) {
        steps.push('Free up system memory');
        steps.push('Close unnecessary applications');
        steps.push('Consider increasing virtual memory');
      }
      break;
    case 'SIGNING':
      steps.push('Verify keystore file exists');
      steps.push('Check keystore password is correct');
      steps.push('Confirm key alias exists');
      steps.push('验证密钥是否未过期');
      break;
    }

    return steps;
  }

  public setLogLevel(level: 'error' | 'warn' | 'info' | 'debug'): void {
    this.logLevel = level;
  }

  public formatErrorForJSON(error: any): string {
    if (!error) return 'Unknown error';
    
    const message = typeof error === 'string' ? error : error.message || error.toString();
    
    return message
      .replace(/[\r\n]+/g, ' ')  // Replace newlines with spaces
      .replace(/"/g, '\\"')      // Escape quotes
      .replace(/\t/g, ' ')       // Replace tabs with spaces
      .replace(/\\/g, '\\\\')    // Escape backslashes
      .trim();
  }
}
