# Web-to-APK 示例项目

这个目录包含了不同类型的示例项目，展示如何使用Web-to-APK工具将各种Web应用转换为Android APK。

## 📁 示例项目列表

### 1. Basic HTML 示例 (`basic-html/`)
一个简单的HTML页面示例，展示基础的Web-to-APK配置和使用方法。

**特点：**
- 纯HTML/CSS/JavaScript
- 基础配置示例
- 适合初学者

### 2. React 应用示例 (`react-app/`)
一个基础的React应用示例，展示如何将现代前端框架应用转换为APK。

**特点：**
- React 18 + Vite
- 现代前端开发工具链
- 生产环境构建配置

## 🚀 如何使用示例

### 方法一：直接复制
```bash
# 复制示例到你的项目目录
cp -r examples/basic-html my-project
cd my-project

# 安装依赖（如果需要）
npm install

# 构建APK
web-to-apk build
```

### 方法二：使用模板
```bash
# 使用CLI模板功能
web-to-apk init my-project --template basic
# 或
web-to-apk init my-project --template react
```

## 📖 学习路径

1. **新手入门**：从 `basic-html` 示例开始
2. **进阶使用**：尝试 `react-app` 示例
3. **自定义配置**：修改配置文件，了解各种选项
4. **实际项目**：将你的Web应用配置转换为APK

## 🔧 通用构建步骤

每个示例项目都包含以下文件：
- `web-to-apk.config.json` - 配置文件
- `README.md` - 项目说明
- `package.json` - 依赖管理（如果需要）
- 源代码文件

构建步骤：
```bash
cd examples/[project-name]
web-to-apk build
```

构建完成后，APK文件将在 `dist/` 目录中。

## 💡 提示

- 确保已正确安装和配置开发环境
- 查看每个示例的README了解具体要求
- 可以修改配置文件来自定义应用
- 遇到问题请查看主项目的FAQ部分