# Web-to-APK 🚀

将任何网站快速转换为Android APK应用程序的强大工具。支持命令行和Web界面两种使用方式，让您轻松将Web应用打包成原生Android应用。

## 🚀 在线演示

**在线体验 Web-to-APK：** [https://webtoapk.rerebot.com](https://webtoapk.rerebot.com)

无需安装任何软件，直接在线体验完整功能 - 只需上传您的网站URL，即可下载APK文件！

## 📋 目录

- [在线演示](#-在线演示)
- [软件截图](#-软件截图)

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [安装和环境准备](#安装和环境准备)
- [快速上手](#快速上手)
- [CLI命令详解](#cli命令详解)
- [配置文件说明](#配置文件说明)
- [常见问题解答](#常见问题解答)
- [贡献指南](#贡献指南)
- [未来路线图](#-未来路线图)
- [许可证](#许可证)

## 📸 软件截图

![Web-to-APK Demo](assets/web-to-apk-demo.gif)

## 🎯 项目简介

### 项目缘起：在 AI 时代，让 Web 应用拥有"原生"之魂

在人工智能辅助开发浪潮席卷全球的今天，借助 n8n、Coze、Flowise 这样优秀的工作流与 Agent 平台，任何人都可以快速地构建出功能强大的网页应用。然而，这些应用的入口，往往是一个冗长、复杂且难以记忆的网址。

我们认为，一个真正好用的工具，应该像原生 App 一样，在用户的手机桌面上拥有一个永久、便捷的"家"。

为此，我们开发了 Web-to-APK。它的使命很简单：让每一位创造者，都能在两分钟内，将自己的工作流、AI Agent，或任何一个心爱的网站，轻松转换为一个可安装的安卓 APK 文件，让思想的结晶，真正"落袋为安"。

### 为何重复造车轮？

我们注意到，同类工具中，优秀的产品往往伴随着极其复杂的环境检测与参数配置，技术门槛很高；简易的产品，又因为忽略最关键的"应用签名"环节，生成的 APK 因安全隐患常常被智能手机拒绝安装。

### Web-to-APK 的哲学：在"简单"与"强大"之间，取得完美平衡

**对于普通用户**，它简单到只需输入应用名称和网址，即可一键生成一个可以正常安装、使用的标准 APK。

**对于专业开发者**，它也足够强大。您可以通过上传自己的密钥库 (Keystore) 文件，生成符合 Google Play 标准的、经过官方签名的发布版 APK，并将其自信地上传到各大手机应用平台。

我们希望 Web-to-APK 能成为您在 AI 时代，连接 Web 创意与移动世界的、最得力的那座桥梁。

### 核心优势

- **🎨 双重界面**：支持命令行和Web界面两种操作方式
- **⚡ 快速构建**：基于Capacitor的高效构建流程
- **🔧 灵活配置**：丰富的配置选项满足不同需求
- **📱 原生体验**：生成的APK具有原生应用的性能和体验
- **🛡️ 安全可靠**：内置安全检查和错误处理机制

## ✨ 功能特性

### 🖥️ CLI模式功能

- **项目初始化**：快速创建项目配置文件
- **一键构建**：自动化APK构建流程
- **本地服务**：启动Web界面进行可视化操作
- **配置验证**：智能检查配置文件的正确性
- **构建日志**：详细的构建过程记录和错误报告

### 🌐 Web界面功能

- **可视化配置**：直观的表单界面配置应用信息
- **图标上传**：支持拖拽上传自定义应用图标
- **发布版APK构建**：支持上传密钥库文件，配置签名密码，生成可发布的签名APK
- **实时预览**：即时预览应用配置效果
- **构建监控**：实时显示构建进度和状态
- **一键下载**：构建完成后直接下载APK文件

### 🔧 核心技术特性

- **智能图标处理**：自动生成多种尺寸的应用图标
- **启动画面生成**：创建适配不同屏幕的启动画面
- **WebView优化**：针对移动设备优化的WebView配置
- **网络状态处理**：智能处理网络连接和离线状态
- **APK签名**：支持调试和发布版本的APK签名
- **发布版构建**：完整的发布版APK构建流程，包括密钥库管理和安全签名

## 🚀 快速开始

### 🐳 使用 Docker 快速开始（推荐）

最快的开始方式是使用 Docker，无需复杂的环境配置！

#### 方式一：Docker Run

```bash
# 拉取并运行最新镜像
docker run -d \
  --name web-to-apk \
  -p 3000:3000 \
  -v web-to-apk-downloads:/app/web-server/downloads \
  rerebot/web-to-apk:latest

# 访问 Web 界面
open http://localhost:3000
```

#### 方式二：Docker Compose

```bash
# 克隆仓库
git clone https://github.com/RereBot/web-to-apk.git
cd web-to-apk

# 启动服务
docker-compose up -d

# 访问 Web 界面
open http://localhost:3000

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### Web 界面使用（本地开发）

1. **启动 Web 服务器**：
   ```bash
   # 启动 Web 服务器
   # 简单直接启动方式 (推荐用于开发)
   node web-server/server.js
   
   # 或使用 npm 脚本
   npm run web-server
   ```

2. **打开浏览器** 并访问 `http://localhost:3000`

3. **配置应用信息**：
   - 输入应用名称和包名
   - 提供要转换的网站URL
   - 上传自定义图标（可选）
   - 根据需要配置高级设置

4. **构建APK**：
   - 点击"构建APK"生成调试版本
   - 或勾选"创建发布版本"并上传密钥库文件生成签名APK

5. **下载**：构建完成后，下载您的APK文件

## 🛠️ 安装和环境准备

### 系统要求

- **Node.js**: 版本 16.0 或更高
- **npm**: 版本 7.0 或更高
- **Java JDK**: 版本 17 或更高
- **Android SDK**: API Level 24 或更高
- **Gradle**: 版本 8.0 或更高

### 本地开发环境搭建 (推荐 WSL)

**强烈推荐使用 WSL (Windows Subsystem for Linux) 进行开发**，这能提供最佳的兼容性和性能。

#### WSL 环境设置 (推荐)

1. **安装 WSL2 和 Ubuntu**：
```bash
# 在 Windows PowerShell (管理员) 中执行
wsl --install -d Ubuntu-22.04
```

2. **在 WSL Ubuntu 中安装开发环境**：
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 20 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 安装 Java 17
sudo apt install openjdk-17-jdk -y

# 设置环境变量
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$PATH:$JAVA_HOME/bin' >> ~/.bashrc
source ~/.bashrc
```

3. **安装 Android SDK**：
```bash
# 创建 Android SDK 目录
mkdir -p ~/android-sdk/cmdline-tools

# 下载 Android 命令行工具
cd /tmp
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip
mv cmdline-tools ~/android-sdk/cmdline-tools/latest

# 设置 Android 环境变量
echo 'export ANDROID_SDK_ROOT=$HOME/android-sdk' >> ~/.bashrc
echo 'export ANDROID_HOME=$HOME/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools' >> ~/.bashrc
source ~/.bashrc

# 安装必要的 Android SDK 组件
yes | sdkmanager --licenses
sdkmanager "platform-tools" "platforms;android-35" "build-tools;34.0.0"
```

4. **克隆和运行项目**：
```bash
# 克隆项目
git clone https://github.com/RereBot/web-to-apk.git
cd web-to-apk

# 安装依赖
npm install

# 构建项目
npm run build

# 启动 Web 服务器
# 简单直接启动方式 (推荐用于开发)
node web-server/server.js

# 或使用 npm 脚本
npm run web-server
```

### 传统环境配置

#### 1. 安装Java JDK

**Windows:**
```bash
# 使用Chocolatey安装
choco install openjdk11

# 或下载并安装Oracle JDK
# https://www.oracle.com/java/technologies/javase-jdk11-downloads.html
```

**macOS:**
```bash
# 使用Homebrew安装
brew install openjdk@11

# 设置JAVA_HOME
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v11)' >> ~/.zshrc
source ~/.zshrc
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install openjdk-17-jdk

# 设置JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
source ~/.bashrc
```

#### 2. 安装Android SDK

**方法一：通过Android Studio**
1. 下载并安装 [Android Studio](https://developer.android.com/studio)
2. 启动Android Studio，按照向导安装SDK
3. 设置环境变量：

```bash
# Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\tools;$env:ANDROID_HOME\platform-tools"

# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

**方法二：仅安装命令行工具**
```bash
# 下载命令行工具
wget https://dl.google.com/android/repository/commandlinetools-linux-8512546_latest.zip
unzip commandlinetools-linux-8512546_latest.zip

# 安装必要的SDK组件
./cmdline-tools/bin/sdkmanager --sdk_root=$ANDROID_HOME "platform-tools" "platforms;android-30" "build-tools;30.0.3"
```

#### 3. 验证环境配置

```bash
# 检查Java版本
java -version

# 检查Android SDK
adb version

# 检查Gradle（如果已安装）
gradle --version
```

### 安装Web-to-APK

#### 全局安装（推荐）

```bash
npm install -g web-to-apk
```

#### 本地项目安装

```bash
npm install web-to-apk --save-dev
```

#### 从源码安装

```bash
git clone https://github.com/RereBot/web-to-apk.git
cd web-to-apk
npm install
npm run build
npm link
```

## 🚀 快速上手

### CLI模式快速开始

#### 1. 初始化项目

```bash
# 在项目目录中初始化配置
web-to-apk init

# 或者指定项目名称
web-to-apk init my-awesome-app
```

这将创建一个 `web-to-apk.config.json` 配置文件：

```json
{
  "appName": "My Awesome App",
  "packageName": "com.example.myawesomeapp",
  "version": "1.0.0",
  "websiteUrl": "https://example.com",
  "icon": "./icon.png",
  "splashScreen": {
    "backgroundColor": "#ffffff",
    "showSpinner": true
  },
  "webView": {
    "allowsInlineMediaPlayback": true,
    "allowsBackForwardNavigationGestures": true
  }
}
```

#### 2. 构建APK

```bash
# 使用默认配置构建
web-to-apk build

# 指定配置文件
web-to-apk build --config ./custom-config.json

# 构建发布版本
web-to-apk build --release

# 显示详细日志
web-to-apk build --verbose
```

#### 3. 启动Web界面

```bash
# 启动本地Web服务
web-to-apk serve

# 指定端口
web-to-apk serve --port 8080

# 自动打开浏览器
web-to-apk serve --open
```

### Web界面模式快速开始

#### 1. 启动Web服务

```bash
web-to-apk serve
```

#### 2. 打开浏览器

访问 `http://localhost:3000` 打开Web界面。

#### 3. 配置应用信息

1. **基本信息**：填写应用名称、包名、版本号
2. **网站URL**：输入要打包的网站地址
3. **应用图标**：上传自定义图标或让系统自动提取favicon
4. **高级选项**：配置启动画面、WebView设置等

#### 4. 发布版APK构建（可选）

如果需要生成可发布到应用商店的签名APK：

1. **勾选"创建发布版本 (Create Release Build)"选项**
2. **上传密钥库文件**：
   - 点击"选择密钥库文件"按钮
   - 选择您的 `.keystore` 或 `.jks` 文件
   - 支持的文件类型：.keystore, .jks
   - 文件大小限制：5MB以内

3. **配置签名信息**：
   - **密钥库密码 (Keystore Password)**：输入密钥库的密码
   - **密钥别名 (Key Alias)**：输入密钥的别名
   - **密钥密码 (Key Password)**：输入密钥的密码（如果与密钥库密码相同可留空）

4. **安全提示**：
   - 密钥库文件在构建完成后会自动删除，确保安全
   - 密码信息不会被记录或存储
   - 建议在安全的网络环境中进行发布版构建

#### 5. 构建和下载

1. 点击"构建APK"按钮开始构建
2. 等待构建完成（通常需要1-3分钟，发布版可能需要更长时间）
3. 构建完成后点击下载链接获取APK文件
4. 发布版APK可直接用于应用商店发布

## 📖 CLI命令详解

### `web-to-apk init`

初始化项目配置文件。

```bash
web-to-apk init [project-name] [options]
```

**参数：**
- `project-name` (可选): 项目名称，默认使用当前目录名

**选项：**
- `-c, --config <path>`: 指定配置文件路径 (默认: `./web-to-apk.config.json`)
- `-t, --template <n>`: 使用预定义模板 (`basic`, `pwa`, `spa`)
- `-f, --force`: 强制覆盖已存在的配置文件
- `-i, --interactive`: 启用交互式配置向导

**示例：**

```bash
# 基本初始化
web-to-apk init

# 使用PWA模板
web-to-apk init my-pwa --template pwa

# 交互式配置
web-to-apk init --interactive

# 强制覆盖现有配置
web-to-apk init --force
```

### `web-to-apk build`

构建Android APK文件。

```bash
web-to-apk build [options]
```

**选项：**
- `-c, --config <path>`: 指定配置文件路径
- `-o, --output <path>`: 指定输出目录 (默认: `./dist`)
- `-r, --release`: 构建发布版本（需要签名配置）
- `-d, --debug`: 构建调试版本（默认）
- `-v, --verbose`: 显示详细构建日志
- `-w, --watch`: 监听文件变化并自动重新构建
- `--clean`: 构建前清理输出目录
- `--no-sign`: 跳过APK签名步骤

**示例：**

```bash
# 基本构建
web-to-apk build

# 构建发布版本
web-to-apk build --release

# 指定输出目录
web-to-apk build --output ./build

# 详细日志模式
web-to-apk build --verbose

# 清理并构建
web-to-apk build --clean

# 监听模式
web-to-apk build --watch
```

### `web-to-apk serve`

启动Web界面服务器。

```bash
web-to-apk serve [options]
```

**选项：**
- `-p, --port <number>`: 指定服务器端口 (默认: 3000)
- `-h, --host <address>`: 指定服务器地址 (默认: localhost)
- `-o, --open`: 自动在浏览器中打开
- `--https`: 启用HTTPS服务
- `--cert <path>`: HTTPS证书文件路径
- `--key <path>`: HTTPS私钥文件路径

**示例：**

```bash
# 基本启动
web-to-apk serve

# 指定端口并自动打开浏览器
web-to-apk serve --port 8080 --open

# 启用HTTPS
web-to-apk serve --https --cert ./cert.pem --key ./key.pem

# 允许外部访问
web-to-apk serve --host 0.0.0.0
```

### 通用选项

所有命令都支持以下通用选项：

- `--version`: 显示版本信息
- `--help`: 显示帮助信息
- `--no-color`: 禁用彩色输出
- `--quiet`: 静默模式，只显示错误信息

## ⚙️ 配置文件说明

`web-to-apk.config.json` 是项目的核心配置文件，包含了构建APK所需的所有设置。

### 完整配置示例

```json
{
  "appName": "我的应用",
  "packageName": "com.example.myapp",
  "version": "1.0.0",
  "versionCode": 1,
  "websiteUrl": "https://example.com",
  "icon": "./assets/icon.png",
  "splashScreen": {
    "backgroundColor": "#ffffff",
    "image": "./assets/splash.png",
    "showSpinner": true,
    "spinnerColor": "#000000",
    "fadeOutDuration": 300
  },
  "webView": {
    "allowsInlineMediaPlayback": true,
    "allowsBackForwardNavigationGestures": true,
    "limitsNavigationsToAppBoundDomains": false,
    "allowsLinkPreview": true,
    "scrollEnabled": true,
    "zoomEnabled": false,
    "fullscreen": false,
    "backgroundColor": "#ffffff"
  },
  "permissions": [
    "INTERNET",
    "ACCESS_NETWORK_STATE",
    "CAMERA",
    "WRITE_EXTERNAL_STORAGE"
  ],
  "orientation": "portrait",
  "theme": {
    "primaryColor": "#007bff",
    "statusBarColor": "#0056b3",
    "navigationBarColor": "#ffffff"
  },
  "build": {
    "minSdkVersion": 24,
    "targetSdkVersion": 33,
    "compileSdkVersion": 33,
    "gradle": {
      "properties": {
        "android.useAndroidX": "true",
        "android.enableJetifier": "true"
      }
    }
  },
  "signing": {
    "keystore": "./keystore.jks",
    "alias": "my-app-key",
    "storePassword": "store-password",
    "keyPassword": "key-password"
  }
}
```

### 配置字段详解

#### 基本应用信息

| 字段 | 类型 | 必需 | 描述 | 示例 |
|------|------|------|------|------|
| `appName` | string | ✅ | 应用显示名称 | `"我的应用"` |
| `packageName` | string | ✅ | Android包名，必须唯一 | `"com.example.myapp"` |
| `version` | string | ✅ | 应用版本号 | `"1.0.0"` |
| `versionCode` | number | ❌ | Android版本代码 | `1` |
| `websiteUrl` | string | ✅ | 要打包的网站URL | `"https://example.com"` |

#### 图标和启动画面

| 字段 | 类型 | 必需 | 描述 | 默认值 |
|------|------|------|------|-------|
| `icon` | string | ❌ | 应用图标路径 | 自动提取favicon |
| `splashScreen.backgroundColor` | string | ❌ | 启动画面背景色 | `"#ffffff"` |
| `splashScreen.image` | string | ❌ | 启动画面图片路径 | 使用应用图标 |
| `splashScreen.showSpinner` | boolean | ❌ | 显示加载动画 | `true` |
| `splashScreen.spinnerColor` | string | ❌ | 加载动画颜色 | `"#000000"` |
| `splashScreen.fadeOutDuration` | number | ❌ | 淡出动画时长(ms) | `300` |

#### WebView配置

| 字段 | 类型 | 必需 | 描述 | 默认值 |
|------|------|------|------|-------|
| `webView.allowsInlineMediaPlaybook` | boolean | ❌ | 允许内联媒体播放 | `true` |
| `webView.allowsBackForwardNavigationGestures` | boolean | ❌ | 允许手势导航 | `true` |
| `webView.limitsNavigationsToAppBoundDomains` | boolean | ❌ | 限制导航到应用域名 | `false` |
| `webView.allowsLinkPreview` | boolean | ❌ | 允许链接预览 | `true` |
| `webView.scrollEnabled` | boolean | ❌ | 允许滚动 | `true` |
| `webView.zoomEnabled` | boolean | ❌ | 允许缩放 | `false` |
| `webView.fullscreen` | boolean | ❌ | 全屏模式 | `false` |
| `webView.backgroundColor` | string | ❌ | WebView背景色 | `"#ffffff"` |

#### 权限和系统设置

| 字段 | 类型 | 必需 | 描述 | 可选值 |
|------|------|------|------|-------|
| `permissions` | array | ❌ | Android权限列表 | 见权限列表 |
| `orientation` | string | ❌ | 屏幕方向 | `"portrait"`, `"landscape"`, `"auto"` |

**常用权限列表：**
- `INTERNET` - 网络访问
- `ACCESS_NETWORK_STATE` - 网络状态
- `CAMERA` - 相机访问
- `WRITE_EXTERNAL_STORAGE` - 外部存储写入
- `READ_EXTERNAL_STORAGE` - 外部存储读取
- `ACCESS_FINE_LOCATION` - 精确位置
- `ACCESS_COARSE_LOCATION` - 大致位置
- `RECORD_AUDIO` - 录音
- `VIBRATE` - 震动

#### 主题和样式

| 字段 | 类型 | 必需 | 描述 | 默认值 |
|------|------|------|------|-------|
| `theme.primaryColor` | string | ❌ | 主题主色调 | `"#007bff"` |
| `theme.statusBarColor` | string | ❌ | 状态栏颜色 | `"#0056b3"` |
| `theme.navigationBarColor` | string | ❌ | 导航栏颜色 | `"#ffffff"` |

#### 构建配置

| 字段 | 类型 | 必需 | 描述 | 默认值 |
|------|------|------|------|-------|
| `build.minSdkVersion` | number | ❌ | 最低SDK版本 | `24` |
| `build.targetSdkVersion` | number | ❌ | 目标SDK版本 | `33` |
| `build.compileSdkVersion` | number | ❌ | 编译SDK版本 | `33` |
| `build.gradle.properties` | object | ❌ | Gradle属性 | `{}` |

#### 签名配置

| 字段 | 类型 | 必需 | 描述 | 用途 |
|------|------|------|------|------|
| `signing.keystore` | string | ❌ | 密钥库文件路径 | 发布版本签名 |
| `signing.alias` | string | ❌ | 密钥别名 | 发布版本签名 |
| `signing.storePassword` | string | ❌ | 密钥库密码 | 发布版本签名 |
| `signing.keyPassword` | string | ❌ | 密钥密码 | 发布版本签名 |

### 配置文件模板

#### 基础模板 (basic)

```json
{
  "appName": "My App",
  "packageName": "com.example.myapp",
  "version": "1.0.0",
  "websiteUrl": "https://example.com"
}
```

#### PWA模板 (pwa)

```json
{
  "appName": "My PWA",
  "packageName": "com.example.mypwa",
  "version": "1.0.0",
  "websiteUrl": "https://example.com",
  "webView": {
    "allowsInlineMediaPlayback": true,
    "fullscreen": true
  },
  "permissions": [
    "INTERNET",
    "ACCESS_NETWORK_STATE",
    "CAMERA",
    "WRITE_EXTERNAL_STORAGE"
  ]
}
```

#### 单页应用模板 (spa)

```json
{
  "appName": "My SPA",
  "packageName": "com.example.myspa",
  "version": "1.0.0",
  "websiteUrl": "https://example.com",
  "webView": {
    "allowsBackForwardNavigationGestures": false,
    "limitsNavigationsToAppBoundDomains": true
  },
  "orientation": "portrait"
}
```

## ❓ 常见问题解答

### 安装和环境问题

**Q: 安装时提示"Java not found"错误？**

A: 请确保已正确安装Java JDK 11或更高版本，并设置了JAVA_HOME环境变量：

```bash
# 检查Java安装
java -version

# 设置JAVA_HOME (Windows)
setx JAVA_HOME "C:\Program Files\Java\jdk-11.0.x"

# 设置JAVA_HOME (macOS/Linux)
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
```

**Q: Android SDK路径找不到？**

A: 设置ANDROID_HOME环境变量：

```bash
# Windows
setx ANDROID_HOME "C:\Users\%USERNAME%\AppData\Local\Android\Sdk"

# macOS
export ANDROID_HOME=$HOME/Library/Android/sdk

# Linux
export ANDROID_HOME=$HOME/Android/Sdk
```

**Q: Gradle构建失败？**

A: 常见解决方案：
1. 清理Gradle缓存：`./gradlew clean`
2. 更新Gradle版本到7.0+
3. 检查网络连接，确保能访问Maven仓库
4. 增加Gradle内存：在`gradle.properties`中添加`org.gradle.jvmargs=-Xmx4g`

### 配置问题

**Q: 包名格式错误？**

A: Android包名必须符合以下规则：
- 只能包含字母、数字、下划线和点号
- 必须包含至少一个点号
- 不能以数字开头
- 推荐格式：`com.company.appname`

**Q: 图标不显示或显示异常？**

A: 图标问题解决方案：
1. 确保图标文件存在且路径正确
2. 支持的格式：PNG、JPG、WebP
3. 推荐尺寸：512x512像素或更高
4. 确保图标文件不超过5MB

**Q: 网站在APK中无法正常显示？**

A: 检查以下设置：
1. 确保网站支持HTTPS
2. 检查网站的CSP（内容安全策略）设置
3. 添加必要的权限（如INTERNET）
4. 检查WebView配置是否正确

### 构建问题

**Q: 构建过程中出现"Permission denied"错误？**

A: 权限问题解决方案：
1. 确保有足够的磁盘空间
2. 检查输出目录的写入权限
3. 在Linux/macOS上可能需要使用`sudo`
4. 检查防病毒软件是否阻止了文件操作

**Q: APK构建成功但无法安装？**

A: 安装问题排查：
1. 检查设备是否允许安装未知来源应用
2. 确保APK签名正确
3. 检查设备的Android版本是否满足minSdkVersion要求
4. 尝试卸载旧版本后重新安装

**Q: 构建时间过长？**

A: 优化构建速度：
1. 使用SSD硬盘
2. 增加系统内存
3. 使用Gradle守护进程
4. 启用并行构建：`org.gradle.parallel=true`
5. 使用构建缓存：`org.gradle.caching=true`

### Web界面问题

**Q: Web界面无法访问？**

A: 检查以下项目：
1. 确保服务已正常启动
2. 检查端口是否被占用
3. 尝试使用不同的端口：`web-to-apk serve --port 8080`
4. 检查防火墙设置

**Q: 文件上传失败？**

A: 文件上传问题：
1. 检查文件大小（限制5MB）
2. 确保文件格式正确（PNG、JPG、WebP）
3. 检查网络连接
4. 尝试刷新页面后重新上传

**Q: 构建进度卡住不动？**

A: 进度问题排查：
1. 检查网络连接
2. 查看浏览器控制台错误信息
3. 检查服务器日志
4. 尝试重新启动构建

### 高级配置问题

**Q: 如何添加自定义插件？**

A: 在配置文件中添加插件配置：

```json
{
  "plugins": [
    {
      "name": "@capacitor/camera",
      "version": "latest"
    }
  ]
}
```

**Q: 如何自定义启动画面？**

A: 配置启动画面选项：

```json
{
  "splashScreen": {
    "backgroundColor": "#007bff",
    "image": "./assets/splash.png",
    "showSpinner": false,
    "fadeOutDuration": 500
  }
}
```

**Q: 如何处理HTTPS证书问题？**

A: 对于自签名证书或内网环境：

```json
{
  "webView": {
    "allowsArbitraryLoads": true,
    "allowsLocalNetworking": true
  }
}
```

### 性能优化

**Q: 如何优化APK大小？**

A: APK优化建议：
1. 启用代码混淆和压缩
2. 移除未使用的资源
3. 使用WebP格式图片
4. 启用APK分包（如果需要）

**Q: 如何提高应用启动速度？**

A: 启动优化：
1. 优化启动画面设置
2. 减少初始加载的资源
3. 使用预加载策略
4. 优化WebView配置

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/RereBot/web-to-apk.git
cd web-to-apk

# 安装依赖
npm install

# 运行测试
npm test

# 构建项目
npm run build

# 启动开发服务器
npm run dev
```

### 提交规范

请使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

## 🗺️ 未来路线图

### 最新添加功能 ✅

- **Docker 支持** - 现已可用！🐳
  - 完整的 Docker 容器化，便于部署
  - 开发环境的 Docker Compose 配置
  - 生产环境的预构建 Docker 镜像
  - 跨平台兼容性（Windows、Linux、macOS）

### 即将推出的功能

- **iOS 支持** - 计划在 v2.0 版本
  - 将网站转换为 iOS 应用程序
  - Android 和 iOS 的统一构建流程

- **云端构建服务** - 未来版本
  - 无需本地环境的在线 APK 构建
  - 云基础设施提供更快的构建速度

- **插件系统** - 考虑中
  - 可扩展的自定义功能架构
  - 社区贡献的插件支持

### 已完成功能 ✅

- ✅ 易用的 Web 界面 APK 构建
- ✅ 自动化工作流的 CLI 工具
- ✅ 发布版 APK 签名支持
- ✅ 多语言支持（中英文）
- ✅ 实时构建进度跟踪

## 📄 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 🔗 相关链接

- [GitHub仓库](https://github.com/RereBot/web-to-apk)
- [问题反馈](https://github.com/RereBot/web-to-apk/issues)
- [更新日志](CHANGELOG.md)
- [部署指南](DEPLOYMENT.zh-CN.md)
- [Capacitor文档](https://capacitorjs.com/docs)
- [Android开发文档](https://developer.android.com/docs)

---

如果这个项目对您有帮助，请给我们一个 ⭐ Star！

有问题或建议？欢迎提交 [Issue](https://github.com/RereBot/web-to-apk/issues) 或 [Pull Request](https://github.com/RereBot/web-to-apk/pulls)。