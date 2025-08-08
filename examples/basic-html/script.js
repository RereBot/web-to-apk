// Basic HTML App JavaScript
// Web-to-APK Example

// DOM Elements
const counterElement = document.getElementById('counter');
const incrementBtn = document.getElementById('incrementBtn');
const decrementBtn = document.getElementById('decrementBtn');
const resetBtn = document.getElementById('resetBtn');
const userForm = document.getElementById('userForm');
const storageInput = document.getElementById('storageInput');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const clearBtn = document.getElementById('clearBtn');
const storageDisplay = document.getElementById('storageDisplay');
const platformInfo = document.getElementById('platformInfo');
const userAgent = document.getElementById('userAgent');
const aboutModal = document.getElementById('aboutModal');

// Application State
let counter = 0;
const STORAGE_KEY = 'basicHtmlAppData';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadStoredData();
    updatePlatformInfo();
});

// Initialize Application
function initializeApp() {
    console.log('Basic HTML App initialized');
    
    // Load counter from localStorage
    const savedCounter = localStorage.getItem('counter');
    if (savedCounter !== null) {
        counter = parseInt(savedCounter, 10);
        updateCounterDisplay();
    }
    
    // Check if running in Capacitor
    if (window.Capacitor) {
        console.log('Running in Capacitor environment');
        document.body.classList.add('capacitor-app');
    }
    
    // Add touch event support
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Counter buttons
    incrementBtn.addEventListener('click', incrementCounter);
    decrementBtn.addEventListener('click', decrementCounter);
    resetBtn.addEventListener('click', resetCounter);
    
    // Form submission
    userForm.addEventListener('submit', handleFormSubmit);
    
    // Storage buttons
    saveBtn.addEventListener('click', saveToStorage);
    loadBtn.addEventListener('click', loadFromStorage);
    clearBtn.addEventListener('click', clearStorage);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Handle back button (Android)
    if (window.Capacitor && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', handleBackButton);
    }
    
    // Handle app state changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle orientation changes
    window.addEventListener('orientationchange', handleOrientationChange);
}

// Counter Functions
function incrementCounter() {
    counter++;
    updateCounterDisplay();
    saveCounterToStorage();
    animateButton(incrementBtn);
}

function decrementCounter() {
    counter--;
    updateCounterDisplay();
    saveCounterToStorage();
    animateButton(decrementBtn);
}

function resetCounter() {
    counter = 0;
    updateCounterDisplay();
    saveCounterToStorage();
    animateButton(resetBtn);
}

function updateCounterDisplay() {
    counterElement.textContent = counter;
    
    // Add animation class
    counterElement.classList.add('counter-updated');
    setTimeout(() => {
        counterElement.classList.remove('counter-updated');
    }, 300);
}

function saveCounterToStorage() {
    localStorage.setItem('counter', counter.toString());
}

// Form Handling
function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(userForm);
    const userData = {
        name: formData.get('userName'),
        email: formData.get('userEmail'),
        message: formData.get('userMessage'),
        timestamp: new Date().toISOString()
    };
    
    // Validate form data
    if (!userData.name.trim()) {
        showNotification('请输入姓名', 'error');
        return;
    }
    
    if (!userData.email.trim()) {
        showNotification('请输入邮箱', 'error');
        return;
    }
    
    if (!isValidEmail(userData.email)) {
        showNotification('请输入有效的邮箱地址', 'error');
        return;
    }
    
    // Save to localStorage
    const savedData = JSON.parse(localStorage.getItem('userSubmissions') || '[]');
    savedData.push(userData);
    localStorage.setItem('userSubmissions', JSON.stringify(savedData));
    
    // Show success message
    showNotification('表单提交成功！', 'success');
    
    // Reset form
    userForm.reset();
    
    console.log('Form submitted:', userData);
}

// Storage Functions
function saveToStorage() {
    const data = storageInput.value.trim();
    if (!data) {
        showNotification('请输入要保存的内容', 'error');
        return;
    }
    
    const storageData = {
        content: data,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
    updateStorageDisplay();
    storageInput.value = '';
    showNotification('数据保存成功', 'success');
}

function loadFromStorage() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const parsedData = JSON.parse(data);
        storageInput.value = parsedData.content;
        updateStorageDisplay();
        showNotification('数据加载成功', 'success');
    } else {
        showNotification('没有找到保存的数据', 'info');
    }
}

function clearStorage() {
    localStorage.removeItem(STORAGE_KEY);
    storageInput.value = '';
    updateStorageDisplay();
    showNotification('数据清除成功', 'success');
}

function updateStorageDisplay() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        const parsedData = JSON.parse(data);
        storageDisplay.textContent = `保存的内容: ${parsedData.content}\n保存时间: ${new Date(parsedData.timestamp).toLocaleString()}`;
    } else {
        storageDisplay.textContent = '暂无保存的数据';
    }
}

function loadStoredData() {
    updateStorageDisplay();
}

// Platform Information
function updatePlatformInfo() {
    // Detect platform
    let platform = 'Web';
    if (window.Capacitor) {
        platform = window.Capacitor.getPlatform();
    } else if (navigator.userAgent.includes('Android')) {
        platform = 'Android (Web)';
    } else if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        platform = 'iOS (Web)';
    }
    
    platformInfo.textContent = platform;
    userAgent.textContent = navigator.userAgent.substring(0, 100) + '...';
}

// Modal Functions
function showAbout() {
    aboutModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideAbout() {
    aboutModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function animateButton(button) {
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // Set background color based on type
    const colors = {
        success: '#4CAF50',
        error: '#F44336',
        info: '#2196F3',
        warning: '#FF9800'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Event Handlers
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + Enter to submit form
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.form === userForm) {
            handleFormSubmit(event);
        }
    }
    
    // Escape to close modal
    if (event.key === 'Escape') {
        hideAbout();
    }
}

function handleBackButton() {
    // Handle Android back button
    if (aboutModal.style.display === 'block') {
        hideAbout();
        return false; // Prevent default back action
    }
    
    // Allow default back action
    return true;
}

function handleVisibilityChange() {
    if (document.hidden) {
        console.log('App went to background');
        // Save current state
        saveCounterToStorage();
    } else {
        console.log('App came to foreground');
        // Refresh data if needed
        updatePlatformInfo();
    }
}

function handleOrientationChange() {
    setTimeout(() => {
        // Recalculate layout after orientation change
        window.scrollTo(0, 0);
    }, 100);
}

// Click outside modal to close
window.addEventListener('click', function(event) {
    if (event.target === aboutModal) {
        hideAbout();
    }
});

// Add CSS for counter animation
const style = document.createElement('style');
style.textContent = `
    .counter-updated {
        animation: counterPulse 0.3s ease;
    }
    
    @keyframes counterPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    .btn {
        transition: transform 0.15s ease;
    }
`;
document.head.appendChild(style);

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        incrementCounter,
        decrementCounter,
        resetCounter,
        isValidEmail,
        showNotification
    };
}