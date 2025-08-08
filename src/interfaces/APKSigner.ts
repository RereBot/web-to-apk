import { KeystoreConfig } from '../types/index.js';

/**
 * Interface for APK signing functionality
 */
export interface APKSigner {
  /**
   * Sign an APK with the provided keystore configuration
   * @param apkPath Path to the unsigned APK file
   * @param keystoreConfig Keystore configuration for signing
   * @returns Path to the signed APK file
   */
  signAPK(apkPath: string, keystoreConfig: KeystoreConfig): Promise<string>;

  /**
   * Sign an APK with debug keystore (for development)
   * @param apkPath Path to the unsigned APK file
   * @returns Path to the signed APK file
   */
  signAPKWithDebugKeystore(apkPath: string): Promise<string>;

  /**
   * Verify if an APK is properly signed
   * @param apkPath Path to the APK file to verify
   * @returns True if the APK is properly signed
   */
  verifyAPKSignature(apkPath: string): Promise<boolean>;

  /**
   * Generate a debug keystore if it doesn't exist
   * @param keystorePath Path where the debug keystore should be created
   * @returns Path to the created keystore
   */
  generateDebugKeystore(keystorePath: string): Promise<string>;

  /**
   * Validate keystore configuration
   * @param keystoreConfig Keystore configuration to validate
   * @returns True if the configuration is valid
   */
  validateKeystoreConfig(keystoreConfig: KeystoreConfig): Promise<boolean>;
}

/**
 * Configuration for debug keystore generation
 */
export interface DebugKeystoreConfig {
  path: string;
  password: string;
  alias: string;
  aliasPassword: string;
  dname: string;
  validity: number; // days
}

/**
 * Result of APK signing operation
 */
export interface SigningResult {
  success: boolean;
  signedApkPath: string;
  originalApkPath: string;
  keystoreUsed: string;
  signingTime: number; // milliseconds
  error?: string;
}
