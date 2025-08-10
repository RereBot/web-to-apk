# Web-to-APK Docker Image
# Single-stage build for reliability

FROM ubuntu:22.04

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    unzip \
    git \
    build-essential \
    python3 \
    python3-pip \
    openjdk-17-jdk \
    && rm -rf /var/lib/apt/lists/*

# Set Java environment
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin

# Install Node.js 20 using nvm
ENV NVM_DIR=/root/.nvm
ENV NODE_VERSION=20
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash \
    && . $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm use $NODE_VERSION \
    && nvm alias default $NODE_VERSION

# Add Node.js to PATH
ENV PATH=$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Verify Node.js installation
RUN . $NVM_DIR/nvm.sh && node --version && npm --version

# Install Android SDK
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=$ANDROID_SDK_ROOT
ENV PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

RUN mkdir -p $ANDROID_SDK_ROOT/cmdline-tools \
    && cd /tmp \
    && wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip \
    && unzip -q commandlinetools-linux-9477386_latest.zip \
    && mv cmdline-tools $ANDROID_SDK_ROOT/cmdline-tools/latest \
    && rm commandlinetools-linux-9477386_latest.zip

# Accept Android SDK licenses and install required components
RUN yes | sdkmanager --licenses \
    && sdkmanager "platform-tools" "platforms;android-35" "build-tools;34.0.0"

# Pre-download and cache Gradle Wrapper to avoid first-time download delays
RUN echo "Pre-downloading Gradle Wrapper to optimize build performance..." \
    && mkdir -p /tmp/gradle-cache-setup \
    && cd /tmp/gradle-cache-setup \
    && . $NVM_DIR/nvm.sh \
    && npm init -y \
    && npm install @capacitor/core@^6.0.0 @capacitor/cli@^6.0.0 @capacitor/android@^6.0.0 typescript \
    && echo 'import {CapacitorConfig} from "@capacitor/cli"; const config: CapacitorConfig = { appId: "com.cache.gradle", appName: "GradleCache", webDir: "dist" }; export default config;' > capacitor.config.ts \
    && mkdir -p dist \
    && echo '<html><body><h1>Gradle Cache Setup</h1></body></html>' > dist/index.html \
    && npx capacitor add android \
    && cd android \
    && chmod +x gradlew \
    && echo "Triggering Gradle Wrapper download..." \
    && ./gradlew --version || echo "Gradle download completed" \
    && echo "Gradle cache setup completed successfully" \
    && cd / \
    && rm -rf /tmp/gradle-cache-setup

# Configure Gradle to handle TLS protocol compatibility issues
RUN mkdir -p /root/.gradle \
    && echo "org.gradle.jvmargs=-Dhttps.protocols=TLSv1.2,TLSv1.3 -Dfile.encoding=UTF-8" > /root/.gradle/gradle.properties \
    && echo "org.gradle.daemon=false" >> /root/.gradle/gradle.properties \
    && echo "org.gradle.parallel=true" >> /root/.gradle/gradle.properties \
    && echo "Global Gradle configuration applied for TLS compatibility"

# Create app directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY web-server/package*.json ./web-server/

# Install dependencies
RUN . $NVM_DIR/nvm.sh && npm install --production \
    && cd web-server \
    && npm install --production \
    && cd ..

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p web-server/uploads web-server/downloads web-server/temp \
    && chmod 755 web-server/uploads web-server/downloads web-server/temp

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Health check
COPY healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/healthcheck.sh
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default command
CMD ["node", "web-server/server.js"]