# React App 示例

这是一个基础的React应用示例，展示如何使用Web-to-APK将React应用转换为Android APK。

## 📋 项目结构

```
react-app/
├── public/                 # 静态资源
│   ├── index.html         # HTML模板
│   └── assets/            # 图标和图片
├── src/                   # 源代码
│   ├── components/        # React组件
│   ├── hooks/            # 自定义Hooks
│   ├── styles/           # 样式文件
│   ├── utils/            # 工具函数
│   ├── App.jsx           # 主应用组件
│   └── main.jsx          # 应用入口
├── dist/                  # 构建输出（自动生成）
├── web-to-apk.config.json # Web-to-APK配置
├── package.json           # 项目配置
├── vite.config.js         # Vite配置
└── README.md              # 说明文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd examples/react-app
npm install
```

### 2. 开发模式

```bash
# 启动开发服务器
npm run dev

# 在浏览器中访问 http://localhost:5173
```

### 3. 构建生产版本

```bash
# 构建React应用
npm run build

# 构建APK
npm run build:apk

# 或者直接使用web-to-apk
web-to-apk build
```

### 4. 预览生产版本

```bash
# 预览构建结果
npm run preview
```

## 🎯 学习要点

这个示例展示了：

1. **现代React开发**：使用React 18和Hooks
2. **Vite构建工具**：快速的开发和构建体验
3. **组件化架构**：可复用的React组件
4. **状态管理**：使用React Hooks管理状态
5. **响应式设计**：适配移动设备的界面
6. **PWA特性**：Service Worker和离线支持
7. **Capacitor集成**：原生功能访问

## 🔧 技术栈

- **React 18** - 用户界面库
- **Vite** - 构建工具和开发服务器
- **CSS Modules** - 样式隔离
- **React Router** - 客户端路由（可选）
- **Capacitor** - 原生功能桥接

## 📱 功能特性

This sample app includes:

- **计数器功能**：展示状态管理
- **表单处理**：用户输入和验证
- **本地存储**：数据持久化
- **主题切换**：明暗主题支持
- **响应式布局**：适配不同屏幕
- **组件库**：可复用的UI组件
- **错误边界**：错误处理机制

## ⚙️ 配置说明

### Vite配置 (`vite.config.js`)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser'
  },
  server: {
    port: 5173,
    host: true
  }
})
```

### Web-to-APK配置

配置文件针对React应用进行了优化：
- 设置了正确的构建输出目录
- 配置了适合SPA的WebView选项
- 添加了必要的权限

## 🎨 自定义指南

### 添加新组件

1. 在 `src/components/` 创建组件文件
2. 使用函数组件和Hooks
3. 添加对应的样式文件
4. 在需要的地方导入使用

### 修改样式

- 编辑 `src/styles/` 中的CSS文件
- 使用CSS变量实现主题切换
- 遵循移动优先的响应式设计

### 添加路由

```bash
npm install react-router-dom
```

然后在应用中配置路由。

### 集成Capacitor插件

```bash
npm install @capacitor/camera
```

在组件中使用：

```javascript
import { Camera } from '@capacitor/camera';

const takePhoto = async () => {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri
  });
};
```

## 🔍 故障排除

### 常见问题

**Q: 开发服务器启动失败？**
A: 检查端口是否被占用，尝试使用不同端口：`npm run dev -- --port 3000`

**Q: 构建失败？**
A: 检查代码语法错误，确保所有依赖都已安装。

**Q: APK中页面显示空白？**
A: 确保构建输出正确，检查相对路径配置。

### 调试技巧

1. 使用React Developer Tools
2. 检查浏览器控制台错误
3. 使用Vite的HMR功能快速调试
4. 在移动设备上测试响应式布局

## 📚 进阶学习

完成这个示例后，你可以：

1. 添加状态管理库（Redux、Zustand）
2. 集成UI组件库（Ant Design、Material-UI）
3. 添加测试（Jest、React Testing Library）
4. 实现PWA功能
5. 集成更多Capacitor插件

## 🤝 贡献

如果你有改进建议或发现问题，欢迎提交Issue或Pull Request。