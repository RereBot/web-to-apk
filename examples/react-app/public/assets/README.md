# React App Assets

这个目录包含React应用的静态资源文件。

## 需要的文件

- `icon.png` - 应用图标 (512x512像素)

## 创建图标

你可以使用以下方法创建应用图标：

### 方法1：使用React Logo
创建一个基于React logo的图标：

1. 访问 https://react.dev/ 
2. 右键保存React logo
3. 使用图像编辑软件调整为512x512像素
4. 保存为 `icon.png`

### 方法2：使用在线工具
1. 访问 https://favicon.io/favicon-generator/
2. 输入文字 "React"
3. 选择合适的字体和颜色
4. 下载512x512尺寸的PNG文件
5. 重命名为 `icon.png`

### 方法3：使用SVG转PNG
如果你有SVG文件，可以转换为PNG：

```bash
# 使用ImageMagick
convert icon.svg -resize 512x512 icon.png

# 使用Inkscape
inkscape icon.svg --export-png=icon.png --export-width=512 --export-height=512
```

## 图标要求

- **尺寸**: 512x512像素（推荐）
- **格式**: PNG
- **背景**: 可以是透明或纯色
- **内容**: 简洁明了，在小尺寸下仍然清晰

## 注意事项

- 确保图标在不同背景下都清晰可见
- 避免过于复杂的细节
- 测试在移动设备上的显示效果
- 保持与应用主题一致的设计风格