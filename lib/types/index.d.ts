/**
 * Core type definitions for Web-to-APK converter
 */
export interface AppConfig {
    appName: string;
    packageName: string;
    version: string;
    webDir: string;
    startUrl: string;
    icon?: string;
    splashScreen?: string;
    permissions: string[];
    orientation?: 'portrait' | 'landscape' | 'any';
    allowNavigation?: string[];
    plugins?: Record<string, any>;
}
export interface CapacitorConfig {
    appId: string;
    appName: string;
    webDir: string;
    server?: {
        url?: string;
        cleartext?: boolean;
    };
    plugins?: Record<string, any>;
}
export interface BuildOptions {
    release: boolean;
    keystore?: KeystoreConfig;
    outputDir: string;
    minifyWeb: boolean;
}
export interface KeystoreConfig {
    path: string;
    password: string;
    alias: string;
    aliasPassword: string;
}
export interface AndroidDevice {
    name: string;
    apiLevel: number;
    architecture: 'arm64-v8a' | 'armeabi-v7a' | 'x86_64';
}
export interface WebApp {
    name: string;
    path: string;
    entryPoint: string;
}
export interface TestEnvironment {
    androidSDKPath: string;
    testDevices: AndroidDevice[];
    sampleWebApps: WebApp[];
}
export type ErrorType = 'CONFIG' | 'RESOURCE' | 'BUILD' | 'SIGNING';
export interface IconSize {
    width: number;
    height: number;
    density: string;
    folder: string;
}
export interface IconProcessorOptions {
    inputPath: string;
    outputDir: string;
    generateAllSizes?: boolean;
}
export interface ProcessedIcon {
    size: IconSize;
    outputPath: string;
    success: boolean;
    error?: string;
}
export interface SplashScreenSize {
    width: number;
    height: number;
    density: string;
    folder: string;
    orientation: 'portrait' | 'landscape';
}
export interface SplashScreenOptions {
    inputPath: string;
    outputDir: string;
    backgroundColor?: string;
    generateAllSizes?: boolean;
    scaleMode?: 'contain' | 'cover' | 'fill';
    imageScale?: number;
    centerImage?: boolean;
}
export interface ProcessedSplashScreen {
    size: SplashScreenSize;
    outputPath: string;
    success: boolean;
    error?: string;
}
export interface CopyResult {
    success: boolean;
    copiedFiles: string[];
    errors: CopyError[];
    totalFiles: number;
    totalSize: number;
}
export interface CopyError {
    file: string;
    error: string;
}
export interface PathTransformOptions {
    baseUrl?: string;
    assetPrefix?: string;
    transformAbsolutePaths?: boolean;
}
export declare class WebToAPKError extends Error {
    type: ErrorType;
    message: string;
    details?: any | undefined;
    constructor(type: ErrorType, message: string, details?: any | undefined);
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    field: string;
    message: string;
    severity: 'error';
}
export interface ValidationWarning {
    field: string;
    message: string;
    severity: 'warning';
}
//# sourceMappingURL=index.d.ts.map