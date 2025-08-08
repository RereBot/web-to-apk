/**
 * 项目模板管理器
 */
import fs from 'fs/promises';
import path from 'path';
export class ProjectTemplateManager {
    constructor() {
        this.templates = new Map();
        /**
         * 基础HTML模板
         */
        this.getBasicIndexHtml = (config) => {
            const appName = config.appName || 'My Web App';
            return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 500px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 {
            margin-bottom: 20px;
            font-size: 2.5em;
            font-weight: 300;
        }
        p {
            margin-bottom: 30px;
            opacity: 0.9;
            font-size: 1.1em;
            line-height: 1.6;
        }
        .button {
            background: rgba(255, 255, 255, 0.2);
            border: 2px solid white;
            color: white;
            padding: 15px 30px;
            border-radius: 30px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
        }
        .button:hover {
            background: white;
            color: #667eea;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        .features {
            margin-top: 40px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 20px;
        }
        .feature {
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            font-size: 0.9em;
        }
        .feature-icon {
            font-size: 2em;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>欢迎使用 ${appName}</h1>
        <p>这是一个使用 Web-to-APK 工具创建的应用。您可以修改这个页面来构建您自己的移动应用。</p>
        
        <button class="button" onclick="showInfo()">点击测试</button>
        <a href="#features" class="button">了解更多</a>
        
        <div class="features" id="features">
            <div class="feature">
                <div class="feature-icon">📱</div>
                <div>原生体验</div>
            </div>
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <div>快速构建</div>
            </div>
            <div class="feature">
                <div class="feature-icon">🔧</div>
                <div>易于定制</div>
            </div>
        </div>
    </div>

    <script>
        function showInfo() {
            alert('Hello from ${appName}!\\n\\nThis is a Web-to-APK sample application.\\nYou can modify HTML, CSS and JavaScript to create your app.');
        }

        // 简单的页面交互
        document.addEventListener('DOMContentLoaded', function() {
            console.log('${appName} 已加载');
            
            // 添加一些基本的移动端优化
            if ('serviceWorker' in navigator) {
                console.log('Service Worker 支持可用');
            }
            
            // 处理返回键（Android）
            document.addEventListener('backbutton', function(e) {
                e.preventDefault();
                if (confirm('确定要退出应用吗？')) {
                    navigator.app.exitApp();
                }
            }, false);
        });
    </script>
</body>
</html>`;
        };
        /**
         * 基础README模板
         */
        this.getBasicReadme = (config) => {
            const appName = config.appName || 'My Web App';
            const packageName = config.packageName || 'com.example.myapp';
            return `# ${appName}

这是一个使用 Web-to-APK 工具创建的移动应用项目。

## 项目信息

- **应用名称**: ${appName}
- **包名**: ${packageName}
- **版本**: ${config.version || '1.0.0'}

## 开始使用

### 1. 开发

编辑 \`dist/index.html\` 文件来修改您的应用界面和功能。

### 2. 构建APK

\`\`\`bash
# 构建调试版本
web-to-apk build

# 构建发布版本（需要签名）
web-to-apk build --release --keystore ./my-key.keystore --keystore-password <password> --key-alias <alias> --key-password <password>
\`\`\`

### 3. 测试

将生成的APK文件安装到Android设备或模拟器上进行测试。

## 项目结构

\`\`\`
${path.basename(process.cwd())}/
├── dist/                 # Web应用文件
│   └── index.html       # 主页面
├── assets/              # 资源文件
├── src/                 # 源代码（可选）
├── web-to-apk.config.json # 配置文件
└── README.md           # 项目说明
\`\`\`

## 配置文件

编辑 \`web-to-apk.config.json\` 来自定义应用设置：

- \`appName\`: 应用显示名称
- \`packageName\`: Android包名
- \`version\`: 应用版本号
- \`icon\`: 应用图标路径
- \`splashScreen\`: 启动画面路径
- \`permissions\`: Android权限列表

## 常用命令

\`\`\`bash
# 查看帮助
web-to-apk help

# 启动开发服务器
web-to-apk serve

# 查看构建选项
web-to-apk build --help
\`\`\`

## 故障排除

如果遇到问题，请检查：

1. Android SDK是否正确安装
2. 配置文件格式是否正确
3. 所有资源文件是否存在
4. 网络连接是否正常

更多帮助请访问: [Web-to-APK 文档](https://github.com/your-repo/web-to-apk)
`;
        };
        /**
         * Git忽略文件模板
         */
        this.getGitignore = () => {
            return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
/android/
/ios/
/dist/
/build/
*.apk
*.aab

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Temporary folders
tmp/
temp/

# Web-to-APK specific
web-to-apk.config.local.json
keystore/
*.keystore
*.jks
`;
        };
        /**
         * React HTML模板
         */
        this.getReactIndexHtml = (config) => {
            const appName = config.appName || 'My React App';
            return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${appName}</title>
</head>
<body>
    <div id="root"></div>
    <script src="./App.js"></script>
</body>
</html>`;
        };
        /**
         * React App组件模板
         */
        this.getReactApp = (config) => {
            const appName = config.appName || 'My React App';
            return `import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  const handleClick = () => {
    alert('Hello from ${appName}!');
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '50px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1>${appName}</h1>
      <p>这是一个基于React的Web-to-APK应用</p>
      <button 
        onClick={handleClick}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '2px solid white',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '25px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        点击测试
      </button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
`;
        };
        this.initializeTemplates();
    }
    /**
     * 初始化内置模板
     */
    initializeTemplates() {
        // 基础模板
        this.templates.set('basic', {
            name: 'basic',
            displayName: '基础模板',
            description: '包含基本HTML页面的简单模板',
            directories: ['src', 'dist', 'assets'],
            files: [
                {
                    path: 'dist/index.html',
                    content: this.getBasicIndexHtml
                },
                {
                    path: 'README.md',
                    content: this.getBasicReadme
                },
                {
                    path: '.gitignore',
                    content: this.getGitignore
                }
            ]
        });
        // React模板
        this.templates.set('react', {
            name: 'react',
            displayName: 'React模板',
            description: '基于React的单页应用模板',
            directories: ['src', 'public', 'dist'],
            files: [
                {
                    path: 'public/index.html',
                    content: this.getReactIndexHtml
                },
                {
                    path: 'src/App.jsx',
                    content: this.getReactApp
                }
            ]
        });
    }
    /**
     * 获取可用模板列表
     */
    getAvailableTemplates() {
        return Array.from(this.templates.values());
    }
    /**
     * 获取指定模板
     */
    getTemplate(name) {
        return this.templates.get(name);
    }
    /**
     * 应用模板到项目目录
     */
    async applyTemplate(templateName, projectPath, config) {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`模板 "${templateName}" 不存在`);
        }
        // 创建目录结构
        for (const dir of template.directories) {
            const dirPath = path.join(projectPath, dir);
            await fs.mkdir(dirPath, { recursive: true });
        }
        // 创建文件
        for (const file of template.files) {
            const filePath = path.join(projectPath, file.path);
            const fileDir = path.dirname(filePath);
            // 确保文件目录存在
            await fs.mkdir(fileDir, { recursive: true });
            // 生成文件内容
            const content = typeof file.content === 'function' ? file.content(config) : file.content;
            // 写入文件
            await fs.writeFile(filePath, content, 'utf-8');
            // 设置可执行权限（如果需要）
            if (file.executable) {
                await fs.chmod(filePath, 0o755);
            }
        }
    }
}
//# sourceMappingURL=ProjectTemplateManager.js.map