/**
 * CLI Factory - Creates CLIImpl instances with proper dependency injection
 */

import { CLIImpl } from './CLIImpl.js';
import { ConfigManager } from '../config/ConfigManager.js';
import { APKBuilderImpl } from '../apk/APKBuilder.js';
import { CLIErrorHandler } from './ErrorHandler.js';
import { ProjectTemplateManager } from './ProjectTemplateManager.js';

/**
 * Creates a CLIImpl instance with all dependencies properly injected
 */
export function createCLI(): CLIImpl {
  const errorHandler = new CLIErrorHandler();
  const configManager = new ConfigManager(errorHandler);
  const apkBuilder = new APKBuilderImpl();
  const templateManager = new ProjectTemplateManager();

  return new CLIImpl(configManager, apkBuilder, errorHandler, templateManager);
}
