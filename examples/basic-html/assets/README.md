# Assets 目录

这个目录包含应用的资源文件。

## 文件说明

- `icon.svg` - 应用图标的SVG源文件
- `logo.svg` - 页面logo的SVG源文件
- `icon.png` - 应用图标的PNG文件（需要从SVG转换）
- `logo.png` - 页面logo的PNG文件（需要从SVG转换）

## 转换SVG到PNG

你可以使用以下方法将SVG文件转换为PNG：

### 方法1：使用在线工具
1. 访问 https://convertio.co/svg-png/
2. 上传SVG文件
3. 设置输出尺寸（推荐512x512用于图标）
4. 下载PNG文件

### 方法2：使用命令行工具

如果安装了ImageMagick：
```bash
# 转换图标
convert icon.svg -resize 512x512 icon.png

# 转换logo
convert logo.svg -resize 120x120 logo.png
```

如果安装了Inkscape：
```bash
# 转换图标
inkscape icon.svg --export-png=icon.png --export-width=512 --export-height=512

# 转换logo
inkscape logo.svg --export-png=logo.png --export-width=120 --export-height=120
```

### 方法3：使用Node.js脚本

创建一个转换脚本：
```javascript
const sharp = require('sharp');

// 转换图标
sharp('icon.svg')
  .resize(512, 512)
  .png()
  .toFile('icon.png');

// 转换logo
sharp('logo.svg')
  .resize(120, 120)
  .png()
  .toFile('logo.png');
```

## 图标规格建议

- **应用图标**: 512x512像素，PNG格式
- **页面Logo**: 120x120像素，PNG格式
- **启动画面**: 1024x1024像素，PNG格式（可选）

## 注意事项

- 确保图标在不同背景下都清晰可见
- 使用高对比度的颜色
- 避免过于复杂的细节
- 测试在小尺寸下的显示效果