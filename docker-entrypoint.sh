#!/bin/bash
set -e

# Web-to-APK Docker Entrypoint Script

echo "🚀 Starting Web-to-APK Docker Container..."

# Verify environment variables
echo "📋 Environment Check:"
# Source nvm to make node available
source $NVM_DIR/nvm.sh
echo "  Node.js version: $(node --version)"
echo "  Java version: $(java -version 2>&1 | head -n 1)"
echo "  Android SDK: $ANDROID_SDK_ROOT"

# Verify Android SDK installation
if [ -d "$ANDROID_SDK_ROOT" ]; then
    echo "  ✅ Android SDK found"
    # List installed packages
    echo "  📦 Installed Android packages:"
    sdkmanager --list | grep "build-tools\|platforms" | head -5
else
    echo "  ❌ Android SDK not found!"
    exit 1
fi

# Create necessary directories if they don't exist
mkdir -p web-server/uploads web-server/downloads web-server/temp
chmod 755 web-server/uploads web-server/downloads web-server/temp

# Set proper permissions
chown -R root:root /app
chmod -R 755 /app

echo "🔧 Environment setup complete!"

# Execute the main command
echo "🌐 Starting Web-to-APK server..."
# Source nvm before executing the command
source $NVM_DIR/nvm.sh
exec "$@"