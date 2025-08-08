/**
 * Backend internationalization messages
 * Used for user-facing messages returned to frontend
 */

const messages = {
  en: {
    // Build status messages
    buildSuccess: 'APK built successfully!',
    buildFailed: 'Build failed. Please try again.',
    buildInProgress: 'Build is already in progress',
    
    // Validation errors
    invalidAppName: 'App name is required and must be valid',
    invalidPackageName: 'Package name must follow Android naming conventions (e.g., com.example.app)',
    invalidVersion: 'Version must be in format X.Y.Z (e.g., 1.0.0)',
    invalidIcon: 'Icon file must be a valid image (PNG, JPG, GIF, WebP) under 5MB',
    invalidKeystore: 'Keystore file is required for release builds',
    invalidKeystorePassword: 'Keystore password is required for release builds',
    invalidKeyAlias: 'Key alias is required for release builds',
    
    // Build errors
    environmentError: 'Build environment is not properly configured',
    capacitorError: 'Failed to initialize Capacitor project',
    androidError: 'Android build process failed',
    gradleError: 'Gradle build failed',
    signingError: 'APK signing failed',
    
    // File errors
    fileUploadError: 'File upload failed',
    fileTooLarge: 'File size exceeds maximum limit',
    fileNotFound: 'Required file not found',
    fileUploadErrorSolution: 'Please check the uploaded file',
    fileUploadErrorTroubleshooting: 'Check the file format, Ensure the file is not corrupted, Re-select the file',
    endpointNotFoundSolution: 'Please check the API endpoint path',
    endpointNotFoundTroubleshooting: 'Check the URL spelling, Consult the API documentation, Confirm the endpoint exists',
    
    // General errors
    internalError: 'Internal server error occurred',
    networkError: 'Network connection error',
    timeoutError: 'Build process timed out',
    
    // Rate limiting
    rateLimitError: 'Too many requests from this IP, please try again later.',
    rateLimitSolution: 'Please try again later or contact administrator',
    rateLimitTroubleshooting: 'Wait 1 hour and retry, Check network connection, Contact technical support',
    
    // Validation solutions and troubleshooting
    appNameSolution: 'Please provide an application name',
    appNameTroubleshooting: 'Check app name field, Ensure name is not empty, Use a valid app name',
    packageNameSolution: 'Please use correct package name format, such as com.example.myapp',
    packageNameTroubleshooting: 'Use lowercase letters, Separate with dots, Avoid special characters, Ensure format is com.company.app',
    iconProcessingSolution: 'Please check icon file format and size',
    iconProcessingTroubleshooting: 'Use PNG, JPG or WebP format, Ensure file size is less than 5MB, Use square images, Check if image is corrupted',
    
    // Additional validation solutions
    iconGenerationSolution: 'Please upload custom icon or contact administrator',
    iconGenerationTroubleshooting: 'Upload custom icon file, Retry build, Contact technical support',
    buildInitiationSolution: 'Please retry or contact administrator',
    buildInitiationTroubleshooting: 'Check network connection, Retry build, Contact technical support',
    keystoreSolution: 'Please upload keystore file',
    keystoreTroubleshooting: 'Generate or obtain keystore file, Ensure file format is .keystore or .jks, Check if file is corrupted',
    keystorePasswordSolution: 'Please provide keystore password',
    keystorePasswordTroubleshooting: 'Check password field, Ensure password is correct, Contact keystore creator',
    keyAliasSolution: 'Please provide key alias',
    keyAliasTroubleshooting: 'Check alias in keystore, Use correct alias, Contact keystore creator',
    
    // File size error
    fileSizeSolution: 'Please use files smaller than 5MB',
    fileSizeTroubleshooting: 'Compress image files, Use smaller keystore files, Check file size'
  },
  
  zh: {
    // Build status messages
    buildSuccess: 'APK 构建成功！',
    buildFailed: '构建失败，请重试。',
    buildInProgress: '构建正在进行中',
    
    // Validation errors
    invalidAppName: '应用名称为必填项且必须有效',
    invalidPackageName: '包名必须遵循 Android 命名规范（例如：com.example.app）',
    invalidVersion: '版本号必须为 X.Y.Z 格式（例如：1.0.0）',
    invalidIcon: '图标文件必须是有效的图片（PNG、JPG、GIF、WebP）且小于 5MB',
    invalidKeystore: '发布版本构建需要密钥库文件',
    invalidKeystorePassword: '发布版本构建需要密钥库密码',
    invalidKeyAlias: '发布版本构建需要密钥别名',
    
    // Build errors
    environmentError: '构建环境配置不正确',
    capacitorError: '初始化 Capacitor 项目失败',
    androidError: 'Android 构建过程失败',
    gradleError: 'Gradle 构建失败',
    signingError: 'APK 签名失败',
    
    // File errors
    fileUploadError: '文件上传失败',
    fileTooLarge: '文件大小超过最大限制',
    fileNotFound: '找不到所需文件',
    fileUploadErrorSolution: '请检查上传的文件',
    fileUploadErrorTroubleshooting: '检查文件格式, 确保文件未损坏, 重新选择文件',
    endpointNotFoundSolution: '请检查 API 端点路径',
    endpointNotFoundTroubleshooting: '检查 URL 拼写, 查看 API 文档, 确认端点存在',
    
    // General errors
    internalError: '服务器内部错误',
    networkError: '网络连接错误',
    timeoutError: '构建过程超时',
    
    // Rate limiting
    rateLimitError: '来自此IP的请求过多，请稍后再试。',
    rateLimitSolution: '请稍后再试，或联系管理员',
    rateLimitTroubleshooting: '等待1小时后重试, 检查网络连接, 联系技术支持',
    
    // Validation solutions and troubleshooting
    appNameSolution: '请提供应用名称',
    appNameTroubleshooting: '检查应用名称字段, 确保名称不为空, 使用有效的应用名称',
    packageNameSolution: '请使用正确的包名格式，如 com.example.myapp',
    packageNameTroubleshooting: '使用小写字母, 用点号分隔, 避免使用特殊字符, 确保格式为 com.company.app',
    iconProcessingSolution: '请检查图标文件格式和大小',
    iconProcessingTroubleshooting: '使用 PNG、JPG 或 WebP 格式, 确保文件大小小于 5MB, 使用正方形图片, 检查图片是否损坏',
    
    // Additional validation solutions
    iconGenerationSolution: '请上传自定义图标或联系管理员',
    iconGenerationTroubleshooting: '上传自定义图标文件, 重试构建, 联系技术支持',
    buildInitiationSolution: '请重试或联系管理员',
    buildInitiationTroubleshooting: '检查网络连接, 重试构建, 联系技术支持',
    keystoreSolution: '请上传 keystore 文件',
    keystoreTroubleshooting: '生成或获取 keystore 文件, 确保文件格式为 .keystore 或 .jks, 检查文件是否损坏',
    keystorePasswordSolution: '请提供 keystore 密码',
    keystorePasswordTroubleshooting: '检查密码字段, 确保密码正确, 联系 keystore 创建者',
    keyAliasSolution: '请提供密钥别名',
    keyAliasTroubleshooting: '检查 keystore 中的别名, 使用正确的别名, 联系 keystore 创建者',
    
    // File size error
    fileSizeSolution: '请使用小于 5MB 的文件',
    fileSizeTroubleshooting: '压缩图片文件, 使用较小的 keystore 文件, 检查文件大小'
  }
};

/**
 * Get localized message
 * @param {string} key - Message key
 * @param {string} lang - Language code (en/zh)
 * @returns {string} Localized message
 */
const getMessage = (key, lang = 'en') => {
  const langMessages = messages[lang] || messages.en;
  return langMessages[key] || messages.en[key] || key;
};

export {
  messages,
  getMessage
};