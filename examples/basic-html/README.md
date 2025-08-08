# Basic HTML 示例

这是一个简单的HTML页面示例，展示如何使用Web-to-APK将基础的Web页面转换为Android APK。

## 📋 项目结构

```
basic-html/
├── index.html              # 主页面
├── styles.css              # 样式文件
├── script.js               # JavaScript文件
├── assets/                 # 资源文件
│   ├── icon.png           # 应用图标
│   └── logo.png           # 页面logo
├── web-to-apk.config.json # 配置文件
├── package.json           # 项目信息
└── README.md              # 说明文档
```

## 🚀 快速开始

### 1. 构建APK

```bash
# 进入项目目录
cd examples/basic-html

# 构建APK
web-to-apk build

# 构建完成后，APK文件在 dist/ 目录中
```

### 2. 本地预览

```bash
# 启动本地服务器预览
python -m http.server 8000
# 或使用Node.js
npx serve .

# 在浏览器中访问 http://localhost:8000
```

### 3. 自定义配置

编辑 `web-to-apk.config.json` 文件来自定义应用：

```json
{
  "appName": "我的应用",
  "packageName": "com.mycompany.myapp",
  "version": "1.0.0"
}
```

## 🎯 学习要点

这个示例展示了：

1. **基础配置**：最简单的配置文件设置
2. **静态资源**：如何处理CSS、JavaScript和图片文件
3. **应用图标**：如何设置自定义应用图标
4. **响应式设计**：适配移动设备的页面布局
5. **离线支持**：基础的离线页面处理

## 🔧 配置说明

### 应用信息
- `appName`: 应用显示名称
- `packageName`: Android包名（必须唯一）
- `version`: 应用版本号

### 资源配置
- `icon`: 应用图标路径
- `websiteUrl`: 如果是本地文件，可以设置为 `"file://./index.html"`

### WebView设置
- 启用了基础的WebView功能
- 支持JavaScript执行
- 允许本地文件访问

## 📱 功能特性

This sample app includes:

- **响应式布局**：适配不同屏幕尺寸
- **交互功能**：按钮点击、表单提交等
- **本地存储**：使用localStorage保存数据
- **动画效果**：CSS动画和过渡效果
- **移动优化**：触摸友好的界面设计

## 🎨 自定义指南

### 修改样式
编辑 `styles.css` 文件来改变应用外观：
- 颜色主题
- 字体样式
- 布局结构
- 动画效果

### 添加功能
在 `script.js` 中添加新功能：
- 数据处理
- API调用
- 用户交互
- 本地存储

### 更换图标
替换 `assets/icon.png` 文件：
- 推荐尺寸：512x512像素
- 格式：PNG（支持透明背景）
- 文件大小：小于1MB

## 🔍 故障排除

### 常见问题

**Q: 页面在APK中显示空白？**
A: 检查文件路径是否正确，确保所有资源文件都在正确位置。

**Q: JavaScript功能不工作？**
A: 确保WebView配置允许JavaScript执行，检查控制台错误信息。

**Q: 图标不显示？**
A: 验证图标文件路径和格式，确保文件存在且可访问。

### 调试技巧

1. 使用浏览器开发者工具测试页面
2. 检查控制台错误信息
3. 验证所有文件路径
4. 测试不同屏幕尺寸的显示效果

## 📚 进阶学习

完成这个示例后，你可以：

1. 尝试 `react-app` 示例
2. 学习更高级的配置选项
3. 添加Capacitor插件功能
4. 实现PWA特性

## 🤝 贡献

如果你有改进建议或发现问题，欢迎提交Issue或Pull Request。