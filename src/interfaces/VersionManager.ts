/**
 * Interface for version management functionality
 */
export interface VersionManager {
  /**
   * Generate version code from version string
   */
  generateVersionCode(version: string): number;

  /**
   * Update Android manifest with version information
   */
  updateManifest(version: string, versionCode: number): void;

  /**
   * Create release notes from changes
   */
  createReleaseNotes(changes: string[]): string;
}
