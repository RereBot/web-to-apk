import { WebToAPKError } from '../types/index.js';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import * as os from 'os';
/**
 * Implementation of APK signing functionality using Android SDK tools
 */
export class APKSignerImpl {
    /**
     * Sign an APK with the provided keystore configuration
     */
    async signAPK(apkPath, keystoreConfig) {
        const startTime = Date.now();
        try {
            // Validate inputs
            await this.validateAPKPath(apkPath);
            await this.validateKeystoreConfig(keystoreConfig);
            // Generate signed APK path
            const signedApkPath = this.generateSignedAPKPath(apkPath);
            // Sign the APK using apksigner
            await this.executeAPKSigner(apkPath, signedApkPath, keystoreConfig);
            // Verify the signed APK
            const isValid = await this.verifyAPKSignature(signedApkPath);
            if (!isValid) {
                throw new WebToAPKError('SIGNING', 'APK signature verification failed after signing', {
                    apkPath,
                    signedApkPath,
                    keystoreConfig: { ...keystoreConfig, password: '***', aliasPassword: '***' }
                });
            }
            const signingTime = Date.now() - startTime;
            console.log(`APK signed successfully in ${signingTime}ms: ${signedApkPath}`);
            return signedApkPath;
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('SIGNING', `Failed to sign APK: ${error instanceof Error ? error.message : String(error)}`, { apkPath, keystoreConfig: { ...keystoreConfig, password: '***', aliasPassword: '***' } });
        }
    }
    /**
     * Sign an APK with debug keystore (for development)
     */
    async signAPKWithDebugKeystore(apkPath) {
        try {
            // Ensure debug keystore exists
            const debugKeystorePath = await this.ensureDebugKeystore();
            // Create keystore config for debug signing
            const debugKeystoreConfig = {
                path: debugKeystorePath,
                password: APKSignerImpl.DEBUG_KEYSTORE_CONFIG.password,
                alias: APKSignerImpl.DEBUG_KEYSTORE_CONFIG.alias,
                aliasPassword: APKSignerImpl.DEBUG_KEYSTORE_CONFIG.aliasPassword
            };
            console.log('Signing APK with debug keystore for development...');
            return await this.signAPK(apkPath, debugKeystoreConfig);
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('SIGNING', `Failed to sign APK with debug keystore: ${error instanceof Error ? error.message : String(error)}`, { apkPath });
        }
    }
    /**
     * Verify if an APK is properly signed
     */
    async verifyAPKSignature(apkPath) {
        try {
            await this.validateAPKPath(apkPath);
            return new Promise((resolve, reject) => {
                const apksignerPath = this.getAPKSignerPath();
                const args = ['verify', '--verbose', apkPath];
                console.log(`Verifying APK signature: ${apksignerPath} ${args.join(' ')}`);
                const verifyProcess = spawn(apksignerPath, args, {
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                let stdout = '';
                let stderr = '';
                verifyProcess.stdout?.on('data', (data) => {
                    stdout += data.toString();
                });
                verifyProcess.stderr?.on('data', (data) => {
                    stderr += data.toString();
                });
                verifyProcess.on('close', code => {
                    if (code === 0) {
                        console.log('APK signature verification successful');
                        resolve(true);
                    }
                    else {
                        console.warn(`APK signature verification failed with code ${code}`);
                        console.warn(`Verification output: ${stdout}`);
                        console.warn(`Verification errors: ${stderr}`);
                        resolve(false);
                    }
                });
                verifyProcess.on('error', error => {
                    reject(new WebToAPKError('SIGNING', `Failed to start APK signature verification: ${error.message}`, { apkPath, error: error.message }));
                });
            });
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('SIGNING', `APK signature verification error: ${error instanceof Error ? error.message : String(error)}`, { apkPath });
        }
    }
    /**
     * Generate a debug keystore if it doesn't exist
     */
    async generateDebugKeystore(keystorePath) {
        try {
            // Check if keystore already exists
            try {
                await fs.access(keystorePath);
                console.log(`Debug keystore already exists: ${keystorePath}`);
                return keystorePath;
            }
            catch {
                // Keystore doesn't exist, create it
            }
            // Ensure the directory exists
            const keystoreDir = path.dirname(keystorePath);
            await fs.mkdir(keystoreDir, { recursive: true });
            // Generate keystore using keytool
            await this.executeKeytool(keystorePath);
            // Verify the keystore was created
            await fs.access(keystorePath);
            console.log(`Debug keystore generated successfully: ${keystorePath}`);
            return keystorePath;
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('SIGNING', `Failed to generate debug keystore: ${error instanceof Error ? error.message : String(error)}`, { keystorePath });
        }
    }
    /**
     * Validate keystore configuration
     */
    async validateKeystoreConfig(keystoreConfig) {
        try {
            // Check required fields
            const requiredFields = [
                'path',
                'password',
                'alias',
                'aliasPassword'
            ];
            const missingFields = requiredFields.filter(field => !keystoreConfig[field]);
            if (missingFields.length > 0) {
                throw new WebToAPKError('SIGNING', `Missing required keystore configuration fields: ${missingFields.join(', ')}`, {
                    missingFields,
                    keystoreConfig: { ...keystoreConfig, password: '***', aliasPassword: '***' }
                });
            }
            // Check if keystore file exists
            try {
                await fs.access(keystoreConfig.path);
            }
            catch {
                throw new WebToAPKError('SIGNING', `Keystore file not found: ${keystoreConfig.path}`, {
                    keystorePath: keystoreConfig.path
                });
            }
            // Validate keystore file is readable
            const stats = await fs.stat(keystoreConfig.path);
            if (stats.size === 0) {
                throw new WebToAPKError('SIGNING', `Keystore file is empty: ${keystoreConfig.path}`, {
                    keystorePath: keystoreConfig.path,
                    size: stats.size
                });
            }
            return true;
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('SIGNING', `Keystore validation failed: ${error instanceof Error ? error.message : String(error)}`, { keystoreConfig: { ...keystoreConfig, password: '***', aliasPassword: '***' } });
        }
    }
    /**
     * Validate APK file path and accessibility
     */
    async validateAPKPath(apkPath) {
        try {
            await fs.access(apkPath);
            const stats = await fs.stat(apkPath);
            if (stats.size === 0) {
                throw new WebToAPKError('SIGNING', `APK file is empty: ${apkPath}`, {
                    apkPath,
                    size: stats.size
                });
            }
            if (!apkPath.toLowerCase().endsWith('.apk')) {
                throw new WebToAPKError('SIGNING', `Invalid APK file extension: ${apkPath}`, { apkPath });
            }
        }
        catch (error) {
            if (error instanceof WebToAPKError) {
                throw error;
            }
            throw new WebToAPKError('SIGNING', `APK file validation failed: ${error instanceof Error ? error.message : String(error)}`, { apkPath });
        }
    }
    /**
     * Generate path for signed APK file
     */
    generateSignedAPKPath(originalApkPath) {
        const dir = path.dirname(originalApkPath);
        const basename = path.basename(originalApkPath, '.apk');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return path.join(dir, `${basename}-signed-${timestamp}.apk`);
    }
    /**
     * Execute apksigner tool to sign the APK
     */
    async executeAPKSigner(inputApkPath, outputApkPath, keystoreConfig) {
        return new Promise((resolve, reject) => {
            const apksignerPath = this.getAPKSignerPath();
            const args = [
                'sign',
                '--ks',
                keystoreConfig.path,
                '--ks-key-alias',
                keystoreConfig.alias,
                '--ks-pass',
                `pass:${keystoreConfig.password}`,
                '--key-pass',
                `pass:${keystoreConfig.aliasPassword}`,
                '--out',
                outputApkPath,
                inputApkPath
            ];
            console.log(`Signing APK: ${apksignerPath} sign --ks [keystore] --ks-key-alias [alias] --out ${outputApkPath} ${inputApkPath}`);
            const signingProcess = spawn(apksignerPath, args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let stdout = '';
            let stderr = '';
            signingProcess.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            signingProcess.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            signingProcess.on('close', code => {
                if (code === 0) {
                    console.log('APK signing completed successfully');
                    resolve();
                }
                else {
                    const errorMessage = this.parseSigningError(stderr, stdout);
                    reject(new WebToAPKError('SIGNING', `APK signing failed with exit code ${code}: ${errorMessage}`, {
                        exitCode: code,
                        stdout: stdout.slice(-500),
                        stderr: stderr.slice(-500),
                        inputApkPath,
                        outputApkPath
                    }));
                }
            });
            signingProcess.on('error', error => {
                reject(new WebToAPKError('SIGNING', `Failed to start APK signing process: ${error.message}`, {
                    error: error.message,
                    apksignerPath
                }));
            });
        });
    }
    /**
     * Execute keytool to generate debug keystore
     */
    async executeKeytool(keystorePath) {
        return new Promise((resolve, reject) => {
            const keytoolPath = this.getKeytoolPath();
            const config = APKSignerImpl.DEBUG_KEYSTORE_CONFIG;
            const args = [
                '-genkeypair',
                '-v',
                '-keystore',
                keystorePath,
                '-alias',
                config.alias,
                '-keyalg',
                'RSA',
                '-keysize',
                '2048',
                '-validity',
                config.validity.toString(),
                '-storepass',
                config.password,
                '-keypass',
                config.aliasPassword,
                '-dname',
                config.dname
            ];
            console.log(`Generating debug keystore: ${keytoolPath} -genkeypair -keystore ${keystorePath}`);
            const keytoolProcess = spawn(keytoolPath, args, {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            let stdout = '';
            let stderr = '';
            keytoolProcess.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            keytoolProcess.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            keytoolProcess.on('close', code => {
                if (code === 0) {
                    console.log('Debug keystore generated successfully');
                    resolve();
                }
                else {
                    reject(new WebToAPKError('SIGNING', `Keystore generation failed with exit code ${code}: ${stderr || stdout}`, {
                        exitCode: code,
                        stdout: stdout.slice(-500),
                        stderr: stderr.slice(-500),
                        keystorePath
                    }));
                }
            });
            keytoolProcess.on('error', error => {
                reject(new WebToAPKError('SIGNING', `Failed to start keytool process: ${error.message}`, {
                    error: error.message,
                    keytoolPath
                }));
            });
        });
    }
    /**
     * Get the path to apksigner tool
     */
    getAPKSignerPath() {
        const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
        if (!androidHome) {
            throw new WebToAPKError('SIGNING', 'ANDROID_HOME or ANDROID_SDK_ROOT environment variable not set', { availableEnvVars: Object.keys(process.env).filter(key => key.includes('ANDROID')) });
        }
        const isWindows = process.platform === 'win32';
        const apksignerName = isWindows ? 'apksigner.bat' : 'apksigner';
        // Try different possible locations for apksigner
        const possiblePaths = [
            path.join(androidHome, 'build-tools'),
            path.join(androidHome, 'cmdline-tools', 'latest', 'bin'),
            path.join(androidHome, 'tools', 'bin')
        ];
        for (const basePath of possiblePaths) {
            try {
                // For build-tools, we need to find the latest version
                if (basePath.includes('build-tools')) {
                    const buildToolsVersions = readdirSync(basePath);
                    const latestVersion = buildToolsVersions.sort().reverse()[0];
                    const apksignerPath = path.join(basePath, latestVersion, apksignerName);
                    if (existsSync(apksignerPath)) {
                        return apksignerPath;
                    }
                }
                else {
                    const apksignerPath = path.join(basePath, apksignerName);
                    if (existsSync(apksignerPath)) {
                        return apksignerPath;
                    }
                }
            }
            catch {
                // Continue to next path
            }
        }
        throw new WebToAPKError('SIGNING', 'apksigner tool not found in Android SDK. Please ensure Android SDK build-tools are installed.', { androidHome, searchedPaths: possiblePaths });
    }
    /**
     * Get the path to keytool
     */
    getKeytoolPath() {
        const javaHome = process.env.JAVA_HOME;
        const isWindows = process.platform === 'win32';
        const keytoolName = isWindows ? 'keytool.exe' : 'keytool';
        // Try JAVA_HOME first
        if (javaHome) {
            const keytoolPath = path.join(javaHome, 'bin', keytoolName);
            if (existsSync(keytoolPath)) {
                return keytoolPath;
            }
        }
        // Fall back to system PATH
        return keytoolName;
    }
    /**
     * Ensure debug keystore exists, create if necessary
     */
    async ensureDebugKeystore() {
        const debugKeystorePath = APKSignerImpl.DEBUG_KEYSTORE_CONFIG.path;
        try {
            await fs.access(debugKeystorePath);
            return debugKeystorePath;
        }
        catch {
            // Debug keystore doesn't exist, generate it
            return await this.generateDebugKeystore(debugKeystorePath);
        }
    }
    /**
     * Parse signing error output to provide meaningful error messages
     */
    parseSigningError(stderr, stdout) {
        const combinedOutput = stderr + stdout;
        // Common signing error patterns
        const errorPatterns = [
            {
                pattern: /Keystore was tampered with, or password was incorrect/,
                message: 'Incorrect keystore password or corrupted keystore file'
            },
            {
                pattern: /Cannot recover key/,
                message: 'Incorrect key alias password'
            },
            {
                pattern: /Alias .* does not exist/,
                message: 'Key alias not found in keystore'
            },
            {
                pattern: /keystore password was incorrect/,
                message: 'Incorrect keystore password'
            },
            {
                pattern: /No such file or directory/,
                message: 'Keystore file not found'
            },
            {
                pattern: /Permission denied/,
                message: 'Permission denied accessing keystore or APK file'
            }
        ];
        for (const { pattern, message } of errorPatterns) {
            if (pattern.test(combinedOutput)) {
                return message;
            }
        }
        // Extract the first error line if no pattern matches
        const errorLines = combinedOutput
            .split('\n')
            .filter(line => line.includes('ERROR:') || line.includes('Exception:') || line.includes('Error:'));
        if (errorLines.length > 0) {
            return errorLines[0].trim();
        }
        return 'Unknown signing error occurred';
    }
}
APKSignerImpl.DEBUG_KEYSTORE_CONFIG = {
    path: path.join(os.homedir(), '.android', 'debug.keystore'),
    password: 'android',
    alias: 'androiddebugkey',
    aliasPassword: 'android',
    dname: 'CN=Android Debug,O=Android,C=US',
    validity: 10000
};
//# sourceMappingURL=APKSigner.js.map