/**
 * Web-to-APK Converter
 * Main entry point for the library
 */

// Export all types
export * from './types/index.js';

// Export interfaces (excluding conflicting types)
export type { ResourceProcessor, ErrorHandler, VersionManager } from './interfaces/index.js';

export type { CLIOptions, InitOptions, ServeOptions } from './interfaces/index.js';

// Export APK builder implementations
export { APKBuilderImpl } from './apk/APKBuilder.js';
export { CapacitorProjectInitializerImpl } from './apk/CapacitorProjectInitializer.js';
export { APKSignerImpl } from './apk/APKSigner.js';

// Export configuration implementations
export { ConfigManager } from './config/ConfigManager.js';
export { ConfigParser } from './config/ConfigParser.js';
export { ConfigValidator } from './config/ConfigValidator.js';

// Export resource processing implementations
export { IconProcessor } from './resources/IconProcessor.js';
export { SplashScreenGenerator } from './resources/SplashScreenGenerator.js';
export { WebResourceCopier } from './resources/WebResourceCopier.js';
export { ResourceProcessorImpl } from './resources/ResourceProcessor.js';
