// Global variables
let currentBuildId = null;
let statusCheckInterval = null;
let currentLanguage = 'en';
let translations = {};

// Script initialization

// DOM elements - will be initialized after DOM loads
let buildForm, buildButton, buildStatus, buildResult, fileUploadArea, fileInput, filePreview, previewImage, removeFileButton;

// Keystore upload DOM elements - will be initialized after DOM loads
let keystoreUploadArea, keystoreInput, keystorePreview, keystoreFileName, removeKeystoreButton;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {

    
    // Initialize DOM elements
    buildForm = document.getElementById('buildForm');
    buildButton = document.getElementById('buildButton');
    buildStatus = document.getElementById('buildStatus');
    buildResult = document.getElementById('buildResult');
    fileUploadArea = document.getElementById('fileUploadArea');
    fileInput = document.getElementById('icon');
    filePreview = document.getElementById('filePreview');
    previewImage = document.getElementById('previewImage');
    removeFileButton = document.getElementById('removeFile');
    
    console.log('DOM elements initialized');
    
    initializeI18n();
    initializeFileUpload();
    initializeKeystoreUpload();
    initializeReleaseOptions();
    initializeForm();
    initializePackageNameValidation();
    initializePackageNameAutoGeneration();
    initializeEnhancedColorInput();
    initializeErrorStylingClearance();
    
    // --- Modal Event Listeners ---
    const helpLink = document.getElementById('help-link');
    const aboutLink = document.getElementById('about-link');
    const helpModalCloseBtn = document.getElementById('help-modal-close-btn');
    const aboutModalCloseBtn = document.getElementById('about-modal-close-btn');
    
    if (helpLink) {
        helpLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            showHelp();
        });
    }
    
    if (aboutLink) {
        aboutLink.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default link behavior
            showAbout();
        });
    }
    
    if (helpModalCloseBtn) {
        helpModalCloseBtn.addEventListener('click', (event) => {
            event.preventDefault();
            closeModal('helpModal');
        });
    }
    
    if (aboutModalCloseBtn) {
        aboutModalCloseBtn.addEventListener('click', (event) => {
            event.preventDefault();
            closeModal('aboutModal');
        });
    }
    

});

// File upload functionality
function initializeFileUpload() {
    // Click to upload
    fileUploadArea.addEventListener('click', function(e) {
        if (e.target !== removeFileButton) {
            fileInput.click();
        }
    });

    // File input change
    fileInput.addEventListener('change', handleFileSelect);

    // Remove file button
    removeFileButton.addEventListener('click', function(e) {
        e.stopPropagation();
        clearFileSelection();
    });

    // Drag and drop
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (isValidImageFile(file)) {
                fileInput.files = files;
                handleFileSelect();
            } else {
                showError(t('errorInvalidImageFile', 'Please select a valid image file (PNG, JPG, GIF, WebP)'));
            }
        }
    });
}

// Handle file selection
function handleFileSelect() {
    const file = fileInput.files[0];
    if (file) {
        if (isValidImageFile(file)) {
            if (file.size > 5 * 1024 * 1024) {
                showError(t('errorFileTooLarge', 'File size must be less than 5MB'));
                clearFileSelection();
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                filePreview.style.display = 'block';
                fileUploadArea.querySelector('.file-upload-content').style.display = 'none';
            };
            reader.readAsDataURL(file);
        } else {
            showError(t('errorInvalidImageFile', 'Please select a valid image file (PNG, JPG, GIF, WebP)'));
            clearFileSelection();
        }
    }
}

// Clear file selection
function clearFileSelection() {
    fileInput.value = '';
    filePreview.style.display = 'none';
    fileUploadArea.querySelector('.file-upload-content').style.display = 'block';
}

// Validate image file
function isValidImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(file.type);
}

// Initialize release options
function initializeReleaseOptions() {
    const isReleaseCheckbox = document.getElementById('isRelease');
    const releaseOptionsForm = document.getElementById('release-options-form');
    
    isReleaseCheckbox.addEventListener('change', function() {
        if (this.checked) {
            releaseOptionsForm.style.display = 'block';
            // Make release fields required
            keystoreInput.required = true;
            document.getElementById('keystorePassword').required = true;
            document.getElementById('keyAlias').required = true;
        } else {
            releaseOptionsForm.style.display = 'none';
            // Remove required attribute
            keystoreInput.required = false;
            document.getElementById('keystorePassword').required = false;
            document.getElementById('keyAlias').required = false;
        }
    });
}

// Initialize keystore file upload
function initializeKeystoreUpload() {
    keystoreUploadArea = document.getElementById('keystoreUploadArea');
    keystoreInput = document.getElementById('keystoreFile');
    keystorePreview = document.getElementById('keystorePreview');
    keystoreFileName = document.getElementById('keystoreFileName');
    removeKeystoreButton = document.getElementById('removeKeystore');

    // Click to upload
    keystoreUploadArea.addEventListener('click', function(e) {
        if (e.target !== removeKeystoreButton) {
            keystoreInput.click();
        }
    });

    // File input change
    keystoreInput.addEventListener('change', handleKeystoreSelect);

    // Remove file button
    removeKeystoreButton.addEventListener('click', function(e) {
        e.stopPropagation();
        clearKeystoreSelection();
    });

    // Drag and drop
    keystoreUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        keystoreUploadArea.classList.add('dragover');
    });

    keystoreUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        keystoreUploadArea.classList.remove('dragover');
    });

    keystoreUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        keystoreUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (isValidKeystoreFile(file)) {
                keystoreInput.files = files;
                handleKeystoreSelect();
            } else {
                showError(t('errorInvalidKeystoreFile', 'Please select a valid keystore file (.keystore or .jks)'));
            }
        }
    });
}

// Handle keystore file selection
function handleKeystoreSelect() {
    const file = keystoreInput.files[0];
    if (file) {
        if (isValidKeystoreFile(file)) {
            keystoreFileName.textContent = file.name;
            keystorePreview.style.display = 'block';
            keystoreUploadArea.querySelector('.file-upload-content').style.display = 'none';
            
            // Show success message
            showSimpleSuccess(`Keystore file "${file.name}" selected successfully`);
            console.log('Keystore file selected:', file.name, 'Size:', file.size, 'bytes');
        } else {
            showError(t('errorInvalidKeystoreFile', 'Please select a valid keystore file (.keystore or .jks)'));
            clearKeystoreSelection();
        }
    }
}

// Clear keystore selection
function clearKeystoreSelection() {
    keystoreInput.value = '';
    keystorePreview.style.display = 'none';
    keystoreUploadArea.querySelector('.file-upload-content').style.display = 'block';
}

// Validate keystore file
function isValidKeystoreFile(file) {
    const allowedExtensions = ['.keystore', '.jks'];
    const fileName = file.name.toLowerCase();
    return allowedExtensions.some(ext => fileName.endsWith(ext));
}

// Initialize form
function initializeForm() {
    buildForm.addEventListener('submit', handleFormSubmit);
    
    // Build another button
    document.getElementById('buildAnother').addEventListener('click', function() {
        resetForm();
    });
    
    // Try again button
    document.getElementById('tryAgain').addEventListener('click', function() {
        showForm();
    });
}

// Package name validation
function initializePackageNameValidation() {
    const packageNameInput = document.getElementById('packageName');
    
    // Keep format validation logic only, remove App Name linkage
    packageNameInput.addEventListener('input', function() {
        const value = this.value;
        const isValid = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(value);
        
        if (value && !isValid) {
            this.setCustomValidity('Package name must be in format com.example.app (lowercase, dots to separate)');
        } else {
            this.setCustomValidity('');
        }
    });
}

// Package name auto-generation from URL
function initializePackageNameAutoGeneration() {
    const websiteUrlInput = document.getElementById('websiteUrl');
    const packageNameInput = document.getElementById('packageName');
    let userHasModifiedPackageName = false;

    // Listen for manual package name modifications
    packageNameInput.addEventListener('input', function() {
        if (this.value.trim() !== '') {
            userHasModifiedPackageName = true;
        }
    });

    // Listen to blur event, trigger only after user completes input
    websiteUrlInput.addEventListener('blur', function() {
        // Auto-generate only when user hasn't manually modified package name and URL is entered
        if (!userHasModifiedPackageName && this.value.trim() !== '') {
            const generatedPackageName = generatePackageNameFromUrl(this.value.trim());
            if (generatedPackageName) {
                packageNameInput.value = generatedPackageName;
                // Trigger validation
                packageNameInput.dispatchEvent(new Event('input'));
            }
        }
    });

    // Reset flag function (when user clears package name)
    packageNameInput.addEventListener('blur', function() {
        if (this.value.trim() === '') {
            userHasModifiedPackageName = false;
        }
    });
}

// Core function for URL to package name conversion
function generatePackageNameFromUrl(url) {
    try {
        // Normalize URL (add protocol if missing)
        let normalizedUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            normalizedUrl = 'https://' + url;
        }

        // Parse URL to get domain name
        const urlObj = new URL(normalizedUrl);
        let hostname = urlObj.hostname;

        // Remove www prefix
        hostname = hostname.replace(/^www\./, '');

        // Split domain by dots
        const parts = hostname.split('.');

        // Reverse domain parts
        const reversedParts = parts.reverse();

        // Convert to package name format (enhanced special character handling)
        const packageName = reversedParts
            .map(part => {
                // Remove non-alphanumeric characters, convert to lowercase, handle hyphens
                return part.replace(/[^a-zA-Z0-9-]/g, '')
                          .replace(/-/g, '') // Remove hyphens
                          .toLowerCase();
            })
            .filter(part => part.length > 0) // Remove empty parts
            .join('.');

        // Validate if generated package name meets Android specifications
        if (isValidPackageNameFormat(packageName)) {
            return packageName;
        }

        return null;
    } catch (error) {
        console.log('URL parsing failed:', error.message);
        return null;
    }
}

// Helper function to validate package name format
function isValidPackageNameFormat(packageName) {
    // Android package name specification: at least two parts, each part starts with a letter
    const parts = packageName.split('.');
    if (parts.length < 2) return false;

    return parts.every(part => {
        // Each part must start with a letter, contain only letters, numbers, underscores
        return /^[a-z][a-z0-9_]*$/.test(part) && part.length > 0;
    });
}

// Initialize error styling clearance on input
function initializeErrorStylingClearance() {
    // Add event listeners to clear error styling when user starts typing
    const inputFields = ['appName', 'packageName', 'version', 'keystorePassword', 'keyAlias'];
    
    inputFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                removeErrorStyling(fieldId);
            });
        }
    });
    
    // Clear keystore upload area error styling when file is selected
    if (keystoreInput) {
        keystoreInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                keystoreUploadArea.classList.remove('input-error');
            }
        });
    }
}

// Enhanced color input functionality - supports HEX and RGB formats
function initializeEnhancedColorInput() {
    const colorPicker = document.getElementById('statusBarColor');
    const colorTextInput = document.getElementById('statusBarColorText');
    
    if (!colorPicker || !colorTextInput) {
        console.log('Color input elements not found');
        return;
    }
    
    // Sync color picker to text input
    colorPicker.addEventListener('input', function() {
        colorTextInput.value = this.value.toUpperCase();
        colorTextInput.className = 'color-text-input valid';
    });
    
    // Handle color code input in text input box
    colorTextInput.addEventListener('input', function() {
        const inputValue = this.value.trim();
        
        // First check if it's hexadecimal format
        if (isValidHexColor(inputValue)) {
            // Directly set color picker value
            colorPicker.value = inputValue;
            this.className = 'color-text-input valid';
        } 
        // Then check if it's RGB format
        else if (isValidRgbColor(inputValue)) {
            // Convert RGB to HEX and set
            const hexColor = rgbToHex(inputValue);
            if (hexColor) {
                colorPicker.value = hexColor;
                this.className = 'color-text-input valid';
            }
        }
        // If neither format matches
        else if (inputValue !== '') {
            this.className = 'color-text-input invalid';
        }
        // Reset style when input is empty
        else {
            this.className = 'color-text-input';
        }
    });
    
    // Initialize text input value
    colorTextInput.value = colorPicker.value.toUpperCase();
    colorTextInput.className = 'color-text-input valid';
}

// Validate hexadecimal color format
function isValidHexColor(color) {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// Validate RGB color format
function isValidRgbColor(color) {
    const rgbRegex = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
    const match = color.match(rgbRegex);
    
    if (!match) return false;
    
    // Validate RGB value range (0-255)
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
}

// Convert RGB to HEX
function rgbToHex(rgbString) {
    const rgbRegex = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
    const match = rgbString.match(rgbRegex);
    
    if (!match) return null;
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    // Convert to hexadecimal
    const toHex = (n) => {
        const hex = n.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const formData = new FormData(buildForm);
    
    // Add language environment to request
    const currentLang = document.documentElement.lang || 'en';
    formData.append('lang', currentLang);
    
    // Ensure correct status bar color is captured (prioritize text input over color picker)
    const statusBarColorText = document.getElementById('statusBarColorText').value.trim();
    const statusBarColorPicker = document.getElementById('statusBarColor').value.trim();
    const finalStatusBarColor = statusBarColorText || statusBarColorPicker;
    
    // Override the FormData with the correct color value
    formData.set('statusBarColor', finalStatusBarColor);
    
    // Determine which API endpoint to use based on release build checkbox
    const isRelease = document.getElementById('isRelease').checked;
    const apiEndpoint = isRelease ? '/api/build-release' : '/api/build';
    
    try {
        showBuilding();
        
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            body: formData
        });
        
        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 200)}`);
        }
        
        const result = await response.json();
        
        if (response.ok) {
            currentBuildId = result.buildId;
            startStatusCheck();
        } else {
            throw new Error(result.error || 'Build request failed');
        }
        
    } catch (error) {
        console.error('Build error:', error);
        showError(error.message);
    }
}

// Helper functions for error styling
function clearAllErrorStyling() {
    const inputs = document.querySelectorAll('input, .file-upload-area');
    inputs.forEach(input => {
        input.classList.remove('input-error');
    });
}

function addErrorStyling(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('input-error');
    }
}

function removeErrorStyling(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('input-error');
    }
}

// Validate form
function validateForm() {
    // Clear all previous error styling
    clearAllErrorStyling();
    
    const appName = document.getElementById('appName').value.trim();
    const packageName = document.getElementById('packageName').value.trim();
    const version = document.getElementById('version').value.trim();
    const isRelease = document.getElementById('isRelease').checked;
    
    let hasErrors = false;
    
    // Validate app name
    if (!appName) {
        addErrorStyling('appName');
        showError(t('errorAppNameRequired', 'App name is required'));
        hasErrors = true;
    }
    
    // Validate package name
    if (!packageName) {
        addErrorStyling('packageName');
        showError(t('errorPackageNameRequired', 'Package name is required'));
        hasErrors = true;
    } else if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(packageName)) {
        addErrorStyling('packageName');
        showError(t('errorInvalidPackageName', 'Invalid package name format. Use format like com.example.app'));
        hasErrors = true;
    }
    
    // Validate version
    if (!version) {
        addErrorStyling('version');
        showError(t('errorVersionRequired', 'Version is required'));
        hasErrors = true;
    } else if (!/^\d+\.\d+\.\d+$/.test(version)) {
        addErrorStyling('version');
        showError(t('errorInvalidVersion', 'Version must be in format X.Y.Z (e.g., 1.0.0)'));
        hasErrors = true;
    }
    
    if (hasErrors) {
        return false;
    }
    
    const statusBarColor = document.getElementById('statusBarColor').value.trim();
    const statusBarColorText = document.getElementById('statusBarColorText').value.trim();
    
    // Validate color format (prioritize text input value for validation)
    const colorToValidate = statusBarColorText || statusBarColor;
    if (!colorToValidate || (!isValidHexColor(colorToValidate) && !isValidRgbColor(colorToValidate))) {
        showError(t('errorInvalidStatusBarColor', 'Invalid status bar color format. Use HEX (#FF0000) or RGB (rgb(255,0,0)) format.'));
        return false;
    }
    
    // Validate release build requirements
    if (isRelease) {
        const keystoreFile = keystoreInput.files[0];
        const keystorePassword = document.getElementById('keystorePassword').value.trim();
        const keyAlias = document.getElementById('keyAlias').value.trim();
        
        if (!keystoreFile) {
            keystoreUploadArea.classList.add('input-error');
            showError(t('errorKeystoreFileRequired', 'Keystore file is required for release builds'));
            return false;
        }
        
        if (!keystorePassword) {
            addErrorStyling('keystorePassword');
            showError(t('errorKeystorePasswordRequired', 'Keystore password is required for release builds'));
            return false;
        }
        
        if (!keyAlias) {
            addErrorStyling('keyAlias');
            showError(t('errorKeyAliasRequired', 'Key alias is required for release builds'));
            return false;
        }
    }
    
    return true;
}

// Start status checking
function startStatusCheck() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
    
    // Optimized polling interval: 5 seconds to reduce server requests
    statusCheckInterval = setInterval(checkBuildStatus, 5000);
    checkBuildStatus(); // Check immediately
}

// Check build status
async function checkBuildStatus() {
    if (!currentBuildId) return;
    
    try {
        const response = await fetch(`/api/build-status/${currentBuildId}`);
        
        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 200)}`);
        }
        
        const result = await response.json();
        console.log('Build status result:', result);
        
        if (response.ok) {
            if (result.status === 'success') {
                clearInterval(statusCheckInterval);
                showSuccess(result);
            } else if (result.status === 'error') {
                clearInterval(statusCheckInterval);
                showError(result.error);
            } else if (result.status === 'building') {
                // Update progress bar and status message
                const message = result.messageKey ? t(result.messageKey, 'Building...') : (result.message || t('buildingText', 'Building...'));
                updateBuildProgress(result.progress || 0, message);
            }
            // Continue checking for building status
        } else {
            throw new Error(result.error || 'Status check failed');
        }
        
    } catch (error) {
        console.error('Status check error:', error);
        clearInterval(statusCheckInterval);
        showError(t('errorBuildStatusCheck', 'Failed to check build status: ') + error.message);
    }
}

// Update build progress
function updateBuildProgress(progress, message) {
    // Update progress bar
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const statusMessage = document.querySelector('.status-message');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${progress}%`;
    }
    
    if (statusMessage) {
        statusMessage.textContent = message;
    }
    
    console.log(`Progress: ${progress}% - ${message}`);
}

// Show building state
function showBuilding() {
    buildForm.style.display = 'none';
    buildResult.style.display = 'none';
    buildStatus.style.display = 'block';
    
    // Initialize progress bar with 8% and initialization message
    updateBuildProgress(8, t('initializingText', 'Initializing...'));
    
    // Update button state
    const btnText = buildButton.querySelector('.btn-text');
    const btnSpinner = buildButton.querySelector('.btn-spinner');
    btnText.style.display = 'none';
    btnSpinner.style.display = 'flex';
    buildButton.disabled = true;
}

// Format build time with robust error handling
function formatBuildTime(buildTime) {
    try {
        // Handle null, undefined, or empty values
        if (!buildTime) {
            return 'Build time unavailable';
        }
        
        // Create date object
        const date = new Date(buildTime);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date received:', buildTime);
            return 'Invalid date format';
        }
        
        // Format date in local format (YYYY-MM-DD HH:mm:ss)
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        return date.toLocaleString('en-CA', options).replace(',', '');
        
    } catch (error) {
        console.error('Error formatting build time:', error, 'Input:', buildTime);
        return 'Date formatting error';
    }
}

// Show simple success message (for file uploads, etc.)
function showSimpleSuccess(message) {
    // Create or update a temporary success notification
    let notification = document.getElementById('tempSuccessNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'tempSuccessNotification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            z-index: 1000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (notification) {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (notification && notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

// Show success result
function showSuccess(result) {
    buildStatus.style.display = 'none';
    buildResult.style.display = 'block';
    
    document.getElementById('resultSuccess').style.display = 'block';
    document.getElementById('resultError').style.display = 'none';
    
    // Update result information
    document.getElementById('resultAppName').textContent = result.config.appName;
    document.getElementById('resultPackage').textContent = result.config.packageName;
    document.getElementById('resultVersion').textContent = result.config.version;
    document.getElementById('resultBuildTime').textContent = formatBuildTime(result.buildTime);
    
    // Set download link
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = result.downloadUrl;
    downloadLink.download = `${result.config.appName.replace(/[^a-zA-Z0-9]/g, '_')}_${result.config.version}.apk`;
}

// Show error
function showError(message) {
    if (buildStatus.style.display === 'block') {
        buildStatus.style.display = 'none';
        buildResult.style.display = 'block';
        
        document.getElementById('resultSuccess').style.display = 'none';
        document.getElementById('resultError').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    } else {
        alert(t('errorPrefix', 'Error: ') + message);
    }
    
    // Reset button state
    const btnText = buildButton.querySelector('.btn-text');
    const btnSpinner = buildButton.querySelector('.btn-spinner');
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    buildButton.disabled = false;
}

// Show form
function showForm() {
    buildForm.style.display = 'block';
    buildStatus.style.display = 'none';
    buildResult.style.display = 'none';
    
    // Reset button state
    const btnText = buildButton.querySelector('.btn-text');
    const btnSpinner = buildButton.querySelector('.btn-spinner');
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    buildButton.disabled = false;
}

// Reset form
function resetForm() {
    buildForm.reset();
    clearFileSelection();
    clearKeystoreSelection();
    document.getElementById('release-options-form').style.display = 'none';
    showForm();
    currentBuildId = null;
    
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
}

// Modal functions
function showHelp() {
    console.log('showHelp function called');
    const modal = document.getElementById('helpModal');
    if (modal) {
        console.log('Help modal found, displaying...');
        modal.style.display = 'flex';
    } else {
        console.error('Help modal not found!');
    }
}

function showAbout() {
    console.log('showAbout function called');
    const modal = document.getElementById('aboutModal');
    if (modal) {
        console.log('About modal found, displaying...');
        modal.style.display = 'flex';
    } else {
        console.error('About modal not found!');
    }
}

function closeModal(modalId) {
    console.log('closeModal function called with:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        console.log('Modal found, closing...');
        modal.style.display = 'none';
    } else {
        console.error('Modal not found:', modalId);
    }
}

// Make modal functions globally available immediately
window.showHelp = showHelp;
window.showAbout = showAbout;
window.closeModal = closeModal;

// Also ensure they're available after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.showHelp = showHelp;
    window.showAbout = showAbout;
    window.closeModal = closeModal;
    
    console.log('Modal functions attached to window object');
    console.log('window.showHelp:', typeof window.showHelp);
    console.log('window.showAbout:', typeof window.showAbout);
    console.log('window.closeModal:', typeof window.closeModal);
});

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
});

// ==========================================
// Internationalization (i18n) Functions
// ==========================================

/**
 * Initialize internationalization
 */
function initializeI18n() {
    // Get saved language preference or default to English
    const savedLanguage = localStorage.getItem('webToApkLanguage') || 'en';
    
    // Initialize language switcher buttons
    initializeLanguageSwitcher();
    
    // Load and apply the saved language
    setLanguage(savedLanguage);
}

/**
 * Initialize language switcher
 */
function initializeLanguageSwitcher() {
    const langLinks = document.querySelectorAll('.lang-link');
    
    // Handle language selection
    langLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const language = this.getAttribute('data-lang');
            setLanguage(language);
        });
    });
}

/**
 * Load translations for a specific language
 * @param {string} language - Language code ('en' or 'zh')
 * @returns {Promise<Object>} - Promise that resolves to translations object
 */
async function loadTranslations(language) {
    try {
        const response = await fetch(`/locales/${language}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load translations for ${language}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to English if loading fails
        if (language !== 'en') {
            return await loadTranslations('en');
        }
        return {};
    }
}

/**
 * Apply translations to the page
 */
function applyTranslations() {
    // Update text content for elements with data-i18n-key
    const elements = document.querySelectorAll('[data-i18n-key]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n-key');
        if (translations[key]) {
            // Handle different element types
            if (element.tagName === 'TITLE') {
                document.title = translations[key];
            } else if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'url' || element.type === 'password')) {
                // Don't change the text content of input elements, only their value if empty
                if (!element.value && element.hasAttribute('data-i18n-value')) {
                    element.value = translations[key];
                }
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translations[key];
            } else {
                element.textContent = translations[key];
            }
        }
    });
    
    // Update placeholder attributes
    const placeholderElements = document.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[key]) {
            element.placeholder = translations[key];
        }
    });
    
    // Update page language attribute
    document.documentElement.lang = currentLanguage;
}

/**
 * Set the current language and apply translations
 * @param {string} language - Language code ('en' or 'zh')
 */
async function setLanguage(language) {
    try {
        // Load translations for the selected language
        translations = await loadTranslations(language);
        currentLanguage = language;
        
        // Apply translations to the page
        applyTranslations();
        
        // Update language switcher buttons
        updateLanguageSwitcher(language);
        
        // Save language preference
        localStorage.setItem('webToApkLanguage', language);
        
        console.log(`Language switched to: ${language}`);
    } catch (error) {
        console.error('Error setting language:', error);
    }
}

/**
 * Update language switcher states
 * @param {string} activeLanguage - Currently active language
 */
function updateLanguageSwitcher(activeLanguage) {
    const langLinks = document.querySelectorAll('.lang-link');
    
    // Update language link states
    langLinks.forEach(link => {
        const linkLang = link.getAttribute('data-lang');
        if (linkLang === activeLanguage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * Get translated text for a given key
 * @param {string} key - Translation key
 * @param {string} fallback - Fallback text if translation not found
 * @returns {string} - Translated text or fallback
 */
function t(key, fallback = '') {
    return translations[key] || fallback;
}

/**
 * Update dynamic content with translations
 * This function can be called when content is dynamically generated
 */
function updateDynamicTranslations() {
    applyTranslations();
}

// Export functions for use in other parts of the application
window.i18n = {
    setLanguage,
    t,
    updateDynamicTranslations,
    getCurrentLanguage: () => currentLanguage
};