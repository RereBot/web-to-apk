import { APKSigner } from '../interfaces/APKSigner.js';
import { KeystoreConfig } from '../types/index.js';
/**
 * Implementation of APK signing functionality using Android SDK tools
 */
export declare class APKSignerImpl implements APKSigner {
    private static readonly DEBUG_KEYSTORE_CONFIG;
    /**
     * Sign an APK with the provided keystore configuration
     */
    signAPK(apkPath: string, keystoreConfig: KeystoreConfig): Promise<string>;
    /**
     * Sign an APK with debug keystore (for development)
     */
    signAPKWithDebugKeystore(apkPath: string): Promise<string>;
    /**
     * Verify if an APK is properly signed
     */
    verifyAPKSignature(apkPath: string): Promise<boolean>;
    /**
     * Generate a debug keystore if it doesn't exist
     */
    generateDebugKeystore(keystorePath: string): Promise<string>;
    /**
     * Validate keystore configuration
     */
    validateKeystoreConfig(keystoreConfig: KeystoreConfig): Promise<boolean>;
    /**
     * Validate APK file path and accessibility
     */
    private validateAPKPath;
    /**
     * Generate path for signed APK file
     */
    private generateSignedAPKPath;
    /**
     * Execute apksigner tool to sign the APK
     */
    private executeAPKSigner;
    /**
     * Execute keytool to generate debug keystore
     */
    private executeKeytool;
    /**
     * Get the path to apksigner tool
     */
    private getAPKSignerPath;
    /**
     * Get the path to keytool
     */
    private getKeytoolPath;
    /**
     * Ensure debug keystore exists, create if necessary
     */
    private ensureDebugKeystore;
    /**
     * Parse signing error output to provide meaningful error messages
     */
    private parseSigningError;
}
//# sourceMappingURL=APKSigner.d.ts.map